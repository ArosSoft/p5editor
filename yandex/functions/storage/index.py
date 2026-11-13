"""
Yandex Cloud Function: хранилище картинок p5editor в Object Storage.

Точка входа: index.handler
Runtime: python312
Вызов: API Gateway, payload_format_version = "2.0"

Маршруты:
    POST /upload-url  -> подписанный URL на загрузку (presigned POST)
    GET  /files       -> список файлов текущего пользователя (ListObjectsV2)

Авторизация выполняется на API Gateway: JWT проверяется до вызова функции,
в событии приходят claims (requestContext.authorizer.jwt.claims).
user_id берётся ТОЛЬКО из claims.sub.

Ключи S3 приходят из Lockbox в переменные окружения — в коде их нет.
Удаление объектов намеренно не реализовано: у сервисного аккаунта роль
storage.uploader (удаление запрещено).
"""

import base64
import binascii
import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ─── Настройки (переопределяются переменными окружения) ──────────────────────

def _env_int(name: str, default: int, minimum: int | None = None, maximum: int | None = None) -> int:
    """Целое из переменной окружения; при опечатке берём значение по умолчанию."""
    try:
        value = int(os.environ.get(name, default))
    except (TypeError, ValueError):
        value = int(default)
    if minimum is not None:
        value = max(minimum, value)
    if maximum is not None:
        value = min(maximum, value)
    return value


BUCKET = os.environ.get("BUCKET", "p5editor")
S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "https://storage.yandexcloud.net")
REGION = os.environ.get("AWS_DEFAULT_REGION", "ru-central1")

# Срок жизни подписанного URL (S3 допускает до 7 суток)
UPLOAD_TTL = _env_int("UPLOAD_URL_TTL", 900, 60, 604800)

# Максимальный размер картинки. Совпадает с лимитом фронтенда (10 МБ).
MAX_UPLOAD_BYTES = _env_int("MAX_UPLOAD_BYTES", 10 * 1024 * 1024, 1, 50 * 1024**3)

# Сколько объектов отдавать за один запрос списка (S3-максимум — 1000)
MAX_LIST_LIMIT = 1000
DEFAULT_LIST_LIMIT = 100

# Публичные ссылки вида https://p5editor.storage.yandexcloud.net/<ключ>
PUBLIC_BASE_URL = (
    os.environ.get("PUBLIC_BASE_URL") or f"https://{BUCKET}.storage.yandexcloud.net"
).rstrip("/")

# Белый список типов: MIME -> расширение
CONTENT_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
}
# Расширение -> MIME (нужно, если клиент прислал только имя файла)
EXT_CONTENT_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
}

# sub в Supabase — UUID. Пропускаем только безопасные символы,
# чтобы клиент не смог подставить «../» или чужой префикс.
SUB_RE = re.compile(r"^[0-9a-fA-F-]{8,64}$")

# Клиент создаётся один раз на инстанс и переиспользуется между вызовами.
# Ключи доступа boto3 берёт из переменных окружения (Lockbox).
s3 = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    region_name=REGION,
    config=Config(signature_version="s3v4"),
)


# ─── Вспомогательные функции ─────────────────────────────────────────────────

def _response(status: int, payload: dict) -> dict:
    """Ответ функции в формате API Gateway 2.0."""
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json; charset=utf-8"},
        "isBase64Encoded": False,
        "body": json.dumps(payload, ensure_ascii=False),
    }


def _error(status: int, code: str, message: str) -> dict:
    return _response(status, {"error": code, "message": message})


def _get_method(event: dict) -> str:
    """Метод HTTP: API Gateway 2.0 (requestContext.http.method) или 1.0."""
    request_context = event.get("requestContext") or {}
    http = request_context.get("http") or {}
    method = http.get("method") or event.get("httpMethod") or ""
    return str(method).upper()


def _get_route(event: dict) -> str:
    """Последний сегмент пути: /upload-url -> upload-url."""
    path = event.get("rawPath") or ""
    if not path:
        request_context = event.get("requestContext") or {}
        path = (request_context.get("http") or {}).get("path") or ""
    path = str(path).rstrip("/")
    return path.rsplit("/", 1)[-1].lower() if path else ""


