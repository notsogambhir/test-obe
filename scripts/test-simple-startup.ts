#!/usr/bin/env tsx

import { spawn } from 'child_process';

async function testSimpleStartup() {
  console.log('🧪 Testing Simple Next.js Startup...\n');

  // Test Next.js directly without custom server
  console.log('🚀 Starting Next.js in production mode...');
  const nextProcess = spawn('npx', ['next', 'start'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=4096',
      PORT: '3001' // Use different port to avoid conflicts
    }
  });

  let output = '';
  let errorOutput = '';

  nextProcess.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    console.log('📝', text.trim());
  });

  nextProcess.stderr.on('data', (data) => {
    const text = data.toString();
    errorOutput += text;
    console.error('❌', text.trim());
  });

  // Wait for startup or timeout
  const timeout = 30000;
  const startTime = Date.now();

  await new Promise((resolve, reject) => {
    const checkStartup = () => {
      if (output.includes('ready') || output.includes('started')) {
        console.log('✅ Next.js started successfully');
        resolve(true);
      } else if (errorOutput.includes('error') || errorOutput.includes('Error')) {
        console.error('❌ Next.js failed to start');
        reject(new Error(errorOutput));
      } else if (Date.now() - startTime > timeout) {
        console.error('❌ Next.js startup timeout');
        reject(new Error('Startup timeout'));
      } else {
        setTimeout(checkStartup, 1000);
      }
    };
    checkStartup();
  });

  // Test if server is responding
  console.log('\n🌐 Testing Next.js response...');
  try {
    const response = await fetch('http://127.0.0.1:3001', {
      method: 'GET',
      headers: { 'User-Agent': 'test-script' }
    });

    if (response.ok) {
      console.log('✅ Next.js responding correctly');
      console.log(`Status: ${response.status}`);
    } else {
      console.error('❌ Next.js response error:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to connect to Next.js:', error);
  }

  // Cleanup
  nextProcess.kill('SIGTERM');
  setTimeout(() => {
    nextProcess.kill('SIGKILL');
    console.log('✅ Simple test completed');
  }, 2000);
}

testSimpleStartup().catch((error) => {
  console.error('❌ Simple test failed:', error);
  process.exit(1);
});