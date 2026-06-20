#!/usr/bin/env node
/**
 * Скрипт миграции данных Supabase
 * Использование: node scripts/migrate-supabase.js
 * 
 * Требования:
 * - supabase CLI установлен (npm install -g supabase)
 * - Доступ к обоим серверам
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  console.log('=== Миграция Supabase ===\n');

  const sourceUrl = await question('Введите URL исходного Supabase (например https://gfupycrmnegbcafuoxdx.supabase.co): ');
  const sourceKey = await question('Введите Service Role Key исходного сервера: ');
  
  const targetHost = await question('Введите хост целевого сервера (IP или домен): ');
  const targetPort = await question('Введите порт PostgreSQL (по умолчанию 5432): ') || '5432';
  const targetPassword = await question('Введите пароль postgres для целевого сервера: ');
  
  const outputDir = path.join(process.cwd(), 'migration_backup');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Формируем подключения
  const sourceDbUrl = `postgresql://postgres:${sourceKey}@${sourceUrl.replace('https://', '').replace('http://', '')}:5432/postgres`;
  const targetDbUrl = `postgresql://postgres:${targetPassword}@${targetHost}:${targetPort}/postgres`;

  console.log('\n--- Шаг 1: Создание дампа с исходного сервера ---\n');
  
  const dumpFile = path.join(outputDir, 'source_dump.sql');
  try {
    execSync(`supabase db dump --db-url "${sourceDbUrl}" -s public -f "${dumpFile}"`, { stdio: 'inherit' });
    console.log('✅ Дамп создан: ' + dumpFile);
  } catch (error) {
    console.error('❌ Ошибка создания дампа:', error.message);
    process.exit(1);
  }

  console.log('\n--- Шаг 2: Подготовка целевой базы ---\n');
  
  // Выполняем очистку и восстановление
  try {
    execSync(`psql "${targetDbUrl}" -c "DROP SCHEMA IF EXISTS public CASCADE;"`, { stdio: 'inherit' });
    execSync(`psql "${targetDbUrl}" -c "CREATE SCHEMA public;"`, { stdio: 'inherit' });
    console.log('✅ Целевая схема очищена');
  } catch (error) {
    console.error('❌ Ошибка очистки целевой базы:', error.message);
    process.exit(1);
  }

  console.log('\n--- Шаг 3: Восстановление данных на целевой сервер ---\n');
  
  try {
    execSync(`psql "${targetDbUrl}" -f "${dumpFile}"`, { stdio: 'inherit' });
    console.log('✅ Данные восстановлены');
  } catch (error) {
    console.error('❌ Ошибка восстановления:', error.message);
    process.exit(1);
  }

  console.log('\n=== Миграция завершена! ===\n');
  console.log('Следующие шаги:');
  console.log('1. Обновите VITE_SUPABASE_URL в .env файле вашего фронтенда');
  console.log('2. Обновите VITE_SUPABASE_ANON_KEY с нового сервера');
  console.log('3. Перенесите файлы Storage (см. ниже)');
  
  rl.close();
}

main().catch(console.error);