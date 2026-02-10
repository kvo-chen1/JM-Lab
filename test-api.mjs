// 测试后端 API
async function testAPI() {
  const communityId = '4000e812-564d-4e7e-8247-dab93b75fac4';
  
  try {
    const response = await fetch(`http://localhost:3000/api/communities/${communityId}/members`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('API Result:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.error('API Error:', errorText);
    }
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

testAPI();
