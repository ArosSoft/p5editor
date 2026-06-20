# Инструкция по переносу Supabase на Docker-сервер

## Ваши данные
- **Исходный сервер**: `gfupycrmnegbcafuoxdx.supabase.co`
- **Новый сервер**: `192.168.1.211`
- **Пароль postgres**: `your-super-secret-and-long-postgres-password`

---

## Способ 1: Через Supabase Dashboard (самый простой)

1. **На исходном сервере** → SQL Editor:
   ```sql
   -- Скопируйте структуру таблиц
   SELECT * FROM pg_tables WHERE schemaname = 'public';
   ```

2. **Экспорт через Dashboard**:
   - Settings → Database → Backups
   - Скачайте последний backup

3. **На новом сервере**:
   ```bash
   # Подключитесь к БД
   docker exec -it supabase-db psql -U postgres -d postgres
   
   # Очистите и импортируйте
   \i /backup.sql
   ```

---

## Способ 2: SQL Миграция через pg_dump

**Выполните на сервере с доступом к исходному Supabase:**

```bash
# Установите Supabase CLI (Linux/Mac/WSL)
brew install supabase/tap/supabase
# или
curl -fsSL https://supabase.com/install.sh | sh

# Создайте дамп
supabase db dump \
  --db-url "postgresql://postgres:YOUR_SERVICE_KEY@gfupycrmnegbcafuoxdx.supabase.co:5432/postgres" \
  -s public -f backup.sql

# Перенесите backup.sql на новый сервер
scp backup.sql user@192.168.1.211:/tmp/
```

**На новом сервере:**
```bash
# Очистите базу
docker exec -i supabase-db psql -U postgres -d postgres <<EOF
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
EOF

# Восстановите данные
docker cp /tmp/backup.sql supabase-db:/backup.sql
docker exec -i supabase-db psql -U postgres -d postgres -f /backup.sql
```

---

## Способ 3: Автоматический скрипт (Node.js)

**На сервере с доступом к исходному Supabase:**
```bash
# Установите зависимости
npm install pg

# Экспорт данных
SOURCE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... node scripts/create-dump.js

# Получите файл migration.sql
```

**На новом сервере:**
```bash
# Примените миграцию
TARGET_PASSWORD=your-super-secret-and-long-postgres-password node scripts/apply-migration.js
```

---

## Перенос Storage (файлы)

1. **Через Dashboard**:
   - Зайдите в Storage на исходном сервере
   - Скачайте все файлы bucket'ов

2. **На новом сервере**:
   - Зайдите в Storage Dashboard
   - Создайте те же bucket'ы
   - Загрузите файлы

---

## После миграции

1. **Обновите .env на фронтенде**:
```env
VITE_SUPABASE_URL=http://192.168.1.211:8000
VITE_SUPABASE_ANON_KEY=<ключ из нового сервера>
```

2. **Настройки на новом сервере**:
   - Settings → API: обновите Site URL
   - Settings → Auth: настройте redirect URLs
   - Settings → API: добавьте CORS origins

3. **Рестарт сервисов**:
```bash
docker compose restart
```