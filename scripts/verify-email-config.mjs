
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  console.log(`正在加载环境变量: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.error('未找到 .env 文件！');
  process.exit(1);
}

const config = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  from: process.env.EMAIL_FROM
};

console.log('----------------------------------------');
console.log('邮件配置检查:');
console.log(`Host: ${config.host}`);
console.log(`Port: ${config.port}`);
console.log(`Secure: ${config.secure}`);
console.log(`User: ${config.auth.user}`);
console.log(`From: ${config.from}`);
console.log('Pass: ****** (已隐藏)');
console.log('----------------------------------------');

if (!config.host || config.host.includes('example.com')) {
  console.error('错误: 请先在 .env 文件中配置真实的邮件服务信息！');
  console.log('提示: 目前检测到 host 为空或仍为默认的 example.com');
  process.exit(1);
}

const transporter = nodemailer.createTransport(config);

async function testSend() {
  try {
    console.log('正在尝试连接邮件服务器...');
    await transporter.verify();
    console.log('✅ 连接成功！SMTP 配置正确。');

    console.log('正在尝试发送测试邮件...');
    const info = await transporter.sendMail({
      from: config.from,
      to: config.auth.user, // 发给自己测试
      subject: 'AI共创平台 - 邮件服务配置测试',
      text: '恭喜！您的邮件服务配置已生效。这是由测试脚本发送的验证邮件。',
      html: '<h1>配置成功！</h1><p>您的邮件服务配置已生效。</p><p>这是由测试脚本发送的验证邮件。</p>'
    });

    console.log(`✅ 邮件发送成功！`);
    console.log(`Message ID: ${info.messageId}`);
    console.log(`请查收邮箱: ${config.auth.user}`);
    
  } catch (error) {
    console.error('❌ 发送失败！');
    console.error('错误详情:', error.message);
    if (error.response) {
      console.error('服务器响应:', error.response);
    }
    
    if (config.host.includes('qq.com')) {
      console.log('\n--- QQ邮箱常见问题提示 ---');
      console.log('1. 确保已开启 POP3/SMTP 服务 (设置 -> 账户)');
      console.log('2. 确保使用的是"授权码"而不是QQ密码');
      console.log('3. 端口通常为 465 (SSL)');
    }
  }
}

testSend();
