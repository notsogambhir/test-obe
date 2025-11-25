#!/bin/bash

# Build script with timeout prevention and optimizations
set -e

echo "🚀 Starting optimized build process..."

# Set environment variables for optimal build performance
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export ANALYZE=false

# Function to check if port is in use
check_port() {
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port 3000 is in use. Attempting to free it..."
        pkill -f "tsx server.ts" || true
        sleep 2
    fi
}

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf .next
rm -rf node_modules/.cache

# Check and free port if needed
check_port

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run build with timeout protection
echo "🏗️  Building application..."
timeout 600s npm run build || {
    echo "❌ Build failed or timed out"
    exit 1
}

# Verify build output
if [ ! -d ".next" ]; then
    echo "❌ Build directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📊 Build size: $(du -sh .next | cut -f1)"
echo "🎯 Ready for production deployment!"

# Optional: Test production build
if [ "$1" = "--test" ]; then
    echo "🧪 Testing production build..."
    timeout 30s npm start || {
        echo "⚠️  Production test failed (this might be expected if port is in use)"
    }
fi

echo "🎉 Build process complete!"