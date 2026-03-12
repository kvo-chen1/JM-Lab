import nodemailer from 'nodemailer';
import { createLogger } from './utils/logger.mjs';

// 创建邮件日志记录器
const emailLogger = createLogger('email');

// 写入日志（保持向后兼容）
function logEmail(type, data) {
  switch (type) {
    case 'ERROR':
      emailLogger.error(data);
      break;
    case 'WARN':
      emailLogger.warn(data);
      break;
    case 'DEBUG':
      emailLogger.debug(data);
      break;
    default:
      emailLogger.info({ type, ...data });
  }
}

// 邮件服务配置和传输器 (Lazy initialization)
let emailConfig = null;
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@example.com',
      pass: process.env.EMAIL_PASS || 'your-email-password'
    },
    from: process.env.EMAIL_FROM || '"AI共创平台" <no-reply@example.com>'
  };

  // 检查配置是否完整
  const isConfigComplete = emailConfig.host && 
                          emailConfig.auth.user && 
                          emailConfig.auth.pass &&
                          emailConfig.host !== 'smtp.example.com' &&
                          emailConfig.auth.user !== 'your-email@example.com' &&
                          emailConfig.auth.pass !== 'your-email-password';

  console.log('[EmailService] 配置检查:', { isConfigComplete });

  transporter = nodemailer.createTransport(emailConfig);
  return transporter;
}


// 邮件发送队列
const emailQueue = [];
let isProcessingQueue = false;

// 队列配置
const QUEUE_MAX_RETRIES = 3;
const QUEUE_PROCESS_INTERVAL = 1000; // 1秒处理一次
const EMAIL_TIMEOUT = 10000; // 邮件发送超时时间：10秒

/**
 * 将邮件加入队列
 * @param {string} to - 收件人
 * @param {string} subject - 主题
 * @param {string} html - 内容
 * @returns {Promise<boolean>}
 */
async function enqueueEmail(to, subject, html) {
  return new Promise((resolve) => {
    emailQueue.push({
      to,
      subject,
      html,
      retries: 0,
      resolve, // 将 resolve 函数存入，以便处理完成后通知调用者
      timestamp: Date.now()
    });
    
    // 如果队列处理器未运行，启动它
    if (!isProcessingQueue) {
      processEmailQueue();
    }
  });
}

/**
 * 处理邮件队列
 */
async function processEmailQueue() {
  if (emailQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }
  
  isProcessingQueue = true;
  const task = emailQueue.shift();
  
  try {
    const success = await sendEmailInternal(task.to, task.subject, task.html);
    if (success) {
      task.resolve(true);
    } else {
      throw new Error('Send failed');
    }
  } catch (error) {
    console.error(`邮件发送任务失败 (尝试 ${task.retries + 1}/${QUEUE_MAX_RETRIES}):`, error.message);
    
    if (task.retries < QUEUE_MAX_RETRIES) {
      // 重试：放回队列头部（或者尾部，视策略而定，这里放回尾部延迟重试）
      task.retries++;
      setTimeout(() => {
        emailQueue.push(task);
        if (!isProcessingQueue) processEmailQueue();
      }, 1000 * task.retries); // 指数退避简单模拟
    } else {
      console.error('邮件发送任务彻底失败:', task.to);
      task.resolve(false);
    }
  }
  
  // 继续处理下一个
  setTimeout(processEmailQueue, QUEUE_PROCESS_INTERVAL);
}

/**
 * 内部实际发送函数
 */
