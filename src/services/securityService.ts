/**
 * 安全服务模块 - 提供数据加密、防作弊和安全验证功能
 */

// 数据加密类型
export interface EncryptedData {
  data: string;
  timestamp: number;
  signature: string;
  iv?: string;
}

// 安全服务类
class SecurityService {
  private readonly ENCRYPTION_KEY = this.getEncryptionKey(); // 加密密钥（生产环境应使用环境变量）
  private readonly SALT = 'f3s6v9yB2e5h8k0n3q6t9w2z5C8r1V4x7'; // 盐值
  private readonly MAX_CACHE_AGE = 3600000; // 缓存最大年龄（1小时）
  private cryptoKey: CryptoKey | null = null;

  constructor() {
    // 只有在浏览器环境中才初始化加密密钥
    if (typeof window !== 'undefined') {
      this.initializeCryptoKey();
    }
  }

  /**
   * 获取加密密钥，兼容Node.js和浏览器环境
   */
  private getEncryptionKey(): string {
    try {
      // 尝试获取环境变量
      let envKey: string | undefined;
      
      // 检查Node.js环境
      if (typeof process !== 'undefined' && process.env) {
        envKey = process.env.VITE_ENCRYPTION_KEY;
      }
      
      // 检查浏览器环境中的全局变量（如果Vite注入了环境变量）
      else if (typeof window !== 'undefined') {
        const windowWithEnv = window as any;
        envKey = windowWithEnv.VITE_ENCRYPTION_KEY || 
                windowWithEnv.__VITE_ENCRYPTION_KEY__ ||
                (windowWithEnv.import && windowWithEnv.import.meta?.env?.VITE_ENCRYPTION_KEY);
      }
      
      return envKey || 'j9kL2pQ5rT8wZ1cV4xY7mU3tR6nH9bE2';
    } catch (e) {
      // 忽略错误，使用默认密钥
      return 'j9kL2pQ5rT8wZ1cV4xY7mU3tR6nH9bE2';
    }
  }

