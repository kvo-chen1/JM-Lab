// 模拟前端数据处理，检查转换逻辑
const mockApiResponse = [
  {
    id: 'f1251821-5738-48ed-91b7-5d4b59287219',
    title: '海河牛奶「红西柚新口味包装及宣传语设计大赛」',
    start_date: 1770903342000,
    end_date: 1770989742000,
    status: 'published',
    created_at: 1770903342000
  }
];

// 当前的 toCamelCase 函数逻辑
const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      let value = obj[key];

      // 将 bigint 时间戳转换为 Date 对象
      const timeFields = ['startDate', 'endDate', 'createdAt', 'updatedAt', 'publishedAt', 'registrationDeadline', 'reviewStartDate', 'resultDate'];
      if (timeFields.includes(camelKey) && typeof value === 'number') {
        console.log(`Converting ${camelKey}: ${value} -> Date`);
        value = new Date(value);
      }

      acc[camelKey] = toCamelCase(value);
      return acc;
    }, {});
  }
  return obj;
};

console.log('=== 测试数据转换 ===\n');
console.log('原始数据:');
console.log(JSON.stringify(mockApiResponse[0], null, 2));

const converted = toCamelCase(mockApiResponse);
console.log('\n转换后:');
console.log(JSON.stringify(converted[0], null, 2));

console.log('\n日期格式化测试:');
const event = converted[0];
console.log(`startTime: ${event.startTime}`);
console.log(`endTime: ${event.endTime}`);

// 模拟 formatDate 函数
const formatDate = (date) => {
  if (!(date instanceof Date)) {
    console.log(`Warning: date is not a Date object, it's ${typeof date}:`, date);
    date = new Date(date);
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

console.log(`\n格式化结果:`);
console.log(`开始日期: ${formatDate(event.startTime)}`);
console.log(`结束日期: ${formatDate(event.endTime)}`);

// 检查是否是秒级时间戳
const now = Date.now();
console.log(`\n当前时间戳: ${now}`);
console.log(`数据时间戳: ${mockApiResponse[0].start_date}`);
console.log(`差值: ${mockApiResponse[0].start_date - now} ms`);
console.log(`差值天数: ${Math.round((mockApiResponse[0].start_date - now) / (1000 * 60 * 60 * 24))} 天`);
