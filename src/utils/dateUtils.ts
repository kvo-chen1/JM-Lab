/**
 * 日期工具函数
 */

/**
 * 格式化日期为相对时间（如：2分钟前、1小时前）
 * @param date 日期字符串或Date对象
 * @returns 相对时间字符串
 */
export function formatDistanceToNow(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else if (diffMonths < 12) {
    return `${diffMonths}个月前`;
  } else {
    return `${diffYears}年前`;
  }
}

/**
 * 格式化日期为本地字符串
 * @param date 日期字符串或Date对象
 * @param options 格式化选项
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  return targetDate.toLocaleDateString('zh-CN', defaultOptions);
}

/**
 * 格式化日期时间为本地字符串
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 检查日期是否在今天
 * @param date 日期字符串或Date对象
 * @returns 是否在今天
 */
export function isToday(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    targetDate.getDate() === today.getDate() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getFullYear() === today.getFullYear()
  );
}

/**
 * 检查日期是否在昨天
 * @param date 日期字符串或Date对象
 * @returns 是否在昨天
 */
export function isYesterday(date: string | Date): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    targetDate.getDate() === yesterday.getDate() &&
    targetDate.getMonth() === yesterday.getMonth() &&
    targetDate.getFullYear() === yesterday.getFullYear()
  );
}

export default {
  formatDistanceToNow,
  formatDate,
  formatDateTime,
  isToday,
  isYesterday,
};
