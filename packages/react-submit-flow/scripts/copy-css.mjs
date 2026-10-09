import { copyFile, mkdir } from 'node:fs/promises';

await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await copyFile(new URL('../src/styles.css', import.meta.url), new URL('../dist/styles.css', import.meta.url));
await mkdir(new URL('../dist/themes/', import.meta.url), { recursive: true });
await copyFile(new URL('../src/themes/forest.css', import.meta.url), new URL('../dist/themes/forest.css', import.meta.url));
await copyFile(new URL('../src/themes/high-contrast.css', import.meta.url), new URL('../dist/themes/high-contrast.css', import.meta.url));
