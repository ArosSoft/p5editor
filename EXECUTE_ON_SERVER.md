# Выполнение миграции на сервере 192.168.1.211

## Вариант А: Через Supabase CLI (рекомендуется)

```bash
# 1. Подключитесь к серверу
ssh user@192.168.1.211

# 2. Установите Supabase CLI
curl -fsSL https://supabase.com/install.sh | sh

# 3. Создайте дамп с удаленного сервера
supabase db dump \
  --db-url "postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXB5Y3JtbmVnYmNhZnVveGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxNDgwNSwiZXhwIjoyMDg5NTkwODA1fQ.eIz4gxcqjXTfazWgr2p1aNrexyPOrGJ8e_VNyGiY_Ds@gfupycrmnegbcafuoxdx.supabase.co:5432/postgres" \
  -s public -f backup.sql

# 4. Очистите локальную базу
docker exec -i supabase-db psql -U postgres -d postgres <<EOF
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
EOF

# 5. Восстановите данные
docker cp backup.sql supabase-db:/backup.sql
docker exec -i supabase-db psql -U postgres -d postgres -f /backup.sql
```

## Вариант Б: Через Docker (без установки CLI)

```bash
# Выполните на сервере:
docker run --rm -v $(pwd):/backup \
  supabase/supabase:latest \
  db dump \
  --db-url "postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXB5Y3JtbmVnYmNhZnVveGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxNDgwNSwiZXhwIjoyMDg5NTkwODA1fQ.eIz4gxcqjXTfazWgr2p1aNrexyPOrGJ8e_VNyGiY_Ds@gfupycrmnegbcafuoxdx.supabase.co:5432/postgres" \
  -s public -f /backup/backup.sql

# Затем импортируйте (те же команды что выше)
```

---

**Важные уточнения:**

1. **Путь к docker-compose.yml** на вашем сервере - нужен для остановки БД
2. **Контейнер называется `supabase-db`** - если иначе, найдите правильное имя: `docker ps | grep postgres`
3. **Пароль postgres** в .env файле уже: `your-super-secret-and-long-postgres-password`