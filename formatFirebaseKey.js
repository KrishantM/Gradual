// formatFirebaseKey.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'firebase-service-account.json');

try {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(raw);

  // Convert back to string and escape newlines
  const formatted = JSON.stringify(json).replace(/\n/g, '\\n');

  console.log('✅ Copy this secret value for GitHub:\n');
  console.log(formatted);
} catch (err) {
  console.error('❌ Failed to read or parse the file:', err);
}
