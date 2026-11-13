// Supabase Edge Function: cloudinary-proxy
// Прокси между сайтом p5editor и личными аккаунтами Cloudinary пользователей.
//
// Зачем: Cloudinary Admin API (список картинок, удаление) и подписанные загрузки
// требуют API Key + API Secret. Секрет нельзя держать в браузере, поэтому он
// хранится зашифрованным в таблице cloudinary_accounts, а эта функция:
//   1) проверяет JWT пользователя (Authorization: Bearer);
//   2) расшифровывает ЕГО секрет из БД (service role);
//   3) выполняет запрос к Cloudinary с Basic Auth от его имени.
//
// Деплой: supabase functions deploy cloudinary-proxy
// Обязательные секреты:
//   SUPABASE_SERVICE_ROLE_KEY — сервисный ключ проекта
//   CLOUDINARY_ENC_KEY        — 32 байта base64, ключ AES-GCM для шифрования секретов
//   (SUPABASE_URL и SUPABASE_ANON_KEY подставляются автоматически)
//
// Протокол: POST c JSON-телом { action: '...', ...параметры }
//   (для upload — multipart/form-data с полем action и файлом file)
// Ответ: { success: true, data: ... } либо { success: false, error: { code, message } }
// Сообщения об ошибках — на русском и понятны школьникам.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const CLOUDINARY_API = 'https://api.cloudinary.com'
const CLOUDINARY_TIMEOUT_MS = 45000
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 МБ
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const LIST_PAGE_SIZE = 30
// Картинки, добавленные через сайт, помечаются тегом и складываются в папку
// p5editor — чтобы их было легко найти в консоли Cloudinary.
const UPLOAD_FOLDER = 'p5editor'
const UPLOAD_TAG = 'p5editor'

// ---------- Утилиты ответов ----------

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function fail(status: number, code: string, message: string): Response {
  return json(status, { success: false, error: { code, message } })
}

// ---------- Утилиты base64 ----------

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ---------- Шифрование API Secret (AES-GCM) ----------

let cachedAesKey: CryptoKey | null | undefined

/** Ключ шифрования из секрета CLOUDINARY_ENC_KEY (base64, 32 байта). null — не задан. */
async function getAesKey(): Promise<CryptoKey | null> {
  if (cachedAesKey !== undefined) return cachedAesKey
  const b64 = Deno.env.get('CLOUDINARY_ENC_KEY')
  if (!b64) {
    cachedAesKey = null
    return cachedAesKey
  }
  try {
    const raw = base64ToBytes(b64.trim())
    if (raw.length !== 32) {
      cachedAesKey = null
      return cachedAesKey
    }
    cachedAesKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
      'encrypt',
      'decrypt'
    ])
    return cachedAesKey
  } catch {
    cachedAesKey = null
    return cachedAesKey
  }
}

async function encryptSecret(key: CryptoKey, plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
  )
  const out = new Uint8Array(iv.length + ciphertext.length)
  out.set(iv, 0)
  out.set(ciphertext, iv.length)
  return bytesToBase64(out)
}

async function decryptSecret(key: CryptoKey, encoded: string): Promise<string> {
  const data = base64ToBytes(encoded)
  const iv = data.slice(0, 12)
  const ciphertext = data.slice(12)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plain)
}

// ---------- Cloudinary ----------

interface CloudinaryCreds {
  cloud_name: string
  api_key: string
  api_secret: string
}

function basicAuthHeader(creds: CloudinaryCreds): string {
  const pair = `${creds.api_key}:${creds.api_secret}`
  return 'Basic ' + bytesToBase64(new TextEncoder().encode(pair))
}

/** Запрос к Cloudinary с Basic Auth и таймаутом. */
async function cld(
  creds: CloudinaryCreds,
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; body: any }> {
  let res: Response
  try {
    res = await fetch(`${CLOUDINARY_API}/v1_1/${creds.cloud_name}${path}`, {
      ...init,
      headers: { Authorization: basicAuthHeader(creds), ...(init.headers || {}) },
      signal: AbortSignal.timeout(CLOUDINARY_TIMEOUT_MS)
    })
  } catch {
    return { ok: false, status: 0, body: null }
  }
  let body: any = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { ok: res.ok, status: res.status, body }
}

