#!/usr/bin/env node

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const { dirname, join } = require('path');

process.env['VITE_CJS_IGNORE_WARNING'] = 'true';

const tsConfigPath = join(__dirname, '..', 'tsconfig.json');
const isTsProject = existsSync(tsConfigPath);

if (isTsProject) {
  process.env.IS_TS_PROJECT = 'true';
  process.env.NODE_ENV = 'development';

  const tsx = join(dirname(require.resolve('tsx')), 'cli.mjs');
  const cliPath = join(__dirname, '..', 'src', 'cli.ts');
  const [, , ...argv] = process.argv;

  spawn(
    tsx,
    [
      'watch',
      '--ignore=./storage/**',
      '-r',
      'tsconfig-paths/register',
      cliPath,
      ...argv,
    ],
    {
      stdio: 'inherit',
    },
  );
} else {
  const cliPath = join(__dirname, '..', 'lib', 'cli.js');
  const [, , ...argv] = process.argv;

  spawn('node', [cliPath, ...argv], {
    stdio: 'inherit',
  });
}
