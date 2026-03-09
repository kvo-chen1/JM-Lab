/**
 * 测试状态映射修复
 */

console.log('==========================================')
console.log('   测试商品状态映射修复')
console.log('==========================================\n')

// 模拟数据库返回的商品数据
const dbProducts = [
  { id: '1', name: '无线充电宝', status: 'active', stock: 99 },
  { id: '2', name: '智能保温杯', status: 'active', stock: 158 },
  { id: '3', name: '津小脉毛绒公仔', status: 'inactive', stock: 50 },
  { id: '4', name: '售罄商品', status: 'sold_out', stock: 0 },
]

// 模拟 getAllProducts 函数的映射逻辑
function mapDbToFrontend(data) {
  return (data || []).map(product => ({
    ...product,
    // 状态映射：数据库的 active/inactive/sold_out 映射为前端的 on_sale/off_shelf/sold_out
    status: product.status === 'active' ? 'on_sale' : product.status === 'inactive' ? 'off_shelf' : product.status,
  }))
}

// 模拟 addProduct 函数的映射逻辑
function mapFrontendToDb(productData) {
  return {
    ...productData,
    // 状态映射：前端的 on_sale/off_shelf/sold_out 映射为数据库的 active/inactive/sold_out
    status: productData.status === 'on_sale' ? 'active' : productData.status === 'off_shelf' ? 'inactive' : productData.status,
  }
}

console.log('【1】数据库 -> 前端 映射测试')
console.log('------------------------------------------')
const frontendProducts = mapDbToFrontend(dbProducts)
frontendProducts.forEach(p => {
  console.log(`  ${p.name}: 数据库状态="${p.status}" -> 前端显示="${p.status === 'on_sale' ? '已上架' : p.status === 'off_shelf' ? '已下架' : '已售罄'}"`)
})

console.log('\n【2】前端 -> 数据库 映射测试')
console.log('------------------------------------------')
const frontendUpdates = [
  { id: '1', name: '无线充电宝', status: 'on_sale' },
  { id: '2', name: '智能保温杯', status: 'off_shelf' },
  { id: '3', name: '津小脉毛绒公仔', status: 'sold_out' },
]

frontendUpdates.forEach(p => {
  const dbData = mapFrontendToDb(p)
  console.log(`  ${p.name}: 前端状态="${p.status}" -> 数据库存储="${dbData.status}"`)
})

console.log('\n【3】验证映射是否正确')
console.log('------------------------------------------')

// 验证 active -> on_sale
const activeTest = mapDbToFrontend([{ status: 'active' }])[0].status === 'on_sale'
console.log(`  active -> on_sale: ${activeTest ? '✅ 正确' : '❌ 错误'}`)

// 验证 inactive -> off_shelf
const inactiveTest = mapDbToFrontend([{ status: 'inactive' }])[0].status === 'off_shelf'
console.log(`  inactive -> off_shelf: ${inactiveTest ? '✅ 正确' : '❌ 错误'}`)

// 验证 sold_out -> sold_out
const soldOutTest = mapDbToFrontend([{ status: 'sold_out' }])[0].status === 'sold_out'
console.log(`  sold_out -> sold_out: ${soldOutTest ? '✅ 正确' : '❌ 错误'}`)

// 验证 on_sale -> active
const onSaleTest = mapFrontendToDb({ status: 'on_sale' }).status === 'active'
console.log(`  on_sale -> active: ${onSaleTest ? '✅ 正确' : '❌ 错误'}`)

// 验证 off_shelf -> inactive
const offShelfTest = mapFrontendToDb({ status: 'off_shelf' }).status === 'inactive'
console.log(`  off_shelf -> inactive: ${offShelfTest ? '✅ 正确' : '❌ 错误'}`)

// 验证 sold_out -> sold_out
const soldOutReverseTest = mapFrontendToDb({ status: 'sold_out' }).status === 'sold_out'
console.log(`  sold_out -> sold_out: ${soldOutReverseTest ? '✅ 正确' : '❌ 错误'}`)

console.log('\n==========================================')
console.log('测试完成！所有映射都应该正确')
console.log('==========================================')