/** Проверка ключей Cloudinary через GET /usage. */
async function checkCredentials(
  creds: CloudinaryCreds
): Promise<{ ok: boolean; message?: string; body?: any }> {
  const r = await cld(creds, '/usage')
  if (r.status === 401 || r.status === 403) {
    return { ok: false, message: 'Cloudinary не принял ключи. Проверь, что скопировал их целиком, и попробуй ещё раз.' }
  }
  if (r.status === 404) {
    return { ok: false, message: 'Аккаунт с таким Cloud name не найден. Проверь написание (обрати внимание на дефисы).' }
  }
  if (!r.ok) {
    return { ok: false, message: 'Cloudinary временно недоступен. Попробуй ещё раз через минуту.' }
  }
  return { ok: true, body: r.body }
}

/** Ошибка Cloudinary → понятный ответ пользователю. */
function cloudinaryFail(r: { status: number }): Response {
  if (r.status === 401 || r.status === 403) {
    return fail(400, 'bad_credentials', 'Сохранённые ключи больше не работают. Обнови их на странице «Мои изображения».')
  }
  if (r.status === 420) {
    return fail(429, 'rate_limited', 'Слишком много запросов к Cloudinary. Подожди немного и попробуй снова.')
  }
  if (r.status === 0) {
    return fail(504, 'network', 'Cloudinary не отвечает. Проверь интернет и попробуй ещё раз.')
  }
  return fail(502, 'cloudinary_error', 'Cloudinary ответил ошибкой. Попробуй позже.')
}

// ---------- Секреты пользователей из БД ----------

interface AccountRow {
  user_id: string
  cloud_name: string
  api_key: string
  api_secret_encrypted: string
  cloudinary_email: string | null
  verified: boolean
}

/** Загрузить и расшифровать ключи пользователя. */
async function loadCreds(
  admin: any,
  userId: string
): Promise<{ kind: 'ok'; creds: CloudinaryCreds } | { kind: 'not_linked' } | { kind: 'error' }> {
  const { data, error } = await admin
    .from('cloudinary_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { kind: 'error' }
  const row = data as AccountRow | null
  if (!row) return { kind: 'not_linked' }

  const key = await getAesKey()
  if (!key) return { kind: 'error' }
  try {
    const api_secret = await decryptSecret(key, row.api_secret_encrypted)
    return { kind: 'ok', creds: { cloud_name: row.cloud_name, api_key: row.api_key, api_secret } }
  } catch {
    return { kind: 'error' }
  }
}

// ---------- Маппинг картинки для фронтенда ----------

function mapImage(r: any, cloudName: string) {
  const publicId = String(r.public_id ?? '')
  return {
    public_id: publicId,
    format: String(r.format ?? ''),
    bytes: Number(r.bytes ?? 0),
    width: Number(r.width ?? 0),
    height: Number(r.height ?? 0),
    created_at: String(r.created_at ?? ''),
    secure_url: String(r.secure_url ?? ''),
    display_name: (r.display_name as string | null) || publicId.split('/').pop() || publicId,
    folder: (r.folder as string | null) || null,
    cloud_name: cloudName
  }
}

// ---------- Валидация формы привязки ----------

function readCreds(payload: any): CloudinaryCreds | null {
  const cloud_name = typeof payload.cloud_name === 'string' ? payload.cloud_name.trim() : ''
  const api_key = typeof payload.api_key === 'string' ? payload.api_key.trim() : ''
  const api_secret = typeof payload.api_secret === 'string' ? payload.api_secret.trim() : ''
  if (!cloud_name || !api_key || !api_secret) return null
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(cloud_name)) return null
  if (!/^[A-Za-z0-9]{4,64}$/.test(api_key)) return null
  if (api_secret.length > 128) return null
  return { cloud_name, api_key, api_secret }
}

