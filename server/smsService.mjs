/**
 * 短信服务模块
 * 支持多种短信服务提供商: 阿里云、腾讯云、Twilio
 * 
 * 上线准备说明：
 * 1. 在 .env 文件中配置真实的服务商信息 (SMS_PROVIDER=aliyun 或 tencent 或 twilio)
 * 2. 填入对应的 Key 和 Secret
 * 3. 生产环境下，如果配置无效，发送将失败，不再降级为 Mock
 */

import * as dotenv from 'dotenv';
dotenv.config();

// 短信服务配置
const smsConfig = {
  // 默认使用 aliyun，可改为 tencent 或 twilio
  provider: process.env.SMS_PROVIDER || 'aliyun', 
  
  // 是否允许在发送失败时降级为 Mock (仅开发环境建议开启)
  allowMock: process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_SMS === 'true',

  aliyun: {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
    signName: process.env.ALIYUN_SMS_SIGN_NAME || 'AI共创平台',
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_123456789', // 模板参数默认假设为 {code}
    endpoint: 'dysmsapi.aliyuncs.com'
  },
  tencent: {
    secretId: process.env.TENCENT_SECRET_ID || '',
    secretKey: process.env.TENCENT_SECRET_KEY || '',
    sdkAppId: process.env.TENCENT_SMS_SDK_APP_ID || '',
    signName: process.env.TENCENT_SMS_SIGN_NAME || 'AI共创平台',
    templateId: process.env.TENCENT_SMS_TEMPLATE_ID || '123456', // 模板参数对应 {1}
    region: process.env.TENCENT_SMS_REGION || 'ap-guangzhou'
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    from: process.env.TWILIO_FROM_PHONE || '',
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
    return false;
  }
  
  console.log(`[短信服务] 准备发送验证码到 ${phone}，使用服务商: ${smsConfig.provider}`);

  let success = false;
  try {
    switch (smsConfig.provider) {
      case 'aliyun':
        success = await sendAliyunSms(phone, code);
        break;
      case 'tencent':
        success = await sendTencentSms(phone, code);
        break;
      case 'twilio':
        success = await sendTwilioSms(phone, code);
        break;
      default:
        console.warn(`未知的短信服务商: ${smsConfig.provider}`);
        break;
    }
  } catch (error) {
    console.error('短信发送过程发生异常:', error);
  }

  // 如果真实发送失败，且允许 Mock，则降级
  if (!success && smsConfig.allowMock) {
    console.log(`[降级模式] 真实短信发送失败，转为 Mock 模式。验证码: ${code}`);
    return true;
  }

  return success;
}

/**
 * 发送阿里云短信
 */
async function sendAliyunSms(phone, code) {
  try {
    if (!smsConfig.aliyun.accessKeyId || !smsConfig.aliyun.accessKeySecret) {
      console.warn('[阿里云] 未配置 AccessKey，跳过真实发送');
      return false;
    }

    // 动态导入 SDK
    const Dysmsapi20170525 = (await import('@alicloud/dysmsapi20170525')).default;
    const OpenApi = (await import('@alicloud/openapi-client')).default;
    const $OpenApi = await import('@alicloud/openapi-client');

    const config = new $OpenApi.Config({
      accessKeyId: smsConfig.aliyun.accessKeyId,
      accessKeySecret: smsConfig.aliyun.accessKeySecret,
    });
    config.endpoint = smsConfig.aliyun.endpoint;
    
    const client = new Dysmsapi20170525(config);
    
    // 构建请求
    // 注意：templateParam 必须是 JSON 字符串
    const sendSmsRequest = new Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: smsConfig.aliyun.signName,
      templateCode: smsConfig.aliyun.templateCode,
      templateParam: JSON.stringify({ code: code }), // 默认模板参数为 code
    });

    const resp = await client.sendSms(sendSmsRequest);
    
    if (resp.body.code === 'OK') {
      console.log(`[阿里云] 短信发送成功，BizId: ${resp.body.bizId}`);
      return true;
    } else {
      console.error(`[阿里云] 发送失败: ${resp.body.code} - ${resp.body.message}`);
      return false;
    }
  } catch (error) {
    console.error('[阿里云] SDK 调用异常:', error);
    return false;
  }
}

