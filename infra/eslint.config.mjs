import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'cdk.out'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['bin/**/*.ts', 'lib/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
);
