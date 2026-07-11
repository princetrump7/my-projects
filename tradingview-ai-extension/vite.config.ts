import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Chrome Extension build with Vite
// Produces a dist/ folder loadable as an unpacked extension
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@content': resolve(__dirname, 'src/content'),
      '@background': resolve(__dirname, 'src/background'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    rollupOptions: {
      input: {
        // Service worker entry (bundled as ESM for MV3)
        background: resolve(__dirname, 'src/background/index.ts'),
        // Content script entry (React app injected into TradingView)
        content: resolve(__dirname, 'src/content/index.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        format: 'esm',
      },
    },
    // Chrome's CSP has restrictions on inline scripts
    cssCodeSplit: false,
  },
})
