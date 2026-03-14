import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  metricNames,
  operatorNames,
  severityNames,
  channelNames,
  type AlertRule,
  type MetricType,
} from '@/services/alertService';

interface AlertRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const metricOptions: MetricType[] = [
  'users', 'works', 'views', 'likes', 'comments', 'shares',
  'active_users', 'conversion_rate', 'revenue',
  'server_cpu', 'server_memory', 'error_rate', 'response_time'
];

const operatorOptions = [
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
  { value: 'eq', label: '等于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lte', label: '小于等于' },
];

const severityOptions = [
  { value: 'info', label: '信息', color: 'blue' },
  { value: 'warning', label: '警告', color: 'yellow' },
  { value: 'error', label: '错误', color: 'orange' },
  { value: 'critical', label: '严重', color: 'red' },
];

const channelOptions = [
  { value: 'dashboard', label: '仪表盘' },
  { value: 'email', label: '邮件' },
  { value: 'sms', label: '短信' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'push', label: '推送通知' },
];

export default function AlertRulesModal({ isOpen, onClose, isDark }: AlertRulesModalProps) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    metric_type: 'users' as MetricType,
    threshold: 0,
    operator: 'gt' as const,
    time_window: 60,
    severity: 'warning' as const,
    enabled: true,
    notify_channels: ['dashboard'] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      loadRules();
    }
  }, [isOpen]);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await getAlertRules();
      setRules(data);
    } catch (error) {
      toast.error('加载预警规则失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await updateAlertRule(editingRule.id, formData);
        toast.success('更新预警规则成功');
      } else {
        await createAlertRule(formData);
        toast.success('创建预警规则成功');
      }
      setShowCreateForm(false);
      setEditingRule(null);
      resetForm();
      loadRules();
    } catch (error) {
      toast.error(editingRule ? '更新预警规则失败' : '创建预警规则失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条预警规则吗？')) return;
    try {
      await deleteAlertRule(id);
      toast.success('删除预警规则成功');
      loadRules();
    } catch (error) {
      toast.error('删除预警规则失败');
    }
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      metric_type: rule.metric_type,
      threshold: rule.threshold,
      operator: rule.operator,
      time_window: rule.time_window,
      severity: rule.severity,
      enabled: rule.enabled,
      notify_channels: rule.notify_channels,
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      metric_type: 'users',
      threshold: 0,
      operator: 'gt',
      time_window: 60,
      severity: 'warning',
      enabled: true,
      notify_channels: ['dashboard'],
    });
  };

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      notify_channels: prev.notify_channels.includes(channel)
        ? prev.notify_channels.filter(c => c !== channel)
        : [...prev.notify_channels, channel],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* 头部 */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              预警规则管理
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!showCreateForm && (
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                新建规则
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {showCreateForm ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    规则名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="例如：用户增长下降预警"
                  />
                </div>

                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    规则描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="描述这条规则的用途..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    监控指标 *
                  </label>
                  <select
                    value={formData.metric_type}
                    onChange={e => setFormData({ ...formData, metric_type: e.target.value as MetricType })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {metricOptions.map(metric => (
                      <option key={metric} value={metric}>
                        {metricNames[metric]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    操作符 *
                  </label>
                  <select
                    value={formData.operator}
                    onChange={e => setFormData({ ...formData, operator: e.target.value as any })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {operatorOptions.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    阈值 *
                  </label>
                  <input
                    type="number"
                    value={formData.threshold}
                    onChange={e => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
                    required
                    step="any"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="例如：-20"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    时间窗口（分钟）*
                  </label>
                  <input
                    type="number"
                    value={formData.time_window}
                    onChange={e => setFormData({ ...formData, time_window: parseInt(e.target.value) })}
                    required
                    min={1}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    严重程度 *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {severityOptions.map(sev => (
                      <option key={sev.value} value={sev.value}>
                        {sev.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      启用规则
                    </span>
                  </label>
                </div>

                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    通知渠道
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {channelOptions.map(channel => (
                      <button
                        key={channel.value}
                        type="button"
                        onClick={() => toggleChannel(channel.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          formData.notify_channels.includes(channel.value)
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : isDark
                            ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {channel.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {editingRule ? '保存修改' : '创建规则'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : rules.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无预警规则</p>
                  <p className="text-sm mt-1">点击上方按钮创建第一条规则</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map(rule => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border ${
                        rule.enabled
                          ? isDark
                            ? 'bg-gray-700/50 border-gray-600'
                            : 'bg-white border-gray-200'
                          : isDark
                          ? 'bg-gray-800/50 border-gray-700 opacity-60'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {rule.name}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                rule.enabled
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                              }`}
                            >
                              {rule.enabled ? '启用' : '禁用'}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                rule.severity === 'critical'
                                  ? 'bg-red-100 text-red-700'
                                  : rule.severity === 'error'
                                  ? 'bg-orange-100 text-orange-700'
                                  : rule.severity === 'warning'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {severityNames[rule.severity]}
                            </span>
                          </div>
                          {rule.description && (
                            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {rule.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {metricNames[rule.metric_type]}
                            </span>
                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                              {operatorNames[rule.operator]}
                            </span>
                            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                              {rule.threshold}
                            </span>
                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                              · {rule.time_window}分钟窗口
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            {rule.notify_channels.map(channel => (
                              <span
                                key={channel}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  isDark
                                    ? 'bg-gray-600 text-gray-300'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {channelNames[channel] || channel}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => handleEdit(rule)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'hover:bg-gray-600 text-gray-400'
                                : 'hover:bg-gray-100 text-gray-500'
                            }`}
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'hover:bg-red-900/30 text-red-400'
                                : 'hover:bg-red-50 text-red-500'
                            }`}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
