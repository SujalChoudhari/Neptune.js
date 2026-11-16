import { defineConfig, normalizePath, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { build as bundleEngine } from 'esbuild'

const engineEntry = path.resolve(__dirname, '../src/neptune.js')

function neptuneRuntimeUrl(): Plugin {
  const id = '\0neptune-runtime-url'
  return {
    name: 'neptune-runtime-url',
    resolveId(source: string) {
      if (source === 'virtual:neptune-runtime-url') return id
    },
    async load(source: string) {
      if (source !== id) return
      if (process.env.NODE_ENV !== 'production') {
        return `export default ${JSON.stringify(`/@fs/${normalizePath(engineEntry).replace(/^\/+/, "")}`)}`
      }
      const result = await bundleEngine({
        entryPoints: [engineEntry], bundle: true, write: false,
        format: 'esm', platform: 'browser', target: 'es2022'
      })
      const reference = this.emitFile({ type: 'asset', name: 'neptune-runtime.js', source: result.outputFiles[0].contents })
      return `export default import.meta.ROLLUP_FILE_URL_${reference}`
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), neptuneRuntimeUrl()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      // Tauri watches the native backend itself. Windows locks compiler DLLs
      // in target/, which must never be opened by Vite's frontend watcher.
      ignored: ['**/src-tauri/**'],
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
})
