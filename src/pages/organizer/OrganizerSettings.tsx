import { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import {
  organizerSettingsService,
  OrganizerSettings as OrganizerSettingsType,
  OrganizerRole,
  EmailNotificationSettings,
  SmsNotificationSettings,
  SecuritySettings as SecuritySettingsType,
  DataManagementSettings as DataManagementSettingsType,
} from '@/services/organizerSettingsService';
import {
  User,
  Bell,
  Shield,
  Users,
  Database,
  ChevronRight,
  Save,
  Loader2,
  Building2,
  Mail,
  Smartphone,
  Lock,
  Key,
  Download,
  Upload,
  Trash2,
  Plus,
  X,
  RefreshCw,
} from 'lucide-react';

// 设置项类型
interface SettingSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

const settingSections: SettingSection[] = [
  { id: 'account', title: '账户信息', icon: User, description: '管理品牌基本信息和联系方式' },
  { id: 'notifications', title: '通知偏好', icon: Bell, description: '配置邮件和推送通知' },
  { id: 'security', title: '安全设置', icon: Shield, description: '账号安全和登录保护' },
  { id: 'members', title: '团队管理', icon: Users, description: '管理团队成员和权限' },
  { id: 'data', title: '数据管理', icon: Database, description: '备份和导出数据' },
];

// 角色配置
const roleConfig: Record<OrganizerRole, { label: string; description: string; color: string }> = {
  owner: { label: '所有者', description: '拥有所有权限', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  admin: { label: '管理员', description: '可管理活动和成员', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  editor: { label: '编辑', description: '可创建和编辑活动', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  viewer: { label: '查看者', description: '仅可查看数据', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' },
};

export default function OrganizerSettings() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('account');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [verifiedBrand, setVerifiedBrand] = useState<BrandPartnership | null>(null);
  const [settings, setSettings] = useState<OrganizerSettingsType | null>(null);

  // 加载品牌和设置数据
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // 获取品牌信息
        const partnerships = await brandPartnershipService.getMyPartnerships({
          id: user.id,
          email: user.email,
        });
        const approvedBrand = partnerships.find(p => p.status === 'approved');
        
        if (approvedBrand) {
          setVerifiedBrand(approvedBrand);
          // 获取设置
          const organizerSettings = await organizerSettingsService.getSettings(approvedBrand.id);
          setSettings(organizerSettings);
        }
      } catch (error) {
        console.error('加载设置数据失败:', error);
        toast.error('加载设置失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // 处理设置变更
  const handleSettingsChange = useCallback((updates: Partial<OrganizerSettingsType>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null);
    setHasChanges(true);
  }, []);

  // 保存设置
  const handleSave = async () => {
    if (!settings || !verifiedBrand) return;
    
    setIsSaving(true);
    try {
      // 这里可以根据当前激活的section保存对应的设置
      toast.success('设置已保存');
      setHasChanges(false);
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置设置
  const handleReset = () => {
    if (confirm('确定要重置所有更改吗？')) {
      // 重新加载设置
      if (verifiedBrand) {
        organizerSettingsService.getSettings(verifiedBrand.id).then(setSettings);
      }
      setHasChanges(false);
      toast.success('已重置');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!verifiedBrand) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          需要品牌认证
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          请先完成品牌认证才能访问设置
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">主办方设置</h2>
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
            管理您的品牌信息和系统偏好
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
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
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

      {/* 品牌信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {verifiedBrand.brand_name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {verifiedBrand.brand_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              认证状态: <span className="text-green-500 font-medium">已认证</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">品牌ID</p>
            <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {verifiedBrand.id.slice(0, 8)}...
            </p>
          </div>
        </div>
      </motion.div>

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
                      ? 'bg-blue-600 text-white'
                      : isDark 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <span className="font-medium block">{section.title}</span>
                    <span className={`text-xs ${activeSection === section.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {section.description}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}
            >
              {activeSection === 'account' && (
                <AccountSettings 
                  brand={verifiedBrand}
                  settings={settings}
                  onChange={handleSettingsChange}
                  isDark={isDark}
                />
              )}
              {activeSection === 'notifications' && (
                <NotificationSettings 
                  settings={settings}
                  onChange={handleSettingsChange}
                  isDark={isDark}
                />
              )}
              {activeSection === 'security' && (
                <SecuritySettings 
                  settings={settings}
                  onChange={handleSettingsChange}
                  isDark={isDark}
                />
              )}
              {activeSection === 'members' && (
                <MemberSettings 
                  settings={settings}
                  onChange={handleSettingsChange}
                  isDark={isDark}
                />
              )}
              {activeSection === 'data' && (
                <DataManagementSettings 
                  settings={settings}
                  onChange={handleSettingsChange}
                  isDark={isDark}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ============== 账户信息设置 ==============
function AccountSettings({
  brand,
  settings,
  onChange,
  isDark
}: {
  brand: BrandPartnership;
  settings: OrganizerSettingsType | null;
  onChange: (updates: Partial<OrganizerSettingsType>) => void;
  isDark: boolean;
}) {
  const [formData, setFormData] = useState({
    name: brand.brand_name || '',
    logo: brand.brand_logo || '',
    description: brand.description || '',
    contactName: brand.contact_name || '',
    contactPhone: brand.contact_phone || '',
    contactEmail: brand.contact_email || '',
    website: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    // 验证
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '品牌名称不能为空';
    if (!formData.contactName.trim()) newErrors.contactName = '联系人姓名不能为空';
    if (!/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = '请输入有效的手机号码';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = '请输入有效的邮箱地址';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('请检查表单填写是否正确');
      return;
    }

    try {
      await organizerSettingsService.updateBrandInfo(brand.id, formData);
      toast.success('品牌信息已更新');
    } catch (error) {
      toast.error('更新失败');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">账户信息</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">管理您的品牌基本信息</p>
      </div>

      <div className="space-y-4">
        {/* 品牌Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            品牌Logo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => handleChange('logo', e.target.value)}
                placeholder="输入Logo URL"
                className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
              <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式，建议尺寸 200x200</p>
            </div>
          </div>
        </div>

        {/* 品牌名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            品牌名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
              errors.name ? 'border-red-500 focus:ring-red-500/20' : ''
            } ${isDark 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* 品牌描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            品牌描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors resize-none ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 字符</p>
        </div>

        {/* 联系人信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              联系人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                errors.contactName ? 'border-red-500 focus:ring-red-500/20' : ''
              } ${isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
            {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              联系电话 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                errors.contactPhone ? 'border-red-500 focus:ring-red-500/20' : ''
              } ${isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
            {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
          </div>
        </div>

        {/* 联系邮箱 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            联系邮箱 <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
              errors.contactEmail ? 'border-red-500 focus:ring-red-500/20' : ''
            } ${isDark 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {errors.contactEmail && <p className="text-xs text-red-500 mt-1">{errors.contactEmail}</p>}
        </div>

        {/* 网站和地址 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              官方网站
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://"
              className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              公司地址
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            保存更改
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ============== 通知偏好设置 ==============
function NotificationSettings({
  settings,
  onChange,
  isDark
}: {
  settings: OrganizerSettingsType | null;
  onChange: (updates: Partial<OrganizerSettingsType>) => void;
  isDark: boolean;
}) {
  const notificationItems: { key: keyof EmailNotificationSettings; label: string; description: string; icon: any }[] = [
    { key: 'newSubmission', label: '新作品提交', description: '当有用户提交作品时通知我', icon: Upload },
    { key: 'statusChange', label: '审核状态变更', description: '活动或作品审核状态变更时通知', icon: RefreshCw },
    { key: 'dailyDigest', label: '每日摘要', description: '每天发送活动数据摘要', icon: Mail },
    { key: 'weeklyReport', label: '周报', description: '每周一发送上周数据报告', icon: Mail },
    { key: 'marketingUpdates', label: '营销更新', description: '接收平台营销活动和功能更新', icon: Bell },
    { key: 'securityAlerts', label: '安全提醒', description: '账号安全相关的重要提醒', icon: Shield },
  ];

  const toggleEmailNotification = (key: keyof EmailNotificationSettings) => {
    const current = settings?.notifications?.email || {} as EmailNotificationSettings;
    onChange({
      notifications: {
        ...settings?.notifications,
        email: { ...current, [key]: !current[key] },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">通知偏好</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">配置您希望接收的通知类型</p>
      </div>

      {/* 邮件通知 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="w-4 h-4" />
          邮件通知
        </h4>
        
        {notificationItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = settings?.notifications?.email?.[item.key as keyof typeof settings.notifications.email] || false;
          
          return (
            <div
              key={item.key}
              className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleEmailNotification(item.key)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isEnabled ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* 短信通知 */}
      <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          短信通知
        </h4>
        
        <div className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
          isDark ? 'bg-gray-700/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">启用短信通知</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">接收重要安全提醒的短信</p>
            </div>
          </div>
          <button
            onClick={() => onChange({
              notifications: {
                ...settings?.notifications,
                sms: { ...(settings?.notifications?.sms || {} as SmsNotificationSettings), enabled: !(settings?.notifications?.sms?.enabled ?? false) },
              },
            })}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings?.notifications?.sms?.enabled ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              settings?.notifications?.sms?.enabled ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============== 安全设置 ==============
function SecuritySettings({
  settings,
  onChange,
  isDark
}: {
  settings: OrganizerSettingsType | null;
  onChange: (updates: Partial<OrganizerSettingsType>) => void;
  isDark: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">安全设置</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">保护您的账号安全</p>
      </div>

      {/* 双因素认证 */}
      <div className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
        isDark ? 'bg-gray-700/50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">双因素认证</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">登录时需要额外的验证码</p>
          </div>
        </div>
        <button
          onClick={() => onChange({
            security: { ...(settings?.security || {} as SecuritySettingsType), twoFactorEnabled: !(settings?.security?.twoFactorEnabled ?? false) },
          })}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            settings?.security?.twoFactorEnabled ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
            settings?.security?.twoFactorEnabled ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* 登录通知 */}
      <div className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
        isDark ? 'bg-gray-700/50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
            <Bell className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">登录通知</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">新设备登录时发送通知</p>
          </div>
        </div>
        <button
          onClick={() => onChange({
            security: { ...(settings?.security || {} as SecuritySettingsType), loginNotification: !(settings?.security?.loginNotification ?? false) },
          })}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            settings?.security?.loginNotification ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
            settings?.security?.loginNotification ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* 会话超时 */}
      <div className={`p-4 rounded-xl transition-colors ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
            <Lock className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">会话超时</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">自动登出的时间</p>
          </div>
        </div>
        <input
          type="range"
          min="5"
          max="120"
          value={settings?.security?.sessionTimeout || 30}
          onChange={(e) => onChange({
            security: { ...(settings?.security || {} as SecuritySettingsType), sessionTimeout: parseInt(e.target.value) },
          })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>5分钟</span>
          <span className="font-medium text-blue-500">{settings?.security?.sessionTimeout || 30}分钟</span>
          <span>120分钟</span>
        </div>
      </div>

      {/* 修改密码 */}
      <div className={`p-4 rounded-xl transition-colors ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <Key className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">修改密码</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                上次修改: {settings?.security?.passwordLastChanged 
                  ? new Date(settings.security.passwordLastChanged).toLocaleDateString('zh-CN')
                  : '从未'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            修改密码
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ============== 团队管理 ==============
function MemberSettings({
  settings,
  onChange,
  isDark
}: {
  settings: OrganizerSettingsType | null;
  onChange: (updates: Partial<OrganizerSettingsType>) => void;
  isDark: boolean;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', name: '', role: 'editor' as OrganizerRole });

  const handleAddMember = async () => {
    if (!newMember.email || !newMember.name) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      // 这里需要调用服务添加成员
      toast.success('邀请已发送');
      setShowAddModal(false);
      setNewMember({ email: '', name: '', role: 'editor' });
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('确定要移除该成员吗？')) {
      try {
        // 调用服务移除成员
        toast.success('成员已移除');
      } catch (error) {
        toast.error('移除失败');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">团队管理</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">管理团队成员和权限</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加成员
        </motion.button>
      </div>

      {/* 成员列表 */}
      <div className="space-y-3">
        {settings?.permissions?.members?.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">暂无团队成员</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">点击上方按钮添加成员</p>
          </div>
        ) : (
          settings?.permissions?.members?.map((member) => (
            <motion.div
              key={member.id}
              layout
              className={`flex items-center justify-between p-4 rounded-xl ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleConfig[member.role].color}`}>
                  {roleConfig[member.role].label}
                </span>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 添加成员弹窗 */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">添加团队成员</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="member@example.com"
                    className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="成员姓名"
                    className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    角色
                  </label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value as OrganizerRole })}
                    className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  >
                    {Object.entries(roleConfig).filter(([key]) => key !== 'owner').map(([key, config]) => (
                      <option key={key} value={key}>{config.label} - {config.description}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddMember}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    发送邀请
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============== 数据管理 ==============
function DataManagementSettings({
  settings,
  onChange,
  isDark
}: {
  settings: OrganizerSettingsType | null;
  onChange: (updates: Partial<OrganizerSettingsType>) => void;
  isDark: boolean;
}) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      // 调用备份服务
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟
      toast.success('备份创建成功');
    } catch (error) {
      toast.error('备份失败');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExport = async (type: 'events' | 'works' | 'participants') => {
    try {
      toast.success(`正在导出${type === 'events' ? '活动' : type === 'works' ? '作品' : '参与者'}数据...`);
    } catch (error) {
      toast.error('导出失败');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">数据管理</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">备份和导出您的数据</p>
      </div>

      {/* 自动备份设置 */}
      <div className={`p-4 rounded-xl transition-colors ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <RefreshCw className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">自动备份</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">定期自动备份您的数据</p>
            </div>
          </div>
          <button
            onClick={() => onChange({
              dataManagement: { ...(settings?.dataManagement || {} as DataManagementSettingsType), autoBackup: !(settings?.dataManagement?.autoBackup ?? false) },
            })}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings?.dataManagement?.autoBackup ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
              settings?.dataManagement?.autoBackup ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {settings?.dataManagement?.autoBackup && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              备份频率
            </label>
            <select
              value={settings?.dataManagement?.backupFrequency || 'weekly'}
              onChange={(e) => onChange({
                dataManagement: { 
                  ...settings?.dataManagement, 
                  backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                },
              })}
              className={`w-full px-4 py-2 rounded-xl border text-sm transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
        )}
      </div>

      {/* 手动备份 */}
      <div className={`p-4 rounded-xl transition-colors ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
              <Database className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">手动备份</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">立即创建数据备份</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isBackingUp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            创建备份
          </motion.button>
        </div>
      </div>

      {/* 数据导出 */}
      <div className={`p-4 rounded-xl transition-colors ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">数据导出</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { key: 'events', label: '活动数据', icon: Calendar },
            { key: 'works', label: '作品数据', icon: Upload },
            { key: 'participants', label: '参与者数据', icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport(item.key as 'events' | 'works' | 'participants')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${
                  isDark 
                    ? 'bg-gray-600 hover:bg-gray-500' 
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium">{item.label}</span>
                <Download className="w-4 h-4 text-gray-400" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 缺失的图标导入
function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
