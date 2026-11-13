#!/usr/bin/env node
/**
 * Применение миграции 007 (хранилище изображений Cloudinary) к Supabase.
 *
 * ВАЖНО (2026): прямое подключение к боевой базе — только по IPv6, а JWT
 * больше НЕ подходит как пароль (старый способ из EXECUTE_ON_SERVER.md не
 * работает). С IPv4-сети подключайтесь через shared pooler (session mode):
 *
 *   DB_URL="postgresql://postgres.gfupycrmnegbcafuoxdx:<ПАРОЛЬ_БАЗЫ>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" \
 *     node scripts/apply-007-cloudinary.js
 *
 * Пароль базы: Dashboard → Settings → Database (можно сбросить там же).
 *
 * Миграция идемпотентна: создаёт только новые объекты
 * (таблица cloudinary_accounts + view cloudinary_accounts_safe),
 * существующие данные не изменяет.
 */
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const dbUrl = process.env.DB_URL
  if (!dbUrl) {
    console.error('Не задана переменная окружения DB_URL (строка подключения Postgres)')
    process.exit(1)
  }

  const sql = fs.readFileSync(path.join(__dirname, '007-cloudinary-images.sql'), 'utf8')
  const client = new pg.Client({ connectionString: dbUrl })

  await client.connect()
  try {
    console.log('Применение scripts/007-cloudinary-images.sql ...')
    await client.query(sql)
    console.log('Миграция выполнена.')

    // Проверка: таблица и view должны существовать
    const res = await client.query(
      `SELECT table_name, table_type
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('cloudinary_accounts', 'cloudinary_accounts_safe')
        ORDER BY table_name`
    )
    console.log('Созданные объекты:')
    for (const row of res.rows) {
      console.log(`  - ${row.table_name} (${row.table_type})`)
    }

    // Проверка: прав у anon/authenticated на таблицу быть не должно
    const grants = await client.query(
      `SELECT grantee, privilege_type
         FROM information_schema.role_table_grants
        WHERE table_schema = 'public' AND table_name = 'cloudinary_accounts'
          AND grantee IN ('anon', 'authenticated')`
    )
    if (grants.rows.length === 0) {
      console.log('Права anon/authenticated на таблицу отсутствуют (как и задумано) ✓')
    } else {
      console.warn('ВНИМАНИЕ: у anon/authenticated остались права на таблицу:', grants.rows)
    }

    // Колонки view не должны содержать секрета
    const cols = await client.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'cloudinary_accounts_safe'
        ORDER BY ordinal_position`
    )
    const colNames = cols.rows.map(r => r.column_name)
    const hasSecret = colNames.some(c => c.includes('secret'))
    console.log(`View cloudinary_accounts_safe: [${colNames.join(', ')}]`)
    if (hasSecret) {
      console.warn('ВНИМАНИЕ: в view есть колонка с секретом!')
      process.exit(1)
    }
    console.log('Готово ✓')
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error('Ошибка применения миграции:', err.message)
  process.exit(1)
})
