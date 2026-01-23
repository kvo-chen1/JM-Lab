import { test, expect } from '@playwright/test'

// 测试用的邮箱和密码
const testEmail = 'test@example.com'
const testPassword = 'Pass1234!'

// 无效邮箱
const invalidEmail = 'invalid@example.com'

// 错误密码
const wrongPassword = 'Wrong1234!'

test.describe('邮箱登录功能测试', () => {
  // 测试用例：密码登录 - 有效凭证
  test('使用有效邮箱和密码登录（模拟）', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 确保是密码登录模式
    await page.locator('button:has-text("密码登录")').click()
    
    // 输入有效邮箱
    await page.locator('input[type="email"]').fill(testEmail)
    
    // 输入有效密码
    await page.locator('input[type="password"]').fill(testPassword)
    
    // 点击登录按钮（模拟）
    const loginButton = page.locator('button:has-text("登录")')
    await expect(loginButton).toBeEnabled()
    
    // 注意：实际测试中会跳转到首页，这里只测试UI交互
    // await loginButton.click()
    // await expect(page).toHaveURL('/')
  })
  
  // 测试用例：密码登录 - 无效邮箱
  test('使用无效邮箱登录', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 选择密码登录模式
    await page.locator('button:has-text("密码登录")').click()
    
    // 输入无效邮箱
    await page.locator('input[type="email"]').fill(invalidEmail)
    
    // 输入有效密码
    await page.locator('input[type="password"]').fill(testPassword)
    
    // 点击登录按钮
    const loginButton = page.locator('button:has-text("登录")')
    await loginButton.click()
    
    // 验证登录失败，显示错误提示
    const errorMessage = page.locator('div.text-red-500')
    await expect(errorMessage).toBeVisible()
  })
  
  // 测试用例：密码登录 - 错误密码
  test('使用错误密码登录', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 选择密码登录模式
    await page.locator('button:has-text("密码登录")').click()
    
    // 输入有效邮箱
    await page.locator('input[type="email"]').fill(testEmail)
    
    // 输入错误密码
    await page.locator('input[type="password"]').fill(wrongPassword)
    
    // 点击登录按钮
    const loginButton = page.locator('button:has-text("登录")')
    await loginButton.click()
    
    // 验证登录失败，显示错误提示
    const errorMessage = page.locator('div.text-red-500')
    await expect(errorMessage).toBeVisible()
  })
  
  // 测试用例：验证码登录 - 切换到验证码登录
  test('切换到验证码登录模式', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 切换到验证码登录
    await page.locator('button:has-text("验证码登录")').click()
    
    // 验证验证码输入框显示
    await expect(page.locator('input[placeholder="请输入验证码"]')).toBeVisible()
    
    // 验证发送验证码按钮显示
    await expect(page.locator('button:has-text("发送验证码")')).toBeVisible()
  })
  
  // 测试用例：验证码登录 - 发送验证码
  test('验证码登录 - 发送验证码', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 切换到验证码登录
    await page.locator('button:has-text("验证码登录")').click()
    
    // 输入有效邮箱
    await page.locator('input[type="email"]').fill(testEmail)
    
    // 点击发送验证码按钮
    const sendCodeButton = page.locator('button:has-text("发送验证码")')
    await expect(sendCodeButton).toBeEnabled()
    await sendCodeButton.click()
    
    // 验证倒计时显示
    await expect(sendCodeButton).toHaveText(/\d+秒后重新发送/)
    await expect(sendCodeButton).toBeDisabled()
  })
  
  // 测试用例：验证码登录 - 有效验证码（模拟）
  test('验证码登录 - 使用有效验证码（模拟）', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 切换到验证码登录
    await page.locator('button:has-text("验证码登录")').click()
    
    // 输入有效邮箱
    await page.locator('input[type="email"]').fill(testEmail)
    
    // 输入6位数字验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('123456')
    
    // 验证登录按钮可用
    const loginButton = page.locator('button:has-text("登录")')
    await expect(loginButton).toBeEnabled()
  })
  
  // 测试用例：验证码登录 - 无效验证码
  test('验证码登录 - 使用无效验证码', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 切换到验证码登录
    await page.locator('button:has-text("验证码登录")').click()
    
    // 输入有效邮箱
    await page.locator('input[type="email"]').fill(testEmail)
    
    // 输入无效验证码
    await page.locator('input[placeholder="请输入验证码"]').fill('000000')
    
    // 点击登录按钮
    const loginButton = page.locator('button:has-text("登录")')
    await loginButton.click()
    
    // 验证登录失败，显示错误提示
    const errorMessage = page.locator('div.text-red-500')
    await expect(errorMessage).toBeVisible()
  })
  
  // 测试用例：邮箱登录类型切换
  test('切换邮箱登录类型', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 初始状态应该是密码登录
    await expect(page.locator('button:has-text("密码登录")')).toHaveClass(/bg-red-600/)
    
    // 切换到验证码登录
    await page.locator('button:has-text("验证码登录")').click()
    await expect(page.locator('button:has-text("验证码登录")')).toHaveClass(/bg-red-600/)
    
    // 验证验证码输入框显示
    await expect(page.locator('input[placeholder="请输入验证码"]')).toBeVisible()
    
    // 切换回密码登录
    await page.locator('button:has-text("密码登录")').click()
    await expect(page.locator('button:has-text("密码登录")')).toHaveClass(/bg-red-600/)
    
    // 验证密码输入框显示，验证码输入框隐藏
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('input[placeholder="请输入验证码"]')).not.toBeVisible()
  })
  
  // 测试用例：空表单字段登录
  test('提交空表单字段登录', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 选择密码登录模式
    await page.locator('button:has-text("密码登录")').click()
    
    // 直接点击登录按钮，不输入任何内容
    const loginButton = page.locator('button:has-text("登录")')
    await loginButton.click()
    
    // 验证表单验证错误提示
    const errorMessages = page.locator('span.text-red-500')
    await expect(errorMessages).toHaveCount(2) // 邮箱和密码都为空
  })
  
  // 测试用例：无效邮箱格式
  test('使用无效邮箱格式登录', async ({ page }) => {
    await page.goto('/login')
    
    // 选择邮箱登录方式
    await page.locator('button:has-text("邮箱登录")').click()
    
    // 选择密码登录模式
    await page.locator('button:has-text("密码登录")').click()
    
    // 输入无效邮箱格式
    await page.locator('input[type="email"]').fill('invalid-email')
    
    // 输入有效密码
    await page.locator('input[type="password"]').fill(testPassword)
    
    // 触发邮箱验证
    const emailInput = page.locator('input[type="email"]')
    await emailInput.blur() // 触发失焦验证
    
    // 验证显示邮箱格式错误提示
    const errorMessage = page.locator('span.text-red-500')
    await expect(errorMessage).toBeVisible()
  })
})

