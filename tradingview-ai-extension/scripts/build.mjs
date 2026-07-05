#!/usr/bin/env node

/**
 * Build script for the TradingView AI Copilot Chrome extension.
 *
 * Produces a dist/ directory ready for:
 *   - Loading as an unpacked extension in Chrome
 *   - Packaging into a .zip for the Chrome Web Store
 *
 * Usage:
 *   node scripts/build.mjs
 *   node scripts/build.mjs --minify      (minified output)
 *   node scripts/build.mjs --watch       (rebuild on changes)
 */

import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.resolve(ROOT, "dist");

const args = process.argv.slice(2);
const shouldMinify = args.includes("--minify");
const shouldWatch = args.includes("--watch");

// ─── Clean ──────────────────────────────────────────────────────────

if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

// ─── Build configuration ────────────────────────────────────────────

const ESBUILD_OPTIONS = {
  platform: "browser",
  target: "chrome109",
  format: "esm",
  minify: shouldMinify,
  sourcemap: !shouldMinify,
  legalComments: "none",
};

async function buildServiceWorker() {
  console.log("[build] Bundling service worker → dist/background.js");

  return esbuild.build({
    ...ESBUILD_OPTIONS,
    entryPoints: [path.resolve(ROOT, "src/background/serviceWorker.js")],
    bundle: true,
    outfile: path.resolve(DIST, "background.js"),
    // Ensure process.env references are replaced at build time
    define: {
      "process.env.BACKEND_URL": "undefined",
    },
  });
}

async function copyContentScript() {
  console.log("[build] Copying content script → dist/src/content/contentScript.js");

  const outDir = path.resolve(DIST, "src/content");
  fs.mkdirSync(outDir, { recursive: true });

  fs.copyFileSync(
    path.resolve(ROOT, "src/content/contentScript.js"),
    path.resolve(outDir, "contentScript.js")
  );
}

async function copySharedModules() {
  console.log("[build] Copying shared modules → dist/src/shared/");

  const sharedSrc = path.resolve(ROOT, "src/shared");
  const sharedDst = path.resolve(DIST, "src/shared");
  fs.mkdirSync(sharedDst, { recursive: true });

  for (const file of fs.readdirSync(sharedSrc)) {
    if (file.endsWith(".js")) {
      fs.copyFileSync(path.resolve(sharedSrc, file), path.resolve(sharedDst, file));
    }
  }
}

async function copyAssets() {
  console.log("[build] Copying assets → dist/assets/");

  fs.cpSync(path.resolve(ROOT, "assets"), path.resolve(DIST, "assets"), {
    recursive: true,
  });
}

async function copyStyles() {
  console.log("[build] Copying styles → dist/src/ui/");

  const outDir = path.resolve(DIST, "src/ui");
  fs.mkdirSync(outDir, { recursive: true });

  fs.copyFileSync(
    path.resolve(ROOT, "src/ui/styles.css"),
    path.resolve(outDir, "styles.css")
  );
}

async function writeManifest() {
  console.log("[build] Writing manifest → dist/manifest.json");

  const manifest = JSON.parse(
    fs.readFileSync(path.resolve(ROOT, "manifest.json"), "utf-8")
  );

  // Update service worker path for the bundled output
  manifest.background = manifest.background || {};
  manifest.background.service_worker = "background.js";
  manifest.background.type = "module";

  fs.writeFileSync(
    path.resolve(DIST, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

// ─── Watch mode ─────────────────────────────────────────────────────

async function watch() {
  console.log("[build] Watch mode enabled — rebuilding on changes...\n");

  const ctx = await esbuild.context({
    ...ESBUILD_OPTIONS,
    entryPoints: [path.resolve(ROOT, "src/background/serviceWorker.js")],
    bundle: true,
    outfile: path.resolve(DIST, "background.js"),
  });

  await ctx.watch();
  console.log("[build] Watching for changes...");

  // Watch other assets by re-running copy functions on change
  // (esbuild watches the JS; for assets, manual re-run is needed)
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log(`[build] TradingView AI Copilot — Build\n`);
  console.log(`  Minify:  ${shouldMinify}`);
  console.log(`  Watch:   ${shouldWatch}`);
  console.log(`  Output:  ${DIST}\n`);

  if (shouldWatch) {
    await watch();
    return;
  }

  const start = Date.now();

  await Promise.all([
    buildServiceWorker(),
    copyContentScript(),
    copySharedModules(),
    copyAssets(),
    copyStyles(),
    writeManifest(),
  ]);

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n[build] Done in ${elapsed}s → ${DIST}`);

  // Summary
  const sizes = [];
  for (const entry of [
    "background.js",
    "src/content/contentScript.js",
    "src/ui/styles.css",
    "assets/icon128.png",
    "manifest.json",
  ]) {
    const p = path.resolve(DIST, entry);
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      sizes.push(`  ${entry}: ${(stat.size / 1024).toFixed(1)} KB`);
    }
  }
  console.log(sizes.join("\n"));
}

main().catch((err) => {
  console.error("[build] Failed:", err);
  process.exit(1);
});
