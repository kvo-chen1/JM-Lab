// 测试日期解析
const startTimeStr = "1771209545000";
const endTimeStr = "1770909742000";

console.log('原始字符串:', startTimeStr, endTimeStr);

const startTimeNum = parseInt(startTimeStr, 10);
const endTimeNum = parseInt(endTimeStr, 10);

console.log('转换后数字:', startTimeNum, endTimeNum);

const startDate = new Date(startTimeNum);
const endDate = new Date(endTimeNum);

console.log('Date对象:', startDate, endDate);
console.log('格式化:', startDate.toLocaleDateString('zh-CN'), endDate.toLocaleDateString('zh-CN'));
