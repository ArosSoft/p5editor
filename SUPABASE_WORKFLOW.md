# Работа с Supabase в проекте p5editor

**Назначение:** Полное описание того, как проект работает с базой данных Supabase. Файл создан для последующей генерации скилла (skill) — описывает архитектуру, схему БД, клиент, composables, паттерны запросов, RLS, миграции и типовые ошибки.

---

## 1. Обзор

- **Стек:** Vue 3 + Vite 7 + TypeScript + `@supabase/supabase-js` (v2).
- **Проект Supabase:** `gfupycrmnegbcafuoxdx` (hosted).
- **Репозиторий опубликован на GitHub Pages** (`base: '/p5editor/'`), поэтому используются hash-роутер и значения подключения по умолчанию, зашитые в клиент.
- Данные приложения живут в схеме `public`. Всё доступно только через **Supabase JS-клиент** (REST/PostgREST) — прямых SQL-запросов из фронтенда нет.

### Ключевые файлы

| Файл | Назначение |
|---|---|
| `src/lib/supabase.ts` | Инициализация клиента + кастомный `fetch` с таймаутами |
| `src/types/supabase.ts` | TypeScript-типы таблиц, view и вспомогательные типы |
| `src/composables/useAuth.ts` | Авторизация, сессии, профили, аватар |
| `src/composables/useSketches.ts` | CRUD скетчей, галерея, лайки, модерация |
| `src/composables/useStorage.ts` | Загрузка/удаление файлов в Storage |
| `scripts/supabase-migrations.sql` | Полная DDL-миграция (таблицы, индексы, триггеры, RLS) |
| `all_schemas_full.json` | Снимок реальной схемы БД |
| `scripts/SUPABASE_SETUP.md`, `scripts/MODERATION_GUIDE.md` | Инструкции по настройке и модерации |

---

## 2. Переменные окружения и клиент

### 2.1. Окружение

```env
VITE_SUPABASE_URL=https://gfupycrmnegbcafuoxdx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_9Yrru1vT4XDUZPY3_sm1XQ_j0YIdHLy
```

