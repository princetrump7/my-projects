/**
 * Icon generator — converts SVGs to PNG icons for Chrome extension.
 *
 * Usage:
 *   npm install sharp
 *   node tools/generate-icons.js
 *
 * Requires: sharp (npm install sharp)
 * If sharp can't install, manually convert the SVGs to PNGs at
 * 16×16, 48×48, and 128×128.
 */

const fs = require("fs");
const path = require("path");

async function generateIcons() {
  const sizes = [16, 48, 128];

  try {
    const sharp = require("sharp");

    for (const size of sizes) {
      const svgPath = path.join(__dirname, "..", "assets", `icon${size}.svg`);
      const pngPath = path.join(__dirname, "..", "assets", `icon${size}.png`);

      if (!fs.existsSync(svgPath)) {
        console.warn(`⚠️  Skipping icon${size}.svg — not found`);
        continue;
      }

      const svgBuffer = fs.readFileSync(svgPath);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath);

      console.log(`✅ Generated icon${size}.png (${size}×${size})`);
    }

    console.log("\n🎉 All icons generated successfully!");
    console.log("Now load the extension in Chrome → chrome://extensions");
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      console.log("⚠️  sharp is not installed. Install it with:\n");
      console.log("  npm install sharp");
      console.log("\nOr manually convert the SVGs in assets/ to PNGs.");
      console.log("Required sizes: 16×16, 48×48, 128×128");
    } else {
      console.error("❌ Error generating icons:", err.message);
    }
  }
}

generateIcons();
