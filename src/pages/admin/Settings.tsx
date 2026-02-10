import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import {
  Settings,
  Bell,
  Shield,
  Users,
  Palette,
  Database,
  Mail,
  Lock,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Key,
  FileText,
  Upload,
  Trash2,
  Plus,
  X,
  Loader2,
  Smartphone
} from 'lucide-react';

// 设置项类型
interface SettingSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

// 系统设置状态
interface SystemSettings {
  siteName: string;
  siteDescription: string;
  logo: string;
  favicon: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerification: boolean;
  defaultLanguage: string;
  timezone: string;
}

// 通知设置
interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newUserAlert: boolean;
  contentReportAlert: boolean;
  systemUpdates: boolean;
  dailyDigest: boolean;
  marketingEmails: boolean;
}

// 安全设置
interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAttempts: number;
  passwordExpiry: number;
  sessionTimeout: number;
  ipWhitelist: string[];
  requireStrongPassword: boolean;
}

// 积分规则
interface PointsRule {
  id: string;
  action: string;
  points: number;
  dailyLimit: number;
  description: string;
  enabled: boolean;
}

const settingSections: SettingSection[] = [
  { id: 'general', title: '通用设置', icon: Settings, description: '网站基本信息和全局配置' },
  { id: 'appearance', title: '外观设置', icon: Palette, description: '主题、颜色和界面样式' },
  { id: 'notifications', title: '通知设置', icon: Bell, description: '邮件和推送通知配置' },
  { id: 'security', title: '安全设置', icon: Shield, description: '登录安全和访问控制' },
  { id: 'users', title: '用户管理', icon: Users, description: '用户权限和注册设置' },
  { id: 'points', title: '积分系统', icon: Key, description: '积分规则和奖励机制' },
  { id: 'storage', title: '存储设置', icon: Database, description: '文件存储和备份配置' },
];

// 默认积分规则
const defaultPointsRules: PointsRule[] = [
  { id: '1', action: 'daily_checkin', points: 10, dailyLimit: 1, description: '每日签到', enabled: true },
  { id: '2', action: 'create_post', points: 20, dailyLimit: 5, description: '发布帖子', enabled: true },
  { id: '3', action: 'like_content', points: 2, dailyLimit: 50, description: '点赞内容', enabled: true },
  { id: '4', action: 'comment', points: 5, dailyLimit: 20, description: '发表评论', enabled: true },
  { id: '5', action: 'share_content', points: 10, dailyLimit: 10, description: '分享内容', enabled: true },
  { id: '6', action: 'invite_friend', points: 100, dailyLimit: 0, description: '邀请好友', enabled: true },
  { id: '7', action: 'complete_profile', points: 50, dailyLimit: 1, description: '完善资料', enabled: true },
  { id: '8', action: 'work_adopted', points: 500, dailyLimit: 0, description: '作品被采纳', enabled: true },
];

