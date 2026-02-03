/**
 * 安全工具类 - 提供HMAC签名与数据完整性校验
 * Security Utilities - HMAC Signing & Data Integrity
 */

// 将字符串转换为Uint8Array
const encoder = new TextEncoder();

/**
 * 生成HMAC-SHA256签名
 * Generate HMAC-SHA256 signature
 * 
 * @param data 需要签名的数据对象 (Data object to sign)
 * @param secretKey 密钥 (Secret key)
 * @returns 签名十六进制字符串 (Signature hex string)
 */
export async function generateHMACSignature(data: Record<string, any>, secretKey: string): Promise<string> {
  // 1. 按键名排序并转换为JSON字符串，确保数据一致性
  // Sort keys and stringify to ensure consistency
  const sortedKeys = Object.keys(data).sort();
  const canonicalData = sortedKeys.map(key => `${key}=${JSON.stringify(data[key])}`).join('&');
  
  // 2. 导入密钥
  // Import key
  const keyData = encoder.encode(secretKey);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 3. 签名
  // Sign data
  const dataToSign = encoder.encode(canonicalData);
  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    dataToSign
  );

  // 4. 转换为十六进制字符串
  // Convert to hex string
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return signatureHex;
}

/**
 * 为请求添加安全头
 * Add security headers to request
 * 
 * @param payload 请求载荷 (Request payload)
 * @param secret 密钥 (Secret)
 * @returns 包含签名和时间戳的请求对象 (Request object with signature and timestamp)
 */
export async function signRequest<T extends Record<string, any>>(payload: T, secret: string = 'default-client-secret') {
  const timestamp = Date.now();
  // 添加时间戳防止重放攻击 (Add timestamp to prevent replay attacks)
  const dataToSign = { ...payload, _ts: timestamp };
  
  const signature = await generateHMACSignature(dataToSign, secret);
  
  return {
    ...dataToSign,
    _sig: signature
  };
}

/**
 * 验证签名 (用于模拟后端验证或P2P场景)
 * Verify signature (For mocking backend verification or P2P)
 */
export async function verifySignature(data: Record<string, any>, secret: string): Promise<boolean> {
  const { _sig, ...payload } = data;
  if (!_sig) return false;
  
  const expectedSignature = await generateHMACSignature(payload, secret);
  return _sig === expectedSignature;
}
