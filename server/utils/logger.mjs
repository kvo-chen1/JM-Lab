/**
 * 日志工具模块 - 支持日志轮转和分级
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志配置
const LOG_CONFIG = {
  dir: path.join(__dirname, '../../logs'),
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  }
};

// 确保日志目录存在
function ensureLogDir() {
  if (!fs.existsSync(LOG_CONFIG.dir)) {
    try {
      fs.mkdirSync(LOG_CONFIG.dir, { recursive: true });
    } catch (e) {
      console.error('无法创建日志目录:', e);
    }
  }
}

// 获取日志文件路径
function getLogFilePath(type) {
  return path.join(LOG_CONFIG.dir, `${type}.log`);
}

// 获取轮转日志文件路径
function getRotatedLogFilePath(type, index) {
  return path.join(LOG_CONFIG.dir, `${type}.log.${index}`);
}

// 检查并轮转日志
function rotateLogIfNeeded(type) {
  const logFile = getLogFilePath(type);
  
  try {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size >= LOG_CONFIG.maxSize) {
        // 轮转现有日志文件
        for (let i = LOG_CONFIG.maxFiles - 1; i > 0; i--) {
          const oldFile = getRotatedLogFilePath(type, i);
          const newFile = getRotatedLogFilePath(type, i + 1);
          if (fs.existsSync(oldFile)) {
            fs.renameSync(oldFile, newFile);
          }
        }
        
        // 移动当前日志文件
        fs.renameSync(logFile, getRotatedLogFilePath(type, 1));
      }
    }
  } catch (e) {
    console.error('日志轮转失败:', e);
  }
}

// 清理旧日志
function cleanupOldLogs(type) {
  try {
    for (let i = LOG_CONFIG.maxFiles + 1; i <= LOG_CONFIG.maxFiles + 10; i++) {
      const oldFile = getRotatedLogFilePath(type, i);
      if (fs.existsSync(oldFile)) {
        fs.unlinkSync(oldFile);
      }
    }
  } catch (e) {
    console.error('清理旧日志失败:', e);
  }
}

// 写入日志
function writeLog(level, type, data) {
  ensureLogDir();
  rotateLogIfNeeded(type);
  cleanupOldLogs(type);
  
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${JSON.stringify(data)}\n`;
  
  const logFile = getLogFilePath(type);
  
  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (e) {
    console.error('写入日志失败:', e);
  }
  
  // 同时输出到控制台
  if (level === 'ERROR') {
    console.error(logEntry.trim());
  } else if (level === 'WARN') {
    console.warn(logEntry.trim());
  } else {
    console.log(logEntry.trim());
  }
}

// 创建日志记录器
export function createLogger(type) {
  return {
    error: (data) => writeLog('ERROR', type, data),
    warn: (data) => writeLog('WARN', type, data),
    info: (data) => writeLog('INFO', type, data),
    debug: (data) => writeLog('DEBUG', type, data)
  };
}

// 默认导出
export default {
  createLogger,
  getLogFilePath,
  rotateLogIfNeeded
};
