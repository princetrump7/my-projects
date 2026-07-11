#!/usr/bin/env node

/**
 * Build orchestrator for TradingView AI Copilot.
 *
 * Vite handles bundling (content script + service worker).
 * This script copies assets and writes the production manifest.
 */

import { build } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')

async function main() {
  const isProduction = process.argv.includes('--minify') || process.env.NODE_ENV === 'production'

  console.log(`[build] TradingView AI Copilot v2 — Build`)
  console.log(`  Minify:  ${isProduction}`)
  console.log(`  Output:  ${DIST}\n`)

  // 1. Clean dist
  if (existsSync(DIST)) {
    rmSync(DIST, { recursive: true, force: true })
  }

  // 2. Run Vite build
  const start = Date.now()
  await build({
    configFile: resolve(ROOT, 'vite.config.ts'),
    mode: isProduction ? 'production' : 'development',
    build: {
      minify: isProduction,
      sourcemap: !isProduction,
    },
  })

  // 3. Copy assets (icons)
  const assetsSrc = resolve(ROOT, 'assets')
  const assetsDst = resolve(DIST, 'assets')
  if (existsSync(assetsSrc)) {
    cpSync(assetsSrc, assetsDst, { recursive: true })
  }

  // 4. Write production manifest (pointing to bundled files)
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf-8'))
  writeFileSync(resolve(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const elapsed = ((Date.now() - start) / 1000).toFixed(2)
  console.log(`\n[build] Done in ${elapsed}s → ${DIST}`)
}

main().catch((err) => {
  console.error('[build] Failed:', err)
  process.exit(1)
})
