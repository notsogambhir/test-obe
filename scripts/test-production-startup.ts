#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { existsSync } from 'fs';

async function testProductionStartup() {
  console.log('🧪 Testing Production Startup...\n');

  // Check if build exists
  if (!existsSync('.next')) {
    console.log('❌ Build directory not found. Running build first...');
    try {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          NODE_OPTIONS: '--max-old-space-size=4096'
        }
      });

      await new Promise((resolve, reject) => {
        buildProcess.on('close', (code) => {
          if (code === 0) resolve(code);
          else reject(new Error(`Build failed with code ${code}`));
        });
      });
      console.log('✅ Build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  // Test database connection
  console.log('\n🗄️  Testing database connection...');
  try {
    const { db } = await import('../src/lib/db');
    await db.$connect();
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    await db.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Test server startup with timeout
  console.log('\n🚀 Starting production server...');
  const serverProcess = spawn('npm', ['start'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });

  let serverOutput = '';
  let serverError = '';

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log('📝', output.trim());
  });

  serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    serverError += error;
    console.error('❌', error.trim());
  });

  // Wait for server to start or timeout
  const startupTimeout = 30000; // 30 seconds
  const startTime = Date.now();

  await new Promise((resolve, reject) => {
    const checkServer = () => {
      if (serverOutput.includes('Ready on http://127.0.0.1:3000')) {
        console.log('✅ Server started successfully');
        resolve(true);
      } else if (serverError.includes('Error')) {
        console.error('❌ Server failed to start');
        reject(new Error(serverError));
      } else if (Date.now() - startTime > startupTimeout) {
        console.error('❌ Server startup timeout');
        reject(new Error('Server startup timeout'));
      } else {
        setTimeout(checkServer, 1000);
      }
    };
    checkServer();
  });

  // Test server response
  console.log('\n🌐 Testing server response...');
  try {
    const response = await fetch('http://127.0.0.1:3000', {
      method: 'GET',
      headers: {
        'User-Agent': 'test-script'
      }
    });

    if (response.ok) {
      console.log('✅ Server responding correctly');
      console.log(`Status: ${response.status}`);
    } else {
      console.error('❌ Server response error:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to connect to server:', error);
  }

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  serverProcess.kill('SIGTERM');
  
  setTimeout(() => {
    serverProcess.kill('SIGKILL');
    console.log('✅ Test completed');
  }, 2000);
}

testProductionStartup().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});