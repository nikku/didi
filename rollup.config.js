import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';

function bbl() {
  return babel({
    babelrc: false,
    presets: [
      [
        'env', {
          modules: false
        }
      ]
    ]
  });
}

export default [
  {
    input: 'lib/index.js',
    output: {
      file: 'dist/didi.umd.js',
      format: 'umd',
      name: 'didi'
    },
    plugins: [
      bbl()
    ]
  },
  {
    input: 'lib/index.js',
    output: {
      file: 'dist/didi.umd.prod.js',
      format: 'umd',
      name: 'didi'
    },
    plugins: [
      bbl(),
      uglify()
    ]
  },
  {
    input: 'lib/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs'
    },
    plugins: [
      bbl()
    ]
  },
  {
    input: 'lib/index.js',
    output: {
      file: 'dist/index.mjs',
      format: 'es'
    },
    plugins: [
      bbl()
    ]
  }
];