# p5editor — Редактор p5.js с возможностью публикации скетчей

**Версия:** 0.5.3  
**Дата:** 22 марта 2026 г.  
**Статус:** ✅ Этап 5 (Модерация) реализован

**Стек:** Vue 3 + Vite 7 + TypeScript 5.9 + CodeMirror 6 + p5.js 2 + Vue Router 4 + Supabase

---

## 📖 Оглавление

- [Возможности](#возможности)
- [Установка](#установка)
- [Запуск](#запуск)
- [Структура проекта](#структура-проекта)
- [Этапы разработки](#этапы-разработки)
- [Документация](#документация)
- [Лицензия](#лицензия)

---

## Возможности

### ✅ Реализовано

#### Редактор кода
- 📝 Редактор кода с подсветкой синтаксиса (CodeMirror 6)
- ▶️ Выполнение p5.js скетчей в изолированном iframe
- 🤖 AI-помощник (Deepseek API)
- 🎨 Настройка шрифта, темы редактора
- 💾 Автосохранение в localStorage
- 📤/📥 Сохранение и загрузка скетчей

#### Галерея скетчей
- 🖼️ Галерея одобренных скетчей сообщества
- 🔍 Поиск и фильтры по категориям/сложности
- 👤 Информация об авторе
- ❤️ Система лайков
- 💬 Комментарии

#### Авторизация и профили
- 🔐 Регистрация и вход через Supabase Auth
- 👤 Профили пользователей с аватарами
- 🎭 Роли: user, moderator, admin
- 📧 Сброс пароля

#### Модерация (Этап 5) ✅
- 🛡️ Админ-панель для модераторов
- ✅ Одобрение скетчей
- ❌ Отклонение с указанием причины
- 📝 Логирование действий модерации
- 🔒 RLS политики безопасности

---

## Установка

### Требования

- Node.js ^20.19.0 или >=22.12.0
- npm или yarn
- Аккаунт на [Supabase](https://supabase.com)

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd p5editor
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка Supabase

#### 3.1. Создайте проект на Supabase

1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь завершения развёртывания

#### 3.2. Настройте переменные окружения

Создайте файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=<ваша-url-проекта>
VITE_SUPABASE_ANON_KEY=<ваш-anon-ключ>
```

**Где взять:**
- Project Settings → API
- Скопируйте **Project URL** и **anon public** ключ

#### 3.3. Выполните SQL миграции

1. Откройте **SQL Editor** в Supabase Dashboard
2. Скопируйте содержимое файла `scripts/supabase-migrations.sql`
3. Вставьте в SQL Editor и выполните

**Или через Supabase CLI:**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <ваш-project-ref>
supabase db push scripts/supabase-migrations.sql
```

#### 3.4. Настройте Storage

1. Перейдите в **Storage** в Supabase Dashboard
2. Создайте бакет `user-content`:
   - Name: `user-content`
   - Public: ✅ Yes
   - File size limit: `5242880` (5MB)

#### 3.5. Назначьте роль модератора (опционально)

```sql
-- Замените email на ваш
UPDATE public.profiles 
SET role = 'moderator' 
WHERE email = 'your-email@example.com';
```

---

## Запуск

### Режим разработки

```bash
npm run dev
```

Приложение доступно по адресу: [http://localhost:5173](http://localhost:5173)

### Production сборка

```bash
npm run build
```

Собранные файлы будут в папке `dist/`

### Preview production сборки

```bash
npm run preview
```

---

## Структура проекта

```
p5editor/
├── .env                        # Переменные окружения
├── .gitignore
├── index.html
├── package.json
├── README.md
├── tsconfig.json
├── vite.config.ts
│
├── scripts/
│   ├── supabase-migrations.sql # SQL миграции для Supabase
│   ├── MODERATION_GUIDE.md    # Руководство по модерации
│   └── SUPABASE_SETUP.md      # Инструкция по настройке Supabase
│
└── src/
    ├── main.ts                 # Точка входа
    ├── App.vue                 # Главный компонент
    │
    ├── components/
    │   ├── AIChat.vue          # AI помощник
    │   ├── AuthModal.vue       # Вход/регистрация
    │   ├── CodeEditor.vue      # Редактор кода
    │   ├── ConsoleOutput.vue   # Консоль
    │   ├── ExamplesPanel.vue   # Примеры и учебник
    │   ├── P5Canvas.vue        # Iframe для скетчей
    │   └── UserProfile.vue     # Профиль пользователя
    │
    ├── composables/
    │   ├── useAuth.ts          # Хуки авторизации
    │   ├── useSketches.ts      # Хуки для скетчей (CRUD, модерация)
    │   └── useStorage.ts       # Хуки для работы с файлами
    │
    ├── directives/
    │   └── clickOutside.ts     # Директива клика вне элемента
    │
    ├── lib/
    │   └── supabase.ts         # Клиент Supabase
    │
    ├── router/
    │   └── index.ts            # Маршруты (editor, explore, admin)
    │
    ├── types/
    │   └── supabase.ts         # TypeScript типы для БД
    │
    └── views/
        ├── AdminDashboard.vue  # Админ-панель модератора
        ├── EditorPage.vue      # Редактор
        ├── ExplorePage.vue     # Галерея
        ├── SharePage.vue       # Публикация
        └── SketchDetailPage.vue # Детали скетча
```

---

## Этапы разработки

### ✅ Этап 1: Подготовка
- [x] Установка Vue Router
- [x] Создание базовой структуры views/
- [x] Настройка навигации между страницами

### ✅ Этап 2: Галерея «Исследуй»
- [x] Компонент ExplorePage
- [x] Поиск и фильтры
- [x] Карточка скетча
- [x] Страница деталей скетча

### ✅ Этап 3: Публикация скетчей
- [x] Страница SharePage
- [x] Форма публикации
- [x] Загрузка thumbnail

### ✅ Этап 4: Авторизация на Supabase
- [x] Настройка клиента Supabase
- [x] Компоненты AuthModal и UserProfile
- [x] Composable useAuth, useSketches, useStorage
- [x] SQL миграции и RLS политики
- [x] Интеграция с приложением

### ✅ Этап 5: Модерация
- [x] Админ-панель (`AdminDashboard.vue`)
- [x] Система ролей (user, moderator, admin)
- [x] Workflow одобрения/отклонения
- [x] Таблица `sketch_moderation_logs`
- [x] RLS политики для модераторов
- [x] Защита маршрута `/admin`
- [x] Документация

### 🚧 Этап 6: Интеграция с существующими компонентами
- [ ] Обновление SharePage для работы с Supabase
- [ ] Обновление ExplorePage для работы с Supabase
- [ ] Обновление SketchDetailPage для работы с Supabase
- [ ] Страница профиля пользователя
- [ ] Личный кабинет

### 🚧 Этап 7: Полировка
- [ ] Тестирование
- [ ] Оптимизация производительности
- [ ] Деплой на GitHub Pages/Vercel

---

## Документация

### Основная документация

- [ТЕХНИЧЕСКОЕ_ОПИСАНИЕ.md](./ТЕХНИЧЕСКОЕ_ОПИСАНИЕ.md) — Полное техническое описание проекта
- [scripts/MODERATION_GUIDE.md](./scripts/MODERATION_GUIDE.md) — Руководство по модерации (Этап 5)
- [scripts/SUPABASE_SETUP.md](./scripts/SUPABASE_SETUP.md) — Инструкция по настройке Supabase

### Схемы БД

- [all_schemas_full.json](./all_schemas_full.json) — Полная схема БД Supabase
- [db_schema_for_ai.json](./db_schema_for_ai.json) — Схема БД для AI агентов

### API документация

- [Supabase JS документация](https://supabase.com/docs/reference/javascript/introduction)
- [Vue 3 документация](https://vuejs.org/)
- [CodeMirror 6 документация](https://codemirror.net/)
- [p5.js документация](https://p5js.org/reference/)

---

## Скрипты npm

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск dev-сервера (Vite) |
| `npm run build` | Production сборка (type check + сборка) |
| `npm run build-only` | Только сборка без проверок |
| `npm run type-check` | Проверка TypeScript |
| `npm run format` | Форматирование кода (Prettier) |
| `npm run preview` | Preview production сборки |
| `npm run deploy` | Деплой на GitHub Pages |
| `npm run generate-examples` | Генерация index.json для примеров |

---

## Лицензия

MIT

---

## Контакты и ресурсы

- **Vue 3:** https://vuejs.org/
- **Vite:** https://vitejs.dev/
- **p5.js:** https://p5js.org/
- **Supabase:** https://supabase.com/
- **CodeMirror 6:** https://codemirror.net/

---

## Статус проекта

**Текущий этап:** ✅ **Этап 5 (Модерация) завершён**

**Следующий этап:** 🚧 Этап 6 (Интеграция с существующими компонентами)
