import fs from 'fs';
import path from 'path';

// 读取 CanvasArea.tsx 文件
const filePath = path.join(__dirname, 'src', 'pages', 'create', 'components', 'CanvasArea.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// 计算 div 标签的平衡
const lines = content.split('\n');
let openDivs = 0;
let lineNumber = 0;
let imbalanceLine = null;

lines.forEach(line => {
  lineNumber++;
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;
  openDivs += opens - closes;
  
  // 记录不平衡的行
  if (openDivs < 0 && imbalanceLine === null) {
    imbalanceLine = lineNumber;
  }
});

console.log('=== Div Tag Balance Check ===');
console.log('File:', filePath);
console.log('Total lines:', lines.length);
console.log('Final balance:', openDivs);
if (imbalanceLine) {
  console.log('First imbalance at line:', imbalanceLine);
} else {
  console.log('No negative balance found (all closing tags have matching opening tags)');
}

// 如果有不平衡，显示最后几行的平衡情况
if (openDivs !== 0) {
  console.log('\n=== Last 20 lines balance ===');
  let tempBalance = 0;
  for (let i = Math.max(0, lines.length - 20); i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    tempBalance += opens - closes;
    console.log(`Line ${i + 1}: opens=${opens}, closes=${closes}, balance=${tempBalance}`);
  }
}
