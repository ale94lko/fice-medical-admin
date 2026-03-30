import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import pluginQuasar from '@quasar/app-vite/eslint'

export default [
  {
    /**
     * Ignore the following files.
     * Please note that pluginQuasar.configs.recommended() already ignores
     * the "node_modules" folder for you (and all other Quasar project
     * relevant folders and files).
     *
     * ESLint requires "ignores" key to be the only one in this object
     */
    // ignores: []
  },

  ...pluginQuasar.configs.recommended(),
  js.configs.recommended,

  /**
   * https://eslint.vuejs.org
   *
   * pluginVue.configs.base
   *   -> Settings and rules to enable correct ESLint parsing.
   * pluginVue.configs[ 'flat/essential']
   *   -> base, plus rules to prevent errors or unintended behavior.
   * pluginVue.configs["flat/strongly-recommended"]
   *   -> Above, plus rules to considerably improve code readability and/or dev experience.
   * pluginVue.configs["flat/recommended"]
   *   -> Above, plus rules to enforce subjective community defaults to ensure consistency.
   */
  ...pluginVue.configs[ 'flat/essential' ],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node, // SSR, Electron, config files
        process: 'readonly', // process.env.*
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly', // BEX related
        browser: 'readonly' // BEX related
      }
    },

    // add your custom rules here
    rules: {
      'prefer-promise-reject-errors': 'off',
      'comma-dangle': ['error', 'only-multiline'],
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'linebreak-style' : 'off',
      'no-useless-concat': 'error',
      'rest-spread-spacing': 'error',
      'semi-spacing': 'error',
      'arrow-spacing': ['error'],
      'array-bracket-spacing': [2, 'never'],
      'block-scoped-var': 2,
      'brace-style': [2, '1tbs'],
      'camelcase': 1,
      'computed-property-spacing': [2, 'never'],
      'comma-spacing': ['error'],
      'curly': 2,
      'eol-last': 2,
      'eqeqeq': [0, 'smart'],
      'key-spacing': ['error'],
      'keyword-spacing': [2, {'before': true, 'after': true}],
      'max-depth': [1, 3],
      'max-len': [1, 80],
      'max-statements': [1, 30],
      'new-cap': 1,
      'no-extend-native': 2,
      'no-mixed-spaces-and-tabs': 2,
      'no-trailing-spaces': 2,
      'no-unused-vars': 1,
      'no-use-before-define': [2, 'nofunc'],
      'no-multi-spaces': 'error',
      'quotes': [2, 'single', 'avoid-escape'],
      'space-unary-ops': 2,
      'space-in-parens': ['error', 'never'],
      'space-before-function-paren': ['error', 'never'],
      'space-before-blocks': ['error'],
      'operator-linebreak': ['error', 'before', {
        'overrides': {
          '+=': 'before',
          '=': 'after',
          '+': 'before',
          '-': 'before',
          '||': 'before',
          '&&': 'before',
        }
      }],
      'no-new': 0,
      'no-console': 0,
      'semi': [2, 'never'],
      'object-curly-spacing': ['error', 'always'],

      // allow debugger during development only
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  },

  {
    files: [ 'src-pwa/custom-service-worker.js' ],
    languageOptions: {
      globals: {
        ...globals.serviceworker
      }
    }
  }
]
