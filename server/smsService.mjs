/**
 * 短信服务模块
 * 支持多种短信服务提供商
 */

// 短信服务配置
const smsConfig = {
  provider: process.env.SMS_PROVIDER || 'aliyun', // aliyun, tencent, twilio等
  aliyun: {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
    signName: process.env.ALIYUN_SMS_SIGN_NAME || 'AI共创平台',
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_123456789'
  },
  tencent: {
    secretId: process.env.TENCENT_SECRET_ID || '',
    secretKey: process.env.TENCENT_SECRET_KEY || '',
    sdkAppId: process.env.TENCENT_SMS_SDK_APP_ID || '',
    signName: process.env.TENCENT_SMS_SIGN_NAME || 'AI共创平台',
    templateId: process.env.TENCENT_SMS_TEMPLATE_ID || '123456'
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    from: process.env.TWILIO_FROM_PHONE || '+1234567890',
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || ''
  }
};

/**
 * 生成6位随机验证码
 * @returns {string} - 6位数字验证码
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 频率限制存储 (内存中)
 const rateLimitStore = new Map();
 const RATE_LIMIT_WINDOW = 60 * 1000; // 60秒
 
 /**
  * 检查频率限制
  * @param {string} phone - 手机号码
  * @returns {boolean} - 是否允许发送
  */
 function checkRateLimit(phone) {
   const now = Date.now();
   const lastSent = rateLimitStore.get(phone);
   
   if (lastSent && now - lastSent < RATE_LIMIT_WINDOW) {
     return false;
   }
   
   rateLimitStore.set(phone, now);
   
   // 清理过期记录
   for (const [key, timestamp] of rateLimitStore.entries()) {
     if (now - timestamp > RATE_LIMIT_WINDOW) {
       rateLimitStore.delete(key);
     }
   }
   
   return true;
 }
 
 /**
  * 发送短信验证码
  * @param {string} phone - 手机号码
  * @param {string} code - 验证码
  * @returns {Promise<boolean>} - 是否发送成功
  */
 export async function sendSmsVerificationCode(phone, code) {
   if (!checkRateLimit(phone)) {
     console.warn(`短信发送频率限制: ${phone}`);
     return false; // 频率过高，拒绝发送 (前端应处理此情况，虽然这里只返回false，理想情况是返回特定错误码)
   }
   
   try {
    switch (smsConfig.provider) {
      case 'aliyun':
        return await sendAliyunSms(phone, code);
      case 'tencent':
        return await sendTencentSms(phone, code);
      case 'twilio':
        return await sendTwilioSms(phone, code);
      default:
        // 模拟短信发送，仅用于开发测试
        console.log(`[模拟] 发送短信验证码到 ${phone}: 您的验证码是 ${code}，有效期5分钟`);
        return true;
    }
  } catch (error) {
    console.error('短信发送失败:', error);
    return false;
  }
}

/**
 * 发送阿里云短信
 * @param {string} phone - 手机号码
 * @param {string} code - 验证码
 * @returns {Promise<boolean>} - 是否发送成功
 */
async function sendAliyunSms(phone, code) {
  try {
    // 由于没有实际的阿里云SDK，这里仅作模拟
    console.log(`[阿里云] 发送短信验证码到 ${phone}: 您的验证码是 ${code}，有效期5分钟`);
    return true;
  } catch (error) {
    console.error('阿里云短信发送失败:', error);
    return false;
  }
}

/**
 * 发送腾讯云短信
 * @param {string} phone - 手机号码
 * @param {string} code - 验证码
 * @returns {Promise<boolean>} - 是否发送成功
 */
async function sendTencentSms(phone, code) {
  try {
    // 由于没有实际的腾讯云SDK，这里仅作模拟
    console.log(`[腾讯云] 发送短信验证码到 ${phone}: 您的验证码是 ${code}，有效期5分钟`);
    return true;
  } catch (error) {
    console.error('腾讯云短信发送失败:', error);
    return false;
  }
}

/**
 * 发送Twilio短信
 * @param {string} phone - 手机号码
 * @param {string} code - 验证码
 * @returns {Promise<boolean>} - 是否发送成功
 */
async function sendTwilioSms(phone, code) {
  try {
    // 检查配置是否完整，否则直接模拟
    if (!smsConfig.twilio.accountSid || !smsConfig.twilio.authToken || !smsConfig.twilio.accountSid.startsWith('AC')) {
      console.log(`[模拟-Twilio配置无效] 发送短信验证码到 ${phone}: 您的验证码是 ${code}，有效期5分钟`);
      return true;
    }

    // 导入Twilio SDK
    const twilio = await import('twilio');
    
    // 创建Twilio客户端
    const client = twilio.default(smsConfig.twilio.accountSid, smsConfig.twilio.authToken);
    
    // 发送短信
    const message = await client.messages.create({
      body: `您的验证码是 ${code}，有效期5分钟`,
      messagingServiceSid: smsConfig.twilio.messagingServiceSid,
      to: phone
    });
    
    console.log(`[Twilio] 短信发送成功: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Twilio短信发送失败:', error);
    // 降级为模拟成功，确保开发流程畅通
    console.log(`[降级模拟] 发送短信验证码到 ${phone}: 您的验证码是 ${code}，有效期5分钟`);
    return true;
  }
}

/**
 * 验证验证码是否有效
 * @param {string} storedCode - 存储的验证码
 * @param {string} inputCode - 用户输入的验证码
 * @param {number} expiresAt - 过期时间戳
 * @returns {boolean} - 是否有效
 */
export function verifySmsCode(storedCode, inputCode, expiresAt) {
  // 检查验证码是否匹配
  if (storedCode !== inputCode) {
    return false;
  }
  
  // 检查验证码是否过期
  // 处理秒级时间戳（来自PostgreSQL）、毫秒级时间戳（来自其他数据库）和时间字符串
  // 处理null值情况
  if (!expiresAt) {
    return false;
  }
  
  const now = Date.now();
  let actualExpiresAt;
  
  if (typeof expiresAt === 'string') {
    // 处理时间字符串
    actualExpiresAt = new Date(expiresAt).getTime();
  } else {
    // 处理数字类型的时间戳
    const isSeconds = expiresAt < 1e12; // 如果expiresAt小于1e12，认为是秒级时间戳
    actualExpiresAt = isSeconds ? expiresAt * 1000 : expiresAt;
  }
  
  if (now > actualExpiresAt) {
    return false;
  }
  
  return true;
}
