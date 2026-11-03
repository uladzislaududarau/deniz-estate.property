import { mkdir, readdir, copyFile, lstat, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Только явный список исходников; локальная история Git никогда не экспортируется.
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, '.github-publish');
const roots = ['package.json', 'package-lock.json', '.gitignore', '.gitattributes', '.dev.vars.example', 'README.md',
  'wrangler.jsonc', 'showcase', 'server', 'cloudflare', 'migrations', 'scripts', 'tests', 'docs/CLOUDFLARE_SETUP.md', 'docs/SECURITY_ADS_AUDIT.md'];
const files = [];
async function collect(relative) {
  const filename = path.join(root, relative);
  const info = await lstat(filename);
  if (info.isSymbolicLink()) throw new Error(`Символические ссылки не экспортируются: ${relative}`);
  if (info.isDirectory()) {
    for (const name of await readdir(filename)) {
      if (name.startsWith('.') || name === 'AGENTS.md') continue;
      await collect(path.join(relative, name));
    }
  } else files.push(relative);
}
for (const relative of roots) await collect(relative);
await mkdir(target, { recursive: true });
let previous = [];
try { previous = JSON.parse(await readFile(path.join(target, '.export-manifest.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const relative of previous) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.split(path.sep).includes('..') || !roots.some(entry => relative === entry || relative.startsWith(entry + path.sep))) throw new Error('Некорректный манифест экспорта');
  if (!files.includes(relative)) await unlink(path.join(target, relative)).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
for (const relative of files) {
  await mkdir(path.dirname(path.join(target, relative)), { recursive: true });
  await copyFile(path.join(root, relative), path.join(target, relative));
}
await writeFile(path.join(target, '.gitignore'), `${await readFile(path.join(root, '.gitignore'), 'utf8')}\n.export-manifest.json\n`);
await writeFile(path.join(target, '.export-manifest.json'), JSON.stringify(files));
console.log(`Подготовлено ${files.length} файлов проекта в .github-publish. Навыки, архивы, секреты и локальная Git-история исключены.`);
