#!/usr/bin/env node

// Simple script to test our Turbo workspace setup
console.log('🚀 Testing Turbo Workspace Setup\n');

const fs = require('fs');
const path = require('path');

// Path validation utility to prevent directory traversal
function validatePath(inputPath, basePath = __dirname) {
  const normalizedPath = path.normalize(inputPath);
  const resolvedPath = path.resolve(basePath, normalizedPath);
  const resolvedBase = path.resolve(basePath);
  
  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error(`Path traversal attempt detected: ${inputPath}`);
  }
  
  return resolvedPath;
}

// Test 1: Check if packages exist
console.log('📦 Checking packages...');
const packages = ['components', 'elements', 'types', 'utils', 'stores', 'actions', 'static'];
packages.forEach(pkg => {
  try {
    // Validate package name to prevent malicious input
    if (pkg.includes('..') || pkg.includes('/') || pkg.includes('\\')) {
      console.log(`  ❌ ${pkg} (invalid package name)`);
      return;
    }
    
    const pkgPath = validatePath(path.join('packages', pkg));
    const exists = fs.existsSync(pkgPath);
    console.log(`  ${exists ? '✅' : '❌'} ${pkg}`);
  } catch (error) {
    console.log(`  ❌ ${pkg} (path validation error)`);
  }
});

// Test 2: Check if product apps exist
console.log('\n🏗️  Checking product apps...');
const products = ['nucleus', 'memotron', 'pointron'];
products.forEach(product => {
  try {
    // Validate product name to prevent malicious input
    if (product.includes('..') || product.includes('/') || product.includes('\\')) {
      console.log(`  ❌ ${product} (invalid product name)`);
      return;
    }
    
    const productPath = validatePath(path.join('client', 'products', product));
    const exists = fs.existsSync(productPath);
    const packageJsonPath = validatePath(path.join('client', 'products', product, 'package.json'));
    const hasPackageJson = fs.existsSync(packageJsonPath);
    console.log(`  ${exists ? '✅' : '❌'} ${product} ${hasPackageJson ? '(has package.json)' : '(missing package.json)'}`);
  } catch (error) {
    console.log(`  ❌ ${product} (path validation error)`);
  }
});

// Test 3: Check turbo configuration
console.log('\n⚙️  Checking Turbo config...');
try {
  const turboPath = validatePath('turbo.json');
  const rootPkgPath = validatePath('package.json');
  const turboExists = fs.existsSync(turboPath);
  const rootPkgExists = fs.existsSync(rootPkgPath);
  console.log(`  ${turboExists ? '✅' : '❌'} turbo.json`);
  console.log(`  ${rootPkgExists ? '✅' : '❌'} root package.json`);
} catch (error) {
  console.log('  ❌ Error validating config file paths');
}

console.log('\n🎉 Setup verification complete!');
console.log('\n🔧 Next steps:');
console.log('1. Run "npm run dev" to start all apps in development mode');
console.log('2. Run "npm run build" to build all packages and apps');
console.log('3. Migrate import statements gradually from $lib/client/* to $components, $elements, etc.');
