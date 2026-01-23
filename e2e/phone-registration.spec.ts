import { test, expect } from '@playwright/test'

const uniqueSuffix = Date.now()
const validPhone = `13${String(uniqueSuffix).slice(-9)}`
const validUsername = `testuser_${uniqueSuffix}`

// 已经注册过的手机号（用于测试已注册场景）
const existingPhone = '13800138000'

// 无效手机号格式列表
const invalidPhones = [
  '1234567890', // 少于11位
  '123456789012', // 超过11位
  '23800138000', // 不是以1开头
  '1380013800a', // 包含非数字字符
  '138-0013-8000', // 包含特殊字符
  '138 0013 8000' // 包含空格
]

test.describe('手机号注册功能测试', () => {
  // 测试用例：有效手机号注册
  test('使用有效手机号和验证码注册（模拟）', async ({ page }) => {
    await page.goto('/register')
    
    // 选择手机号注册方式
    await page.locator('button:has-text("手机号注册")').click()
    
    // 输入有效用户名
    await page.locator('input[placeholder="请输入用户名"]').fill(validUsername)
    
    // 输入有效手机号
    await page.locator('input[type="tel"]').fill(validPhone)
    
    // 点击发送验证码按钮（模拟）
    const sendCodeButton = page.locator('button:has-text("发送验证码")')
    await expect(sendCodeButton).toBeEnabled()
    
    // 注意：实际测试中无法获取真实验证码，这里只测试UI交互
    await sendCodeButton.click()
    
    // 验证倒计时显示
    await expect(page.locator('button:has-text("秒后重新发送")')).toBeVisible()
  })
  
  // 测试用例：无效手机号格式
  test('使用无效手机号格式注册', async ({ page }) => {
    await page.goto('/register')
    
    // 选择手机号注册方式
    await page.locator('button:has-text("手机号注册")').click()
    
    // 输入有效用户名
    await page.locator('input[placeholder="请输入用户名"]').fill(validUsername)
    
    for (const invalidPhone of invalidPhones) {
      // 输入无效手机号
      await page.locator('input[type="tel"]').fill(invalidPhone)
      
      // 触发手机号验证
      const phoneInput = page.locator('input[type="tel"]')
      await phoneInput.blur() // 触发失焦验证
      
      // 检查是否显示错误提示
      const errorMessage = page.locator('span.text-red-500')
      await expect(errorMessage).toBeVisible()
    }
  })
  
  // 测试用例：空表单字段
  test('提交空表单字段', async ({ page }) => {
    await page.goto('/register')
    
    // 选择手机号注册方式
    await page.locator('button:has-text("手机号注册")').click()
    
    // 直接点击注册按钮
    const registerButton = page.locator('button:has-text("注册")')
    await registerButton.click()
    
    // 验证表单验证错误提示
    const errorMessages = page.locator('span.text-red-500')
    await expect(errorMessages).toHaveCount(2) // 用户名、手机号都为空
  })
  
  // 测试用例：用户名长度验证
  test('用户名长度验证', async ({ page }) => {
    await page.goto('/register')
    
    // 选择手机号注册方式
    await page.locator('button:has-text("手机号注册")').click()
    
    // 测试用户名少于2个字符
    await page.locator('input[placeholder="请输入用户名"]').fill('a')
    await page.locator('input[type="tel"]').fill(validPhone)
    
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
    
    // 选择手机号注册方式
    await page.locator('button:has-text("手机号注册")').click()
    
    // 填写基本信息
    await page.locator('input[placeholder="请输入用户名"]').fill(validUsername)
    await page.locator('input[type="tel"]').fill(validPhone)
    
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
    await page.goto('/register')
    
    // 选择手机号注册方式
    await page.locator('button:has-text("手机号注册")').click()
    
    // 填写基本信息
    await page.locator('input[placeholder="请输入用户名"]').fill(validUsername)
    await page.locator('input[type="tel"]').fill(validPhone)
    
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
})

test.describe('API层面手机号注册测试', () => {
  // 测试用例：API - 发送短信验证码
  test('API - 发送短信验证码', async ({ request }) => {
    const response = await request.post('/api/auth/send-sms-code', {
      data: { phone: validPhone }
    })
    
    const responseBody = await response.json()
    console.log('发送短信验证码响应:', responseBody)
    
    // 期望响应成功（具体状态码和响应结构根据实际API调整）
    expect([200, 201]).toContain(response.status())
  })
  
  // 测试用例：API - 使用无效手机号发送验证码
  test('API - 使用无效手机号发送验证码', async ({ request }) => {
    const response = await request.post('/api/auth/send-sms-code', {
      data: { phone: 'invalid-phone' }
    })
    
    // 期望API返回错误状态码
    expect([400, 422]).toContain(response.status())
    
    const responseBody = await response.json()
    expect(responseBody).toHaveProperty('error')
  })
  
  // 测试用例：API - 验证短信验证码接口
  test('API - 验证短信验证码接口存在', async ({ request }) => {
    const response = await request.post('/api/auth/verify-sms-code', {
      data: { phone: validPhone, code: '000000' }
    })
    
    // 期望接口存在（无论验证结果如何）
    expect([200, 400, 500]).toContain(response.status())
  })
  
  // 测试用例：API - 手机号注册接口
  test('API - 手机号注册接口存在', async ({ request }) => {
    const response = await request.post('/api/auth/register-phone', {
      data: {
        username: validUsername,
        phone: validPhone,
        code: '000000'
      }
    })
    
    // 期望接口存在（无论注册结果如何）
    expect([200, 400, 500]).toContain(response.status())
  })
})
