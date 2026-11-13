# Подключение хранилища изображений Cloudinary (деплой)

Проект Supabase: `gfupycrmnegbcafuoxdx` (https://supabase.com/dashboard/project/gfupycrmnegbcafuoxdx)

Фича состоит из двух частей, которые нужно развернуть на боевом Supabase:

1. **Миграция базы** — таблица `cloudinary_accounts` + безопасный view `cloudinary_accounts_safe`
2. **Edge Function `cloudinary-proxy`** — прокси к Cloudinary (шифрует и хранит API Secret, выполняет все запросы к Cloudinary от имени пользователя)

После этого фича целиком работает на сайте (локально и на GitHub Pages).

---

## Шаг 1. Применить миграцию базы

1. Открой SQL Editor:
   https://supabase.com/dashboard/project/gfupycrmnegbcafuoxdx/sql/new
2. Открой файл `scripts/007-cloudinary-images.sql`, скопируй **весь** текст.
3. Вставь в SQL Editor и нажми **Run**.

Миграция идемпотентна (повторный запуск безопасен) и создаёт только новые объекты:

| Объект | Назначение |
|---|---|
| `public.cloudinary_accounts` | привязка «пользователь → его Cloudinary» (API Secret зашифрован AES-GCM) |
| `public.cloudinary_accounts_safe` | view для фронтенда: только своя строка, только несекретные колонки |

**Проверка:** в Table Editor должна появиться таблица `cloudinary_accounts`, а запрос
`select * from cloudinary_accounts_safe` в SQL Editor не должен возвращать строк (и ошибок).

### Альтернатива: применить из командной строки

Прямое подключение к базе теперь только по IPv6, а JWT как пароль новая
инфраструктура не принимает. С IPv4-сети подключайся через pooler
`aws-1-eu-central-1.pooler.supabase.com:5432` (session mode), пользователь
`postgres.gfupycrmnegbcafuoxdx`, пароль — пароль базы (Dashboard → Settings →
Database → Reset database password):

```bash
DB_URL="postgresql://postgres.gfupycrmnegbcafuoxdx:<ПАРОЛЬ_БАЗЫ>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" node scripts/apply-007-cloudinary.js
```

Скрипт применяет миграцию и проверяет, что права `anon`/`authenticated` на
таблицу отсутствуют, а в view нет колонки с секретом.

---

## Шаг 2. Создать Edge Function

1. Открой https://supabase.com/dashboard/project/gfupycrmnegbcafuoxdx/functions
2. Нажми **Create a new function** (или New function).
3. Название: **`cloudinary-proxy`** (строго так — это имя используется в коде сайта).
4. Удали шаблонный код из редактора.
5. Открой файл `supabase/functions/cloudinary-proxy/index.ts`, скопируй **весь** код и вставь в редактор.
6. Нажми **Deploy function**.
7. Настройка **Verify JWT** должна остаться **включённой** (по умолчанию) — сайт
   обращается к функции с токеном вошедшего пользователя.

---

## Шаг 3. Задать секреты функции

Оба секрета задаются в интерфейсе функции: **Manage secrets** (или Secrets →
Add new secret):

| Секрет | Значение | Где взять |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | сервисный ключ проекта (JWT `eyJ...`) | Dashboard → Project Settings → API → `service_role` (секретный!) |
| `CLOUDINARY_ENC_KEY` | `nyXR7KwJSwIiQlIDfVphoQmD/u3Q7IPIZXlowAJ6iXg=` | уже сгенерирован — ключ AES-256 для шифрования API Secret пользователей |

> Если `CLOUDINARY_ENC_KEY` поменять после того, как пользователи уже привязали
> аккаунты, старые записи не расшифруются (пользователям нужно будет привязаться
> заново). Сгенерировать новый ключ: PowerShell
> `[Convert]::ToBase64String((1..32|%{Get-Random -Maximum 256}) -as [byte[]])`
> или `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

`SUPABASE_URL` и `SUPABASE_ANON_KEY` подставляются автоматически, их задавать не нужно.

---

## Шаг 4. Проверить

1. Открой сайт (локально `npm run dev` → http://localhost:5174/p5editor/#/images,
   или боевой GitHub Pages), войди в аккаунт.
2. Меню профиля → **Мои изображения**.
3. Пройди онбординг: зарегистрируй Cloudinary → скопируй Cloud name / API Key /
   API Secret → «Проверить и подключить».
4. После успешной привязки появится панель аккаунта и список картинок из твоего
   Cloudinary (если аккаунт свежий — список пуст, так и должно быть).

Типичные ошибки:

| Сообщение | Причина |
|---|---|
| `Сервер настроен неправильно (нет сервисного ключа)` | не задан секрет `SUPABASE_SERVICE_ROLE_KEY` |
| `Сервер настроен неправильно (нет ключа шифрования)` | не задан секрет `CLOUDINARY_ENC_KEY` |
| `Cloudinary не принял ключи...` | неверные Cloud name / API Key / API Secret |
| 404 / «Неизвестное действие» | функция не развернута или развернута под другим именем |
| Ошибка `Could not find the table ... cloudinary_accounts_safe` | не применена миграция из шага 1 |

## Ограничение доступности Cloudinary

Cloudinary может не открываться с IP-адресов некоторых стран (не загружаются сайт
и консоль). Это ограничение самого сервиса, а не ошибка p5editor. На странице
онбординга добавлено предупреждение для пользователей.

- Для проверки используйте **VPN**. Ограничение временное.
- После привязки аккаунта все запросы к Cloudinary выполняет Edge Function на
  серверах Supabase, поэтому список, загрузка, удаление и использование аккаунта
  работают независимо от того, открывается ли сайт Cloudinary у пользователя.
- Если страница тестируется через VPN, а функция уже развёрнута — повторный деплой
  не нужен.
