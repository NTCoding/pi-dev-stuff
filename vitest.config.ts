import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reportsDirectory: './test-output/vitest/coverage',
      reporter: ['text', 'lcov'],
    },
  },
})
