#!/usr/bin/env node

// Build script for static
// This script can copy assets to consuming apps or prepare them for distribution

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validatePath, copyAssetsRecursive, scanDirectoryForAssets } from '@nucleum/static/asset-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🏗️  Building static package...');

// Create a manifest of all assets for easy reference
const createAssetManifest = () => {
  const manifest = {
    name: 'static',
    version: '0.0.0',
    assets: {},
    timestamp: new Date().toISOString()
  };

  // Use shared utility to scan directory
  scanDirectoryForAssets(__dirname, __dirname, '', manifest);
  
  // Write manifest
  fs.writeFileSync(
    path.join(__dirname, 'assets-manifest.json'), 
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`📦 Generated manifest with ${Object.keys(manifest.assets).length} assets`);
};

// Copy assets to a target directory (for apps that need them)
export const copyAssetsTo = (targetDir) => {
  console.log(`📂 Copying assets to ${targetDir}`);
  
  // Validate target directory path
  const validatedTargetDir = validatePath(targetDir, process.cwd());
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(validatedTargetDir)) {
    fs.mkdirSync(validatedTargetDir, { recursive: true });
  }
  
  // Use shared utility to copy assets
  copyAssetsRecursive(__dirname, validatedTargetDir, __dirname, process.cwd());
  console.log('✅ Assets copied successfully');
};

// Main build process
const build = () => {
  createAssetManifest();
  console.log('✅ Static assets package built successfully!');
};

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}
