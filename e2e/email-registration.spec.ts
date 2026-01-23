import { test, expect } from '@playwright/test'

const uniqueSuffix = Date.now()
const validEmail = `test_${uniqueSuffix}@example.com`
const validPassword = 'Pass1234!'
const validUsername = `testuser_${uniqueSuffix}`

// 已经注册过的邮箱（用于测试已注册场景）
const existingEmail = 'existing@example.com'

// 无效邮箱格式列表
const invalidEmails = [
  'test@',
  'test.com',
  'test',
  '@example.com',
  'test@@example.com',
  'test@.com'
]

// 无效密码列表
const invalidPasswords = [
  'short1', // 少于8个字符
  'passwordwithoutnumbers', // 没有数字
  '12345678', // 没有字母
  '!@#$%^&*', // 没有字母和数字
  'a1b2c3' // 少于8个字符
]

test.describe('邮箱注册功能测试', () => {
  // 测试用例：有效邮箱注册
  test('使用有效邮箱、密码和验证码注册（模拟）', async ({ page }) => {
    await page.goto('/register')
    
    // 选择邮箱注册方式
    await page.locator('button:has-text("邮箱注册")').click()
    
    // 输入有效用户名
    await page.locator('input[placeholder="请输入用户名"]').fill(validUsername)
    
    // 输入有效邮箱
    await page.locator('input[type="email"]').fill(validEmail)
    
    // 输入有效密码
    await page.locator('input[type="password"]').fill(validPassword)
    
    // 点击发送验证码按钮（模拟）
    const sendCodeButton = page.locator('button:has-text("发送验证码")')
    await expect(sendCodeButton).toBeEnabled()
    
    // 注意：实际测试中无法获取真实验证码，这里只测试UI交互
    await sendCodeButton.click()
    
    // 验证倒计时显示
    await expect(page.locator('button:has-text("秒后重新发送")')).toBeVisible()
  })
  
  // 测试用例：无效邮箱格式
  test('使用无效邮箱格式注册', async ({ page }) => {
    await page.goto('/register')
    
    // 选择邮箱注册方式
    await page.locator('button:has-text("邮箱注册")').click()
    
    // 输入有效用户名
    await page.locator('input[placeholder="请输入用户名"]').fill(validUsername)
    
    for (const invalidEmail of invalidEmails) {
      // 输入无效邮箱
      await page.locator('input[type="email"]').fill(invalidEmail)
      
      // 输入有效密码
      await page.locator('input[type="password"]').fill(validPassword)
      
      // 验证邮箱格式错误提示
      // 注意：具体的错误提示选择器需要根据实际UI调整
      const emailInput = page.locator('input[type="email"]')
      await emailInput.blur() // 触发失焦验证
      
      // 检查是否显示错误提示
      // 实际项目中需要根据具体的错误提示元素调整
      const errorMessage = page.locator('span.text-red-500')
      await expect(errorMessage).toBeVisible()
    }
  })
  
  // 测试用例：密码不符合要求
  test('使用不符合要求的密码注册', async ({ page }) => {
    await page.goto('/register')
    
    // 选择邮箱注册方式
    await page.locator('button:has-text("邮箱注册")').click()
    
    // 输入有效用户名
    await page.locator('input[placeholder="请输入用户名"]').fill(validUsername)
    
    // 输入有效邮箱
    await page.locator('input[type="email"]').fill(validEmail)
    
    for (const invalidPassword of invalidPasswords) {
      // 输入无效密码
      await page.locator('input[type="password"]').fill(invalidPassword)
      
      // 触发密码验证
      const passwordInput = page.locator('input[type="password"]')
      await passwordInput.blur() // 触发失焦验证
      
      // 检查是否显示错误提示
      const errorMessage = page.locator('span.text-red-500')
      await expect(errorMessage).toBeVisible()
    }
  })
  
  // 测试用例：空表单字段
  test('提交空表单字段', async ({ page }) => {
    await page.goto('/register')
    
    // 选择邮箱注册方式
    await page.locator('button:has-text("邮箱注册")').click()
    
    // 直接点击注册按钮
    const registerButton = page.locator('button:has-text("注册")')
    await registerButton.click()
    
    // 验证表单验证错误提示
    const errorMessages = page.locator('span.text-red-500')
    await expect(errorMessages).toHaveCount(3) // 用户名、邮箱、密码都为空
  })
  
  // 测试用例：用户名长度验证
  test('用户名长度验证', async ({ page }) => {
    await page.goto('/register')
    
    // 选择邮箱注册方式
    await page.locator('button:has-text("邮箱注册")').click()
    
    // 测试用户名少于2个字符
    await page.locator('input[placeholder="请输入用户名"]').fill('a')
    await page.locator('input[type="email"]').fill(validEmail)
    await page.locator('input[type="password"]').fill(validPassword)
    
    const usernameInput = page.locator('input[placeholder="请输入用户名"]')
    await usernameInput.blur() // 触发失焦验证
    
    // 检查用户名长度错误提示
    const errorMessage = page.locator('span.text-red-500')
    await expect(errorMessage).toBeVisible()
    
    // 测试用户名超过20个字符
    await page.locator('input[placeholder="请输入用户名"]').fill('a'.repeat(21))
    await usernameInput.blur() // 触发失焦验证
    
    await expect(errorMessage).toBeVisible()
  })
  
  // 测试用例：验证码发送频率限制
  test('验证码发送频率限制', async ({ page }) => {
    await page.goto('/register')
    
    // 选择邮箱注册方式
    await page.locator('button:has-text("邮箱注册")').click()
    
    // 填写基本信息
    await page.locator('input[placeholder="请输入用户名"]').fill(validUsername)
    await page.locator('input[type="email"]').fill(validEmail)
    await page.locator('input[type="password"]').fill(validPassword)
    
    // 第一次点击发送验证码
    const sendCodeButton = page.locator('button:has-text("发送验证码")')
    await sendCodeButton.click()
    
    // 验证按钮进入倒计时状态
    await expect(sendCodeButton).toHaveText(/\d+秒后重新发送/)
    await expect(sendCodeButton).toBeDisabled()
    
    // 验证按钮在倒计时期间无法再次点击
    await expect(sendCodeButton).toBeDisabled()
  })
})

test.describe('API层面邮箱注册测试', () => {
  // 测试用例：API - 有效邮箱注册
  test('API - 使用有效邮箱注册', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        username: validUsername,
        email: validEmail,
        password: validPassword
      }
    })
    
    const responseBody = await response.json()
    console.log('API注册响应:', responseBody)
    
    // 期望响应成功（具体状态码和响应结构根据实际API调整）
    // 注意：实际项目中需要根据API的返回格式调整断言
    expect([200, 201]).toContain(response.status())
  })
  
  // 测试用例：API - 无效邮箱格式
  test('API - 使用无效邮箱格式注册', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        username: validUsername,
        email: 'invalid-email',
        password: validPassword
      }
    })
    
    // 期望API返回错误状态码
    expect([400, 422]).toContain(response.status())
    
    const responseBody = await response.json()
    expect(responseBody).toHaveProperty('error')
  })
  
  // 测试用例：API - 密码不符合要求
  test('API - 使用不符合要求的密码注册', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        username: validUsername,
        email: validEmail,
        password: 'short1' // 少于8个字符
      }
    })
    
    // 期望API返回错误状态码
    expect([400, 422]).toContain(response.status())
    
    const responseBody = await response.json()
    expect(responseBody).toHaveProperty('error')
  })
})
