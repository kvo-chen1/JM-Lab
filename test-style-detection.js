// 测试风格检测函数

const styleKeywords = {
  'color-pencil': ['彩铅', '素描', '彩铅素描'],
  'fantasy-picture-book': ['诡萌', '幻想', '绘本', '诡萌幻想'],
  'mori-girl': ['森系', '辛逝季', '芙莉', '森系少女'],
  'warm-color': ['温馨', '彩绘', '温馨彩绘'],
  'adventure-comic': ['治愈', '冒险', '漫画', '治愈冒险', '治愈冒险漫画'],
  'grainy-cute': ['颗粒', '粉彩', '童话', '颗粒粉彩'],
  'dreamy-pastel': ['虹彩', '梦幻', '治愈', '虹彩梦幻']
};

function detectStyleFromMessage(message) {
  const lowerMsg = message.toLowerCase();
  
  for (const [styleId, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some(keyword => lowerMsg.includes(keyword))) {
      return styleId;
    }
  }
  
  return null;
}

// 测试用例
const testCases = [
  '@狗不理包子 生成ip形象',
  '生成ip形象',
  '帮我生成一个小包子IP形象',
  '彩铅风格的小包子',
  '素描画一个小包子'
];

console.log('测试风格检测函数:\n');
testCases.forEach(test => {
  const result = detectStyleFromMessage(test);
  console.log(`输入: "${test}"`);
  console.log(`检测结果: ${result || 'null'}`);
  console.log('---');
});
