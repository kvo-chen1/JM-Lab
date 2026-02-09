import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  HelpCircle,
  Lightbulb,
  ExternalLink,
  BookOpen,
  MessageCircle,
  Bell,
  Shield,
  Layout,
  User,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Volume2
} from 'lucide-react';
import { SettingCategory } from './SettingsSidebar';
import ThemePreview from './ThemePreview';
import ModelStatusCard from './ModelStatusCard';
import { Theme } from '@/config/themeConfig';

interface SettingsPreviewProps {
  activeCategory: SettingCategory;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onOpenModelSelector: () => void;
}

// 帮助内容配置
const helpContent: Record<SettingCategory, { title: string; tips: string[]; links: { label: string; url: string }[] }> = {
  theme: {
    title: '主题帮助',
    tips: [
      '自动主题会根据系统设置自动切换深浅色',
      '自定义主题可以创建独特的配色方案',
      '主题设置会立即生效并保存到本地',
    ],
    links: [
      { label: '了解更多主题选项', url: '/help/themes' },
      { label: '自定义主题指南', url: '/help/custom-theme' },
    ],
  },
  model: {
    title: 'API 配置帮助',
    tips: [
      'API密钥仅保存在本地浏览器中',
      '支持 Kimi、DeepSeek 等多种AI服务',
      '可以在不同模型间自由切换',
    ],
    links: [
      { label: '如何获取API密钥', url: '/help/api-keys' },
      { label: '模型对比与选择', url: '/help/model-comparison' },
    ],
  },
  notification: {
    title: '通知设置帮助',
    tips: [
      '关闭通知后仍可查看消息列表',
      '每日摘要会在早上9点发送',
      '通知声音可以在系统设置中调整',
    ],
    links: [
      { label: '通知管理指南', url: '/help/notifications' },
      { label: '消息中心使用', url: '/help/messages' },
    ],
  },
  privacy: {
    title: '隐私设置帮助',
    tips: [
      '数据收集仅用于改进产品体验',
      '您可以随时导出或删除个人数据',
      '清除缓存不会影响您的账户数据',
    ],
    links: [
      { label: '隐私政策', url: '/privacy' },
      { label: '数据使用说明', url: '/help/data-usage' },
    ],
  },
  interface: {
    title: '界面设置帮助',
    tips: [
      '字体大小调整会影响整个应用',
      '紧凑布局适合小屏幕设备',
      '语言切换后会立即生效',
    ],
    links: [
      { label: '界面自定义指南', url: '/help/interface' },
      { label: '快捷键列表', url: '/help/shortcuts' },
    ],
  },
  account: {
    title: '账户管理帮助',
    tips: [
      '定期更换密码可以提高安全性',
      '启用两步验证保护账户安全',
      '数据导出包含您的所有信息',
    ],
    links: [
      { label: '账户安全指南', url: '/help/security' },
      { label: '常见问题', url: '/help/faq' },
    ],
  },
  advanced: {
    title: '高级功能帮助',
    tips: [
      '开发者模式会显示额外的调试信息',
      'API调试仅在开发者模式下可用',
      '性能监控可以帮助优化加载速度',
    ],
    links: [
      { label: '开发者文档', url: '/docs' },
      { label: 'API参考', url: '/docs/api' },
    ],
  },
  danger: {
    title: '危险操作说明',
    tips: [
      '账号注销是不可逆的操作',
      '建议先导出您的数据备份',
      '注销后无法恢复任何数据',
    ],
    links: [
      { label: '数据导出指南', url: '/help/export' },
      { label: '联系客服', url: '/help/support' },
    ],
  },
};

// 模拟模型状态数据
const mockModelStatus = [
  { name: 'Kimi AI', status: 'connected' as const, latency: 245 },
  { name: 'DeepSeek', status: 'disconnected' as const },
  { name: 'OpenAI', status: 'disconnected' as const },
];

