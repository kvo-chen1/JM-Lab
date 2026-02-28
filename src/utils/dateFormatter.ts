/**
 * 全局时间格式化工具类
 * 
 * 统一处理项目中的所有时间格式，确保使用 ISO 8601 标准格式
 * 支持时间戳、日期字符串、Date 对象之间的转换
 * 
 * @module utils/dateFormatter
 */

/**
 * 日期时间格式枚举
 */
export enum DateFormat {
  /** ISO 8601 标准格式 (推荐): 2024-01-15T10:30:00.000Z */
  ISO = 'ISO',
  /** 日期格式：2024-01-15 */
  DATE = 'DATE',
  /** 时间格式：10:30:00 */
  TIME = 'TIME',
  /** 日期时间格式：2024-01-15 10:30:00 */
  DATETIME = 'DATETIME',
  /** 中文格式：2024 年 01 月 15 日 10:30 */
  CHINESE = 'CHINESE',
  /** 时间戳 (毫秒): 1705315800000 */
  TIMESTAMP = 'TIMESTAMP',
  /** 时间戳 (秒): 1705315800 */
  TIMESTAMP_SECONDS = 'TIMESTAMP_SECONDS',
}

/**
 * 时间格式化工具类
 */
export class DateFormatter {
  /**
   * 将任意类型的日期值转换为 Date 对象
   * @param dateValue - 可以是 Date 对象、时间戳、ISO 字符串等
   * @returns Date 对象，如果转换失败返回 null
   */
  static parse(dateValue: any): Date | null {
    if (dateValue == null) {
      return null;
    }

    // 已经是 Date 对象
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    // 数字类型 (时间戳)
    if (typeof dateValue === 'number') {
      // 判断是秒级还是毫秒级时间戳
      const timestamp = dateValue < 1e12 ? dateValue * 1000 : dateValue;
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }

    // 字符串类型
    if (typeof dateValue === 'string') {
      // 检查是否是纯数字字符串 (时间戳)
      if (/^\d+$/.test(dateValue)) {
        const numValue = parseInt(dateValue, 10);
        const timestamp = numValue < 1e12 ? numValue * 1000 : numValue;
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
      }

      // ISO 日期字符串或其他日期格式
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }

    // 其他类型尝试直接转换
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * 将日期格式化为指定格式
   * @param dateValue - 任意类型的日期值
   * @param format - 目标格式，默认为 ISO 格式
   * @returns 格式化后的字符串或数字
   */
  static format(dateValue: any, format: DateFormat = DateFormat.ISO): string | number | null {
    const date = this.parse(dateValue);
    if (!date) {
      return null;
    }

    switch (format) {
      case DateFormat.ISO:
        return date.toISOString();

      case DateFormat.DATE:
        return date.toISOString().split('T')[0];

      case DateFormat.TIME:
        return date.toTimeString().split(' ')[0];

      case DateFormat.DATETIME:
        return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');

      case DateFormat.CHINESE:
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}年${month}月${day}日 ${hours}:${minutes}`;

      case DateFormat.TIMESTAMP:
        return date.getTime();

      case DateFormat.TIMESTAMP_SECONDS:
        return Math.floor(date.getTime() / 1000);

      default:
        return date.toISOString();
    }
  }

  /**
   * 获取当前时间的 ISO 格式字符串 (推荐用于数据库存储)
   * @returns ISO 8601 格式的当前时间
   */
  static now(): string {
    return new Date().toISOString();
  }

  /**
   * 获取当前时间戳 (毫秒)
   * @returns 当前时间戳 (毫秒)
   */
  static nowTimestamp(): number {
    return Date.now();
  }

  /**
   * 获取当前时间戳 (秒)
   * @returns 当前时间戳 (秒)
   */
  static nowTimestampSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 格式化相对时间 (如：3 分钟前、2 小时前)
   * @param dateValue - 任意类型的日期值
   * @param locale - 语言环境，默认中文
   * @returns 相对时间描述
   */
  static relativeTime(dateValue: any, locale: 'zh' | 'en' = 'zh'): string {
    const date = this.parse(dateValue);
    if (!date) {
      return locale === 'zh' ? '时间未知' : 'Unknown time';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (locale === 'zh') {
      if (diffSeconds < 60) return '刚刚';
      if (diffMinutes < 60) return `${diffMinutes}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 30) return `${diffDays}天前`;
      if (diffMonths < 12) return `${diffMonths}个月前`;
      return `${diffYears}年前`;
    } else {
      if (diffSeconds < 60) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * 检查日期是否有效
   * @param dateValue - 任意类型的日期值
   * @returns 是否有效
   */
  static isValid(dateValue: any): boolean {
    return this.parse(dateValue) !== null;
  }

  /**
   * 比较两个日期
   * @param date1 - 第一个日期
   * @param date2 - 第二个日期
   * @returns date1 > date2 返回 1, date1 < date2 返回 -1, 相等返回 0
   */
  static compare(date1: any, date2: any): number {
    const d1 = this.parse(date1);
    const d2 = this.parse(date2);

    if (!d1 || !d2) {
      return 0;
    }

    const time1 = d1.getTime();
    const time2 = d2.getTime();

    if (time1 > time2) return 1;
    if (time1 < time2) return -1;
    return 0;
  }

  /**
   * 计算两个日期之间的差异
   * @param date1 - 第一个日期
   * @param date2 - 第二个日期
   * @param unit - 差异单位
   * @returns 差异值
   */
  static diff(date1: any, date2: any, unit: 'ms' | 's' | 'm' | 'h' | 'd' | 'M' | 'y' = 'ms'): number {
    const d1 = this.parse(date1);
    const d2 = this.parse(date2);

    if (!d1 || !d2) {
      return 0;
    }

    const diffMs = Math.abs(d1.getTime() - d2.getTime());

    switch (unit) {
      case 'ms':
        return diffMs;
      case 's':
        return Math.floor(diffMs / 1000);
      case 'm':
        return Math.floor(diffMs / 60000);
      case 'h':
        return Math.floor(diffMs / 3600000);
      case 'd':
        return Math.floor(diffMs / 86400000);
      case 'M':
        return Math.floor(diffMs / 2592000000); // 30 天
      case 'y':
        return Math.floor(diffMs / 31536000000); // 365 天
      default:
        return diffMs;
    }
  }

  /**
   * 日期加减运算
   * @param dateValue - 基础日期
   * @param amount - 数量 (正数加，负数减)
   * @param unit - 单位
   * @returns 运算后的日期
   */
  static add(dateValue: any, amount: number, unit: 'ms' | 's' | 'm' | 'h' | 'd' | 'M' | 'y' = 'd'): Date | null {
    const date = this.parse(dateValue);
    if (!date) {
      return null;
    }

    const result = new Date(date);

    switch (unit) {
      case 'ms':
        result.setMilliseconds(result.getMilliseconds() + amount);
        break;
      case 's':
        result.setSeconds(result.getSeconds() + amount);
        break;
      case 'm':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'h':
        result.setHours(result.getHours() + amount);
        break;
      case 'd':
        result.setDate(result.getDate() + amount);
        break;
      case 'M':
        result.setMonth(result.getMonth() + amount);
        break;
      case 'y':
        result.setFullYear(result.getFullYear() + amount);
        break;
    }

    return result;
  }

  /**
   * 判断日期是否是今天
   * @param dateValue - 任意类型的日期值
   * @returns 是否是今天
   */
  static isToday(dateValue: any): boolean {
    const date = this.parse(dateValue);
    if (!date) return false;

    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  /**
   * 判断日期是否是昨天
   * @param dateValue - 任意类型的日期值
   * @returns 是否是昨天
   */
  static isYesterday(dateValue: any): boolean {
    const date = this.parse(dateValue);
    if (!date) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getFullYear() === yesterday.getFullYear() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getDate() === yesterday.getDate();
  }

  /**
   * 判断日期是否在未来
   * @param dateValue - 任意类型的日期值
   * @returns 是否在未来
   */
  static isFuture(dateValue: any): boolean {
    const date = this.parse(dateValue);
    if (!date) return false;
    return date.getTime() > Date.now();
  }

  /**
   * 判断日期是否在过去
   * @param dateValue - 任意类型的日期值
   * @returns 是否在过去
   */
  static isPast(dateValue: any): boolean {
    const date = this.parse(dateValue);
    if (!date) return false;
    return date.getTime() < Date.now();
  }
}

// 导出便捷函数
export const parseDate = DateFormatter.parse;
export const formatDate = DateFormatter.format;
export const now = DateFormatter.now;
export const nowTimestamp = DateFormatter.nowTimestamp;
export const relativeTime = DateFormatter.relativeTime;
export const isValidDate = DateFormatter.isValid;
export const compareDates = DateFormatter.compare;
export const diffDates = DateFormatter.diff;
export const addToDate = DateFormatter.add;
export const isToday = DateFormatter.isToday;
export const isYesterday = DateFormatter.isYesterday;
export const isFuture = DateFormatter.isFuture;
export const isPast = DateFormatter.isPast;

// 默认导出
export default DateFormatter;
