import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Palette,
  Cpu,
  Bell,
  Shield,
  Layout,
  User,
  Settings,
  AlertTriangle,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export type SettingCategory =
  | 'theme'
  | 'model'
  | 'notification'
  | 'privacy'
  | 'interface'
  | 'account'
  | 'advanced'
  | 'danger';

interface NavItem {
  id: SettingCategory;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const navItems: NavItem[] = [
  { id: 'theme', label: '主题', icon: Palette, description: '外观与配色' },
  { id: 'model', label: '模型与API', icon: Cpu, description: 'AI模型配置' },
  { id: 'notification', label: '通知', icon: Bell, description: '消息提醒设置' },
  { id: 'privacy', label: '隐私', icon: Shield, description: '数据与隐私' },
  { id: 'interface', label: '界面', icon: Layout, description: '显示与交互' },
  { id: 'account', label: '账户', icon: User, description: '账号管理' },
  { id: 'advanced', label: '高级', icon: Settings, description: '开发者选项' },
  { id: 'danger', label: '危险操作', icon: AlertTriangle, description: '账号注销' },
];

interface SettingsSidebarProps {
  activeCategory: SettingCategory;
  onCategoryChange: (category: SettingCategory) => void;
}

export function SettingsSidebar({ activeCategory, onCategoryChange }: SettingsSidebarProps) {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="h-full flex flex-col">
      {/* 头部标题 */}
      <div className="px-6 py-6 border-b border-gray-200/50 dark:border-gray-800/50">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          设置
        </motion.h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          管理您的偏好和账户
        </p>
      </div>

      {/* 导航列表 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeCategory === item.id;
          const isDanger = item.id === 'danger';

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onCategoryChange(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                'transition-all duration-200 ease-out',
                'group relative overflow-hidden',
                isActive
                  ? isDanger
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              )}
            >
              {/* 活跃指示器 */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className={clsx(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full',
                    isDanger ? 'bg-red-500' : 'bg-gradient-to-b from-blue-500 to-purple-500'
                  )}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* 图标 */}
              <div
                className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                  isActive
                    ? isDanger
                      ? 'bg-red-100 dark:bg-red-800/30'
                      : 'bg-blue-100 dark:bg-blue-800/30'
                    : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* 文字内容 */}
              <div className="flex-1 text-left">
                <div className={clsx(
                  'font-medium text-sm',
                  isActive && (isDanger ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400')
                )}>
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {item.description}
                </div>
              </div>

              {/* 箭头 */}
              <ChevronRight
                className={clsx(
                  'w-4 h-4 transition-transform duration-200',
                  isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                )}
              />
            </motion.button>
          );
        })}
      </nav>

      {/* 底部用户信息 */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
              {user?.username || '用户'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || 'user@example.com'}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsSidebar;
