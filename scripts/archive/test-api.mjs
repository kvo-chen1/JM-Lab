// 测试 API 端点
async function testAPI() {
  console.log('=================================');
  console.log('  测试 API 端点');
  console.log('=================================\n');
  
  const baseURL = 'http://localhost:3030';
  
  try {
    // 测试 /api/works
    console.log('🔄 测试 GET /api/works?limit=5');
    const response = await fetch(`${baseURL}/api/works?limit=5`);
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 请求成功`);
      console.log(`   返回数据: ${data.data?.length || 0} 条记录`);
      
      if (data.data && data.data.length > 0) {
        console.log('\n📄 第一条记录:');
        const first = data.data[0];
        console.log(`   标题: ${first.title}`);
        console.log(`   作者: ${first.author?.username}`);
        console.log(`   创建时间: ${first.date}`);
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ 请求失败: ${errorText}`);
    }
    
    console.log('\n=================================');
    console.log('  测试完成');
    console.log('=================================');
    
  } catch (error) {
    console.error('\n❌ 测试失败!');
    console.error(`   错误: ${error.message}`);
    
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 提示: 服务器可能没有运行，请先启动服务器 (pnpm dev)');
    }
  }
}

testAPI();
