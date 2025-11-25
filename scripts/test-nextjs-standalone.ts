#!/usr/bin/env tsx

import { spawn } from 'child_process';

async function testNextJsStandalone() {
  console.log('🧪 Testing Next.js standalone startup...\n');

  // Kill any existing processes
  try {
    spawn('pkill', ['-f', 'tsx'], { stdio: 'pipe' });
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    // Ignore if pkill fails
  }

  // Test Next.js standalone
  console.log('🚀 Starting Next.js standalone...');
  const nextProcess = spawn('npx', ['next', 'start'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=4096',
      PORT: '3002' // Use different port
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
  const timeout = 30000; // 30 seconds
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

  // Test server response
  console.log('\n🌐 Testing Next.js response...');
  try {
    const response = await fetch('http://127.0.0.1:3002', {
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
    console.log('✅ Next.js test completed');
  }, 2000);
}

testNextJsStandalone().catch((error) => {
  console.error('❌ Next.js standalone test failed:', error);
  process.exit(1);
});