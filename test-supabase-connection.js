// 测试 Supabase 连接
const SUPABASE_URL = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AYUZnzF2LNBPXi2o_3LGbA_7ceksBnv';

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  try {
    // 测试 REST API 连接
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Data:', data);
    } else {
      const error = await response.text();
      console.error('Error:', error);
    }
  } catch (e) {
    console.error('Exception:', e.message);
  }
}

// 测试 Auth OTP
testConnection();
