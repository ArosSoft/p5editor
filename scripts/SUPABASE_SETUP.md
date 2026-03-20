# Инструкция по настройке Supabase для p5editor

**Версия:** 0.3.0  
**Дата:** 20 марта 2026 г.

---

## 📋 Шаг 1: Подготовка переменных окружения

Создайте файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://gfupycrmnegbcafuoxdx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_9Yrru1vT4XDUZPY3_sm1XQ_j0YIdHLy
```

**Важно:** Добавьте `.env` в `.gitignore` (уже сделано).

---

## 📋 Шаг 2: Выполнение SQL миграций

1. **Откройте [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Выберите ваш проект:** `gfupycrmnegbcafuoxdx`
3. **Перейдите в SQL Editor:**
   - В левом меню нажмите **SQL Editor**
   - Нажмите **New query**

4. **Скопируйте и выполните SQL-скрипт:**
   - Откройте файл `scripts/supabase-migrations.sql`
   - Скопируйте всё содержимое
   - Вставьте в SQL Editor
   - Нажмите **Run** (или Ctrl+Enter)

5. **Проверьте результат:**
   - Убедитесь, что все команды выполнены без ошибок
   - В разделе **Table Editor** должны появиться таблицы:
     - `profiles`
     - `sketches`
     - `sketch_likes`
     - `sketch_comments`

---

## 📋 Шаг 3: Настройка Storage (бакет для файлов)

1. **Перейдите в Storage:**
   - В левом меню нажмите **Storage**
   - Нажмите **New bucket**

2. **Создайте бакет:**
   - **Name:** `user-content`
   - **Public:** ✅ Да (сделать публичным)
   - **File size limit:** `5242880` (5 MB)
   - Нажмите **Create bucket**

3. **Настройте политики доступа к бакету:**
   - Нажмите на бакет `user-content`
   - Перейдите во вкладку **Policies**
   - Нажмите **New policy**

4. **Добавьте политику для загрузки файлов:**

```sql
-- Разрешить авторизованным пользователям загружать файлы
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-content'
  AND auth.uid() IS NOT NULL
);
```

5. **Добавьте политику для чтения файлов:**

```sql
-- Разрешить всем читать файлы (публичный доступ)
CREATE POLICY "Public files are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-content');
```

6. **Добавьте политику для удаления файлов:**

```sql
-- Пользователи могут удалять только свои файлы
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-content'
  AND auth.uid() = owner
);
```

---

## 📋 Шаг 4: Настройка Email подтверждений (опционально)

По умолчанию Supabase требует подтверждение email при регистрации.

### Вариант A: Отключить подтверждение email (для разработки)

1. **Перейдите в Authentication:**
   - В левом меню **Authentication** → **Settings**

2. **Отключите подтверждение:**
   - Найдите **Enable email confirmations**
   - Выключите переключатель
   - Нажмите **Save**

### Вариант B: Настроить SMTP для production

1. **Перейдите в Project Settings:**
   - В левом меню **Project Settings** → **Auth**

2. **Настройте SMTP:**
   - Прокрутите до **SMTP Settings**
   - Введите данные вашего SMTP-сервера
   - Нажмите **Save**

---

## 📋 Шаг 5: Создание тестового админа

После выполнения миграций все новые пользователи создаются с ролью `user`.

Чтобы создать админа:

1. **Зарегистрируйте пользователя** через приложение (кнопка "Войти" → "Регистрация")

2. **Обновите роль в SQL Editor:**

```sql
-- Замените email на email вашего пользователя
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

3. **Проверьте результат:**

```sql
SELECT email, display_name, role FROM profiles;
```

---

## 📋 Шаг 6: Проверка подключения

1. **Запустите приложение:**

```bash
npm run dev
```

2. **Проверьте авторизацию:**
   - Нажмите кнопку "Войти"
   - Зарегистрируйтесь или войдите
   - Проверьте, что профиль отображается в хедере

3. **Проверьте загрузку аватара:**
   - Нажмите на профиль
   - Выберите "Редактировать профиль"
   - Загрузите аватар
   - Проверьте, что изображение сохранилось

---

## 📋 Шаг 7: Проверка таблиц

Выполните в SQL Editor:

```sql
-- Проверка структуры таблиц
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- Проверка триггеров
SELECT trigger_name, event_object_table, action_timing 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Проверка view
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Проверка RLS политик
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## 🔧 Возможные проблемы и решения

### Ошибка: "relation already exists"

**Решение:** Таблицы уже созданы. Можно пропустить этот шаг или удалить существующие таблицы:

```sql
-- ⚠️ Внимание! Это удалит все данные!
DROP TABLE IF EXISTS sketch_comments CASCADE;
DROP TABLE IF EXISTS sketch_likes CASCADE;
DROP TABLE IF EXISTS sketches CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP VIEW IF EXISTS gallery_sketches CASCADE;
```

### Ошибка: "permission denied for schema auth"

**Решение:** Убедитесь, что выполняете скрипт от имени пользователя с правами admin.

### Аватар не загружается

**Проверьте:**
1. Бакет `user-content` создан и публичный
2. Политики доступа к бакету настроены
3. Пользователь авторизован

### Профиль не создаётся при регистрации

**Проверьте:**
1. Trigger `on_auth_user_created` существует
2. Функция `handle_new_user()` выполнена

---

## 📚 Полезные ссылки

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/gfupycrmnegbcafuoxdx/sql)
- [Supabase Storage](https://supabase.com/dashboard/project/gfupycrmnegbcafuoxdx/storage)
- [Supabase Auth](https://supabase.com/dashboard/project/gfupycrmnegbcafuoxdx/auth)
- [Документация Supabase](https://supabase.com/docs)

---

*Инструкция обновлена: 20 марта 2026 г.*
