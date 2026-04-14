import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

// Copy sql.js WASM file to output for runtime access
function copySqlJsWasm() {
  return {
    name: 'copy-sql-js-wasm',
    closeBundle() {
      const src = resolve(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm')
      // Also check workspace root node_modules
      const srcAlt = resolve(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm')
      const dest = resolve(__dirname, 'out/main/sql-wasm.wasm')
      const outDir = resolve(__dirname, 'out/main')
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
      if (existsSync(src)) {
        copyFileSync(src, dest)
      } else if (existsSync(srcAlt)) {
        copyFileSync(srcAlt, dest)
      }
    },
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copySqlJsWasm()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
        },
      },
    },
  },
  renderer: {
    plugins: [react()],
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
      },
    },
  },
})
