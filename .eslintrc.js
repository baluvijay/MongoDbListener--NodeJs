module.exports = {
  extends: 'airbnb-base',
  env: {
    jest: true,
    jquery: true,
  },
  rules: {
    'no-console': 0,
    'function-paren-newline': 0,
    'no-underscore-dangle': 0,
    'max-len': ['error', 120, 2, {
      ignoreUrls: true,
      ignoreComments: false,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],
    'no-restricted-properties': ['error', {
      object: 'arguments',
      property: 'callee',
      message: 'arguments.callee is deprecated',
    }, {
      object: 'global',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    }, {
      object: 'self',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    }, {
      object: 'window',
      property: 'isFinite',
      message: 'Please use Number.isFinite instead',
    }, {
      object: 'global',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    }, {
      object: 'self',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    }, {
      object: 'window',
      property: 'isNaN',
      message: 'Please use Number.isNaN instead',
    }, {
      property: '__defineGetter__',
      message: 'Please use Object.defineProperty instead.',
    }, {
      property: '__defineSetter__',
      message: 'Please use Object.defineProperty instead.',
    },
    ],
    'arrow-parens': 0,
    'implicit-arrow-linebreak': 0,
    'no-nested-ternary': 0,
    radix: 0,
    'no-param-reassign': 0,
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        'test/**', // tape, common npm pattern
        'tests/**', // also common npm pattern
        'spec/**', // mocha, rspec-like pattern
        '**/__tests__/**', // jest pattern
        'test.{js,jsx}', // repos with a single test file
        'test-*.{js,jsx}', // repos with multiple top-level test files
        '**/*.{test,spec}.{js,jsx}', // tests where the extension denotes that it is a test
        '**/jest.*.js',
        '**/webpack.config.js', // webpack config
        '**/webpack.config.*.js', // webpack config
        '**/rollup.config.js', // rollup config
        '**/rollup.config.*.js', // rollup config
        '**/gulpfile.js', // gulp config
        '**/gulpfile.*.js', // gulp config
        '**/Gruntfile{,.js}', // grunt config
        '**/protractor.conf.js', // protractor config
        '**/protractor.conf.*.js', // protractor config
      ],
      optionalDependencies: false,
    }],
    'no-else-return': 0,
    'operator-linebreak': 0,
    'no-multiple-empty-lines': 0,
    'import/no-useless-path-segments': 0,
    'no-trailing-spaces': ["error", { "ignoreComments": true }]
  },
};
