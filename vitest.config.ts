import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
  define: {
    __DEV__: false,
  },
  resolve: {
    alias: {
      'expo-crypto': path.resolve(__dirname, 'tests/mocks/expo-crypto.ts'),
      'expo': path.resolve(__dirname, 'tests/mocks/expo.ts'),
      'expo-sqlite': path.resolve(__dirname, 'tests/mocks/expo-sqlite.ts'),
      'react-native': path.resolve(__dirname, 'tests/mocks/react-native.ts'),
    },
  },
});
