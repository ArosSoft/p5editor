#!/bin/bash
# Скрипт миграции - выполнить на Docker-сервере 192.168.1.211

set -e

SUPABASE_DIR="/path/to/your/supabase-docker"  # Укажите путь к docker-compose.yml
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdXB5Y3JtbmVnYmNhZnVveGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAxNDgwNSwiZXhwIjoyMDg5NTkwODA1fQ.eIz4gxcqjXTfazWgr2p1aNrexyPOrGJ8e_VNyGiY_Ds"

echo "=== Создание дампа с удаленного Supabase ==="

# Способ 1: Через Docker (без установки CLI)
docker run --rm -v $(pwd):/backup \
  supabase/supabase:latest \
  db dump \
  --db-url "postgresql://postgres:${SERVICE_KEY}@gfupycrmnegbcafuoxdx.supabase.co:5432/postgres" \
  -s public -f /backup/backup.sql

echo "=== Применение дампа к локальной базе ==="

# Остановите сервисы
cd $SUPABASE_DIR
docker compose stop supabase-db

# Начните безопасный режим
docker compose run --rm supabase-db pg_ctl -D /var/lib/postgresql/data start -w -o "-c listen_addresses='*' -c shared_buffers=256MB" || true

# Очистите и импортируйте
docker exec -i $(docker compose ps -q supabase-db) psql -U postgres -d postgres <<EOF
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
EOF

docker exec -i $(docker compose ps -q supabase-db) psql -U postgres -d postgres < backup.sql

echo "=== Миграция завершена ==="