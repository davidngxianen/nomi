import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Standalone single-file build: everything (JS, CSS) inlined into one index.html.
// publicDir is disabled so no extra files (day.svg, favicon, etc) get copied alongside it —
// the background photo won't render, but the rest of the UI is unaffected.
export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
  },
})
