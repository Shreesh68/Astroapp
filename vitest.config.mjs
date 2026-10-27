import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node', setupFiles: ['tests/setup.js'], include: ['tests/**/*.test.{js,jsx}'] },
})
