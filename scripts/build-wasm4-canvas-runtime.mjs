import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const [templatePath, wasmPath, outputPath, title] = process.argv.slice(2);
if (!templatePath || !wasmPath || !outputPath || !title) {
  throw new Error('Usage: node build_canvas2d_wasm4_host.mjs <template> <cart.wasm> <output.html> <title>');
}
const template = await readFile(templatePath, 'utf8');
const cartridge = (await readFile(wasmPath)).toString('base64');
const html = template
  .replaceAll('__TITLE__', title)
  .replace('__CART_BASE64__', cartridge);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, html);
console.log(`Built ${outputPath}`);
