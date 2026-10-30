import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { 'cloudflare:workers': new URL('./tests/stubs/cloudflare-workers.js', import.meta.url).pathname } },
  test: { environment: 'node', setupFiles: ['tests/setup.js'], include: ['tests/**/*.test.{js,jsx}'] },
})
