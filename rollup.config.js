import pkg from './package.json';

import { copy } from '@web/rollup-plugin-copy';

export default [
  {
    input: 'lib/index.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      copy({
        patterns: '**/*.d.ts', rootDir: './lib'
      })
    ]
  }
];