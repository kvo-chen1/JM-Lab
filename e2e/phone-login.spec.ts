import { test, expect } from '@playwright/test'

// 测试用的手机号
const testPhone = '13800138000'

// 无效手机号
const invalidPhone = '13800138001'

test.describe('手机号登录功能测试', () => {
  // 测试用例：有效手机号和验证码登录（模拟）
  test('使用有效手机号和验证码登录（模拟）', async ({ page }) => {
    await page.goto('/login')
    
    // 选择手机号登录方式
    await page.locator('button:has-text("手机号验证码")').click()
    
    // 输入有效手机号
    await page.locator('input[type="tel"]').fill(testPhone)
    
    // 点击发送验证码按钮
    const sendCodeButton = page.locator('button:has-text("发送验证码")')
    await expect(sendCodeButton).toBeEnabled()
    await sendCodeButton.click()
    
    // 验证倒计时显示
    await expect(sendCodeButton).toHaveText(/\d+秒后重新发送/)
    await expect(sendCodeButton).toBeDisabled()
    
    // 输入6位数字验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('123456')
    
    // 验证登录按钮可用
    const loginButton = page.locator('button:has-text("登录")')
    await expect(loginButton).toBeEnabled()
  })
  
  // 测试用例：无效手机号登录
  test('使用未注册手机号登录', async ({ page }) => {
    await page.goto('/login')
    
    // 选择手机号登录方式
    await page.locator('button:has-text("手机号验证码")').click()
    
    // 输入未注册手机号
    await page.locator('input[type="tel"]').fill(invalidPhone)
    
    // 输入验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('123456')
    
    // 点击登录按钮
    const loginButton = page.locator('button:has-text("登录")')
    await loginButton.click()
    
    // 验证登录失败，显示错误提示
    const errorMessage = page.locator('div.text-red-500')
    await expect(errorMessage).toBeVisible()
  })
  
  // 测试用例：错误验证码登录
  test('使用错误验证码登录', async ({ page }) => {
    await page.goto('/login')
    
    // 选择手机号登录方式
    await page.locator('button:has-text("手机号验证码")').click()
    
    // 输入有效手机号
    await page.locator('input[type="tel"]').fill(testPhone)
    
    // 输入错误验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('000000')
    
    // 点击登录按钮
    const loginButton = page.locator('button:has-text("登录")')
    await loginButton.click()
    
    // 验证登录失败，显示错误提示
    const errorMessage = page.locator('div.text-red-500')
    await expect(errorMessage).toBeVisible()
  })
  
  // 测试用例：验证码发送频率限制
  test('验证码发送频率限制', async ({ page }) => {
    await page.goto('/login')
    
    // 选择手机号登录方式
    await page.locator('button:has-text("手机号验证码")').click()
    
    // 输入有效手机号
    await page.locator('input[type="tel"]').fill(testPhone)
    
    // 第一次点击发送验证码
    const sendCodeButton = page.locator('button:has-text("发送验证码")')
    await sendCodeButton.click()
    
    // 验证按钮进入倒计时状态
    await expect(sendCodeButton).toHaveText(/\d+秒后重新发送/)
    await expect(sendCodeButton).toBeDisabled()
    
    // 验证按钮在倒计时期间无法再次点击
    await expect(sendCodeButton).toBeDisabled()
  })
  
  // 测试用例：验证码长度验证
  test('验证码长度验证', async ({ page }) => {
    await page.goto('/login')
    
    // 选择手机号登录方式
    await page.locator('button:has-text("手机号验证码")').click()
    
    // 输入有效手机号
    await page.locator('input[type="tel"]').fill(testPhone)
    
    // 输入少于6位的验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('12345')
    
    // 触发验证码验证
    const codeInput = page.locator('input[placeholder="请输入验证码"]')
    await codeInput.blur() // 触发失焦验证
    
    // 检查是否显示错误提示
    const errorMessage = page.locator('span.text-red-500')
    await expect(errorMessage).toBeVisible()
    
    // 输入多于6位的验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('1234567')
    await codeInput.blur() // 触发失焦验证
    
    await expect(errorMessage).toBeVisible()
    
    // 输入包含非数字的验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('123abc')
    await codeInput.blur() // 触发失焦验证
    
    await expect(errorMessage).toBeVisible()
  })
  
  // 测试用例：空表单字段登录
  test('提交空表单字段登录', async ({ page }) => {
    await page.goto('/login')
    
    // 选择手机号登录方式
    await page.locator('button:has-text("手机号验证码")').click()
    
    // 直接点击登录按钮，不输入任何内容
    const loginButton = page.locator('button:has-text("登录")')
    await loginButton.click()
    
    // 验证表单验证错误提示
    const errorMessages = page.locator('span.text-red-500')
    await expect(errorMessages).toHaveCount(2) // 手机号和验证码都为空
  })
  
  // 测试用例：无效手机号格式
  test('使用无效手机号格式登录', async ({ page }) => {
    await page.goto('/login')
    
    // 选择手机号登录方式
    await page.locator('button:has-text("手机号验证码")').click()
    
    // 输入无效手机号格式
    await page.locator('input[type="tel"]').fill('1234567890') // 少于11位
    
    // 输入有效验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('123456')
    
    // 触发手机号验证
    const phoneInput = page.locator('input[type="tel"]')
    await phoneInput.blur() // 触发失焦验证
    
    // 验证显示手机号格式错误提示
    const errorMessage = page.locator('span.text-red-500')
    await expect(errorMessage).toBeVisible()
  })
  
  // 测试用例：切换登录方式
  test('切换登录方式', async ({ page }) => {
    await page.goto('/login')
    
    // 初始状态应该是邮箱登录
    await expect(page.locator('button:has-text("邮箱登录")')).toHaveClass(/bg-red-600/)
    
    // 切换到手机号登录
    await page.locator('button:has-text("手机号验证码")').click()
    await expect(page.locator('button:has-text("手机号验证码")')).toHaveClass(/bg-red-600/)
    
    // 验证手机号输入框显示
    await expect(page.locator('input[type="tel"]')).toBeVisible()
    
    // 切换回邮箱登录
    await page.locator('button:has-text("邮箱登录")').click()
    await expect(page.locator('button:has-text("邮箱登录")')).toHaveClass(/bg-red-600/)
    
    // 验证邮箱输入框显示
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

test.describe('API层面手机号登录测试', () => {
  // 测试用例：API - 发送短信验证码
  test('API - 发送短信验证码', async ({ request }) => {
    const validPhone = `13${Date.now().toString().slice(-9)}`
    
    const response = await request.post('/api/auth/send-sms-code', {
      data: { phone: validPhone }
    })
    
    const responseBody = await response.json()
    console.log('发送短信验证码响应:', responseBody)
    
    // 期望响应成功（具体状态码和响应结构根据实际API调整）
    expect([200, 201]).toContain(response.status())
  })
  
  // 测试用例：API - 手机号验证码登录
  test('API - 手机号验证码登录接口存在', async ({ request }) => {
    const validPhone = `13${Date.now().toString().slice(-9)}`
    
    const response = await request.post('/api/auth/login-phone', {
      data: {
        phone: validPhone,
        code: '123456'
      }
    })
    
    const responseBody = await response.json()
    console.log('手机号验证码登录响应:', responseBody)
    
    // 期望接口存在（无论登录结果如何）
    expect([200, 400, 500]).toContain(response.status())
  })
  
  // 测试用例：API - 使用无效手机号登录
  test('API - 使用无效手机号登录', async ({ request }) => {
    const response = await request.post('/api/auth/login-phone', {
      data: {
        phone: 'invalid-phone',
        code: '123456'
      }
    })
    
    // 期望API返回错误状态码
    expect([400, 422, 401]).toContain(response.status())
  })
  
  // 测试用例：API - 使用错误验证码登录
  test('API - 使用错误验证码登录', async ({ request }) => {
    const validPhone = `13${Date.now().toString().slice(-9)}`
    
    // 先发送验证码
    await request.post('/api/auth/send-sms-code', {
      data: { phone: validPhone }
    })
    
    // 然后使用错误验证码登录
    const response = await request.post('/api/auth/login-phone', {
      data: {
        phone: validPhone,
        code: '000000' // 错误验证码
      }
    })
    
    // 期望API返回错误状态码
    expect([400, 401]).toContain(response.status())
  })
})
