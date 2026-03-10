// 在浏览器控制台执行此代码来调试草稿问题

(function debugDraft() {
  // 获取当前活动ID
  const pathParts = window.location.pathname.split('/');
  const eventId = pathParts[2]; // 假设路径是 /events/:id/submit
  
  console.log('========================================');
  console.log('🔍 草稿调试信息');
  console.log('========================================');
  
  console.log('当前路径:', window.location.pathname);
  console.log('活动ID:', eventId);
  
  // 检查 localStorage 中的所有草稿
  console.log('\n📋 所有草稿键:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('draft_')) {
      console.log('  -', key);
    }
  }
  
  // 检查当前活动的草稿
  const draftKey = `draft_event_submission_${eventId}`;
  console.log('\n📋 当前活动草稿键:', draftKey);
  
  const draftData = localStorage.getItem(draftKey);
  console.log('草稿数据原始值:', draftData);
  
  if (draftData) {
    try {
      const parsed = JSON.parse(draftData);
      console.log('\n📋 解析后的草稿数据:');
      console.log('  savedAt:', parsed.savedAt);
      console.log('  formData:', parsed.formData);
      console.log('  files:', parsed.files);
      
      if (parsed.formData) {
        console.log('\n📋 formData 详情:');
        console.log('  title:', parsed.formData.title);
        console.log('  description:', parsed.formData.description);
        console.log('  tags:', parsed.formData.tags);
      }
      
      // 检查是否有内容
      const hasContent = parsed.formData?.title || 
                        parsed.formData?.description || 
                        (parsed.formData?.tags && parsed.formData.tags.length > 0) ||
                        (parsed.files && parsed.files.length > 0);
      
      console.log('\n📋 草稿是否有内容:', hasContent);
      
      if (!hasContent) {
        console.log('⚠️  警告: 草稿数据为空！');
        console.log('   可能的原因:');
        console.log('   1. 草稿保存时表单数据为空');
        console.log('   2. 草稿保存功能未启用');
        console.log('   3. 草稿被意外清除');
      }
    } catch (e) {
      console.error('❌ 解析草稿数据失败:', e);
    }
  } else {
    console.log('⚠️  没有找到草稿数据');
  }
  
  console.log('\n========================================');
})();
