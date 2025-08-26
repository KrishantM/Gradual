#!/bin/bash

# Quick deployment script for the critical dashboard fix
# This script helps deploy the fix without losing current development progress

echo "🚀 Deploying critical dashboard fix..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check for errors above"
    exit 1
fi

echo "✅ Build successful!"

# Check if this is a Vercel deployment
if [ -f "vercel.json" ] || [ -d ".vercel" ]; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
elif [ -f "firebase.json" ]; then
    echo "🚀 Deploying to Firebase..."
    firebase deploy
else
    echo "⚠️  No deployment configuration found. Please deploy manually:"
    echo "   - For Vercel: vercel --prod"
    echo "   - For Firebase: firebase deploy"
    echo "   - For other platforms: Follow your usual deployment process"
fi

echo "🎉 Deployment script completed!"
echo "📝 Remember to test the dashboard after deployment to ensure the fix works"
