
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
});

const config = {
  host: env.EMAIL_HOST,
  port: parseInt(env.EMAIL_PORT),
  secure: env.EMAIL_SECURE === 'true',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS
  }
};

console.log('--- Email Configuration ---');
console.log(`Host: ${config.host}`);
console.log(`Port: ${config.port}`);
console.log(`User: ${config.auth.user}`);
console.log(`Secure: ${config.secure}`);
console.log('---------------------------');

async function sendTestEmail() {
  const transporter = nodemailer.createTransport(config);

  try {
    console.log('⏳ Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection established successfully!');

    console.log(`⏳ Sending test email to ${env.EMAIL_USER}...`);
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: env.EMAIL_USER, // Send to self
      subject: 'AI共创平台 - 邮件服务配置测试',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4CAF50;">邮件服务配置成功！</h2>
          <p>您收到这封邮件，说明您的 SMTP 服务配置已正确生效。</p>
          <p><strong>发送时间:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log(`🆔 Message ID: ${info.messageId}`);
    console.log('🎉 You should receive the email shortly.');

  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error(error);
  }
}

sendTestEmail();
