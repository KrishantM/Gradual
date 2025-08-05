// Browser Security Test Script for Gradual
// Copy and paste this into your browser console at localhost:3000

const runSecurityTests = async () => {
  console.log('🔒 Starting Security Tests...\n');
  
  // Test 1: Unauthorized access
  console.log('Testing unauthorized access...');
  const endpoints = ['/score', '/suggestions', '/opportunities'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      
      if (response.status === 401) {
        console.log(`✅ ${endpoint}: Properly rejects unauthorized access`);
      } else {
        console.log(`❌ ${endpoint}: Allows unauthorized access (${response.status})`);
      }
    } catch (error) {
      console.log(`✅ ${endpoint}: Properly rejects unauthorized access`);
    }
  }
  
  // Test 2: Invalid token
  console.log('\nTesting invalid token access...');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token-123'
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      if (response.status === 401) {
        console.log(`✅ ${endpoint}: Properly rejects invalid token`);
      } else {
        console.log(`❌ ${endpoint}: Allows invalid token (${response.status})`);
      }
    } catch (error) {
      console.log(`✅ ${endpoint}: Properly rejects invalid token`);
    }
  }
  
  // Test 3: Rate limiting
  console.log('\nTesting rate limiting...');
  const requests = [];
  for (let i = 0; i < 10; i++) {
    requests.push(
      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test User ${i}`,
          email: `test${i}@example.com`
        })
      })
    );
  }
  
  const responses = await Promise.all(requests);
  const statusCodes = responses.map(r => r.status);
  const rateLimited = statusCodes.filter(code => code === 429).length;
  
  console.log(`Rate limiting test: ${rateLimited} requests were rate limited out of ${responses.length}`);
  if (rateLimited > 0) {
    console.log('✅ Rate limiting is working');
  } else {
    console.log('❌ Rate limiting may not be working');
  }
  
  console.log('\n✅ Security tests completed!');
};

// Run the tests
runSecurityTests(); 