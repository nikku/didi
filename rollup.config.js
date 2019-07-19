import { uglify } from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

import pkg from './package.json';

function pgl(plugins=[]) {
  return [
    babel({
      babelrc: false,
      presets: [
        [
          'env', {
            modules: false
          }
        ]
      ]
    }),
    ...plugins
  ];
}

const srcEntry = pkg.source;

const umdDist = pkg['umd:main'];

export default [
  // browser-friendly UMD build
  {
    input: srcEntry,
    output: {
      name: 'didi',
      file: umdDist.replace(/\.js$/, '.prod.js'),
      format: 'umd'
    },
    plugins: pgl([
      uglify()
    ])
  },
  {
    input: srcEntry,
    output: [
      {
        name: 'didi',
        file: umdDist,
        format: 'umd'
      },
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: pgl()
  }
];