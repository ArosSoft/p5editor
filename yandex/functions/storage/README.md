# Хранилище картинок в Yandex Cloud (альтернатива Cloudinary)

Функция для Yandex Cloud Functions: выдаёт подписанные ссылки на загрузку
картинок в Object Storage и отдаёт список файлов пользователя.
Авторизация — JWT Supabase, проверяется на API Gateway.

```
yandex/functions/storage/
├── index.py           # код функции (index.handler)
├── requirements.txt   # зависимости (boto3)
└── README.md          # этот файл
```

## Деплой

1. Консоль Yandex Cloud → **Cloud Functions** → ваша функция.
2. **Создать версию**:
   - Среда выполнения: **Python 3.12**
   - Точка входа: **`index.handler`**
   - Способ: редактор кода → добавьте два файла: `index.py` и `requirements.txt`
   - Память: 256 МБ, таймаут: 10 с (можно больше)
3. Переменные окружения уже заданы (перепроверьте):

   | Переменная | Значение |
   |---|---|
   | `BUCKET` | `p5editor` |
   | `S3_ENDPOINT` | `https://storage.yandexcloud.net` |
   | `AWS_DEFAULT_REGION` | `ru-central1` |
   | `UPLOAD_URL_TTL` | `900` |
   | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | из Lockbox (автоматически) |

   Необязательные:
   - `MAX_UPLOAD_BYTES` — лимит размера файла (по умолчанию `10485760`, т.е. 10 МБ);
   - `PUBLIC_BASE_URL` — база публичных ссылок (по умолчанию `https://<BUCKET>.storage.yandexcloud.net`).

4. API Gateway уже настроен: маршруты `POST /upload-url` и `GET /files`,
   JWT-авторизация Supabase, CORS на шлюзе.

## Подключение к сайту

1. В `.env` (рядом с `VITE_SUPABASE_*`) укажите URL API Gateway:

   ```
   VITE_YANDEX_API_URL=https://d5d....apigw.yandexcloud.net
   ```

2. Перезапустите dev-сервер или пересоберите сайт.

Маршруты интерфейса:

- `/images` — выбор хранилища (Cloudinary или Яндекс Облако);
- `/images/yandex` — картинки в Яндекс Облаке;
- `/images/cloudinary` — прежняя страница Cloudinary.

В разработке демо-режим открывается без входа: `/#/images?demo=1` и
`/#/images/yandex?demo=1` (только при `npm run dev`).

## API

### POST /upload-url

Тело (JSON):

```json
{ "filename": "kot.png", "contentType": "image/png", "size": 117000 }
```

`filename` и `contentType` взаимозаменяемы: тип определяется по MIME, а если его
нет — по расширению. Допустимы только PNG, JPG, GIF, WebP.

Ответ `200`:

```json
{
  "url": "https://p5editor.storage.yandexcloud.net/",
  "fields": { "key": "<sub>/<uuid>.png", "Content-Type": "image/png", "policy": "...", "...": "..." },
  "key": "<sub>/<uuid>.png",
  "publicUrl": "https://p5editor.storage.yandexcloud.net/<sub>/<uuid>.png",
  "contentType": "image/png",
  "maxBytes": 10485760,
  "expiresIn": 900,
  "expiresAt": "2026-11-13T12:34:56Z"
}
```

Ключ объекта придумывает сервер: `<sub>/<uuid4>.<ext>`, где `sub` — UUID
пользователя из JWT. Клиент не может повлиять на папку.

Загрузка — обычный `multipart/form-data` POST на `url` с полями из `fields`
(поле `Content-Type` добавляйте **перед** файлом):

```bash
curl -X POST "$URL" \
  -F "key=$KEY" \
  -F "Content-Type=image/png" \
  -F "policy=$POLICY" \
  -F "x-amz-algorithm=$ALG" \
  -F "x-amz-credential=$CRED" \
  -F "x-amz-date=$DATE" \
  -F "x-amz-signature=$SIGN" \
  -F "file=@kot.png;type=image/png"
```

Лимит размера проверяет сам Object Storage по политике `content-length-range`,
поэтому обойти его нельзя.

### GET /files

Параметры запроса:

| Параметр | Значение |
|---|---|
| `limit` | сколько файлов вернуть, 1…1000 (по умолчанию 100) |
| `token` | `nextToken` из предыдущего ответа (пагинация) |

Ответ `200`:

```json
{
  "files": [
    {
      "key": "<sub>/<uuid>.png",
      "size": 117000,
      "lastModified": "2026-11-13T10:20:30Z",
      "url": "https://p5editor.storage.yandexcloud.net/<sub>/<uuid>.png"
    }
  ],
  "nextToken": "0J...+3w==",
  "truncated": true
}
```

`nextToken = null` означает, что список закончился.

### GET /health

Ответ `200`: `{"ok": true, "bucket": "p5editor"}` — быстрая проверка, что функция жива.

## Ошибки

Все ошибки — JSON `{"error": "<код>", "message": "<текст>"}`.

| Код | HTTP | Когда |
|---|---|---|
| `unauthorized` | 401 | шлюз не передал `sub` (нет или неверный JWT) |
| `invalid_json` | 400 | тело не JSON-объект |
| `bad_filename` / `bad_size` | 400 | некорректные поля запроса |
| `bad_content_type` | 400 | тип не PNG/JPG/GIF/WebP |
| `file_too_large` | 413 | файл больше `MAX_UPLOAD_BYTES` |
| `bad_limit` / `bad_token` | 400 | некорректный `limit` или устаревший `token` |
| `method_not_allowed` | 405 | неподходящий метод |
| `not_found` | 404 | неизвестный путь |
| `storage_error` | 500 | ошибка Object Storage (см. логи функции) |
| `internal` | 500 | любое необработанное исключение |

## Важно

- **CORS бакета:** для загрузки через presigned POST в `AllowedMethods` должен быть
  `POST` (сейчас в брифе GET/HEAD/PUT). Итоговый список: `GET, HEAD, PUT, POST`.
  Без этого браузер заблокирует ответ на загрузку.
- **Удаление не реализовано** намеренно: у сервисного аккаунта роль
  `storage.uploader` (удаление запрещено). Если понадобится удаление — выдайте
  роль `storage.editor` и добавьте метод отдельно.
- Ключи доступа в коде не хранятся: только переменные окружения (Lockbox).
- `sub` никогда не берётся из тела, query или пути — только из claims шлюза.
- CORS-заголовки функция не добавляет — их проставляет API Gateway.
- Публичное чтение объектов включено, листинг бакета — нет: чужие файлы видны
  только по прямой ссылке, если её кто-то передал.
- Функция не ресайзит картинки. Yandex Object Storage не умеет трансформации
  «на лету», как Cloudinary: для превью фронтенд может масштабировать картинку
  на клиенте (или позже добавим отдельную функцию ресайза).