def _get_user_id(event: dict) -> str | None:
    """UUID пользователя Supabase из claims, проверенных шлюзом."""
    request_context = event.get("requestContext") or {}
    authorizer = request_context.get("authorizer") or {}
    jwt = authorizer.get("jwt") or {}
    claims = jwt.get("claims") or authorizer.get("claims") or {}
    sub = claims.get("sub") if isinstance(claims, dict) else None
    if not isinstance(sub, str) or not SUB_RE.match(sub):
        return None
    return sub.lower()


def _query_params(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    if not isinstance(params, dict):
        return {}
    return {str(key): str(value) for key, value in params.items() if value is not None}


def _read_json_body(event: dict) -> dict:
    """Тело запроса как JSON-объект (поддерживает base64-кодирование)."""
    raw = event.get("body")
    if raw is None or raw == "":
        return {}
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("body must be a JSON object")
    return data


def _ext_from_filename(filename: str) -> str | None:
    """Расширение из имени файла с проверкой по белому списку."""
    if not filename:
        return None
    base = filename.replace("\\", "/").rsplit("/", 1)[-1]
    if "." not in base:
        return None
    ext = base.rsplit(".", 1)[1].strip().lower()
    if ext == "jpeg":
        ext = "jpg"
    return ext if ext in EXT_CONTENT_TYPES else None


def _public_url(key: str) -> str:
    return f"{PUBLIC_BASE_URL}/{quote(key, safe='/')}"


def _iso_utc(value) -> str | None:
    if not value:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


# ─── POST /upload-url ────────────────────────────────────────────────────────

def _handle_upload_url(event: dict) -> dict:
    user_id = _get_user_id(event)
    if not user_id:
        return _error(401, "unauthorized", "Нужно войти в аккаунт p5editor.")

    try:
        body = _read_json_body(event)
    except (ValueError, binascii.Error, UnicodeDecodeError):
        return _error(400, "invalid_json", "Не получилось прочитать запрос.")

    filename = body.get("filename")
    content_type = body.get("contentType") or body.get("content_type")
    size = body.get("size")

    if filename is not None and not isinstance(filename, str):
        return _error(400, "bad_filename", "Не получилось понять имя файла.")
    if isinstance(filename, str) and len(filename) > 255:
        return _error(400, "bad_filename", "Слишком длинное имя файла.")

    # Тип важнее имени файла: если клиент прислал MIME — используем его.
    if isinstance(content_type, str) and content_type.strip():
        content_type = content_type.split(";")[0].strip().lower()
        ext = CONTENT_TYPES.get(content_type)
        if not ext:
            return _error(
                400,
                "bad_content_type",
                "Можно загружать только PNG, JPG, GIF и WebP.",
            )
    else:
        ext = _ext_from_filename(filename or "")
        if not ext:
            return _error(
                400,
                "bad_content_type",
                "Можно загружать только PNG, JPG, GIF и WebP.",
            )
        content_type = EXT_CONTENT_TYPES[ext]

    # Размер проверяем заранее для понятной ошибки; окончательно его
    # ограничивает политика content-length-range в Object Storage.
    if size is not None:
        try:
            size = int(size)
        except (TypeError, ValueError):
            return _error(400, "bad_size", "Не получилось понять размер файла.")
        if size <= 0:
            return _error(400, "bad_size", "Файл пустой. Выбери другую картинку.")
        if size > MAX_UPLOAD_BYTES:
            megabytes = MAX_UPLOAD_BYTES // (1024 * 1024)
            return _error(
                413,
                "file_too_large",
                f"Файл больше {megabytes} МБ. Выбери картинку поменьше.",
            )

    # Ключ формирует только сервер: <sub>/<uuid4>.<ext>
    key = f"{user_id}/{uuid.uuid4()}.{ext}"

    try:
        presigned = s3.generate_presigned_post(
            Bucket=BUCKET,
            Key=key,
            Fields={"Content-Type": content_type},
            Conditions=[
                ["content-length-range", 1, MAX_UPLOAD_BYTES],
                ["eq", "$Content-Type", content_type],
            ],
            ExpiresIn=UPLOAD_TTL,
        )
    except (BotoCoreError, ClientError):
        logger.exception("presign failed")
        return _error(
            500,
            "storage_error",
            "Хранилище не смогло подготовить загрузку. Попробуй ещё раз.",
        )

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=UPLOAD_TTL)

    return _response(
        200,
        {
            "url": presigned["url"],
            "fields": presigned["fields"],
            "key": key,
            "publicUrl": _public_url(key),
            "contentType": content_type,
            "maxBytes": MAX_UPLOAD_BYTES,
            "expiresIn": UPLOAD_TTL,
            "expiresAt": _iso_utc(expires_at),
        },
    )


