import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Cpu,
  Bell,
  Shield,
  Layout,
  User,
  Settings,
  AlertTriangle,
  Moon,
  Volume2,
  Clock,
  Database,
  Trash2,
  Globe,
  Type,
  Grid3X3,
  Redo,
  Edit3,
  Lock,
  ShieldCheck,
  Download,
  Code,
  Bug,
  Gauge,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SettingCategory } from './SettingsSidebar';
import { SettingItem, SettingSwitch, SettingSelect, SettingSlider, SettingButton } from './SettingItem';

interface SettingsContentProps {
  activeCategory: SettingCategory;
  // 主题设置
  theme: string;
  onThemeChange: (theme: string) => void;
  // 模型设置
  onOpenModelSelector: () => void;
  // 通知设置
  notificationsEnabled: boolean;
  onNotificationsChange: (enabled: boolean) => void;
  notificationSound: boolean;
  onNotificationSoundChange: (enabled: boolean) => void;
  notificationFrequency: string;
  onNotificationFrequencyChange: (frequency: string) => void;
  // 隐私设置
  dataCollectionEnabled: boolean;
  onDataCollectionChange: (enabled: boolean) => void;
  onClearCache: () => void;
  // 界面设置
  language: string;
  onLanguageChange: (language: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  layoutCompactness: string;
  onLayoutCompactnessChange: (compactness: string) => void;
  onResetGuide: () => void;
  // 账户设置
  onExportData: () => void;
  isExporting: boolean;
  // 高级设置
  developerMode: boolean;
  onDeveloperModeChange: (enabled: boolean) => void;
  apiDebugging: boolean;
  onApiDebuggingChange: (enabled: boolean) => void;
  performanceMonitoring: boolean;
  onPerformanceMonitoringChange: (enabled: boolean) => void;
  // 危险操作
  onDeleteAccount: () => void;
}

const categoryConfig: Record<SettingCategory, { title: string; description: string; icon: React.ElementType }> = {
  theme: { title: '主题设置', description: '自定义应用的外观和配色方案', icon: Palette },
  model: { title: '模型与API', description: '配置AI模型和API密钥', icon: Cpu },
  notification: { title: '通知设置', description: '管理消息提醒和通知偏好', icon: Bell },
  privacy: { title: '隐私设置', description: '控制数据收集和隐私选项', icon: Shield },
  interface: { title: '界面设置', description: '调整显示和交互偏好', icon: Layout },
  account: { title: '账户管理', description: '管理您的账户信息和安全', icon: User },
  advanced: { title: '高级设置', description: '开发者选项和调试工具', icon: Settings },
  danger: { title: '危险操作', description: '不可逆的账户操作', icon: AlertTriangle },
};

export function SettingsContent(props: SettingsContentProps) {
  const config = categoryConfig[props.activeCategory];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* 分类标题 */}
      <motion.div
        key={props.activeCategory}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-gray-800"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {config.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {config.description}
          </p>
        </div>
      </motion.div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={props.activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {renderCategoryContent(props)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function renderCategoryContent(props: SettingsContentProps) {
  switch (props.activeCategory) {
    case 'theme':
      return (
        <>
          <div className="md:col-span-2">
            <SettingItem
              icon={Moon}
              title="当前主题"
              description="选择您喜欢的主题风格，支持自动跟随系统"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {props.theme === 'auto' ? '自动' :
                   props.theme === 'light' ? '浅色' :
                   props.theme === 'dark' ? '深色' :
                   props.theme === 'pink' ? '粉色' :
                   props.theme === 'blue' ? '蓝色' : '绿色'}
                </span>
                <SettingButton onClick={() => {
                  const themes = ['light', 'dark', 'auto', 'pink', 'blue', 'green'];
                  const currentIndex = themes.indexOf(props.theme);
                  const nextIndex = (currentIndex + 1) % themes.length;
                  props.onThemeChange(themes[nextIndex]);
                }}>
                  切换主题
                </SettingButton>
              </div>
            </SettingItem>
          </div>
        </>
      );

    case 'model':
      return (
        <>
          <div className="md:col-span-2">
            <SettingItem
              icon={Cpu}
              title="AI 模型配置"
              description="配置 Kimi、DeepSeek 等AI服务的API密钥"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  密钥仅保存在本地浏览器中
                </span>
                <SettingButton onClick={props.onOpenModelSelector} variant="primary">
                  打开模型设置
                </SettingButton>
              </div>
            </SettingItem>
          </div>
        </>
      );

    case 'notification':
      return (
        <>
          <SettingItem
            icon={Bell}
            title="启用通知"
            description="接收应用内的消息和提醒通知"
          >
            <SettingSwitch
              checked={props.notificationsEnabled}
              onChange={props.onNotificationsChange}
            />
          </SettingItem>

          <SettingItem
            icon={Volume2}
            title="通知声音"
            description="播放声音提醒新消息"
            disabled={!props.notificationsEnabled}
          >
            <SettingSwitch
              checked={props.notificationSound}
              onChange={props.onNotificationSoundChange}
            />
          </SettingItem>

          <div className="md:col-span-2">
            <SettingItem
              icon={Clock}
              title="通知频率"
              description="选择接收通知的时间间隔"
              disabled={!props.notificationsEnabled}
            >
              <SettingSelect
                value={props.notificationFrequency}
                onChange={props.onNotificationFrequencyChange}
                options={[
                  { value: 'immediate', label: '立即通知' },
                  { value: 'digest', label: '每日摘要' },
                  { value: 'weekly', label: '每周汇总' },
                ]}
              />
            </SettingItem>
          </div>
        </>
      );

    case 'privacy':
      return (
        <>
          <SettingItem
            icon={Database}
            title="数据收集"
            description="允许收集使用数据以改进产品体验"
          >
            <SettingSwitch
              checked={props.dataCollectionEnabled}
              onChange={props.onDataCollectionChange}
            />
          </SettingItem>

          <SettingItem
            icon={Trash2}
            title="清除缓存"
            description="清除本地存储的缓存数据"
          >
            <SettingButton onClick={props.onClearCache} variant="secondary">
              立即清除
            </SettingButton>
          </SettingItem>
        </>
      );

    case 'interface':
      return (
        <>
          <SettingItem
            icon={Globe}
            title="语言"
            description="选择界面显示语言"
          >
            <SettingSelect
              value={props.language}
              onChange={props.onLanguageChange}
              options={[
                { value: 'zh-CN', label: '中文 (简体)' },
                { value: 'en-US', label: 'English' },
              ]}
            />
          </SettingItem>

          <div className="md:col-span-2">
            <SettingItem
              icon={Type}
              title="字体大小"
              description="调整界面文字大小"
            >
              <SettingSlider
                value={props.fontSize}
                onChange={props.onFontSizeChange}
                min={12}
                max={24}
                step={1}
              />
            </SettingItem>
          </div>

          <SettingItem
            icon={Grid3X3}
            title="布局紧凑度"
            description="调整界面元素的间距"
          >
            <SettingSelect
              value={props.layoutCompactness}
              onChange={props.onLayoutCompactnessChange}
              options={[
                { value: 'compact', label: '紧凑' },
                { value: 'standard', label: '标准' },
                { value: 'spacious', label: '宽松' },
              ]}
            />
          </SettingItem>

          <SettingItem
            icon={Redo}
            title="重置新手引导"
            description="重新显示应用引导教程"
          >
            <SettingButton onClick={props.onResetGuide} variant="ghost">
              重置引导
            </SettingButton>
          </SettingItem>
        </>
      );

    case 'account':
      return (
        <>
          <SettingItem
            icon={Edit3}
            title="编辑个人资料"
            description="修改您的个人信息和头像"
          >
            <Link to="/profile/edit">
              <SettingButton variant="secondary" icon={ChevronRight}>
                前往编辑
              </SettingButton>
            </Link>
          </SettingItem>

          <SettingItem
            icon={Lock}
            title="修改密码"
            description="更改您的登录密码"
          >
            <Link to="/password/change">
              <SettingButton variant="secondary" icon={ChevronRight}>
                修改密码
              </SettingButton>
            </Link>
          </SettingItem>

          <SettingItem
            icon={ShieldCheck}
            title="账号安全"
            description="管理安全设置和登录设备"
          >
            <Link to="/account/security">
              <SettingButton variant="secondary" icon={ChevronRight}>
                安全设置
              </SettingButton>
            </Link>
          </SettingItem>

          <SettingItem
            icon={Download}
            title="导出个人数据"
            description="下载您的所有数据副本"
          >
            <SettingButton
              onClick={props.onExportData}
              variant="secondary"
              disabled={props.isExporting}
            >
              {props.isExporting ? '导出中...' : '开始导出'}
            </SettingButton>
          </SettingItem>
        </>
      );

    case 'advanced':
      return (
        <>
          <SettingItem
            icon={Code}
            title="开发者模式"
            description="启用高级功能和调试选项"
          >
            <SettingSwitch
              checked={props.developerMode}
              onChange={props.onDeveloperModeChange}
            />
          </SettingItem>

          <SettingItem
            icon={Bug}
            title="API 调试"
            description="在控制台显示API请求详情"
            disabled={!props.developerMode}
          >
            <SettingSwitch
              checked={props.apiDebugging}
              onChange={props.onApiDebuggingChange}
            />
          </SettingItem>

          <SettingItem
            icon={Gauge}
            title="性能监控"
            description="显示性能指标和加载时间"
          >
            <SettingSwitch
              checked={props.performanceMonitoring}
              onChange={props.onPerformanceMonitoringChange}
            />
          </SettingItem>
        </>
      );

    case 'danger':
      return (
        <>
          <div className="md:col-span-2">
            <SettingItem
              icon={AlertOctagon}
              title="注销账号"
              description="永久删除您的账号和所有数据，此操作不可撤销"
            >
              <SettingButton onClick={props.onDeleteAccount} variant="danger" fullWidth>
                注销账号
              </SettingButton>
            </SettingItem>
          </div>

          <div className="md:col-span-2 mt-4">
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                    警告
                  </h4>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    注销账号后，您的所有数据将被永久删除，包括个人资料、作品、收藏、消息记录等。此操作无法撤销。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      );

    default:
      return null;
  }
}

export default SettingsContent;