export function SettingsPreview({ activeCategory, theme, onThemeChange, onOpenModelSelector }: SettingsPreviewProps) {
  const help = helpContent[activeCategory];

  return (
    <div className="h-full flex flex-col">
      {/* 预览区域 */}
      <div className="flex-1 overflow-y-auto">
        {activeCategory === 'theme' && (
          <ThemePreview currentTheme={theme} onThemeChange={onThemeChange} />
        )}

        {activeCategory === 'model' && (
          <ModelStatusCard models={mockModelStatus} onConfigure={onOpenModelSelector} />
        )}

        {/* 通知设置预览 */}
        {activeCategory === 'notification' && (
          <div className="p-6">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-sm">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">通知预览</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* 通知示例 */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">新消息提醒</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">您有一条新的评论回复</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">2分钟前</p>
                  </div>
                </div>
                {/* 声音指示器 */}
                <div className="flex items-center gap-2 p-2">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 隐私设置预览 */}
        {activeCategory === 'privacy' && (
          <div className="p-6">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-sm">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">隐私状态</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">数据加密</span>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">已启用</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">本地存储</span>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">已启用</span>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-400 text-center">
                    您的数据仅保存在本地浏览器中
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 界面设置预览 */}
        {activeCategory === 'interface' && (
          <div className="p-6">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-sm">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Layout className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">界面预览</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* 字体大小预览 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">字体大小</span>
                    <span className="text-xs text-purple-600 font-medium">中</span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-2">
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">标题文字</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">正文内容预览</p>
                  </div>
                </div>
                {/* 布局预览 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">布局紧凑度</span>
                    <span className="text-xs text-purple-600 font-medium">标准</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30" />
                    <div className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 账户设置预览 */}
        {activeCategory === 'account' && (
          <div className="p-6">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-sm">
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">账户状态</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* 安全评分 */}
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200 dark:text-gray-700" />
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="226" strokeDashoffset="45" className="text-green-500" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">80</span>
                      <span className="text-xs text-gray-500">安全分</span>
                    </div>
                  </div>
                </div>
                {/* 安全项 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>已绑定手机</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>已设置密码</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>上次登录: 今天</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 高级设置预览 */}
        {activeCategory === 'advanced' && (
          <div className="p-6">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] shadow-sm">
              <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">开发者模式</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* 控制台样式预览 */}
                <div className="rounded-lg bg-gray-900 p-3 font-mono text-xs">
                  <div className="text-green-400">$ API Status: Connected</div>
                  <div className="text-blue-400 mt-1">&gt; Latency: 24ms</div>
                  <div className="text-yellow-400 mt-1">! Debug mode active</div>
                  <div className="text-gray-500 mt-1">&gt; Monitoring...</div>
                </div>
                {/* 性能指标 */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-gray-50 dark:bg-gray-800 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">24ms</div>
                    <div className="text-xs text-gray-500">API延迟</div>
                  </div>
                  <div className="p-2 rounded bg-gray-50 dark:bg-gray-800 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">60fps</div>
                    <div className="text-xs text-gray-500">帧率</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 危险操作预览 */}
        {activeCategory === 'danger' && (
          <div className="p-6">
            <div className="rounded-xl overflow-hidden border border-red-200 dark:border-red-800 bg-white dark:bg-[#1a1a1a] shadow-sm">
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-b border-red-100 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-sm text-red-700 dark:text-red-400">危险操作警告</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400 text-center">
                    账号注销是不可逆的操作
                  </p>
                </div>
                {/* 数据备份提醒 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>建议先导出数据备份</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>确认无未完成的交易</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>注销后无法恢复数据</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 帮助信息 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {help.title}
            </h3>
          </div>

          {/* 提示列表 */}
          <div className="space-y-3 mb-6">
            {help.tips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2"
              >
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tip}
                </p>
              </motion.div>
            ))}
          </div>

          {/* 相关链接 */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
              相关链接
            </h4>
            {help.links.map((link, index) => (
              <motion.a
                key={index}
                href={link.url}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={clsx(
                  'flex items-center gap-2 p-2 rounded-lg',
                  'text-sm text-gray-700 dark:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'transition-colors group'
                )}
              >
                <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="flex-1">{link.label}</span>
                <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* 底部反馈 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={clsx(
            'w-full flex items-center justify-center gap-2',
            'px-4 py-2.5 rounded-xl',
            'bg-gradient-to-r from-blue-500 to-purple-600',
            'text-white text-sm font-medium',
            'hover:shadow-lg hover:shadow-blue-500/25',
            'transition-all duration-200'
          )}
        >
          <MessageCircle className="w-4 h-4" />
          需要帮助？
        </motion.button>
      </div>
    </div>
  );
}

export default SettingsPreview;
