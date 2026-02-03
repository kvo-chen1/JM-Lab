// 清除本地存储中的模拟数据
// 运行方法：在浏览器控制台中复制并执行以下代码

// 清除作品数据
localStorage.removeItem('jmzf_posts');

// 清除标签缓存
localStorage.removeItem('jmzf_tags_cache');

// 清除其他可能的模拟数据
localStorage.removeItem('user');
localStorage.removeItem('jmzf_user_bookmarks');
localStorage.removeItem('jmzf_user_likes');

console.log('模拟数据已清除，请刷新页面获取真实数据');
