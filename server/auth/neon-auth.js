// Auth 配置
import { getDB } from '../database.mjs';

// 认证配置
export const authConfig = {
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  // 认证提供者
  providers: {
    // 邮箱密码认证
    email: {
      enabled: true,
      // 邮箱验证配置
      verification: {
        enabled: true,
        sendVerificationEmail: async (email, verificationToken) => {
          // 这里可以集成邮件发送服务
          console.log(`发送验证邮件到 ${email}，验证token: ${verificationToken}`);
        }
      }
    },
    // 可以添加其他认证提供者，如Google、GitHub等
    // google: {
    //   enabled: true,
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET
    // }
  }
};

// 用户相关操作
export const userActions = {
  // 创建用户
  async createUser(userData) {
    const { email, password, name } = userData;
    
    try {
      const db = await getDB();
      const { rows } = await db.query(
        `INSERT INTO users (email, password_hash, username, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, email, username`,
        [email, password, name || email.split('@')[0]]
      );
      
      return rows[0];
    } catch (error) {
      throw new Error(`创建用户失败: ${error.message}`);
    }
  },
  
  // 根据邮箱查找用户
  async findUserByEmail(email) {
    try {
      const db = await getDB();
      const { rows } = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`查找用户失败: ${error.message}`);
    }
  },
  
  // 根据ID查找用户
  async findUserById(id) {
    try {
      const db = await getDB();
      const { rows } = await db.query(
        'SELECT id, email, username, avatar_url, created_at FROM users WHERE id = $1',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`查找用户失败: ${error.message}`);
    }
  }
};

// 认证相关操作
export const authActions = {
  // 用户注册
  async register(userData) {
    const { email, password, name } = userData;
    
    // 检查用户是否已存在
    const existingUser = await userActions.findUserByEmail(email);
    if (existingUser) {
      throw new Error('用户已存在');
    }
    
    // 创建用户
    const user = await userActions.createUser({
      email,
      password,
      name
    });
    
    return user;
  },
  
  // 用户登录
  async login(credentials) {
    const { email, password } = credentials;
    
    // 查找用户
    const user = await userActions.findUserByEmail(email);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 验证密码（这里简化处理，实际应该比较密码哈希）
    // TODO: 实现密码验证逻辑
    
    return user;
  },
  
  // 用户登出
  async logout(token) {
    return await sessionActions.deleteSession(token);
  },
  
  // 验证token
  async verifyToken(token) {
    return await sessionActions.validateSession(token);
  }
};

// 会话相关操作
export const sessionActions = {
  // 创建会话
  async createSession(userId, token) {
    try {
      const db = await getDB();
      const { rows } = await db.query(
        `INSERT INTO user_sessions (user_id, token, created_at, expires_at)
         VALUES ($1, $2, NOW(), NOW() + INTERVAL '7 days')
         RETURNING *`,
        [userId, token]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`创建会话失败: ${error.message}`);
    }
  },
  
  // 验证会话
  async validateSession(token) {
    try {
      const db = await getDB();
      const { rows } = await db.query(
        `SELECT s.*, u.email, u.username 
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`验证会话失败: ${error.message}`);
    }
  },
  
  // 删除会话
  async deleteSession(token) {
    try {
      const db = await getDB();
      await db.query('DELETE FROM user_sessions WHERE token = $1', [token]);
      return true;
    } catch (error) {
      throw new Error(`删除会话失败: ${error.message}`);
    }
  }
};