/**
 * 发送腾讯云短信
 */
async function sendTencentSms(phone, code) {
  try {
    if (!smsConfig.tencent.secretId || !smsConfig.tencent.secretKey) {
      console.warn('[腾讯云] 未配置 SecretId/Key，跳过真实发送');
      return false;
    }

    // 动态导入 SDK
    const tencentcloud = (await import('tencentcloud-sdk-nodejs-sms')).default;
    const SmsClient = tencentcloud.sms.v20210111.Client;

    const client = new SmsClient({
      credential: {
        secretId: smsConfig.tencent.secretId,
        secretKey: smsConfig.tencent.secretKey,
      },
      region: smsConfig.tencent.region,
      profile: {
        signMethod: "HmacSHA256",
        httpProfile: {
          reqMethod: "POST",
          reqTimeout: 30,
        },
      },
    });

    // 格式化手机号，腾讯云需要带 +86
    const formattedPhone = phone.startsWith('+') ? phone : `+86${phone}`;

    const params = {
      SmsSdkAppId: smsConfig.tencent.sdkAppId,
      SignName: smsConfig.tencent.signName,
      TemplateId: smsConfig.tencent.templateId,
      TemplateParamSet: [code], // 假设模板只有一个参数 {1}
      PhoneNumberSet: [formattedPhone],
    };

    const result = await client.SendSms(params);
    const status = result.SendStatusSet[0];
    
    if (status.Code === 'Ok') {
      console.log(`[腾讯云] 短信发送成功，SerialNo: ${status.SerialNo}`);
      return true;
    } else {
      console.error(`[腾讯云] 发送失败: ${status.Code} - ${status.Message}`);
      return false;
    }
  } catch (error) {
    console.error('[腾讯云] SDK 调用异常:', error);
    return false;
  }
}

/**
 * 发送 Twilio 短信
 */
async function sendTwilioSms(phone, code) {
  try {
    if (!smsConfig.twilio.accountSid || !smsConfig.twilio.authToken) {
      console.warn('[Twilio] 未配置 AccountSID/AuthToken，跳过真实发送');
      return false;
    }

    const twilio = (await import('twilio')).default;
    const client = twilio(smsConfig.twilio.accountSid, smsConfig.twilio.authToken);
    
    const messageOptions = {
      body: `您的验证码是 ${code}，有效期5分钟`,
      to: phone
    };

    // 优先使用 Messaging Service
    if (smsConfig.twilio.messagingServiceSid) {
      messageOptions.messagingServiceSid = smsConfig.twilio.messagingServiceSid;
    } else if (smsConfig.twilio.from) {
      messageOptions.from = smsConfig.twilio.from;
    } else {
      console.warn('[Twilio] 未配置 From 号码或 MessagingServiceSid');
      return false;
    }
    
    const message = await client.messages.create(messageOptions);
    console.log(`[Twilio] 短信发送成功: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('[Twilio] 发送失败:', error.message);
    if (error.code === 21608) {
      console.error('提示: 这是一个已验证号码限制错误。请升级 Twilio 账号或在控制台验证该号码。');
    }
    return false;
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
  if (storedCode !== inputCode) {
    return false;
  }
  
  if (!expiresAt) {
    return false;
  }
  
  const now = Date.now();
  let actualExpiresAt;
  
  if (typeof expiresAt === 'string') {
    actualExpiresAt = new Date(expiresAt).getTime();
  } else {
    const isSeconds = expiresAt < 1e12;
    actualExpiresAt = isSeconds ? expiresAt * 1000 : expiresAt;
  }
  
  if (now > actualExpiresAt) {
    return false;
  }
  
  return true;
}
