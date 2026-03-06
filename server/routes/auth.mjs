// 认证API路由 - 原生Node.js HTTP版本
import { userActions, authActions } from '../auth/neon-auth.js';

// 读取请求体
async function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    
    // 检查是否是Node.js的HTTP请求对象
    if (req.on && typeof req.on === 'function') {
      // 检查是否已经有请求体数据
      if (req.body) {
        // 如果已经有解析好的请求体，直接返回
        resolve(typeof req.body === 'object' ? req.body : {});
        return;
      }
      
      // 正常处理流数据
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          if (!data) {
            resolve({});
            return;
          }
          const parsedBody = JSON.parse(data);
          resolve(parsedBody);
        } catch (error) {
          console.error('Error parsing request body:', error);
          console.error('Request body:', data);
          resolve({});
        }
      });
      req.on('error', (error) => {
        console.error('Error reading request body:', error);
        resolve({});
      });
    } else if (req.body) {
      // 对于Vercel Serverless Function或其他已解析请求体的环境
      resolve(typeof req.body === 'object' ? req.body : {});
    } else {
      resolve({});
    }
  });
}

// 发送JSON响应
function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

async function handleRegister(req, res) {
  try {
    const body = await readBody(req);
    const { email, password, name } = body;
    
    if (!email || !password) {
      return sendJson(res, 400, { error: '邮箱和密码是必填项' });
    }
    
    // 检查用户是否已存在
    const existingUser = await userActions.findUserByEmail(email);
    if (existingUser) {
      return sendJson(res, 400, { error: '该邮箱已被注册' });
    }
    
    // 创建新用户
    const newUser = await userActions.createUser({ email, password, name });
    
    // 生成JWT令牌
    const token = await authActions.generateToken(newUser.id);
    
    sendJson(res, 201, {
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
    sendJson(res, 500, { error: '注册失败，请稍后重试' });
  }
}

async function handleLogin(req, res) {
  try {
    const body = await readBody(req);
    const { email, password } = body;
    
    if (!email || !password) {
      return sendJson(res, 400, { error: '邮箱和密码是必填项' });
    }
    
    // 查找用户
    const user = await userActions.findUserByEmail(email);
    if (!user) {
      return sendJson(res, 401, { error: '邮箱或密码错误' });
    }
    
    // 验证密码
    const isPasswordValid = await authActions.verifyPassword(user.password_hash, password);
    if (!isPasswordValid) {
      return sendJson(res, 401, { error: '邮箱或密码错误' });
    }
    
    // 生成JWT令牌
    const token = await authActions.generateToken(user.id);
    
    sendJson(res, 200, {
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
    sendJson(res, 500, { error: '登录失败，请稍后重试' });
  }
}

async function handleVerify(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return sendJson(res, 401, { error: '缺少认证令牌' });
    }
    
    // 验证令牌
    const decoded = await authActions.verifyToken(token);
    if (!decoded) {
      return sendJson(res, 401, { error: '无效的认证令牌' });
    }
    
    // 查找用户
    const user = await userActions.findUserById(decoded.userId);
    if (!user) {
      return sendJson(res, 401, { error: '用户不存在' });
    }
    
    sendJson(res, 200, {
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
    sendJson(res, 500, { error: '验证失败，请稍后重试' });
  }
}

function handleLogout(req, res) {
  // 客户端应该删除本地存储的令牌
  sendJson(res, 200, { success: true, message: '登出成功' });
}

async function authRoutes(req, res, path) {
  // 注册路由
  if (req.method === 'POST' && path === '/api/auth/register') {
    await handleRegister(req, res);
    return;
  }
  
  // 登录路由
  if (req.method === 'POST' && path === '/api/auth/login') {
    await handleLogin(req, res);
    return;
  }
  
  // 验证令牌路由
  if (req.method === 'GET' && path === '/api/auth/verify') {
    await handleVerify(req, res);
    return;
  }
  
  // 登出路由
  if (req.method === 'POST' && path === '/api/auth/logout') {
    handleLogout(req, res);
    return;
  }
}

export default authRoutes;