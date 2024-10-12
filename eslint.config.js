import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

import typescriptPlugin from 'typescript-eslint';

const files = {
  build: [
    '*.js'
  ],
  test: [
    'test/**/*.js',
    'test/**/*.ts'
  ],
  node_test: [
    'test/**/*.cjs'
  ],
  ignored: [
    'dist',
    'coverage',
    '.nyc_output'
  ]
};

export default [
  {
    'ignores': files.ignored
  },
  ...bpmnIoPlugin.configs.recommended.map(config => {

    return {
      ...config,
      ignores: [
        ...files.build,
        ...files.node_test
      ]
    };
  }),
  ...bpmnIoPlugin.configs.node.map(config => {

    return {
      ...config,
      files: [
        ...files.build,
        ...files.node_test
      ]
    };
  }),
  ...bpmnIoPlugin.configs.mocha.map(config => {

    return {
      ...config,
      files: [
        ...files.test,
        ...files.node_test
      ]
    };
  }),
  ...typescriptPlugin.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': [ 'warn', { 'ignoreRestArgs': true } ],
    },
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-expressions': 'off'
    },
    files: [
      ...files.test,
      ...files.node_test
    ]
  },
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    },
    files: [
      ...files.node_test
    ]
  }
];