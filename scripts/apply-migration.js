#!/usr/bin/env node
/**
 * Применение SQL миграции к локальному Supabase
 * Использование: SOURCE_SUPABASE_KEY=xxx node scripts/apply-migration.js
 */
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

async function applyMigration() {
  const targetClient = new Client({
    host: process.env.TARGET_HOST || '192.168.1.211',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.TARGET_PASSWORD || 'your-super-secret-and-long-postgres-password',
  });

  await targetClient.connect();
  
  // Очищаем схему
  console.log('Очистка схемы public...');
  await targetClient.query('DROP SCHEMA IF EXISTS public CASCADE');
  await targetClient.query('CREATE SCHEMA public');
  
  // Читаем миграцию
  const migration = fs.readFileSync('migration.sql', 'utf8');
  
  // Применяем
  console.log('Применение миграции...');
  await targetClient.query(migration);
  
  console.log('✅ Готово!');
  await targetClient.end();
}

applyMigration().catch(console.error);