# ─── GET /files ──────────────────────────────────────────────────────────────

def _handle_files(event: dict) -> dict:
    user_id = _get_user_id(event)
    if not user_id:
        return _error(401, "unauthorized", "Нужно войти в аккаунт p5editor.")

    query = _query_params(event)

    try:
        limit = int(query.get("limit", DEFAULT_LIST_LIMIT))
    except (TypeError, ValueError):
        return _error(400, "bad_limit", "Не получилось понять, сколько файлов показать.")
    limit = max(1, min(limit, MAX_LIST_LIMIT))

    token = (
        query.get("token")
        or query.get("continuationToken")
        or query.get("cursor")
        or ""
    ).strip()

    params = {
        "Bucket": BUCKET,
        "Prefix": f"{user_id}/",
        "Delimiter": "/",
        "MaxKeys": limit,
    }
    if token:
        params["ContinuationToken"] = token

    try:
        result = s3.list_objects_v2(**params)
    except ClientError as exc:
        code = str((exc.response.get("Error") or {}).get("Code") or "")
        if code in ("InvalidArgument", "InvalidToken", "InvalidContinuationToken"):
            return _error(
                400,
                "bad_token",
                "Список устарел. Обнови страницу и попробуй снова.",
            )
        logger.exception("list failed")
        return _error(
            500,
            "storage_error",
            "Не получилось получить список картинок. Попробуй ещё раз.",
        )
    except BotoCoreError:
        logger.exception("list failed")
        return _error(
            500,
            "storage_error",
            "Не получилось получить список картинок. Попробуй ещё раз.",
        )

    files = []
    for item in result.get("Contents") or []:
        key = str(item.get("Key") or "")
        if not key or key.endswith("/"):
            continue
        files.append(
            {
                "key": key,
                "size": int(item.get("Size") or 0),
                "lastModified": _iso_utc(item.get("LastModified")),
                "url": _public_url(key),
            }
        )

    return _response(
        200,
        {
            "files": files,
            "nextToken": result.get("NextContinuationToken") or None,
            "truncated": bool(result.get("IsTruncated")),
        },
    )


# ─── Роутинг и обработка ошибок ──────────────────────────────────────────────

def _route(event: dict, method: str, route: str) -> dict:
    if method == "OPTIONS":
        # Предзапрос обычно снимает шлюз; сюда попадает только при прямом вызове.
        return _response(200, {"ok": True})
    if route == "upload-url" and method == "POST":
        return _handle_upload_url(event)
    if route == "files" and method == "GET":
        return _handle_files(event)
    if route == "health" and method == "GET":
        return _response(200, {"ok": True, "bucket": BUCKET})
    if route in ("upload-url", "files"):
        return _error(405, "method_not_allowed", "Этот метод здесь не поддерживается.")
    return _error(404, "not_found", "Нет такого маршрута.")


def handler(event: dict, context) -> dict:
    method = _get_method(event)
    route = _get_route(event)

    try:
        response = _route(event, method, route)
    except (BotoCoreError, ClientError):
        logger.exception("storage error: %s /%s", method, route)
        response = _error(
            500,
            "storage_error",
            "Хранилище сейчас недоступно. Попробуй ещё раз.",
        )
    except Exception:
        logger.exception("unhandled error: %s /%s", method, route)
        response = _error(500, "internal", "Что-то пошло не так. Попробуй ещё раз.")

    logger.info("%s /%s -> %s", method, route, response.get("statusCode"))
    return response
