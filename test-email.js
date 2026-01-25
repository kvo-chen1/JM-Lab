// 测试邮件发送功能
import { sendLoginEmailCode } from './server/emailService.mjs';

async function testEmail() {
  try {
    console.log('开始测试邮件发送...');
    const email = '15959355938@qq.com';
    const code = '123456';
    
    console.log('发送验证码到:', email);
    console.log('验证码:', code);
    
    const success = await sendLoginEmailCode(email, code);
    
    console.log('邮件发送结果:', success ? '成功' : '失败');
    
    if (success) {
      console.log('测试成功！请检查邮箱是否收到验证码邮件。');
    } else {
      console.log('测试失败！请检查邮件服务配置。');
    }
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

testEmail();