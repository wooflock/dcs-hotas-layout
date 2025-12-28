// scripts/copy-electron-pkg.cjs
const fs = require("node:fs");
const path = require("node:path");

const src = path.join(process.cwd(), "electron", "package.json");
const dstDir = path.join(process.cwd(), "dist-electron");
const dst = path.join(dstDir, "package.json");

if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log("Copied electron/package.json -> dist-electron/package.json");