// ---------- Обработчик ----------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return fail(405, 'method_not_allowed', 'Поддерживается только POST')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return fail(500, 'misconfigured', 'Сервер настроен неправильно (нет сервисного ключа)')
  }

  // 1) Кто вызывает функцию?
  const authHeader = req.headers.get('Authorization') ?? ''
  const accessToken = authHeader.replace(/^Bearer\s+/i, '')
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })
  const {
    data: { user },
    error: userErr
  } = await admin.auth.getUser(accessToken)
  if (userErr || !user) {
    return fail(401, 'unauthorized', 'Нужно войти в аккаунт p5editor')
  }

  // 2) Разбор тела: JSON или multipart
  const contentType = req.headers.get('content-type') || ''
  let action = ''
  let payload: Record<string, any> = {}
  let form: FormData | null = null
  if (contentType.includes('multipart/form-data')) {
    try {
      form = await req.formData()
      action = String(form.get('action') || '')
    } catch {
      return fail(400, 'bad_request', 'Не удалось прочитать файл')
    }
  } else {
    try {
      const parsed = await req.json()
      action = String(parsed?.action || '')
      payload = parsed || {}
    } catch {
      return fail(400, 'bad_request', 'Неправильный формат запроса')
    }
  }

  try {
    switch (action) {
      // --- Проверка ключей без сохранения ---
      case 'verify': {
        const creds = readCreds(payload)
        if (!creds) {
          return fail(400, 'bad_form', 'Заполни все три поля: Cloud name, API Key и API Secret.')
        }
        const check = await checkCredentials(creds)
        if (!check.ok) return fail(400, 'bad_credentials', check.message!)
        return json(200, {
          success: true,
          data: { plan: check.body?.plan ?? null, credits: check.body?.credits ?? null }
        })
      }

      // --- Привязка: проверяем ключи и сохраняем зашифрованный секрет ---
      case 'link': {
        const creds = readCreds(payload)
        if (!creds) {
          return fail(400, 'bad_form', 'Заполни все три поля: Cloud name, API Key и API Secret.')
        }
        const check = await checkCredentials(creds)
        if (!check.ok) return fail(400, 'bad_credentials', check.message!)

        const key = await getAesKey()
        if (!key) {
          return fail(500, 'misconfigured', 'Сервер настроен неправильно (нет ключа шифрования)')
        }
        const secretEncrypted = await encryptSecret(key, creds.api_secret)

        const { error: upsertError } = await admin.from('cloudinary_accounts').upsert(
          {
            user_id: user.id,
            cloud_name: creds.cloud_name,
            api_key: creds.api_key,
            api_secret_encrypted: secretEncrypted,
            cloudinary_email: user.email ?? null,
            verified: true,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
        if (upsertError) {
          return fail(500, 'db_error', 'Не получилось сохранить привязку. Попробуй ещё раз.')
        }
        return json(200, { success: true, data: { linked: true } })
      }

      // --- Отвязка аккаунта ---
      case 'unlink': {
        const { error: deleteError } = await admin
          .from('cloudinary_accounts')
          .delete()
          .eq('user_id', user.id)
        if (deleteError) {
          return fail(500, 'db_error', 'Не получилось отвязать аккаунт. Попробуй ещё раз.')
        }
        return json(200, { success: true, data: { linked: false } })
      }

      // --- Список картинок пользователя ---
      case 'list': {
        const loaded = await loadCreds(admin, user.id)
        if (loaded.kind === 'not_linked') {
          return fail(409, 'account_not_linked', 'Сначала подключи аккаунт Cloudinary.')
        }
        if (loaded.kind === 'error') {
          return fail(500, 'db_error', 'Не получилось прочитать сохранённые ключи. Попробуй перепривязать аккаунт.')
        }

        const searchBody: Record<string, unknown> = {
          expression: 'resource_type:image',
          max_results: LIST_PAGE_SIZE
        }
        if (typeof payload.next_cursor === 'string' && payload.next_cursor) {
          searchBody.next_cursor = payload.next_cursor
        }
        const r = await cld(loaded.creds, '/resources/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchBody)
        })
        if (!r.ok) return cloudinaryFail(r)

        const resources = Array.isArray(r.body?.resources) ? r.body.resources : []
        return json(200, {
          success: true,
          data: {
            images: resources.map((res: any) => mapImage(res, loaded.creds.cloud_name)),
            total_count: typeof r.body?.total_count === 'number' ? r.body.total_count : null,
            next_cursor: typeof r.body?.next_cursor === 'string' ? r.body.next_cursor : null
          }
        })
      }

      // --- Загрузка новой картинки ---
      case 'upload': {
        if (!form) return fail(400, 'bad_request', 'Файл не передан.')
        const file = form.get('file')
        if (!(file instanceof File)) return fail(400, 'bad_request', 'Не удалось прочитать файл.')

        const mime = file.type || ''
        if (!ALLOWED_MIME_TYPES.includes(mime)) {
          return fail(400, 'bad_file_type', 'Это не картинка. Подходят PNG, JPG, GIF и WebP.')
        }
        if (file.size > MAX_FILE_BYTES) {
          return fail(400, 'file_too_big', 'Файл больше 10 МБ. Выбери картинку поменьше.')
        }

        const loaded = await loadCreds(admin, user.id)
        if (loaded.kind === 'not_linked') {
          return fail(409, 'account_not_linked', 'Сначала подключи аккаунт Cloudinary.')
        }
        if (loaded.kind === 'error') {
          return fail(500, 'db_error', 'Не получилось прочитать сохранённые ключи. Попробуй перепривязать аккаунт.')
        }

        const out = new FormData()
        out.append('file', file, file.name)
        out.append('folder', UPLOAD_FOLDER)
        out.append('tags', UPLOAD_TAG)
        out.append('use_filename', 'true')

        const r = await cld(loaded.creds, '/image/upload', { method: 'POST', body: out })
        if (!r.ok) return cloudinaryFail(r)

        return json(200, {
          success: true,
          data: { image: mapImage(r.body, loaded.creds.cloud_name) }
        })
      }

      // --- Удаление картинки ---
      case 'delete': {
        const publicId = typeof payload.public_id === 'string' ? payload.public_id.trim() : ''
        if (!publicId || publicId.length > 512) {
          return fail(400, 'bad_request', 'Не указано, какую картинку удалить.')
        }

        const loaded = await loadCreds(admin, user.id)
        if (loaded.kind === 'not_linked') {
          return fail(409, 'account_not_linked', 'Сначала подключи аккаунт Cloudinary.')
        }
        if (loaded.kind === 'error') {
          return fail(500, 'db_error', 'Не получилось прочитать сохранённые ключи. Попробуй перепривязать аккаунт.')
        }

        const r = await cld(loaded.creds, '/image/destroy', {
          method: 'POST',
          body: new URLSearchParams({ public_id: publicId }).toString()
        })
        if (!r.ok) return cloudinaryFail(r)

        return json(200, { success: true, data: { result: r.body?.result ?? 'ok' } })
      }

      // --- Сколько места занято в Cloudinary ---
      case 'usage': {
        const loaded = await loadCreds(admin, user.id)
        if (loaded.kind === 'not_linked') {
          return fail(409, 'account_not_linked', 'Сначала подключи аккаунт Cloudinary.')
        }
        if (loaded.kind === 'error') {
          return fail(500, 'db_error', 'Не получилось прочитать сохранённые ключи. Попробуй перепривязать аккаунт.')
        }

        const r = await cld(loaded.creds, '/usage')
        if (!r.ok) return cloudinaryFail(r)

        return json(200, {
          success: true,
          data: { plan: r.body?.plan ?? null, credits: r.body?.credits ?? null }
        })
      }

      default:
        return fail(400, 'unknown_action', 'Неизвестное действие.')
    }
  } catch (e) {
    console.error('[cloudinary-proxy] error:', e)
    return fail(500, 'internal', 'Что-то пошло не так. Попробуй ещё раз.')
  }
})
