// 测试 orderService 导出
import orderService from './orderService';

console.log('orderService loaded:', orderService);
console.log('cancelOrder method:', typeof orderService.cancelOrder);
console.log('confirmDelivery method:', typeof orderService.confirmDelivery);
console.log('completeOrder method:', typeof orderService.completeOrder);

// 测试所有方法
const methods = [
  'getUserOrders',
  'getOrderDetail',
  'getOrderLogistics',
  'cancelOrder',
  'confirmDelivery',
  'completeOrder',
  'applyRefund',
  'getUserRefundApplications',
  'getOrderStats',
  'exportOrders'
];

methods.forEach(method => {
  console.log(`${method}: ${typeof orderService[method]}`);
});
