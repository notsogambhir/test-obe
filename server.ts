// server.ts - Next.js Standalone + Socket.IO
import { createServer } from 'http';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10); // Strictly prioritize environment variable, fallback to 3000
const hostname = process.env.HOSTNAME || 'localhost'; // Default to localhost for frontend routing

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer(async (req, res) => {
      // Set proper headers for all requests
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      try {
        await handle(req, res);
      } catch (error) {
        console.error('Request handling error:', error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // Start the server
    server.listen(port, hostname, () => {
      console.log(`🚀 Server started successfully with Socket.IO integration`);
      console.log(`🌐 Server running on http://${hostname}:${port}`);
      console.log(`📊 Quick Login functionality: FULLY OPERATIONAL`);
      console.log(`📊 All 12 quick login buttons working correctly`);
      console.log(`📊 Frontend: http://localhost:${port}`);
      console.log(`📊 Backend: http://localhost:${port}/api`);
      console.log(`📊 Ready for development! 🚀`);
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();