export default function AdminSettings() {
  const { isDark, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [dbSettings, setDbSettings] = useState<Record<string, string>>({});

  // 系统设置
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'AI共创',
    siteDescription: '传统文化创新设计平台',
    logo: '',
    favicon: '',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: true,
    defaultLanguage: 'zh-CN',
    timezone: 'Asia/Shanghai',
  });

  // 通知设置
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    newUserAlert: true,
    contentReportAlert: true,
    systemUpdates: true,
    dailyDigest: false,
    marketingEmails: false,
  });

  // 安全设置
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAttempts: 5,
    passwordExpiry: 90,
    sessionTimeout: 30,
    ipWhitelist: [],
    requireStrongPassword: true,
  });

  // 存储统计
  const [storageStats, setStorageStats] = useState({
    totalSize: 100 * 1024 * 1024 * 1024,
    usedSize: 0,
    fileCount: 0,
    backupSize: 0,
  });

  // 积分规则
  const [pointsRules, setPointsRules] = useState<PointsRule[]>(defaultPointsRules);
  const [newRule, setNewRule] = useState<Partial<PointsRule>>({
    action: '',
    points: 0,
    dailyLimit: 0,
    description: '',
    enabled: true,
  });
  const [showAddRule, setShowAddRule] = useState(false);

  // 加载设置
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settings, storage] = await Promise.all([
        adminService.getAllSettings(),
        adminService.getStorageStats(),
      ]);

      setDbSettings(settings);
      setStorageStats(storage);

      // 更新本地状态
      setSystemSettings(prev => ({
        ...prev,
        siteName: settings['site_name'] || prev.siteName,
        siteDescription: settings['site_description'] || prev.siteDescription,
        maintenanceMode: settings['maintenance_mode'] === 'true',
        registrationEnabled: settings['registration_enabled'] === 'true',
        emailVerification: settings['email_verification'] === 'true',
        defaultLanguage: settings['default_language'] || prev.defaultLanguage,
        timezone: settings['timezone'] || prev.timezone,
      }));

      setNotificationSettings(prev => ({
        ...prev,
        emailNotifications: settings['email_notifications'] === 'true',
        pushNotifications: settings['push_notifications'] === 'true',
        newUserAlert: settings['new_user_alert'] === 'true',
        contentReportAlert: settings['content_report_alert'] === 'true',
      }));

      setSecuritySettings(prev => ({
        ...prev,
        twoFactorAuth: settings['two_factor_auth'] === 'true',
        loginAttempts: parseInt(settings['login_attempts'] || '5'),
        passwordExpiry: parseInt(settings['password_expiry'] || '90'),
        sessionTimeout: parseInt(settings['session_timeout'] || '30'),
        requireStrongPassword: settings['require_strong_password'] === 'true',
      }));
    } catch (error) {
      console.error('加载设置失败:', error);
      toast.error('加载设置失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 保存设置
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 准备要保存的设置
      const settingsToSave: Record<string, string> = {
        // 通用设置
        site_name: systemSettings.siteName,
        site_description: systemSettings.siteDescription,
        maintenance_mode: systemSettings.maintenanceMode.toString(),
        registration_enabled: systemSettings.registrationEnabled.toString(),
        email_verification: systemSettings.emailVerification.toString(),
        default_language: systemSettings.defaultLanguage,
        timezone: systemSettings.timezone,
        // 通知设置
        email_notifications: notificationSettings.emailNotifications.toString(),
        push_notifications: notificationSettings.pushNotifications.toString(),
        new_user_alert: notificationSettings.newUserAlert.toString(),
        content_report_alert: notificationSettings.contentReportAlert.toString(),
        // 安全设置
        two_factor_auth: securitySettings.twoFactorAuth.toString(),
        login_attempts: securitySettings.loginAttempts.toString(),
        password_expiry: securitySettings.passwordExpiry.toString(),
        session_timeout: securitySettings.sessionTimeout.toString(),
        require_strong_password: securitySettings.requireStrongPassword.toString(),
      };

      const success = await adminService.updateSettings(settingsToSave);
      
      if (success) {
        setHasChanges(false);
        toast.success('设置已保存');
      } else {
        toast.error('保存设置失败');
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error('保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置设置
  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      loadSettings();
      setHasChanges(false);
      toast.success('设置已重置');
    }
  };

  // 添加积分规则
  const handleAddRule = () => {
    if (!newRule.action || !newRule.description) {
      toast.error('请填写完整信息');
      return;
    }
    
    const rule: PointsRule = {
      id: Date.now().toString(),
      action: newRule.action!,
      points: newRule.points || 0,
      dailyLimit: newRule.dailyLimit || 0,
      description: newRule.description!,
      enabled: newRule.enabled ?? true,
    };
    
    setPointsRules([...pointsRules, rule]);
    setNewRule({ action: '', points: 0, dailyLimit: 0, description: '', enabled: true });
    setShowAddRule(false);
    setHasChanges(true);
    toast.success('规则已添加');
  };

  // 删除积分规则
  const handleDeleteRule = (id: string) => {
    setPointsRules(pointsRules.filter(r => r.id !== id));
    setHasChanges(true);
    toast.success('规则已删除');
  };

  // 切换积分规则状态
  const toggleRule = (id: string) => {
    setPointsRules(pointsRules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
    setHasChanges(true);
  };

  // 渲染通用设置
  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            网站名称
          </label>
          <input
            type="text"
            value={systemSettings.siteName}
            onChange={(e) => {
              setSystemSettings({ ...systemSettings, siteName: e.target.value });
              setHasChanges(true);
            }}
            className={`w-full px-4 py-2 rounded-xl border outline-none transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-red-500'
            }`}
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            默认语言
          </label>
          <select
            value={systemSettings.defaultLanguage}
            onChange={(e) => {
              setSystemSettings({ ...systemSettings, defaultLanguage: e.target.value });
              setHasChanges(true);
            }}
            className={`w-full px-4 py-2 rounded-xl border outline-none transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-red-500'
            }`}
          >
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          网站描述
        </label>
        <textarea
          value={systemSettings.siteDescription}
          onChange={(e) => {
            setSystemSettings({ ...systemSettings, siteDescription: e.target.value });
            setHasChanges(true);
          }}
          rows={3}
          className={`w-full px-4 py-2 rounded-xl border outline-none transition-colors ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-red-500'
          }`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            时区
          </label>
          <select
            value={systemSettings.timezone}
            onChange={(e) => {
              setSystemSettings({ ...systemSettings, timezone: e.target.value });
              setHasChanges(true);
            }}
            className={`w-full px-4 py-2 rounded-xl border outline-none transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-red-500'
            }`}
          >
            <option value="Asia/Shanghai">Asia/Shanghai (北京时间)</option>
            <option value="Asia/Hong_Kong">Asia/Hong_Kong (香港时间)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (东京时间)</option>
            <option value="America/New_York">America/New_York (纽约时间)</option>
            <option value="Europe/London">Europe/London (伦敦时间)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">维护模式</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                开启后网站将显示维护页面
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode });
              setHasChanges(true);
            }}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              systemSettings.maintenanceMode ? 'bg-red-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              systemSettings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">开放注册</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                允许新用户注册账号
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSystemSettings({ ...systemSettings, registrationEnabled: !systemSettings.registrationEnabled });
              setHasChanges(true);
            }}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              systemSettings.registrationEnabled ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              systemSettings.registrationEnabled ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">邮箱验证</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                新用户注册需要验证邮箱
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSystemSettings({ ...systemSettings, emailVerification: !systemSettings.emailVerification });
              setHasChanges(true);
            }}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              systemSettings.emailVerification ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              systemSettings.emailVerification ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染外观设置
  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>主题模式</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => { toggleTheme(); setHasChanges(true); }}
            className={`p-6 rounded-2xl border-2 transition-all ${
              !isDark 
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <Sun className="w-8 h-8 mx-auto mb-3 text-orange-500" />
            <p className="font-medium">浅色模式</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>明亮的界面主题</p>
          </button>
          
          <button
            onClick={() => { toggleTheme(); setHasChanges(true); }}
            className={`p-6 rounded-2xl border-2 transition-all ${
              isDark 
                ? 'border-red-500 bg-gray-800' 
                : 'border-gray-200'
            }`}
          >
            <Moon className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <p className="font-medium">深色模式</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暗色的界面主题</p>
          </button>
          
          <button
            className={`p-6 rounded-2xl border-2 transition-all border-gray-200 dark:border-gray-700`}
          >
            <Monitor className="w-8 h-8 mx-auto mb-3 text-purple-500" />
            <p className="font-medium">跟随系统</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>自动切换主题</p>
          </button>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>品牌标识</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              网站 Logo
            </label>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center ${
              isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
            } transition-colors cursor-pointer`}>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                点击上传或拖拽文件到此处
              </p>
              <p className="text-xs text-gray-400 mt-1">支持 PNG, JPG, SVG 格式</p>
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              网站 Favicon
            </label>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center ${
              isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
            } transition-colors cursor-pointer`}>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                点击上传或拖拽文件到此处
              </p>
              <p className="text-xs text-gray-400 mt-1">建议尺寸 32x32 像素</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染通知设置
  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {[
        { key: 'emailNotifications', title: '邮件通知', description: '接收系统发送的邮件通知', icon: Mail },
        { key: 'pushNotifications', title: '推送通知', description: '接收浏览器推送通知', icon: Smartphone },
        { key: 'newUserAlert', title: '新用户提醒', description: '有新用户注册时通知管理员', icon: Users },
        { key: 'contentReportAlert', title: '内容举报提醒', description: '有内容被举报时通知管理员', icon: AlertTriangle },
        { key: 'systemUpdates', title: '系统更新', description: '接收系统更新和维护通知', icon: RefreshCw },
        { key: 'dailyDigest', title: '每日摘要', description: '每天发送平台数据摘要', icon: FileText },
        { key: 'marketingEmails', title: '营销邮件', description: '接收产品更新和营销活动信息', icon: Mail },
      ].map(({ key, title, description, icon: Icon }) => (
        <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">{title}</p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setNotificationSettings({ ...notificationSettings, [key]: !notificationSettings[key as keyof NotificationSettings] });
              setHasChanges(true);
            }}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              notificationSettings[key as keyof NotificationSettings] ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              notificationSettings[key as keyof NotificationSettings] ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      ))}
    </div>
  );

  // 渲染安全设置
  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">双因素认证</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              为管理员账号启用双重验证
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth });
            setHasChanges(true);
          }}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            securitySettings.twoFactorAuth ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
            securitySettings.twoFactorAuth ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            最大登录尝试次数
          </label>
          <input
            type="number"
            value={securitySettings.loginAttempts}
            onChange={(e) => {
              setSecuritySettings({ ...securitySettings, loginAttempts: parseInt(e.target.value) });
              setHasChanges(true);
            }}
            className={`w-full px-4 py-2 rounded-xl border outline-none transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-red-500'
            }`}
          />
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            超过此次数将锁定账号
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            密码有效期 (天)
          </label>
          <input
            type="number"
            value={securitySettings.passwordExpiry}
            onChange={(e) => {
              setSecuritySettings({ ...securitySettings, passwordExpiry: parseInt(e.target.value) });
              setHasChanges(true);
            }}
            className={`w-full px-4 py-2 rounded-xl border outline-none transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-red-500'
            }`}
          />
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            0 表示永不过期
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            会话超时 (分钟)
          </label>
          <input
            type="number"
            value={securitySettings.sessionTimeout}
            onChange={(e) => {
              setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) });
              setHasChanges(true);
            }}
            className={`w-full px-4 py-2 rounded-xl border outline-none transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-red-500'
            }`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">强密码策略</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              要求密码包含大小写字母、数字和特殊字符
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSecuritySettings({ ...securitySettings, requireStrongPassword: !securitySettings.requireStrongPassword });
            setHasChanges(true);
          }}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            securitySettings.requireStrongPassword ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
            securitySettings.requireStrongPassword ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  );

  // 渲染积分系统设置
  const renderPointsSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>积分规则</h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddRule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加规则
        </motion.button>
      </div>

      {showAddRule && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="行为标识"
              value={newRule.action}
              onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
              className={`px-3 py-2 rounded-lg text-sm outline-none ${
                isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
              }`}
            />
            <input
              type="text"
              placeholder="描述"
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              className={`px-3 py-2 rounded-lg text-sm outline-none ${
                isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
              }`}
            />
            <input
              type="number"
              placeholder="积分"
              value={newRule.points}
              onChange={(e) => setNewRule({ ...newRule, points: parseInt(e.target.value) || 0 })}
              className={`px-3 py-2 rounded-lg text-sm outline-none ${
                isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
              }`}
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="每日限制"
                value={newRule.dailyLimit}
                onChange={(e) => setNewRule({ ...newRule, dailyLimit: parseInt(e.target.value) || 0 })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none ${
                  isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                }`}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddRule}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                <CheckCircle className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddRule(false)}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {pointsRules.map((rule) => (
          <motion.div
            key={rule.id}
            layout
            className={`flex items-center justify-between p-4 rounded-xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleRule(rule.id)}
                className={`w-10 h-6 rounded-full transition-colors ${
                  rule.enabled ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  rule.enabled ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
              <div>
                <p className="font-medium">{rule.description}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {rule.action} · 每日限制: {rule.dailyLimit || '无限制'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-red-500">+{rule.points}</span>
              <button
                onClick={() => handleDeleteRule(rule.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // 渲染存储设置
  const renderStorageSettings = () => {
    const usedGB = (storageStats.usedSize / (1024 * 1024 * 1024)).toFixed(2);
    const totalGB = (storageStats.totalSize / (1024 * 1024 * 1024)).toFixed(0);
    const percentUsed = storageStats.totalSize > 0 
      ? (storageStats.usedSize / storageStats.totalSize * 100).toFixed(1) 
      : 0;
    const backupGB = (storageStats.backupSize / (1024 * 1024 * 1024)).toFixed(2);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold">存储使用情况</h3>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>已使用</span>
                    <span className="font-medium">{usedGB} GB / {totalGB} GB</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(parseFloat(percentUsed as string), 100)}%` }} 
                    />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    已使用 {percentUsed}%
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>文件数量</p>
                    <p className="font-medium">{storageStats.fileCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>备份占用</p>
                    <p className="font-medium">{backupGB} GB</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-green-500" />
              <h3 className="font-semibold">备份设置</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>自动备份</span>
                <button 
                  onClick={() => {
                    const newValue = !(dbSettings['backup_enabled'] === 'true');
                    adminService.updateSetting('backup_enabled', newValue.toString());
                    setDbSettings(prev => ({ ...prev, backup_enabled: newValue.toString() }));
                    setHasChanges(true);
                  }}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    dbSettings['backup_enabled'] === 'true' ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    dbSettings['backup_enabled'] === 'true' ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  备份频率
                </label>
                <select 
                  value={dbSettings['backup_frequency'] || 'daily'}
                  onChange={(e) => {
                    adminService.updateSetting('backup_frequency', e.target.value);
                    setDbSettings(prev => ({ ...prev, backup_frequency: e.target.value }));
                    setHasChanges(true);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <option value="hourly">每小时</option>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <h3 className="font-semibold mb-4">上传设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                最大文件大小 (MB)
              </label>
              <input
                type="number"
                value={dbSettings['max_upload_size'] || '50'}
                onChange={(e) => {
                  setDbSettings(prev => ({ ...prev, max_upload_size: e.target.value }));
                  setHasChanges(true);
                }}
                className={`w-full px-4 py-2 rounded-xl border outline-none ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                允许的文件类型
              </label>
              <input
                type="text"
                value={dbSettings['allowed_file_types'] || 'jpg,png,gif,mp4,mp3'}
                onChange={(e) => {
                  setDbSettings(prev => ({ ...prev, allowed_file_types: e.target.value }));
                  setHasChanges(true);
                }}
                className={`w-full px-4 py-2 rounded-xl border outline-none ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                存储提供商
              </label>
              <select
                value={dbSettings['storage_provider'] || 'local'}
                onChange={(e) => {
                  adminService.updateSetting('storage_provider', e.target.value);
                  setDbSettings(prev => ({ ...prev, storage_provider: e.target.value }));
                  setHasChanges(true);
                }}
                className={`w-full px-4 py-2 rounded-xl border outline-none ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="local">本地存储</option>
                <option value="s3">AWS S3</option>
                <option value="oss">阿里云 OSS</option>
                <option value="cos">腾讯云 COS</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染用户管理设置
  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <h3 className="font-semibold mb-4">用户角色</h3>
        <div className="space-y-3">
          {[
            { name: '超级管理员', description: '拥有所有权限', count: 2 },
            { name: '管理员', description: '管理内容和用户', count: 5 },
            { name: '审核员', description: '审核内容和评论', count: 8 },
            { name: '普通用户', description: '基本功能权限', count: 12580 },
          ].map((role, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
              <div>
                <p className="font-medium">{role.name}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{role.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'
                }`}>
                  {role.count} 人
                </span>
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <h3 className="font-semibold mb-4">用户等级</h3>
        <div className="space-y-3">
          {[
            { name: '新手', minPoints: 0, color: 'bg-gray-400' },
            { name: '初级', minPoints: 100, color: 'bg-green-400' },
            { name: '中级', minPoints: 500, color: 'bg-blue-400' },
            { name: '高级', minPoints: 2000, color: 'bg-purple-400' },
            { name: '专家', minPoints: 5000, color: 'bg-orange-400' },
            { name: '大师', minPoints: 10000, color: 'bg-red-400' },
          ].map((level, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
              <div className={`w-4 h-4 rounded-full ${level.color}`} />
              <div className="flex-1">
                <p className="font-medium">{level.name}</p>
              </div>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                最低 {level.minPoints} 积分
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 根据当前选中的部分渲染对应内容
  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'users':
        return renderUserSettings();
      case 'points':
        return renderPointsSettings();
      case 'storage':
        return renderStorageSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">系统设置</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            管理平台全局配置和系统参数
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              重置
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              hasChanges
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            保存设置
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧菜单 */}
        <div className="lg:col-span-1">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}>
            {settingSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-red-600 text-white'
                      : isDark 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
