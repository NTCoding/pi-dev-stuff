import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import vitest from '@vitest/eslint-plugin'
import tseslint from 'typescript-eslint'
import noGenericNames from './.eslint-rules/no-generic-names.cjs'

const customRules = {
  plugins: {
    custom: {
      rules: {
        'no-generic-names': noGenericNames,
      },
    },
  },
}

export default tseslint.config(
  {
    ignores: [
      '**/coverage',
      '**/dist',
      '**/node_modules',
      '**/test-output',
      '.eslint-rules/**',
      'eslint.config.mjs',
      'vitest.config.ts',
    ],
  },
  eslintComments.recommended,
  {
    rules: {
      '@eslint-community/eslint-comments/no-use': ['error', { allow: [] }],
    },
  },
  sonarjs.configs.recommended,
  {
    rules: {
      'sonarjs/void-use': 'off',
    },
  },
  customRules,
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variable', format: ['camelCase'] },
        { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase'] },
        { selector: 'objectLiteralProperty', format: null },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      complexity: ['error', 12],
      'custom/no-generic-names': 'error',
      'no-duplicate-imports': 'error',
      'max-depth': ['error', 3],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'no-inline-comments': 'error',
      'no-negated-condition': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: '__dirname',
          message: 'Use dirname(fileURLToPath(import.meta.url)) in ESM',
        },
        {
          name: '__filename',
          message: 'Use fileURLToPath(import.meta.url) in ESM',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.ts', '**/*.tsx', '**/*.js'],
              message: 'Omit TypeScript and JavaScript extensions from imports',
            },
            {
              group: ['*/utils/*', '*/utils', '*/utilities/*', '*/utilities'],
              message: 'Use an intention revealing module name',
            },
            {
              group: ['*/helpers/*', '*/helpers'],
              message: 'Use an intention revealing module name',
            },
            {
              group: ['*/common/*', '*/common'],
              message: 'Use an intention revealing module name',
            },
            {
              group: ['*/shared/*', '*/shared'],
              message: 'Use an intention revealing module name',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'VariableDeclaration[kind="let"]',
          message: 'Use const. Avoid mutation.',
        },
        {
          selector: 'NewExpression[callee.name="Error"]',
          message: 'Use a precise error class.',
        },
        {
          selector:
            'Identifier[name="TypeError"], ImportSpecifier[imported.name="TypeError"], MemberExpression[property.name="TypeError"], MemberExpression[property.value="TypeError"]',
          message: 'Use a precise error class.',
        },
        {
          selector: 'LogicalExpression[operator="??"][right.type="Literal"][right.value=""]',
          message: 'Do not hide missing values with an empty string fallback.',
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    plugins: { vitest },
    rules: {
      'vitest/consistent-test-filename': ['error', { pattern: '.*\\.spec\\.[tj]sx?$' }],
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/max-expects': ['error', { max: 4 }],
      'vitest/no-conditional-expect': 'error',
      'vitest/no-conditional-in-test': 'error',
      'vitest/prefer-called-with': 'error',
      'vitest/prefer-spy-on': 'error',
      'vitest/prefer-strict-equal': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/require-to-throw-message': 'error',
    },
  },
  {
    files: ['profiles/**/*.ts'],
    rules: {
      'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['platform/**/*.ts'],
    plugins: { unicorn },
    rules: {
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-type-error': 'error',
    },
  },
)
