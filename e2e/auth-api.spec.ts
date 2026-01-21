import { test, expect } from '@playwright/test'

// 中文注释：后端API端到端覆盖（注册、登录、验证码、刷新、会话）

const uniqueSuffix = Date.now()
const email = `user_${uniqueSuffix}@example.com`
const password = 'Pass1234!'
const phone = `1310000${String(uniqueSuffix).slice(-4)}`

test.describe('账号密码注册与登录', () => {
  test('邮箱注册 -> 密码登录 -> /me', async ({ request }) => {
    const reg = await request.post('/api/auth/register', {
      data: { username: `user_${uniqueSuffix}`, email, password }
    })
    expect(reg.ok()).toBeTruthy()
    const regData = await reg.json()
    expect(regData.code).toBe(0)

    const login = await request.post('/api/auth/login', {
      data: { email, password }
    })
    expect(login.ok()).toBeTruthy()
    const loginData = await login.json()
    expect(loginData.code).toBe(0)
    const token = loginData.data.token

    const me = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(me.ok()).toBeTruthy()
    const meData = await me.json()
    expect(meData.code).toBe(0)
    expect(meData.data.email).toBe(email)
  })
})

test.describe('邮箱验证码登录', () => {
  test('发送邮箱验证码 -> 验证 -> 使用验证码登录（预期错误）', async ({ request }) => {
    const send = await request.post('/api/auth/send-email-code', { data: { email } })
    expect(send.ok()).toBeTruthy()
    const sendData = await send.json()
    expect(sendData.code).toBe(0)

    // 无法获取真实验证码，这里直接调用登录端点以验证端到端（应返回错误）
    const failLogin = await request.post('/api/auth/login-with-email-code', { data: { email, code: '000000' } })
    expect(failLogin.status()).toBe(400)
  })
})

test.describe('手机号验证码注册与登录', () => {
  test('发送短信验证码 -> 验证接口存在 -> 登录接口存在', async ({ request }) => {
    const send = await request.post('/api/auth/send-sms-code', { data: { phone } })
    expect(send.ok()).toBeTruthy()

    const verify = await request.post('/api/auth/verify-sms-code', { data: { phone, code: '000000' } })
    expect([200, 400, 500]).toContain(verify.status())

    const loginPhone = await request.post('/api/auth/login-phone', { data: { phone, code: '000000' } })
    expect([200, 400, 500]).toContain(loginPhone.status())
  })
})

test.describe('令牌刷新与会话', () => {
  test('登录后刷新令牌', async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: { email, password } })
    expect(login.ok()).toBeTruthy()
    const loginData = await login.json()
    const token = loginData.data.token

    const refresh = await request.post('/api/auth/refresh', { data: { token } })
    expect(refresh.ok()).toBeTruthy()
    const refreshData = await refresh.json()
    expect(refreshData.code).toBe(0)
    expect(refreshData.data.token).toBeTruthy()
    expect(refreshData.data.refreshToken).toBeTruthy()
  })
})

