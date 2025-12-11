import { copy } from '@web/rollup-plugin-copy';

import pkg from './package.json' with { type: 'json' };


const pkgExport = pkg.exports['.'];

export default [
  {
    input: 'lib/index.js',
    output: {
      file: pkgExport,
      format: 'es',
      sourcemap: true
    },
    plugins: [
      copy({
        patterns: '**/*.d.ts', rootDir: './lib'
      })
    ]
  }
];