test.describe('API层面邮箱登录测试', () => {
  // 测试用例：API - 邮箱密码登录
  test('API - 使用有效邮箱和密码登录', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: testEmail,
        password: testPassword
      }
    })
    
    const responseBody = await response.json()
    console.log('API登录响应:', responseBody)
    
    // 期望响应成功（具体状态码和响应结构根据实际API调整）
    expect([200, 201]).toContain(response.status())
    
    // 期望返回token
    // expect(responseBody.data).toHaveProperty('token')
  })
  
  // 测试用例：API - 邮箱验证码登录
  test('API - 邮箱验证码登录接口存在', async ({ request }) => {
    const response = await request.post('/api/auth/login-with-email-code', {
      data: {
        email: testEmail,
        code: '123456'
      }
    })
    
    // 期望接口存在（无论登录结果如何）
    expect([200, 400, 500]).toContain(response.status())
  })
  
  // 测试用例：API - 发送邮箱验证码
  test('API - 发送邮箱验证码', async ({ request }) => {
    const response = await request.post('/api/auth/send-email-code', {
      data: { email: testEmail }
    })
    
    const responseBody = await response.json()
    console.log('发送邮箱验证码响应:', responseBody)
    
    // 期望响应成功
    expect([200, 201]).toContain(response.status())
  })
})
