#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing for production deployment...\n');

// Files to remove for production
const filesToRemove = [
  'src/app/security-test/page.tsx',
  'security-test.js',
  'firestore-security-test.js'
];

// Files to check for development content
const filesToCheck = [
  'src/app/layout.tsx' // Check if maintenance mode is enabled
];

console.log('📋 Checking for development files...');

let hasChanges = false;

// Remove development files
filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`🗑️  Removing: ${file}`);
    fs.unlinkSync(file);
    hasChanges = true;
  }
});

// Check for maintenance mode
const layoutPath = 'src/app/layout.tsx';
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  if (layoutContent.includes('NEXT_PUBLIC_MAINTENANCE_MODE')) {
    console.log('⚠️  WARNING: Maintenance mode is configured in layout.tsx');
    console.log('   Make sure NEXT_PUBLIC_MAINTENANCE_MODE=false in production');
  }
}

// Check environment variables
console.log('\n🔧 Environment Variables Check:');
console.log('   Make sure these are set for production:');
console.log('   - NEXT_PUBLIC_MAINTENANCE_MODE=false');
console.log('   - All Firebase keys are configured');
console.log('   - MailerLite API key is set');

if (hasChanges) {
  console.log('\n✅ Production preparation complete!');
  console.log('   Development files have been removed.');
} else {
  console.log('\n✅ No development files found to remove.');
}

console.log('\n📝 Next steps:');
console.log('1. Set NEXT_PUBLIC_MAINTENANCE_MODE=false');
console.log('2. Deploy to your hosting platform');
console.log('3. Test all features in production environment'); 