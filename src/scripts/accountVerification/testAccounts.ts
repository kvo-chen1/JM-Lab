// 测试账户管理表
// 用于管理测试账户的凭据和预期数据，确保测试的可重复性和一致性

// 定义测试账户类型
export interface TestAccount {
  id: string;
  username: string;
  email: string;
  password: string;
  membershipLevel: 'free' | 'premium' | 'vip';
  description: string;
  // 预期的用户信息
  expectedInfo: {
    age?: number;
    tags: string[];
    interests?: string[];
  };
  // 用于验证的数据标记
  verificationToken: string;
}

// 测试账户列表
export const TEST_ACCOUNTS: TestAccount[] = [
  {
    id: 'test-account-1',
    username: 'testuser1',
    email: 'test1@example.com',
    password: 'Test1234!',
    membershipLevel: 'free',
    description: '普通免费用户',
    expectedInfo: {
      age: 25,
      tags: ['国潮', '插画'],
      interests: ['设计', '艺术']
    },
    verificationToken: 'test1-verification-token'
  },
  {
    id: 'test-account-2',
    username: 'testuser2',
    email: 'test2@example.com',
    password: 'Test1234!',
    membershipLevel: 'premium',
    description: '高级会员用户',
    expectedInfo: {
      age: 30,
      tags: ['数字艺术', '品牌设计'],
      interests: ['品牌', '数字营销']
    },
    verificationToken: 'test2-verification-token'
  },
  {
    id: 'test-account-3',
    username: 'testuser3',
    email: 'test3@example.com',
    password: 'Test1234!',
    membershipLevel: 'vip',
    description: 'VIP会员用户',
    expectedInfo: {
      age: 35,
      tags: ['传统纹样', '文创设计'],
      interests: ['传统文化', '文创产业']
    },
    verificationToken: 'test3-verification-token'
  }
];

/**
 * 根据ID获取测试账户
 */
export function getTestAccountById(id: string): TestAccount | undefined {
  return TEST_ACCOUNTS.find(account => account.id === id);
}

/**
 * 根据邮箱获取测试账户
 */
export function getTestAccountByEmail(email: string): TestAccount | undefined {
  return TEST_ACCOUNTS.find(account => account.email === email);
}

/**
 * 获取所有测试账户
 */
export function getAllTestAccounts(): TestAccount[] {
  return [...TEST_ACCOUNTS];
}

/**
 * 验证账户信息是否匹配预期
 */
export function verifyAccountInfo(actual: any, expected: TestAccount): boolean {
  console.log('验证账户信息...');
  
  const checks = [
    { name: '用户名', actual: actual.username, expected: expected.username },
    { name: '邮箱', actual: actual.email, expected: expected.email },
    { name: '会员等级', actual: actual.membershipLevel, expected: expected.membershipLevel },
    { name: '年龄', actual: actual.age, expected: expected.expectedInfo.age },
  ];
  
  let allMatch = true;
  checks.forEach(check => {
    if (check.actual !== check.expected) {
      console.error(`${check.name}不匹配: 实际=${check.actual}, 预期=${check.expected}`);
      allMatch = false;
    } else {
      console.log(`${check.name}匹配: ${check.actual}`);
    }
  });
  
  // 验证标签匹配度（至少匹配80%）
  if (actual.tags && expected.expectedInfo.tags) {
    const actualSet = new Set(actual.tags);
    const expectedSet = new Set(expected.expectedInfo.tags);
    const intersection = [...expectedSet].filter(tag => actualSet.has(tag));
    const matchRate = intersection.length / expectedSet.size;
    
    if (matchRate >= 0.8) {
      console.log(`标签匹配度: ${(matchRate * 100).toFixed(0)}% (通过)`);
    } else {
      console.error(`标签匹配度: ${(matchRate * 100).toFixed(0)}% (失败，预期至少80%)`);
      allMatch = false;
    }
  }
  
  return allMatch;
}

/**
 * 生成唯一的测试数据标记
 */
export function generateVerificationToken(): string {
  return `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
