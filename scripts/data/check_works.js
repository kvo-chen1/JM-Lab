import { mockWorks } from './src/mock/works.js';

console.log('Total works:', mockWorks.length);
console.log('First 5 works:', mockWorks.slice(0, 5).map(w => ({ id: w.id, title: w.title })));
console.log('Last 5 works:', mockWorks.slice(-5).map(w => ({ id: w.id, title: w.title })));
