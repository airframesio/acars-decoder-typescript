import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..');
const packageJson = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
);
const tsupConfig = readFileSync(join(root, 'tsup.config.ts'), 'utf8');

describe('published CLI binaries', () => {
  it('builds every package.json bin target into dist/bin', () => {
    const binEntries = packageJson.bin as Record<string, string>;

    expect(Object.keys(binEntries).sort()).toEqual([
      'acars-decoder',
      'acars-decoder-test',
    ]);
    for (const command of Object.keys(binEntries)) {
      expect(binEntries[command]).toBe(`./dist/bin/${command}.js`);
      expect(tsupConfig).toContain(`'bin/${command}': 'lib/bin/${command}.ts'`);
    }
  });
});
