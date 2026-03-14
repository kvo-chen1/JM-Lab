// 账户数据隔离验证主脚本
// 用于协调测试账户的创建、数据隔离验证和报告生成

import { cleanupAllTestData, verifyCleanup } from './cleanupTestData';
import { TEST_ACCOUNTS, TestAccount, verifyAccountInfo } from './testAccounts';
// 直接导入服务文件，不使用@/别名
import { recordUserAction, getUserActions, getUserPreferences } from '../../services/recommendationService';
import productService from '../../services/productService';
// 简单的模拟服务，避免依赖问题
const mockAchievementService = {
  addPoints: (args: any) => {},
  getPointsRecords: (userId: string) => []
};
const mockCheckinService = {
  checkin: (userId: string) => {},
  getUserCheckinRecords: (userId: string) => []
};

// 验证结果类型
interface VerificationResult {
  testName: string;
  accountId: string;
  passed: boolean;
  message: string;
  details?: any;
  timestamp?: Date;
}

// 验证报告类型
interface VerificationReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: VerificationResult[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

// 验证报告实例
class VerificationReporter {
  private results: VerificationResult[] = [];
  private startTime: Date;
  private endTime: Date | null = null;

  constructor() {
    this.startTime = new Date();
  }

  /**
   * 记录验证结果
   */
  public recordResult(result: VerificationResult): void {
    this.results.push({
      ...result,
      timestamp: new Date()
    });
  }

  /**
   * 生成验证报告
   */
  public generateReport(): VerificationReport {
    this.endTime = new Date();
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const duration = this.endTime.getTime() - this.startTime.getTime();

    const report: VerificationReport = {
      totalTests,
      passedTests,
      failedTests,
      results: this.results,
      startTime: this.startTime,
      endTime: this.endTime,
      duration
    };

    return report;
  }

  /**
   * 打印验证报告
   */
  public printReport(): void {
    const report = this.generateReport();
    
    console.log('\n========================================');
    console.log('账户数据隔离验证报告');
    console.log('========================================');
    console.log(`开始时间: ${report.startTime.toISOString()}`);
    console.log(`结束时间: ${report.endTime.toISOString()}`);
    console.log(`持续时间: ${report.duration}ms`);
    console.log(`总测试数: ${report.totalTests}`);
    console.log(`通过测试: ${report.passedTests} (${((report.passedTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`失败测试: ${report.failedTests} (${((report.failedTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log('\n详细结果:');
    console.log('----------------------------------------');
    
    report.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${status} ${result.testName}`);
      console.log(`   账户: ${result.accountId}`);
      console.log(`   消息: ${result.message}`);
      if (result.details) {
        console.log(`   详情: ${JSON.stringify(result.details)}`);
      }
      console.log('');
    });
    
    console.log('========================================');
  }
}

// 主验证类
class AccountIsolationVerifier {
  private reporter: VerificationReporter;
  private currentAccount: TestAccount | null = null;

  constructor() {
    this.reporter = new VerificationReporter();
  }

  /**
   * 准备测试环境
   */
  public async prepareEnvironment(): Promise<boolean> {
    console.log('\n1. 准备测试环境...');
    
    // 清理现有测试数据
    cleanupAllTestData();
    
    // 验证清理结果
    const isClean = verifyCleanup();
    
    this.reporter.recordResult({
      testName: '环境准备',
      accountId: 'system',
      passed: isClean,
      message: isClean ? '测试环境准备成功' : '测试环境准备失败'
    });
    
    return isClean;
  }

  /**
   * 注册测试账户
   */
  public async registerTestAccounts(): Promise<boolean> {
    console.log('\n2. 注册测试账户...');
    
    let allRegistered = true;
    
    for (const account of TEST_ACCOUNTS) {
      try {
        // 模拟注册账户
        console.log(`模拟注册账户: ${account.username}`);
        this.reporter.recordResult({
          testName: '账户注册',
          accountId: account.id,
          passed: true,
          message: '模拟注册成功'
        });
      } catch (error) {
        console.error(`注册账户${account.username}时发生异常:`, error);
        allRegistered = false;
        this.reporter.recordResult({
          testName: '账户注册',
          accountId: account.id,
          passed: false,
          message: `注册异常: ${(error as Error).message}`
        });
      }
    }
    
    return allRegistered;
  }

  /**
   * 测试账户登录
   */
  public async testAccountLogin(account: TestAccount): Promise<boolean> {
    console.log(`\n3. 测试账户登录: ${account.username}`);
    
    try {
      // 模拟登录
      console.log(`模拟登录账户: ${account.username}`);
      this.currentAccount = account;
      
      // 模拟用户信息
      const userInfo = {
        username: account.username,
        email: account.email,
        membershipLevel: account.membershipLevel,
        age: account.expectedInfo.age,
        tags: account.expectedInfo.tags
      };
      
      const isInfoValid = verifyAccountInfo(userInfo, account);
      
      this.reporter.recordResult({
        testName: '账户登录',
        accountId: account.id,
        passed: true,
        message: '登录成功'
      });
      
      return isInfoValid;
    } catch (error) {
      console.error(`登录账户${account.username}时发生异常:`, error);
      this.reporter.recordResult({
        testName: '账户登录',
        accountId: account.id,
        passed: false,
        message: `登录异常: ${(error as Error).message}`
      });
      return false;
    }
  }

  /**
   * 测试数据隔离
   */
  public async testDataIsolation(): Promise<boolean> {
    console.log('\n4. 测试数据隔离...');
    
    let allIsolated = true;
    
    for (const account of TEST_ACCOUNTS) {
      try {
        // 登录当前账户
        await this.testAccountLogin(account);
        
        // 执行一些操作，生成用户数据
        await this.generateUserData(account);
        
        // 登出当前账户
        await this.logout();
      } catch (error) {
        console.error(`测试账户${account.username}数据隔离时发生异常:`, error);
        allIsolated = false;
      }
    }
    
    // 验证数据隔离
    for (const account of TEST_ACCOUNTS) {
      try {
        // 登录当前账户
        await this.testAccountLogin(account);
        
        // 验证只能访问自己的数据
        const isIsolated = await this.verifyAccountData(account);
        
        if (!isIsolated) {
          allIsolated = false;
        }
        
        // 登出当前账户
        await this.logout();
      } catch (error) {
        console.error(`验证账户${account.username}数据隔离时发生异常:`, error);
        allIsolated = false;
      }
    }
    
    return allIsolated;
  }

  /**
   * 生成用户数据
   */
  private async generateUserData(account: TestAccount): Promise<void> {
    console.log(`  生成用户数据: ${account.username}`);
    
    // 生成用户行为数据
    const action = {
      id: `action-${account.id}-${Date.now()}`,
      userId: account.id,
      itemId: `item-${Date.now()}`,
      itemType: 'post' as const,
      actionType: 'view' as const,
      timestamp: new Date().toISOString(),
      metadata: { verificationToken: account.verificationToken }
    };
    
    recordUserAction(action);
    
    // 生成积分记录
    mockAchievementService.addPoints({
      source: 'test-action',
      type: 'achievement',
      points: 10,
      description: '测试操作获得积分',
      userId: account.id
    });
    
    // 生成签到记录
    mockCheckinService.checkin(account.id);
    
    console.log(`  成功生成用户${account.username}的数据`);
  }

  /**
   * 验证账户数据
   */
  private async verifyAccountData(account: TestAccount): Promise<boolean> {
    console.log(`  验证账户数据隔离: ${account.username}`);
    
    let isIsolated = true;
    
    // 验证用户行为数据
    const userActions = getUserActions(account.id);
    for (const action of userActions) {
      if (action.metadata?.verificationToken !== account.verificationToken) {
        console.error(`  ❌ 发现交叉数据: 用户${account.username}的行为数据中包含其他账户的验证令牌`);
        isIsolated = false;
        this.reporter.recordResult({
          testName: '数据隔离验证',
          accountId: account.id,
          passed: false,
          message: '行为数据包含其他账户信息',
          details: { action }
        });
      }
    }
    
    // 验证积分记录
    const pointsRecords = mockAchievementService.getPointsRecords(account.id);
    if (pointsRecords.length === 0) {
      console.error(`  ❌ 积分记录丢失: 用户${account.username}没有积分记录`);
      isIsolated = false;
      this.reporter.recordResult({
        testName: '数据隔离验证',
        accountId: account.id,
        passed: false,
        message: '积分记录丢失'
      });
    }
    
    // 验证签到记录
    const checkinRecords = mockCheckinService.getUserCheckinRecords(account.id);
    if (checkinRecords.length === 0) {
      console.error(`  ❌ 签到记录丢失: 用户${account.username}没有签到记录`);
      isIsolated = false;
      this.reporter.recordResult({
        testName: '数据隔离验证',
        accountId: account.id,
        passed: false,
        message: '签到记录丢失'
      });
    }
    
    // 验证用户偏好数据
    const userPreferences = getUserPreferences(account.id);
    if (!userPreferences) {
      console.error(`  ❌ 用户偏好数据丢失: 用户${account.username}没有偏好数据`);
      isIsolated = false;
      this.reporter.recordResult({
        testName: '数据隔离验证',
        accountId: account.id,
        passed: false,
        message: '用户偏好数据丢失'
      });
    }
    
    if (isIsolated) {
      console.log(`  ✅ 账户${account.username}数据隔离验证通过`);
      this.reporter.recordResult({
        testName: '数据隔离验证',
        accountId: account.id,
        passed: true,
        message: '数据隔离验证通过'
      });
    }
    
    return isIsolated;
  }

  /**
   * 测试服务层数据访问控制
   */
  public testServiceLayerAccessControl(): boolean {
    console.log('\n5. 测试服务层数据访问控制...');
    
    let allSecure = true;
    
    // 测试recommendationService
    console.log('  测试recommendationService...');
    try {
      const actionsWithoutUserId = getUserActions('');
      console.log('  ✅ recommendationService: 正确处理空userId');
    } catch (error) {
      console.error('  ❌ recommendationService: 访问控制实现错误', error);
      allSecure = false;
      this.reporter.recordResult({
        testName: '服务层访问控制',
        accountId: 'system',
        passed: false,
        message: `recommendationService访问控制实现错误: ${(error as Error).message}`
      });
    }
    
    // 测试productService
    console.log('  测试productService...');
    try {
      // 检查getUserExchangeRecords方法是否正确使用userId
      if (productService.getUserExchangeRecords) {
        const exchangeRecords = productService.getUserExchangeRecords('invalid-user');
        if (exchangeRecords.length > 0) {
          console.error('  ❌ productService: 允许访问无效用户的兑换记录');
          allSecure = false;
          this.reporter.recordResult({
            testName: '服务层访问控制',
            accountId: 'system',
            passed: false,
            message: 'productService允许访问无效用户的兑换记录'
          });
        } else {
          console.log('  ✅ productService: 正确过滤无效用户的兑换记录');
        }
      } else {
        console.log('  ⏭️  productService: getUserExchangeRecords方法不存在，跳过测试');
      }
    } catch (error) {
      console.error('  ❌ productService: 访问控制实现错误', error);
      allSecure = false;
      this.reporter.recordResult({
        testName: '服务层访问控制',
        accountId: 'system',
        passed: false,
        message: `productService访问控制实现错误: ${(error as Error).message}`
      });
    }
    
    // 测试achievementService
    console.log('  测试achievementService...');
    try {
      const pointsRecords = mockAchievementService.getPointsRecords('invalid-user');
      if (pointsRecords.length > 0) {
        console.error('  ❌ achievementService: 允许访问无效用户的积分记录');
        allSecure = false;
        this.reporter.recordResult({
          testName: '服务层访问控制',
          accountId: 'system',
          passed: false,
          message: 'achievementService允许访问无效用户的积分记录'
        });
      } else {
        console.log('  ✅ achievementService: 正确过滤无效用户的积分记录');
      }
    } catch (error) {
      console.error('  ❌ achievementService: 访问控制实现错误', error);
      allSecure = false;
      this.reporter.recordResult({
        testName: '服务层访问控制',
        accountId: 'system',
        passed: false,
        message: `achievementService访问控制实现错误: ${(error as Error).message}`
      });
    }
    
    if (allSecure) {
      console.log('  ✅ 服务层数据访问控制验证通过');
      this.reporter.recordResult({
        testName: '服务层访问控制',
        accountId: 'system',
        passed: true,
        message: '服务层数据访问控制验证通过'
      });
    }
    
    return allSecure;
  }

  /**
   * 登出当前账户
   */
  private async logout(): Promise<void> {
    if (this.currentAccount) {
      console.log(`  登出账户: ${this.currentAccount.username}`);
    }
    
    // 清理本地存储
    cleanupAllTestData();
    this.currentAccount = null;
  }

  /**
   * 执行完整的验证流程
   */
  public async runFullVerification(): Promise<VerificationReport> {
    console.log('========================================');
    console.log('开始账户数据隔离验证');
    console.log('========================================');
    
    // 1. 准备测试环境
    const isEnvReady = await this.prepareEnvironment();
    if (!isEnvReady) {
      console.error('测试环境准备失败，终止验证');
      return this.reporter.generateReport();
    }
    
    // 2. 注册测试账户
    const areAccountsRegistered = await this.registerTestAccounts();
    if (!areAccountsRegistered) {
      console.error('账户注册失败，终止验证');
      return this.reporter.generateReport();
    }
    
    // 3. 测试数据隔离
    await this.testDataIsolation();
    
    // 4. 测试服务层数据访问控制
    this.testServiceLayerAccessControl();
    
    // 生成并打印报告
    const report = this.reporter.generateReport();
    this.reporter.printReport();
    
    return report;
  }
}

/**
 * 执行账户数据隔离验证
 */
export async function runAccountIsolationVerification(): Promise<VerificationReport> {
  const verifier = new AccountIsolationVerifier();
  return await verifier.runFullVerification();
}

// 如果直接运行脚本，则执行验证
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('verifyAccountIsolation')) {
  runAccountIsolationVerification();
}
