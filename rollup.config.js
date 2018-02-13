import uglify from 'rollup-plugin-uglify';
import babel from 'rollup-plugin-babel';


// rollup.config.js (building more than one bundle)
export default [
  {
    input: 'lib/index.js',
    output: {
      file: 'dist/didi.umd.js',
      format: 'umd',
      name: 'didi'
    },
    plugins: [
      babel({
        babelrc: false,
        presets: [
          [
            'env', {
              modules: false
            }
          ]
        ]
      })
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
      uglify()
    ]
  },
  {
    input: 'lib/index.js',
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs'
    }
  },
  {
    input: 'lib/index.js',
    output: {
      file: 'dist/index.mjs',
      format: 'es'
    }
  }
];