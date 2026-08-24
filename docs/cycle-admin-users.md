# Цикл: Панель управления пользователями (админ)

**Цель:** добавить админу в глобальный хедер выпадающее меню с пунктом
«Управление пользователями», ведущим на страницу со списком, поиском и
фильтром пользователей сайта.

**Архитектура:** hybrid (фаза 1 = клиентский profiles-уровень на anon-key + RLS;
фаза 2 = Supabase Edge Function с service_role для смены роли, сброса пароля,
бана/удаления auth-аккаунта, audit-log).

**Решения (подтверждены пользователем):**
- Меню: новый глобальный хедер `AppHeader.vue`, видимый на всех страницах.
- Объём фазы 1: список + поиск + фильтр по роли (read-only, без действий над юзером).
- Глубокие действия (роль/бан/удаление) — отдельная фаза через Edge Function.

## Цикл (LLM-loop)

```
loop until DONE:
  1. PLAN        — взять следующий task из backlog
  2. CONTEXT     — прочитать referenced files
  3. IMPLEMENT   — создать/изменить файлы
  4. TYPECHECK   — npm run type-check (vue-tsc)
  5. FIX         — при ошибках -> IMPLEMENT
  6. BUILD       — npm run build
  7. REPORT      — пометить task done, перейти к следующему
```

## Backlog

### P0 — Глобальный хедер с dropdown
- **create:** `src/components/AppHeader.vue`
- **edit:** `src/App.vue`
- **do:**
  - Импортировать `AppHeader` в `App.vue` и вставить над `<RouterView>`.
  - Шапка: слева лого + «Исследуй»; справа — если `!isAuthenticated`: кнопка
    «Войти» (локальный `AuthModal` с `v-model`), иначе аватар + `display_name`
    с клик-админ dropdown.
  - Dropdown (через `v-click-outside` из `src/directives/clickOutside.ts`):
    - все: Профиль (`/profile`), Личный кабинет (`/dashboard`), Выход
    - `isModerator`: Админ-панель (`/admin`), Создание пользователей (`/create-users`)
    - `isAdmin`: Управление пользователями (`/admin/users`)
  - Тема: читать `localStorage['p5editor-theme']` (dark/light), паттерн из `CreateUsersPage.vue`.
- **verify:** type-check, build, меню открывается/закрывается по клику вне.

### P1 — Роут и защита админа
- **edit:** `src/router/index.ts`
- **do:**
  - Добавить ленивый импорт `AdminUsersPage` и роут
    `{ path:'/admin/users', name:'admin-users', component: AdminUsersPage,
       meta:{ title:'Управление пользователями', requiresAdmin:true } }`.
  - В `router.beforeEach` добавить ветку `requiresAdmin`: если `!isAdmin` -> `next('/')`.
    (`isAdmin` уже есть в `useAuth`.)
- **verify:** type-check, build, не-админ при `/admin/users` -> редирект на `/`.

### P2 — Страница управления пользователями (список+поиск+фильтр)
- **create:** `src/views/AdminUsersPage.vue`
- **do:**
  - `useAuth()` -> `isReady/readyPromise/isAdmin`; `onMounted` ждать ready и
    проверять `isAdmin` (как в `CreateUsersPage.vue`).
  - Загрузка профилей:
    `supabase.from('profiles').select('id,email,display_name,avatar_url,role,created_at', { count:'exact' })`
    `.order('created_at',{ascending:false}).range(from,to)`; пагинация по 20.
  - Поиск (debounce ~300мс): `.or('email.ilike.%q%,display_name.ilike.%q%')`.
  - Фильтр роли: select All/user/moderator/admin -> `.eq('role', r)` когда не All.
  - Таблица: аватар, ФИО/display_name, email, бейдж роли, дата регистрации.
  - Состояния: loading, error + кнопка «Попробовать снова» (паттерн `ExplorePage.vue`), empty.
  - Пагинация: «Назад/Вперёд» + «стр N».
  - Тема: reuse `themeClass` паттерн из `CreateUsersPage.vue`.
  - Фаза 1 read-only (действия над юзером — в фазе Edge Function).
- **verify:** type-check, build; под админом список грузится, поиск/фильтр/пагинация/retry работают.

## Future (P3) — Edge Function (service_role), гибрид-часть
- смена роли, сброс пароля, бан/разбан, удаление auth-аккаунта, audit-log
- требует деплоя `supabase/functions` + секрет; вне объёма фазы 1.

### Статус (обновлено)
- **Смена роли (user/moderator/admin) — РЕАЛИЗОВАНО клиентски** в `AdminUsersPage.vue`
  через `<select>` в строке + RLS-политика `scripts/003-admin-user-management.sql`
  (`Admins can update any profile`). Защита от смены собственной роли.
  **Миграцию 003 нужно выполнить в Supabase SQL Editor вручную.**
  - ВАЖНО: исходная версия (inline-подзапрос к profiles внутри политики НА profiles)
    давала HTTP 500 на PATCH. Исправлено через SECURITY DEFINER функцию `public.is_admin()`,
    которая обходит RLS и убирает рекурсию. Перевыполняйте актуальный скрипт 003 при ошибках 500.
- **Сброс пароля (письмо со ссылкой) — РЕАЛИЗОВАНО клиентски** через
  `supabase.auth.resetPasswordForEmail` (работает с anon-key). Кнопка в строке.
- **Аудит-лог админских действий — РЕАЛИЗОВАНО.** Таблица `admin_audit_logs`
  (`scripts/004-admin-audit-logs.sql`) + запись после смены роли и сброса пароля.
  **Миграцию 004 нужно выполнить в Supabase SQL Editor вручную.**
- **Осталось для P3 (требует Edge Function + service_role):**
  - бан / разбан / удаление самого auth-аккаунта (удаление только profiles создаст
    «осиротевшего» auth-пользователя — поэтому DELETE-политика намеренно не добавлена)
  - инвайт пользователя по email (опц.)

## Acceptance
- админ видит в dropdown пункт «Управление пользователями» и переходит на `/admin/users`
- не-админ (user/moderator) пункта не видит и редиректится
- список + поиск + фильтр по роли работают, пагинация и retry присутствуют
- `npm run type-check` и `npm run build` проходят

## Ключевые файлы
- `src/App.vue` — добавить `<AppHeader />` над `<RouterView>`.
- `src/router/index.ts` — новый роут `/admin/users` + ветка `requiresAdmin`.
- `src/directives/clickOutside.ts` — переиспользовать для закрытия dropdown.
- `src/views/AdminUsersPage.vue` (new) — по образцу `CreateUsersPage.vue` и `ExplorePage.vue`.
