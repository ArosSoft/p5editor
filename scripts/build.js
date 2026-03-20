import { execSync } from 'child_process';
import { copyFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

process.env.NODE_ENV = 'production';
process.env.VITE_BUILD = 'true';

try {
  execSync('vite build', { stdio: 'inherit', env: { ...process.env } });
  
  // Копируем 404.html в dist для обработки маршрутов SPA
  copyFileSync(
    join(rootDir, 'public', '404.html'),
    join(rootDir, 'dist', '404.html')
  );
  console.log('✅ 404.html copied to dist');

  // Создаем .nojekyll в dist, чтобы GitHub Pages не обрабатывал файлы через Jekyll
  const noJekyllPath = join(rootDir, 'dist', '.nojekyll');
  writeFileSync(noJekyllPath, '');
  console.log('✅ .nojekyll created in dist');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
