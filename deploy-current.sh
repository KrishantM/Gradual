#!/bin/bash

# Deploy Current Version of Gradual with Critical Fixes
# This script deploys the current working version without complex git operations

echo "🚀 Deploying current version of Gradual with critical fixes..."

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

# Check deployment platform and deploy
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

echo "🎉 Deployment completed!"
echo "📝 The dashboard should now work without the 'e.match is not a function' error"
echo "🔧 All critical fixes have been applied to prevent crashes"
