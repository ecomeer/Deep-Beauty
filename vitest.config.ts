import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    // Required for @testing-library/react's automatic DOM cleanup between tests.
    globals: true,
    include: [
      'lib/**/*.test.ts',
      'app/**/*.test.ts',
      'hooks/**/*.test.{ts,tsx}',
      'components/**/*.test.{ts,tsx}',
      'context/**/*.test.{ts,tsx}',
      '*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'app/api/**', 'hooks/**', 'components/**', 'context/**', 'proxy.ts'],
      exclude: ['**/*.test.*'],
    },
  },
})
