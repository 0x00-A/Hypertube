import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: { sourceType: 'module', ecmaVersion: 'latest' },
      globals: { ...globals.node, ...globals.jest },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