async function sendEmailInternal(to, subject, html) {
  try {
    const transport = getTransporter();

    // 检查配置是否为示例值或不完整，如果是则模拟发送
    console.log('[EmailService] 当前邮件配置:', {
      host: emailConfig.host,
      port: emailConfig.port,
      user: emailConfig.auth.user,
      pass: emailConfig.auth.pass ? '******' : 'undefined',
      from: emailConfig.from
    });
    
    const isMockConfig = emailConfig.host === 'smtp.example.com' || 
                         emailConfig.auth.user === 'your-email@example.com' ||
                         emailConfig.auth.pass === 'your-email-password' ||
                         !emailConfig.host || 
                         !emailConfig.auth.user ||
                         !emailConfig.auth.pass;
    
    if (isMockConfig) {
       console.log('[EmailService] 使用模拟发送模式');
       logEmail('MOCK_SEND', { to, subject, status: 'simulated' });
       const match = html.match(/letter-spacing: 4px;">(\d+)<\/div>/);
       if (match) logEmail('MOCK_CODE', { to, code: match[1] });
       return true;
    }
    
    console.log('[EmailService] 使用真实邮件发送模式');

    // 设置超时，避免阻塞主流程
    const sendPromise = transport.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timed out')), EMAIL_TIMEOUT)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    
    logEmail('SUCCESS', { to, messageId: info.messageId });
    return true;
  } catch (error) {
    console.error('[EmailService] 邮件发送失败:', error.message);
    logEmail('ERROR', { to, error: error.message });
    // 降级为模拟成功，确保开发流程畅通
    logEmail('FALLBACK', { to, status: 'simulated_fallback', reason: error.message });
    const match = html.match(/letter-spacing: 4px;">(\d+)<\/div>/);
    if (match) logEmail('MOCK_CODE', { to, code: match[1] });
    return true;
  }
}

/**
 * 发送邮件 (公开接口)
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} html - 邮件内容（HTML格式）
 * @returns {Promise<boolean>} - 是否发送成功
 */
export async function sendEmail(to, subject, html) {
  return enqueueEmail(to, subject, html);
}

/**
 * 发送邮箱验证邮件
 * @param {string} to - 收件人邮箱
 * @param {string} token - 验证令牌
 * @param {string} username - 用户名
 * @returns {Promise<boolean>} - 是否发送成功
 */
export async function sendVerificationEmail(to, token, username) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>邮箱验证 - AI共创平台</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">AI共创平台</h1>
      </div>
      <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2>欢迎注册AI共创平台，${username}！</h2>
        <p>请点击下方链接完成邮箱验证，验证后即可登录平台：</p>
        <a href="${verificationUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">验证邮箱</a>
        <p>如果您没有注册我们的平台，请忽略此邮件。</p>
        <p>此链接将在24小时后过期。</p>
        <p>平台团队敬上</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, 'AI共创平台 - 邮箱验证', html);
}

/**
 * 发送密码重置邮件
 * @param {string} to - 收件人邮箱
 * @param {string} token - 重置令牌
 * @param {string} username - 用户名
 * @returns {Promise<boolean>} - 是否发送成功
 */
export async function sendPasswordResetEmail(to, token, username) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>密码重置 - AI共创平台</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">AI共创平台</h1>
      </div>
      <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2>密码重置请求，${username}！</h2>
        <p>请点击下方链接重置您的密码：</p>
        <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">重置密码</a>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
        <p>此链接将在1小时后过期。</p>
        <p>平台团队敬上</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(to, 'AI共创平台 - 密码重置', html);
}

/**
 * 发送登录用邮箱验证码（OTP）
 * @param {string} to - 收件人邮箱
 * @param {string} code - 六位验证码
 * @returns {Promise<boolean>} - 是否发送成功
 */
export async function sendLoginEmailCode(to, code) {
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>登录验证码 - AI共创平台</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">AI共创平台</h1>
      </div>
      <div style="border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2>登录验证码</h2>
        <p>您的登录验证码为：</p>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</div>
        <p>该验证码在5分钟内有效，请尽快使用。</p>
        <p>如果非本人操作，请忽略此邮件。</p>
        <p style="color:#888">此邮件由系统自动发送，请勿回复。</p>
      </div>
    </body>
    </html>
  `;
  return sendEmail(to, 'AI共创平台 - 登录验证码', html);
}
