// Neon Auth 配置
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
      console.error('创建用户失败:', error);
      throw error;
    }
  },
  
  // 通过邮箱查找用户
  async findUserByEmail(email) {
    try {
      const db = await getDB();
      const { rows } = await db.query(
        `SELECT id, email, password_hash, username
         FROM users
         WHERE email = $1`,
        [email]
      );
      
      return rows[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  },
  
  // 更新用户信息
  async updateUser(id, updates) {
    try {
      const db = await getDB();
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      
      const { rows } = await db.query(
        `UPDATE users
         SET ${setClause}
         WHERE id = $${fields.length + 1}
         RETURNING id, email, username`,
        [...values, id]
      );
      
      return rows[0] || null;
    } catch (error) {
      console.error('更新用户失败:', error);
      return null;
    }
  },
  
  // 通过ID查找用户
  async findUserById(id) {
    try {
      const db = await getDB();
      const { rows } = await db.query(
        `SELECT id, email, password_hash, username
         FROM users
         WHERE id = $1`,
        [id]
      );
      
      return rows[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      return null;
    }
  }
};

// 认证相关操作
export const authActions = {
  // 验证密码
  async verifyPassword(storedHash, password) {
    // 这里应该使用密码哈希验证
    // 暂时简化处理，实际应该使用bcrypt等库
    return storedHash === password;
  },
  
  // 生成JWT令牌
  generateToken(userId) {
    const jwt = import('jsonwebtoken');
    return jwt.then(jwtModule => {
      return jwtModule.default.sign({ userId }, authConfig.jwt.secret, {
        expiresIn: authConfig.jwt.expiresIn
      });
    });
  },
  
  // 验证JWT令牌
  verifyToken(token) {
    const jwt = import('jsonwebtoken');
    return jwt.then(jwtModule => {
      try {
        return jwtModule.default.verify(token, authConfig.jwt.secret);
      } catch (error) {
        return null;
      }
    });
  }
};

export default {
  config: authConfig,
  user: userActions,
  auth: authActions
};
