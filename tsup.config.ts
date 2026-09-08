import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'index.ts',
    'bin/acars-decoder': 'lib/bin/acars-decoder.ts',
    'bin/acars-decoder-test': 'lib/bin/acars-decoder-test.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node18',
});
