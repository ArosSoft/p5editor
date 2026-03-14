import { execSync } from 'child_process';

process.env.VITE_BUILD = 'true';

try {
  execSync('vite build', { stdio: 'inherit', env: { ...process.env } });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
