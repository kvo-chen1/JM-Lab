/**
 * 腾讯云 COS 存储服务
 * 用于替代本地存储，支持图片上传到腾讯云对象存储
 */

import COS from 'cos-nodejs-sdk-v5';
import { randomUUID } from 'crypto';
import path from 'path';

// 延迟获取配置（确保环境变量已加载）
function getConfig() {
  return {
    secretId: process.env.COS_SECRET_ID,
    secretKey: process.env.COS_SECRET_KEY,
    bucket: process.env.COS_BUCKET,
    region: process.env.COS_REGION,
    domain: process.env.COS_DOMAIN,
  };
}

// 延迟初始化 COS 客户端
let cosClient = null;
function getCosClient() {
  if (!cosClient) {
    const config = getConfig();
    cosClient = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
    });
  }
  return cosClient;
}

// 允许的文件类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * 上传文件到 COS
 * @param {Buffer} fileBuffer 文件缓冲区
 * @param {string} originalName 原始文件名
 * @param {string} mimeType 文件类型
 * @param {string} folder 目标文件夹
 * @returns {Promise<{url: string, key: string}>}
 */
export async function uploadToCOS(fileBuffer, originalName, mimeType, folder = 'uploads') {
  const config = getConfig();
  
  // 验证文件类型
  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);
  
  if (!isImage && !isVideo) {
    throw new Error(`不支持的文件类型: ${mimeType}`);
  }

  // 验证文件大小
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // 生成文件名
  const ext = path.extname(originalName) || (isImage ? '.jpg' : '.mp4');
  const timestamp = Date.now();
  const random = randomUUID().slice(0, 8);
  const filename = `${timestamp}-${random}${ext}`;
  const key = `${folder}/${filename}`;

  try {
    // 上传文件到 COS
    const result = await getCosClient().putObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // 设置文件为公开可读
      ACL: 'public-read',
    });

    console.log('[COS] 上传成功:', result.Location || `${config.domain}/${key}`);

    // 返回文件 URL
    const url = result.Location || `${config.domain}/${key}`;
    
    return {
      url,
      key,
      size: fileBuffer.length,
      mimeType,
    };
  } catch (error) {
    console.error('[COS] 上传失败:', error.message);
    throw new Error('文件上传失败: ' + error.message);
  }
}

/**
 * 从 COS 删除文件
 * @param {string} key 文件 key
 * @returns {Promise<boolean>}
 */
export async function deleteFromCOS(key) {
  const config = getConfig();
  
  try {
    await getCosClient().deleteObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
    });

    console.log('[COS] 删除成功:', key);
    return true;
  } catch (error) {
    console.error('[COS] 删除失败:', error.message);
    return false;
  }
}

/**
 * 从 URL 中提取 COS key
 * @param {string} url 文件 URL
 * @returns {string|null}
 */
export function extractKeyFromUrl(url) {
  const config = getConfig();
  
  if (!url || !url.includes(config.domain)) {
    return null;
  }
  
  // 提取 key 部分
  const urlObj = new URL(url);
  return urlObj.pathname.slice(1); // 去掉开头的 /
}

/**
 * 获取文件的公开 URL
 * @param {string} key 文件 key
 * @returns {string}
 */
export function getPublicUrl(key) {
  const config = getConfig();
  
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  return `${config.domain}/${key}`;
}

/**
 * 检查 COS 配置是否完整
 * @returns {boolean}
 */
export function isCOSConfigured() {
  const config = getConfig();
  return !!(config.secretId && config.secretKey && config.bucket && config.region);
}

// 默认导出
export default {
  uploadToCOS,
  deleteFromCOS,
  extractKeyFromUrl,
  getPublicUrl,
  isCOSConfigured,
};
