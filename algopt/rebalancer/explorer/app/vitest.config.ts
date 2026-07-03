import path from 'path';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['lib/__tests__/**/*.test.ts', 'app/**/__tests__/**/*.test.ts'],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@platform': path.resolve(__dirname, 'lib/platform'),
      '@': path.resolve(__dirname),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/app': path.resolve(__dirname, 'app'),
    },
  },
});