  /**
   * 初始化加密密钥
   */
  private async initializeCryptoKey(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        this.cryptoKey = await window.crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256,
          },
          true,
          ['encrypt', 'decrypt']
        );
      }
    } catch (error) {
      console.warn('Failed to initialize Web Crypto API, falling back to XOR encryption');
    }
  }

  /**
   * 使用Web Crypto API进行加密（如果可用）
   */
  private async encryptWithWebCrypto(data: string): Promise<{ encrypted: string; iv: string }> {
    if (!this.cryptoKey) {
      throw new Error('Crypto key not initialized');
    }

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.cryptoKey,
      encodedData
    );

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  /**
   * 使用Web Crypto API进行解密（如果可用）
   */
  private async decryptWithWebCrypto(encryptedData: string, iv: string): Promise<string> {
    if (!this.cryptoKey) {
      throw new Error('Crypto key not initialized');
    }

    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivArray,
      },
      this.cryptoKey,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * 加密数据（优先使用Web Crypto API，回退到XOR加密）
   */
  async encrypt(data: any): Promise<EncryptedData> {
    const jsonData = JSON.stringify(data);
    const timestamp = Date.now();
    
    try {
      if (this.cryptoKey) {
        const { encrypted, iv } = await this.encryptWithWebCrypto(jsonData);
        const signature = this.generateSignature(encrypted, timestamp);
        return {
          data: encrypted,
          timestamp,
          signature,
          iv
        };
      }
    } catch (error) {
      console.warn('Web Crypto encryption failed, falling back to XOR encryption');
    }
    
    let encrypted = '';
    for (let i = 0; i < jsonData.length; i++) {
      const charCode = jsonData.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    const base64Data = btoa(encrypted);
    const signature = this.generateSignature(base64Data, timestamp);
    
    return {
      data: base64Data,
      timestamp,
      signature
    };
  }

  /**
   * 解密数据（支持Web Crypto API和XOR加密）
   */
  async decrypt(encryptedData: EncryptedData): Promise<any> {
    const { data, timestamp, signature, iv } = encryptedData;
    
    if (!this.verifySignature(data, timestamp, signature)) {
      throw new Error('数据已被篡改');
    }
    
    if (Date.now() - timestamp > this.MAX_CACHE_AGE) {
      throw new Error('数据已过期');
    }
    
    try {
      if (this.cryptoKey && iv) {
        const decrypted = await this.decryptWithWebCrypto(data, iv);
        return JSON.parse(decrypted);
      }
    } catch (error) {
      console.warn('Web Crypto decryption failed, falling back to XOR decryption');
    }
    
    const encrypted = atob(data);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    
    return JSON.parse(decrypted);
  }

  /**
   * 生成数据签名
   */
  generateSignature(data: string, timestamp: number): string {
    const signatureData = `${data}${timestamp}${this.SALT}`;
    return this.hash(signatureData);
  }

  /**
   * 验证数据签名
   */
  private verifySignature(data: string, timestamp: number, signature: string): boolean {
    const expectedSignature = this.generateSignature(data, timestamp);
    return expectedSignature === signature;
  }

  /**
   * 简单的哈希算法
   */
  private hash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 验证数据完整性
   */
  verifyDataIntegrity(data: any, expectedType: string): boolean {
    if (typeof data !== expectedType) {
      return false;
    }
    
    // 添加更多数据完整性验证逻辑
    return true;
  }

  /**
   * 检测作弊行为
   */
  detectCheating(userId: string): boolean {
    // 检查本地存储数据是否被篡改
    try {
      // 只在浏览器环境中检测
      if (typeof localStorage !== 'undefined') {
        // 验证积分记录
        const pointsRecords = localStorage.getItem('POINTS_RECORDS');
        if (pointsRecords) {
          const parsedRecords = JSON.parse(pointsRecords);
          if (!Array.isArray(parsedRecords)) {
            return true;
          }
          
          // 验证每条记录的完整性
          for (const record of parsedRecords) {
            if (!record.id || !record.source || !record.type || record.points === undefined) {
              return true;
            }
          }
        }
        
        // 验证任务记录
        const tasks = localStorage.getItem('CREATIVE_TASKS');
        if (tasks) {
          const parsedTasks = JSON.parse(tasks);
          if (!Array.isArray(parsedTasks)) {
            return true;
          }
        }
        
        // 验证签到记录
        const checkinRecords = localStorage.getItem('CHECKIN_RECORDS');
        if (checkinRecords) {
          const parsedCheckins = JSON.parse(checkinRecords);
          if (!Array.isArray(parsedCheckins)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Cheating detection error:', error);
      return true; // 解析错误也视为作弊
    }
  }

  /**
   * 获取安全的本地存储项
   */
  async getSecureItem(key: string): Promise<any | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (stored) {
          const encryptedData: EncryptedData = JSON.parse(stored);
          return await this.decrypt(encryptedData);
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get secure item:', error);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return null;
    }
  }

  /**
   * 设置安全的本地存储项
   */
  async setSecureItem(key: string, data: any): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        const encryptedData = await this.encrypt(data);
        localStorage.setItem(key, JSON.stringify(encryptedData));
      }
    } catch (error) {
      console.error('Failed to set secure item:', error);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    
    // 只在浏览器环境中清理
    if (typeof localStorage !== 'undefined') {
      // 清理所有安全存储项
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('SECURE_') || key.includes('_SECURE'))) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const encryptedData: EncryptedData = JSON.parse(stored);
              if (now - encryptedData.timestamp > this.MAX_CACHE_AGE) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            localStorage.removeItem(key); // 删除损坏的数据
          }
        }
      }
    }
  }

  /**
   * 生成唯一标识符
   */
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 验证UUID格式
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// 导出单例实例
const service = new SecurityService();
export default service;
