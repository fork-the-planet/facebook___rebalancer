import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextCoreWebVitals,

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'react/no-unescaped-entities': 'off',
      'jsx-a11y/alt-text': 'off',
    },
  },

  {
    ignores: ['.next/**/*', 'node_modules/**/*', 'next-env.d.ts'],
  },
];

export default eslintConfig;
