import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
});
