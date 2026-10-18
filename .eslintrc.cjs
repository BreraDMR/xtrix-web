module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/api/schema.d.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // API shapes come from src/api/types.ts (generated from openapi), not any
    '@typescript-eslint/no-explicit-any': 'error',
    // the empty catches are on purpose (localStorage can throw)
    'no-empty': ['error', { allowEmptyCatch: true }],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      // app code runs in the browser; e2e/ and the config files run in Node and keep process
      files: ['src/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-globals': ['error', {
          name: 'process',
          message: 'There is no process in the browser, use import.meta.env (VITE_*) instead.',
        }],
      },
    },
  ],
}
