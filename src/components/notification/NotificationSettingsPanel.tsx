import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Monitor,
  Moon,
  Sun,
  Clock,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  X
} from 'lucide-react';
import type {
  NotificationSettings,
  NotificationCategory,
  NotificationType
} from '../../types/notification';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  DEFAULT_NOTIFICATION_SETTINGS
} from '../../types/notification';
import { notificationBatchService } from '../../services/notificationBatchService';

interface NotificationSettingsPanelProps {
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
  userId?: string;
  isDark?: boolean;
}

const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  settings: initialSettings,
  onSettingsChange,
  userId,
  isDark = false
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [expandedCategory, setExpandedCategory] = useState<NotificationCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const updateSettings = useCallback(async (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    onSettingsChange(newSettings);
    
    if (userId) {
      setIsSaving(true);
      try {
        await notificationBatchService.saveSettingsToDB(userId, newSettings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (error) {
        console.error('Failed to save settings:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      notificationBatchService.saveSettingsToStorage(newSettings);
    }
  }, [userId, onSettingsChange]);

  const toggleCategory = (category: NotificationCategory) => {
    const categoryConfig = NOTIFICATION_CATEGORIES.find(c => c.category === category);
    if (!categoryConfig || (!categoryConfig.canDisable && settings.categories[category])) {
      return;
    }

    const newSettings = notificationBatchService.updateCategorySetting(
      settings,
      category,
      !settings.categories[category]
    );
    updateSettings(newSettings);
  };

  const toggleType = (type: NotificationType) => {
    const newSettings = notificationBatchService.updateTypeSetting(
      settings,
      type,
      !settings.types[type]
    );
    updateSettings(newSettings);
  };

  const toggleQuietHours = () => {
    updateSettings({
      ...settings,
      quietHoursEnabled: !settings.quietHoursEnabled
    });
  };

  const updateQuietHours = (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    updateSettings({
      ...settings,
      [field]: value
    });
  };

  const toggleGlobalSetting = (field: keyof NotificationSettings) => {
    updateSettings({
      ...settings,
      [field]: !settings[field]
    });
  };

  return (
    <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              通知设置
            </h3>
          </div>
          {isSaving && (
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              保存中...
            </span>
          )}
          {saveSuccess && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-sm text-green-500"
            >
              <Check className="w-4 h-4" />
              已保存
            </motion.span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {settings.enabled ? (
                <Bell className="w-5 h-5 text-blue-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                通知总开关
              </span>
            </div>
            <button
              onClick={() => toggleGlobalSetting('enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            >
              <motion.span
                layout
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SettingToggle
              icon={settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              label="声音提醒"
              enabled={settings.soundEnabled}
              onChange={() => toggleGlobalSetting('soundEnabled')}
              disabled={!settings.enabled}
              isDark={isDark}
            />
            <SettingToggle
              icon={<Monitor className="w-4 h-4" />}
              label="桌面通知"
              enabled={settings.desktopEnabled}
              onChange={() => toggleGlobalSetting('desktopEnabled')}
              disabled={!settings.enabled}
              isDark={isDark}
            />
            <SettingToggle
              icon={<Sun className="w-4 h-4" />}
              label="邮件通知"
              enabled={settings.emailEnabled}
              onChange={() => toggleGlobalSetting('emailEnabled')}
              disabled={!settings.enabled}
              isDark={isDark}
            />
            <SettingToggle
              icon={<Moon className="w-4 h-4" />}
              label="推送通知"
              enabled={settings.pushEnabled}
              onChange={() => toggleGlobalSetting('pushEnabled')}
              disabled={!settings.enabled}
              isDark={isDark}
            />
          </div>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className={`w-5 h-5 ${settings.quietHoursEnabled ? 'text-purple-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                免打扰时段
              </span>
            </div>
            <button
              onClick={toggleQuietHours}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.quietHoursEnabled ? 'bg-purple-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            >
              <motion.span
                layout
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ${
                  settings.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <AnimatePresence>
            {settings.quietHoursEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1">
                    <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      开始时间
                    </label>
                    <input
                      type="time"
                      value={settings.quietHoursStart || '22:00'}
                      onChange={(e) => updateQuietHours('quietHoursStart', e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                  <span className={`mt-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>至</span>
                  <div className="flex-1">
                    <label className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      结束时间
                    </label>
                    <input
                      type="time"
                      value={settings.quietHoursEnd || '08:00'}
                      onChange={(e) => updateQuietHours('quietHoursEnd', e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                </div>
                <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Info className="w-3 h-3 inline mr-1" />
                  在此时段内，除紧急通知外，其他通知将被静音
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <h4 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            分类设置
          </h4>
          
          {NOTIFICATION_CATEGORIES.map((categoryConfig) => (
            <div
              key={categoryConfig.category}
              className={`rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => setExpandedCategory(
                  expandedCategory === categoryConfig.category ? null : categoryConfig.category
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${categoryConfig.color}20` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryConfig.color }}
                    />
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {categoryConfig.label}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {categoryConfig.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!categoryConfig.canDisable && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      必要
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(categoryConfig.category);
                    }}
                    disabled={!categoryConfig.canDisable && settings.categories[categoryConfig.category]}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.categories[categoryConfig.category]
                        ? 'bg-blue-500'
                        : isDark ? 'bg-gray-600' : 'bg-gray-300'
                    } ${!categoryConfig.canDisable ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <motion.span
                      layout
                      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ${
                        settings.categories[categoryConfig.category] ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  {expandedCategory === categoryConfig.category ? (
                    <ChevronUp className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedCategory === categoryConfig.category && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`px-3 pb-3 space-y-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      {categoryConfig.types.map((type) => {
                        const typeConfig = NOTIFICATION_TYPES[type];
                        return (
                          <div
                            key={type}
                            className="flex items-center justify-between py-2"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: typeConfig.color }}
                              />
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {typeConfig.label}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleType(type)}
                              disabled={!categoryConfig.canDisable && settings.types[type]}
                              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                                settings.types[type]
                                  ? 'bg-blue-500'
                                  : isDark ? 'bg-gray-600' : 'bg-gray-300'
                              } ${!categoryConfig.canDisable ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              <motion.span
                                layout
                                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow-sm ${
                                  settings.types[type] ? 'translate-x-4' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            其他设置
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                显示内容预览
              </span>
              <button
                onClick={() => toggleGlobalSetting('showPreview')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.showPreview ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              >
                <motion.span
                  layout
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ${
                    settings.showPreview ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                最大通知数量
              </span>
              <select
                value={settings.maxNotifications}
                onChange={(e) => updateSettings({ ...settings, maxNotifications: Number(e.target.value) })}
                className={`px-2 py-1 rounded border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } text-sm`}
              >
                <option value={50}>50 条</option>
                <option value={100}>100 条</option>
                <option value={200}>200 条</option>
                <option value={500}>500 条</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                自动归档已读通知
              </span>
              <select
                value={settings.autoArchiveDays}
                onChange={(e) => updateSettings({ ...settings, autoArchiveDays: Number(e.target.value) })}
                className={`px-2 py-1 rounded border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } text-sm`}
              >
                <option value={7}>7 天后</option>
                <option value={14}>14 天后</option>
                <option value={30}>30 天后</option>
                <option value={90}>90 天后</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingToggleProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  isDark: boolean;
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  label,
  enabled,
  onChange,
  disabled,
  isDark
}) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : enabled
        ? isDark
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-blue-50 text-blue-600'
        : isDark
        ? 'bg-gray-600 text-gray-400'
        : 'bg-gray-100 text-gray-500'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </button>
);

export default NotificationSettingsPanel;
