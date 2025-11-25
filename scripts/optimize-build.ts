#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function optimizeBuild() {
  try {
    console.log('🔧 Optimizing build process...\n');

    // Check current Node.js version
    const nodeVersion = process.version;
    console.log(`📦 Node.js version: ${nodeVersion}`);

    // Increase Node.js memory limit for build
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';
    console.log('✅ Set Node.js memory limit to 4GB');

    // Check if .next directory exists and clean it
    const nextDir = join(process.cwd(), '.next');
    if (existsSync(nextDir)) {
      console.log('🧹 Cleaning .next directory...');
      execSync('rm -rf .next', { stdio: 'inherit' });
    }

    // Optimize package.json build script
    const packageJsonPath = join(process.cwd(), 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      
      // Add optimized build script
      if (!packageJson.scripts['build:optimized']) {
        packageJson.scripts['build:optimized'] = 'NODE_OPTIONS="--max-old-space-size=4096" next build';
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Added optimized build script');
      }
    }

    // Check environment variables
    const envVars = {
      'NODE_ENV': 'production',
      'NODE_OPTIONS': '--max-old-space-size=4096',
      'NEXT_TELEMETRY_DISABLED': '1',
      'ANALYZE': 'false'
    };

    console.log('\n🌍 Environment variables for build:');
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`  ${key}=${value}`);
      process.env[key] = value;
    });

    // Run build with optimizations
    console.log('\n🏗️  Starting optimized build...');
    const buildStart = Date.now();
    
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 300000 // 5 minutes timeout
      });
      
      const buildTime = Date.now() - buildStart;
      console.log(`✅ Build completed successfully in ${buildTime}ms`);
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }

    // Check build output
    if (existsSync(nextDir)) {
      const buildStats = execSync('du -sh .next', { encoding: 'utf8' });
      console.log(`📊 Build size: ${buildStats.trim()}`);
    }

    console.log('\n🎉 Build optimization complete!');

  } catch (error) {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  }
}

optimizeBuild();