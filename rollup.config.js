import { copy } from '@web/rollup-plugin-copy';

import pkg from './package.json';


const pkgExport = pkg.exports['.'];

export default [
  {
    input: 'lib/index.js',
    output: [
      { file: pkgExport.require, format: 'cjs', sourcemap: true },
      { file: pkgExport.import, format: 'es', sourcemap: true }
    ],
    plugins: [
      copy({
        patterns: '**/*.d.ts', rootDir: './lib'
      })
    ]
  }
];