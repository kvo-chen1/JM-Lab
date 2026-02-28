/**
 * 时间格式化工具测试
 */

import { describe, test, expect } from '@jest/globals';
import { DateFormatter, DateFormat } from '../dateFormatter';

describe('DateFormatter', () => {
  describe('parse', () => {
    test('应该能解析 ISO 字符串', () => {
      const date = DateFormatter.parse('2024-01-15T10:30:00.000Z');
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(0); // 0-based
      expect(date?.getDate()).toBe(15);
    });

    test('应该能解析毫秒级时间戳', () => {
      const timestamp = 1705315800000;
      const date = DateFormatter.parse(timestamp);
      expect(date).toBeInstanceOf(Date);
    });

    test('应该能解析秒级时间戳', () => {
      const timestamp = 1705315800;
      const date = DateFormatter.parse(timestamp);
      expect(date).toBeInstanceOf(Date);
    });

    test('应该能解析 Date 对象', () => {
      const originalDate = new Date('2024-01-15T10:30:00.000Z');
      const date = DateFormatter.parse(originalDate);
      expect(date).toEqual(originalDate);
    });

    test('应该能解析日期字符串', () => {
      const date = DateFormatter.parse('2024-01-15');
      expect(date).toBeInstanceOf(Date);
    });

    test('应该返回 null 对于无效输入', () => {
      expect(DateFormatter.parse(null)).toBeNull();
      expect(DateFormatter.parse(undefined)).toBeNull();
      expect(DateFormatter.parse('')).toBeNull();
      expect(DateFormatter.parse('invalid')).toBeNull();
    });
  });

  describe('format', () => {
    const testDate = new Date('2024-01-15T10:30:45.123Z');

    test('应该能格式化为 ISO 格式', () => {
      const formatted = DateFormatter.format(testDate, DateFormat.ISO);
      expect(formatted).toBe('2024-01-15T10:30:45.123Z');
    });

    test('应该能格式化为日期格式', () => {
      const formatted = DateFormatter.format(testDate, DateFormat.DATE);
      expect(formatted).toBe('2024-01-15');
    });

    test('应该能格式化为时间格式', () => {
      const formatted = DateFormatter.format(testDate, DateFormat.TIME);
      expect(formatted).toBe('10:30:45');
    });

    test('应该能格式化为日期时间格式', () => {
      const formatted = DateFormatter.format(testDate, DateFormat.DATETIME);
      expect(formatted).toBe('2024-01-15 10:30:45');
    });

    test('应该能格式化为时间戳 (毫秒)', () => {
      const formatted = DateFormatter.format(testDate, DateFormat.TIMESTAMP);
      expect(formatted).toBe(testDate.getTime());
    });

    test('应该能格式化为时间戳 (秒)', () => {
      const formatted = DateFormatter.format(testDate, DateFormat.TIMESTAMP_SECONDS);
      expect(formatted).toBe(Math.floor(testDate.getTime() / 1000));
    });

    test('应该返回 null 对于无效日期', () => {
      const formatted = DateFormatter.format(null);
      expect(formatted).toBeNull();
    });
  });

  describe('now', () => {
    test('应该返回当前时间的 ISO 字符串', () => {
      const before = Date.now();
      const nowStr = DateFormatter.now();
      const after = Date.now();

      const parsed = new Date(nowStr);
      expect(parsed.getTime()).toBeGreaterThanOrEqual(before);
      expect(parsed.getTime()).toBeLessThanOrEqual(after);
    });
  });

  describe('relativeTime', () => {
    test('应该能格式化刚刚的时间', () => {
      const now = new Date();
      const relative = DateFormatter.relativeTime(now, 'zh');
      expect(relative).toBe('刚刚');
    });

    test('应该能格式化几分钟前的时间', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const relative = DateFormatter.relativeTime(fiveMinutesAgo, 'zh');
      expect(relative).toContain('分钟前');
    });

    test('应该能格式化几小时前的时间', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const relative = DateFormatter.relativeTime(twoHoursAgo, 'zh');
      expect(relative).toContain('小时前');
    });

    test('应该能格式化几天前的时间', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const relative = DateFormatter.relativeTime(threeDaysAgo, 'zh');
      expect(relative).toContain('天前');
    });

    test('应该支持英文格式', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const relative = DateFormatter.relativeTime(fiveMinutesAgo, 'en');
      expect(relative).toContain('minute');
    });
  });

  describe('isValid', () => {
    test('应该验证有效日期', () => {
      expect(DateFormatter.isValid(new Date())).toBe(true);
      expect(DateFormatter.isValid('2024-01-15')).toBe(true);
      expect(DateFormatter.isValid(Date.now())).toBe(true);
    });

    test('应该验证无效日期', () => {
      expect(DateFormatter.isValid(null)).toBe(false);
      expect(DateFormatter.isValid(undefined)).toBe(false);
      expect(DateFormatter.isValid('invalid')).toBe(false);
    });
  });

  describe('compare', () => {
    test('应该比较两个日期', () => {
      const date1 = new Date('2024-01-15T10:00:00.000Z');
      const date2 = new Date('2024-01-15T12:00:00.000Z');

      expect(DateFormatter.compare(date1, date2)).toBe(-1);
      expect(DateFormatter.compare(date2, date1)).toBe(1);
      expect(DateFormatter.compare(date1, date1)).toBe(0);
    });
  });

  describe('diff', () => {
    test('应该计算日期差异 (天)', () => {
      const date1 = new Date('2024-01-01T00:00:00.000Z');
      const date2 = new Date('2024-01-15T00:00:00.000Z');

      const diff = DateFormatter.diff(date1, date2, 'd');
      expect(diff).toBe(14);
    });

    test('应该计算日期差异 (小时)', () => {
      const date1 = new Date('2024-01-15T00:00:00.000Z');
      const date2 = new Date('2024-01-15T10:00:00.000Z');

      const diff = DateFormatter.diff(date1, date2, 'h');
      expect(diff).toBe(10);
    });
  });

  describe('add', () => {
    test('应该增加天数', () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      const result = DateFormatter.add(date, 5, 'd');
      
      expect(result?.getDate()).toBe(20);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getFullYear()).toBe(2024);
    });

    test('应该减少天数', () => {
      const date = new Date('2024-01-15T00:00:00.000Z');
      const result = DateFormatter.add(date, -5, 'd');
      
      expect(result?.getDate()).toBe(10);
    });
  });

  describe('isToday', () => {
    test('应该识别今天', () => {
      expect(DateFormatter.isToday(new Date())).toBe(true);
      expect(DateFormatter.isToday(new Date('2020-01-01'))).toBe(false);
    });
  });

  describe('isYesterday', () => {
    test('应该识别昨天', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(DateFormatter.isYesterday(yesterday)).toBe(true);
      expect(DateFormatter.isYesterday(new Date())).toBe(false);
    });
  });

  describe('isFuture', () => {
    test('应该识别未来时间', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(DateFormatter.isFuture(tomorrow)).toBe(true);
      expect(DateFormatter.isFuture(new Date())).toBe(false);
    });
  });

  describe('isPast', () => {
    test('应该识别过去时间', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(DateFormatter.isPast(yesterday)).toBe(true);
      expect(DateFormatter.isPast(new Date())).toBe(false);
    });
  });
});
