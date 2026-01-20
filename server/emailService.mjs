import nodemailer from 'nodemailer';

// 邮件服务配置
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@example.com',
    pass: process.env.EMAIL_PASS || 'your-email-password'
  },
  from: process.env.EMAIL_FROM || '"AI共创平台" <no-reply@example.com>'
};

// 创建邮件传输器
const transporter = nodemailer.createTransport(emailConfig);

/**
 * 发送邮件
 * @param {string} to - 收件人邮箱
 * @param {string} subject - 邮件主题
 * @param {string} html - 邮件内容（HTML格式）
 * @returns {Promise<boolean>} - 是否发送成功
 */
export async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html
    });
    
    console.log('邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
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
