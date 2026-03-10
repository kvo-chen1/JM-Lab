// 测试草稿存储
const fs = require('fs');
const path = require('path');

// 模拟 localStorage
class LocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value.toString();
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// 设置全局 localStorage
global.localStorage = new LocalStorage();

// 测试草稿服务
const { draftService } = require('./src/services/draftService.ts');

async function testDrafts() {
  console.log('Testing draft service...');
  
  // 测试保存草稿
  const draft = await draftService.saveDraft({
    id: 'test-123',
    title: '测试草稿',
    templateId: 'template-1',
    templateName: '社交媒体文案',
    content: '这是一个测试草稿内容',
    summary: '测试保存'
  });
  
  console.log('Saved draft:', draft);
  
  // 测试获取所有草稿
  const drafts = await draftService.getAllDrafts();
  console.log('All drafts:', drafts);
  
  // 测试本地存储
  const localData = localStorage.getItem('ai_writer_drafts');
  console.log('Local storage data:', localData);
  
  console.log('Test completed!');
}

testDrafts().catch(console.error);
