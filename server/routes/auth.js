// 认证API路由
import express from 'express';
import { userActions, authActions } from '../auth/neon-auth.js';

const router = express.Router();

// 注册路由
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码是必填项' });
    }
    
    // 检查用户是否已存在
    const existingUser = await userActions.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }
    
    // 创建新用户
    const newUser = await userActions.createUser({ email, password, name });
    
    // 生成JWT令牌
    const token = authActions.generateToken(newUser.id);
    
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      },
      token
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码是必填项' });
    }
    
    // 查找用户
    const user = await userActions.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 验证密码
    const isPasswordValid = await authActions.verifyPassword(user.password_hash, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 生成JWT令牌
    const token = authActions.generateToken(user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        email_verified: user.email_verified
      },
      token
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 验证令牌路由
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '缺少认证令牌' });
    }
    
    // 验证令牌
    const decoded = authActions.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }
    
    // 查找用户
    const user = await userActions.findUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({ error: '验证失败，请稍后重试' });
  }
});

// 登出路由
router.post('/logout', (req, res) => {
  // 客户端应该删除本地存储的令牌
  res.status(200).json({ success: true, message: '登出成功' });
});

export default router;
