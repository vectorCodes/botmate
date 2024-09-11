import fg from 'fast-glob';
import path from 'path';
import { defineConfig } from 'tsup';

const entry = fg.globSync(['src/**/*.ts'], {
  cwd: __dirname,
  absolute: true,
});

export default defineConfig({
  entry,
  outDir: path.join(__dirname, 'lib'),
  splitting: false,
  silent: true,
  sourcemap: false,
  clean: true,
  bundle: true,
  skipNodeModulesBundle: true,
});
