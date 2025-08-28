#!/bin/bash

# Rugalika Backend Deployment Script
echo "🚀 Starting Rugalika Backend Deployment..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building TypeScript project..."
npm run build

# Check if build was successful
if [ ! -f "dist/app.js" ]; then
    echo "❌ Build failed! dist/app.js not found"
    exit 1
fi

echo "✅ Build successful!"
echo "📁 Build output:"
ls -la dist/

# Start the application
echo "🚀 Starting application..."
npm start