В `src/lib/supabase.ts` значения **дублируются как fallback** для GitHub Pages (без `.env`):

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gfupycrmnegbcafuoxdx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Yrru1vT4XDUZPY3_sm1XQ_j0YIdHLy'
```

### 2.2. Конфигурация клиента (`src/lib/supabase.ts`)

```ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'p5editor-auth',      // ключ localStorage для сессии
    storage: localStorage
  },
  fetch: customFetch                   // адаптивный таймаут
})
```

- **PKCE flow**, сессия сохраняется в `localStorage` под ключом `p5editor-auth`.
- **Кастомный `fetch`**: на медленных соединениях (2g/3g) таймаут 180 c, иначе 60 c; не срабатывает, если передан внешний `signal`.

> **Важно:** клиент импортируется только через `../lib/supabase`/`../composables/*`. Прямые обращения к `supabase` из `.vue` есть только для проверки соединения (см. §8).

---

## 3. Схема базы данных (`public`)

### 3.1. Таблицы

#### `profiles` — профили пользователей
| Колонка | Тип | Ограничения |
|---|---|---|
| `id` | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | text | NOT NULL |
| `display_name` | text | NULL |
| `avatar_url` | text | NULL |
| `bio` | text | NULL |
| `role` | text | NOT NULL, default `'user'`, CHECK IN (`user`,`moderator`,`admin`) |
| `created_at` | timestamptz | NOT NULL, default `now()` |
| `updated_at` | timestamptz | NOT NULL, default `now()` |

Профиль создаётся **автоматически** триггером `on_auth_user_created` после регистрации в `auth.users` (`handle_new_user()`, SECURITY DEFINER, `ON CONFLICT (id) DO NOTHING`). `display_name` берётся из `raw_user_meta_data->>'display_name'` или из email до `@`.

#### `sketches` — скетчи
| Колонка | Тип | Ограничения |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `title` | text | NOT NULL |
| `description` | text | NOT NULL |
| `code` | text | NOT NULL (исходник p5.js) |
| `thumbnail_url` | text | NULL |
| `tags` | text[] | NOT NULL, default `'{}'` |
| `category` | text | NULL |
| `difficulty` | text | NULL, CHECK IN (`Лёгкая`,`Средняя`,`Тяжёлая`) |
| `status` | text | NOT NULL, default `'pending'`, CHECK IN (`pending`,`approved`,`rejected`,`draft`) |
| `rejection_reason` | text | NULL (причина отклонения) |
| `views` | integer | NOT NULL, default 0 |
| `likes` | integer | NOT NULL, default 0 (денормализованный счётчик) |
| `created_at` / `updated_at` | timestamptz | NOT NULL, default `now()` |

#### `sketch_moderation_logs` — логи модерации
| Колонка | Тип | Ограничения |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `sketch_id` | uuid | NOT NULL, FK → `sketches(id)` ON DELETE CASCADE |
| `moderator_id` | uuid | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `action` | text | NOT NULL, CHECK IN (`approved`,`rejected`) |
| `comment` | text | NULL |
| `created_at` | timestamptz | NOT NULL, default `now()` |

#### `sketch_likes` — лайки
| Колонка | Тип | Ограничения |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, FK → `profiles(id)` |
| `sketch_id` | uuid | NOT NULL, FK → `sketches(id)` |
| `created_at` | timestamptz | NOT NULL, default `now()` |

UNIQUE(`user_id`, `sketch_id`). Триггеры `on_like_created` / `on_like_deleted` автоматически меняют `sketches.likes`.

#### `sketch_comments` — комментарии
| Колонка | Тип | Ограничения |
|---|---|---|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `user_id` | uuid | NOT NULL, FK → `profiles(id)` |
| `sketch_id` | uuid | NOT NULL, FK → `sketches(id)` |
| `content` | text | NOT NULL |
| `created_at` / `updated_at` | timestamptz | NOT NULL, default `now()` |

### 3.2. View

**`gallery_sketches`** — скетчи только со статусом `approved` + данные автора:

```sql
SELECT s.id, s.title, s.description,
  COALESCE(p.display_name, SPLIT_PART(p.email, '@', 1)) AS author_name,
  p.avatar_url AS author_avatar,
  s.thumbnail_url, s.tags, s.category, s.difficulty,
  s.likes, s.views, s.created_at
FROM sketches s
JOIN profiles p ON s.user_id = p.id
WHERE s.status = 'approved'
ORDER BY s.created_at DESC
```

Тип во фронтенде: `GallerySketch`. **В коде приложения view не используется** — галерея читается из таблицы `sketches` с join на `profiles`.

### 3.3. Индексы

- `profiles`: `email`, `role`.
- `sketches`: `user_id`, `status`, `category` (partial), `difficulty` (partial), `created_at DESC`, `likes DESC`, `views DESC`, `tags` (GIN).
- `sketch_likes`: `user_id`, `sketch_id`.
- `sketch_comments`: `user_id`, `sketch_id`.
- `sketch_moderation_logs`: `sketch_id`, `moderator_id`, `action`.

### 3.4. Триггеры и функции

| Триггер | Функция | Описание |
|---|---|---|
| `on_auth_user_created` | `handle_new_user()` | Создание профиля при регистрации (SECURITY DEFINER) |
| `update_profiles_updated_at` | `update_updated_at_column()` | `updated_at = now()` перед UPDATE |
| `update_sketches_updated_at` | то же | — |
| `update_sketch_comments_updated_at` | то же | — |
| `on_like_created` | `increment_sketch_likes()` | `likes + 1` |
| `on_like_deleted` | `decrement_sketch_likes()` | `likes = GREATEST(0, likes - 1)` |

---

## 4. TypeScript-типы (`src/types/supabase.ts`)

Для каждой таблицы объявлены `Row` / `Insert` / `Update`. Экспортируемые алиасы:

```ts
Profile / ProfileInsert / ProfileUpdate
Sketch / SketchInsert / SketchUpdate
SketchLike / SketchLikeInsert
SketchComment / SketchCommentInsert
GallerySketch
ProfilesUpdate / SketchesInsert / SketchesUpdate / SketchLikesInsert
SketchModerationLog / SketchModerationLogInsert
SketchWithProfile   // Sketch + profiles + moderation_log
```

Важные перечисления:
```ts
UserRole = 'user' | 'moderator' | 'admin'
SketchStatus = 'pending' | 'approved' | 'rejected' | 'draft'
SketchDifficulty = 'Лёгкая' | 'Средняя' | 'Тяжёлая'
ModerationAction = 'approved' | 'rejected'
```

`SketchWithProfile` (используется в галерее и детальной странице):

```ts
interface SketchWithProfile extends Sketch {
  profiles?: { id, display_name, email, avatar_url } | null
  moderation_log?: { action, comment, moderator_name, created_at } | null
}
```

> Примечание: типы **поддерживаются вручную** и повторяют схему. При изменении БД нужно обновлять и `src/types/supabase.ts`.

---

## 5. Авторизация (`useAuth`)

Файл: `src/composables/useAuth.ts`. Глобальное синглтон-состояние (модульные `ref`).

### 5.1. Жизненный цикл

- **`initAuth()`** вызывается один раз в `src/main.ts` до монтирования приложения.
- Порядок: кеш сессии → `supabase.auth.getSession()` → подписка `onAuthStateChange`.
- **Кеш сессии** (`p5editor-auth-cache`): сессия + `savedAt`, живёт 15 минут (grace). Позволяет мгновенно показать пользователя до ответа сервера.
- При событии `PASSWORD_RECOVERY` включается `passwordRecoveryMode` и роутер переходит на `/update-password`.
- При `TOKEN_REFRESH_FAILED` / `SIGNED_OUT` — полный сброс состояния, чистка `localStorage` (`p5editor-auth`, `p5editor-auth-cache`, `user_role`).
- Роль профиля кэшируется в `localStorage.setItem('user_role', role)`.

### 5.2. Публичный API

```ts
const {
  user, profile, session, loading, error,      // ref
  isAuthenticated, isAdmin, isModerator,       // computed
  isReady, readyPromise, passwordRecoveryMode, // computed
  login, register, logout,
  resetPassword, updatePassword,
  updateProfile, uploadAvatar, loadProfile
} = useAuth()
```

| Метод | Реализация |
|---|---|
| `login(email, password)` | `supabase.auth.signInWithPassword` |
| `register(email, password, displayName?)` | `supabase.auth.signUp` с `options.data.display_name` |
| `logout()` | `supabase.auth.signOut` + чистка локального состояния |
| `resetPassword(email)` | `supabase.auth.resetPasswordForEmail(email, { redirectTo })`; basePath учитывает `/p5editor/` (GitHub Pages) |
| `updatePassword(newPassword)` | `supabase.auth.updateUser({ password })` |
| `updateProfile(updates)` | `supabase.from('profiles').update(updates).eq('id', user.id).select().single()` |
| `uploadAvatar(file)` | Storage → путь `avatars/{userId}-{timestamp}.{ext}` → `updateProfile({ avatar_url })` |

> `isModerator` = `role === 'moderator' || role === 'admin'`.

### 5.3. Роутер и права

В `src/router/index.ts` guard `beforeEach`:
- ждёт `readyPromise` (если auth ещё не готов);
- `requiresAuth` → без `user`/`session` редирект на `/` с `query.auth='required'`;
- `requiresModerator` (`/admin`) → без авторизации редирект на `/`.

Защищённые маршруты: `/share`, `/profile`, `/dashboard` (`requiresAuth`), `/admin` (`requiresModerator`).

---

## 6. Скетчи (`useSketches`)

Файл: `src/composables/useSketches.ts`. Все методы возвращают `{ success, data?, error? }`.

### 6.1. Обёртки запросов (важные паттерны)

**`withTimeout(queryBuilder, timeoutMs, message)`** — таймаут + реальная отмена через `AbortController` и `queryBuilder.abortSignal(...)`.

**`withAuthRetry(queryFactory, timeoutMs, message)`** — первая попытка; при ошибке `401` / `PGRST301` / сообщении про `JWT` вызывает `supabase.auth.refreshSession()` и повторяет запрос с новой фабрикой (`queryFactory`). Это стандарт для всех запросов к `sketches`.

```ts
const { data, error } = await withAuthRetry(
  () => supabase.from('sketches').select('*').eq('id', id).single(),
  8000, 'Таймаут загрузки скетча'
)
```

Таймауты: `DEFAULT_TIMEOUT = 8000`, `LONG_TIMEOUT = 15000` (insert/update модерации).

### 6.2. Запросы

| Метод | Суть |
|---|---|
| `getSketchById(id)` | select `*` + join `profiles:user_id` + `sketch_moderation_logs` (с join `profiles:moderator_id`); берёт последний лог по `created_at` → формирует `moderation_log` |
| `getGallerySketches({page, limit, category, difficulty, search, tags, sortBy, sortOrder})` | select `*` + `profiles:user_id`, `.eq('status','approved')`, фильтры, пагинация `.range(from,to)`, `count: 'exact'` |
| `getUserSketches(userId, status?)` | select + `sketch_moderation_logs`, `.eq('user_id', userId)`, опционально `.eq('status', status)` |
| `createSketch(data)` | `.insert(data).select().single()` |
| `updateSketch(id, updates)` | `.update(updates).eq('id', id).select().single()` |
| `deleteSketch(id)` | сначала читает `thumbnail_url`, удаляет файл из Storage, затем `.delete().eq('id', id)` |
| `incrementViews(id)` | `.update({ views: sketch.value.views + 1 })` (клиентский инкремент) |
| `toggleLike(sketchId, userId)` | проверка `.maybeSingle()`, insert или delete в `sketch_likes`, синхронизация `sketch.value.likes` |
| `checkLike(sketchId, userId)` | `.maybeSingle()` на `sketch_likes` |
| `getCategories()` | select `category` у approved, `.not('category','is',null)`, уникализация на клиенте |
| `getPendingSketches()` | select + join профиля, `.eq('status','pending')`, `.order('created_at', {ascending:false})` |
| `approveSketch(sketchId, moderatorId, comment?)` | update status `approved` + insert в `sketch_moderation_logs` (лог не критичен) |
| `rejectSketch(sketchId, moderatorId, reason)` | проверка доступа → update status `rejected` + insert лога с `comment: reason` |
| `getSketchModerationHistory(sketchId)` | select `*` + `profiles:moderator_id`, `.eq('sketch_id',...)`, `.order('created_at',{ascending:false})` |

### 6.3. Паттерны запросов в деталях

**Join (PostgREST «вложенные» ресурсы):**

```ts
supabase
  .from('sketches')
  .select(`
    *,
    profiles:user_id (
      id,
      display_name,
      avatar_url
    ),
    sketch_moderation_logs (
      id,
      action,
      comment,
      created_at,
      profiles:moderator_id (
        display_name
      )
    )
  `, { count: 'exact' })
```

**Фильтр по тэгам** (array contains):

```ts
const tagFilters = tags.map(tag => `tags.cs.{${JSON.stringify(tag)}}`).join(',')
query = query.or(tagFilters)
```

**Поиск** (case-insensitive LIKE по title/description):

```ts
query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
```

**Сортировка:** маппинг `'new'|'title'|'views'|'created_at'`; для `popular` — клиентская сортировка по формуле `views*0.7 + likes*10*0.3`.

### 6.4. Workflow публикации (SharePage)

1. Загрузка thumbnail в Storage (`uploadFile(file, 'thumbnails')`) → получаем публичный URL.
2. `createSketch({ user_id, title, description, code, thumbnail_url, tags, category, difficulty, status: 'pending' })`.
3. Редирект в `/dashboard` (личный кабинет), где виден статус.

### 6.5. Workflow модерации

1. `getPendingSketches()` — список `status='pending'`.
2. `approveSketch` → `status='approved'` (появляется в галерее) + лог `approved`.
3. `rejectSketch` → `status='rejected'` + лог `rejected` с причиной (по коду причина пишется только в лог; поле `rejection_reason` предусмотрено схемой).

---

## 7. Storage (`useStorage`)

Файл: `src/composables/useStorage.ts`. Бакет: **`user-content`** (public, лимит 5 MB по настройке Dashboard; в `config.toml` — 50 MiB).

| Метод | Суть |
|---|---|
| `uploadFile(file, folder, options?)` | путь `{folder}/{Date.now()}-{rand}.{ext}`, `cacheControl:'3600'`, таймаут 60 c через `Promise.race`, возврат `{ success, url, path }` |
| `uploadAvatar(file, userId)` | путь `avatars/{userId}-avatar.{ext}`, сначала удаляет старые файлы по поиску `{userId}-avatar`, `upsert: true` |
| `uploadThumbnail(file, sketchId)` | путь `thumbnails/{sketchId}-thumbnail.{ext}`, удаляет старые, `upsert: true` |
| `deleteFile(filePath)` | `supabase.storage.from('user-content').remove([filePath])` |
| `getPublicUrl(filePath)` | `supabase.storage...getPublicUrl()` |
| `uploadMultipleFiles(files, folder, options?)` | `Promise.all` по `uploadFile` |

**Извлечение пути из публичного URL** (используется в `deleteSketch`):

```ts
const url = sketchData.thumbnail_url
const match = url.match(/\/public\/user-content\/([^?]+)/)
if (match) { const filePath = match[1]; await deleteFile(filePath) }
```

> В `useAuth.uploadAvatar` продублирована своя реализация загрузки аватара (без удаления старого). `useStorage.uploadAvatar` — предпочтительный вариант.

---

## 8. Проверка соединения с Supabase

Применяется в `EditorPage.vue` (`LoadingPanel.vue` и `SharePage.vue`):

```ts
const { error } = await supabase.from('sketches').select('id').limit(1)
// статус: 'checking' | 'connected' | 'error'
```

В `SharePage.vue` также прямой `fetch` к `.../rest/v1/sketches?select=id&limit=1` с измерением времени ответа. Публикация блокируется, пока `supabaseStatus !== 'connected'`.

---

## 9. RLS-политики (безопасность)

Включены для всех таблиц `public`. Полный SQL — в `scripts/supabase-migrations.sql`, актуальный снимок — в `all_schemas_full.json` и `scripts/RLS.txt`.

### `profiles`
- SELECT: все (`true`).
- UPDATE: `auth.uid() = id`.
- INSERT: `auth.uid() = id`.

### `sketches`
- SELECT: `status = 'approved'` (все) **или** `auth.uid() = user_id` (свои) **или** роль moderator/admin.
- INSERT: `auth.uid() = user_id`.
- UPDATE: `auth.uid() = user_id` **или** роль moderator/admin.
- DELETE: `auth.uid() = user_id` (admin — отдельной политикой).
- Модераторская политика через `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('moderator','admin'))`.

### `sketch_likes`
- SELECT: все.
- INSERT: `auth.uid() = user_id`.
- DELETE: `auth.uid() = user_id`.

### `sketch_comments`
- SELECT: все.
- INSERT: `auth.uid() = user_id`.
- UPDATE/DELETE: `auth.uid() = user_id`.

### `sketch_moderation_logs`
- SELECT и INSERT: только роль moderator/admin.

> **Важно (см. `scripts/RLS.txt`):** в части политик роль проверяется через таблицу `profiles.role`, в других — через JWT-claim `auth.jwt() ->> 'role'`. Эти источники могут расходиться. В актуальных миграциях (`supabase-migrations.sql`) используются проверки через таблицу `profiles`.

---

## 10. Инициализация проекта на новой машине

### 10.1. Локальный запуск

```bash
npm install
# при необходимости создать .env с VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev        # http://localhost:5173
npm run type-check # vue-tsc --build
```

### 10.2. Развёртывание схемы (SQL Editor в Dashboard)

Скопировать `scripts/supabase-migrations.sql` целиком в SQL Editor проекта `gfupycrmnegbcafuoxdx` и выполнить. Альтернатива — Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

### 10.3. Storage

Бакет `user-content` (Public = YES, file size limit 5 MB) + политики на `storage.objects`:
- INSERT: `bucket_id = 'user-content' AND auth.uid() IS NOT NULL`;
- SELECT: `bucket_id = 'user-content'` (всем);
- DELETE: `bucket_id = 'user-content' AND auth.uid() = owner`.

### 10.4. Роли

```sql
UPDATE public.profiles SET role = 'moderator' WHERE email = '...';
UPDATE public.profiles SET role = 'admin' WHERE email = '...';
```

---

## 11. Миграция / перенос БД на свой сервер

В репозитории есть скрипты переноса (см. `MIGRATION_GUIDE.md`, `EXECUTE_ON_SERVER.md`, `docker-migrate.sh`):

- `scripts/migrate-supabase.js` — интерактивная миграция через Supabase CLI (`supabase db dump` + `psql`).
- `scripts/create-dump.js` — генерация `migration.sql` (INSERT-строки) через `pg` из исходного сервера.
- `scripts/apply-migration.js` — применение `migration.sql` к целевому серверу (`TARGET_HOST`, `TARGET_PASSWORD`).
- После смены сервера обновить `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в `src/lib/supabase.ts` (fallback) и в `.env`, а также настроить Site URL / redirect URLs / CORS в Dashboard.

> Внимание: эти файлы содержат **реальные/примерные секреты** (service role key, пароль). Не публиковать ключи, выходящие за пределы проекта.

---

## 12. Типовые ошибки и решения

| Симптом | Причина / решение |
|---|---|
| `401` / `PGRST301` / "JWT expired" | Обрабатывается `withAuthRetry` (refresh + повтор). Если повторяется — проверьте `autoRefreshToken`, `localStorage['p5editor-auth']` |
| "new row violates row-level security policy" | Нет подходящей RLS-политики; проверьте `auth.uid() = user_id` и что пользователь авторизован |
| Модератор не видит админ-панель | Роль не в `profiles.role` или в `localStorage['user_role']`; проверить `SELECT email, role FROM profiles` |
| `relation already exists` | Миграция уже применена; пересоздавать только при необходимости `DROP TABLE ... CASCADE` |
| Аватар не грузится | Бакет `user-content` не публичный или нет политик INSERT/SELECT |
| Профиль не создаётся при регистрации | Нет триггера `on_auth_user_created` / функции `handle_new_user()` |
| Скетч не появляется в галерее | Статус не `approved`; проверить RLS SELECT на `sketches` |

---

## 13. Чеклист при добавлении новой таблицы/колонки

1. Добавить DDL в `scripts/supabase-migrations.sql` (и применить через SQL Editor).
2. Обновить `src/types/supabase.ts` (Row/Insert/Update).
3. При необходимости — типы `SketchWithProfile`/view.
4. Реализовать запросы в нужном composable, обернуть в `withAuthRetry` (если данные зависят от ролей/авторизации).
5. Настроить RLS-политики и включить RLS.
6. Обновить `all_schemas_full.json` (снимок схемы).