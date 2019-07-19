import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

function pgl(plugins=[]) {
  return plugins;
}

const srcEntry = pkg.source;

const umdDist = pkg['umd:main'];

const umdName = 'Didi';

export default [
  // browser-friendly UMD build
  {
    input: srcEntry,
    output: {
      file: umdDist.replace(/\.js$/, '.prod.js'),
      format: 'umd',
      name: umdName
    },
    plugins: pgl([
      terser()
    ])
  },
  {
    input: srcEntry,
    output: [
      {
        file: umdDist,
        format: 'umd',
        name: umdName
      },
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: pgl()
  }
];