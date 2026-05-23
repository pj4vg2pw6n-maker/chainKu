#!/usr/bin/env node
// Prepares .functions-build/ for Firebase deploy.
// Copies functions/ + packages/shared into a staging dir and patches
// package.json to use a local file: reference that npm understands
// (Cloud Build uses npm, not pnpm, so workspace:* would fail).
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const buildDir = path.join(root, ".functions-build");

if (fs.existsSync(buildDir)) execSync(`rm -rf "${buildDir}"`);
fs.mkdirSync(buildDir, { recursive: true });

execSync(`cp -r "${path.join(root, "functions")}/." "${buildDir}"`);

const sharedDest = path.join(buildDir, "_shared");
execSync(`cp -r "${path.join(root, "packages", "shared")}" "${sharedDest}"`);
execSync(`rm -rf "${path.join(sharedDest, "node_modules")}"`);

const pkgPath = path.join(buildDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.dependencies["@chainku/shared"] = "file:./_shared";
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log("✓ .functions-build/ ready for deploy");
