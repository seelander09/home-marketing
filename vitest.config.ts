import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: true,
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx', 'node_modules/**']
  }
})
