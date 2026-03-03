// scripts/generate-examples.js
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateExamplesIndex() {
  // Путь к папке с примерами
  const examplesDir = join(__dirname, '..', 'public', 'examples');
  // Выходной файл
  const outputFile = join(examplesDir, 'index.json');
  
  console.log('🔍 Поиск примеров в:', examplesDir);
  
  try {
    // Проверяем, существует ли папка examples
    try {
      await fs.access(examplesDir);
    } catch {
      console.error('❌ Папка public/examples не найдена!');
      console.log('Создайте папку public/examples и добавьте туда примеры');
      process.exit(1);
    }
    
    const examples = [];
    const items = await fs.readdir(examplesDir);
    
    for (const item of items) {
      const itemPath = join(examplesDir, item);
      const stat = await fs.stat(itemPath);
      
      // Пропускаем файлы, работаем только с папками
      if (stat.isDirectory()) {
        try {
          const metaPath = join(itemPath, 'meta.json');
          const metaContent = await fs.readFile(metaPath, 'utf-8');
          const meta = JSON.parse(metaContent);
          
          examples.push({
            ...meta,
            // Путь для загрузки кода
            codePath: `/examples/${item}/sketch.js`
          });
          console.log(`✅ Добавлен: ${meta.title}`);
        } catch (err) {
          console.log(`⚠️ Пропускаем ${item}: нет meta.json или ошибка чтения`);
        }
      }
    }
    
    // Сортируем по id
    examples.sort((a, b) => a.id.localeCompare(b.id));
    
    // Сохраняем index.json
    await fs.writeFile(outputFile, JSON.stringify(examples, null, 2));
    console.log(`\n🎉 Сгенерировано ${examples.length} примеров в public/examples/index.json`);
    
  } catch (err) {
    console.error('❌ Ошибка:', err);
    process.exit(1);
  }
}

generateExamplesIndex();