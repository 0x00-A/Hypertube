import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: { sourceType: 'module', ecmaVersion: 'latest' },
      globals: { ...globals.node, ...globals.jest },
    },
    plugins: { '@typescript-eslint': tseslint, 'unused-imports': unusedImports },
    rules: {
      'no-console': 'error',
      // '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Disable standard rules (they don't autofix)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Enable the autofix rule
      'unused-imports/no-unused-imports': 'error',

      // Optional: Warn about unused vars (but don't delete them automatically)
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
];
