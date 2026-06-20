#!/usr/bin/env node
/**
 * Скрипт для генерации SQL миграций
 * Запускать на сервере, где есть доступ к обоим Supabase
 */
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

async function createMigration() {
  const dump = [];
  
  // Подключаемся к исходному серверу
  const sourceClient = new Client({
    host: process.env.SOURCE_SUPABASE_HOST || 'gfupycrmnegbcafuoxdx.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SOURCE_SUPABASE_KEY, // Service Role Key
    ssl: { rejectUnauthorized: false }
  });

  await sourceClient.connect();
  
  // Получаем структуру таблиц
  const tables = await sourceClient.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
    ORDER BY tablename
  `);

  console.log('Найденные таблицы:', tables.rows.map(r => r.tablename));

  // Для каждой таблицы экспортируем данные
  for (const table of tables.rows) {
    const name = table.tablename;
    console.log(`Экспорт ${name}...`);
    
    const data = await sourceClient.query(`SELECT * FROM public.${name} ORDER BY created_at`);
    dump.push(`-- Table: ${name} (${data.rows.length} rows)`);
    
    for (const row of data.rows) {
      const cols = Object.keys(row);
      const vals = cols.map(c => {
        const v = row[c];
        if (v === null) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        if (Array.isArray(v)) return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
        return v;
      });
      dump.push(`INSERT INTO public.${name} (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
    }
  }

  await sourceClient.end();
  
  fs.writeFileSync('migration.sql', dump.join('\n'));
  console.log('Migration saved to migration.sql');
}

createMigration().catch(console.error);