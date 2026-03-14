/**
 * 版权详情弹窗组件
 * 展示版权资产的详细信息和证书详情
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  X, Shield, Calendar, FileText,
  Download, Eye, Clock, Award, DollarSign,
  Unlock, Lock, TrendingUp, User, Hash, Copy, AlertCircle, ChevronRight
} from 'lucide-react';
import { type CopyrightAsset } from '@/services/ipService';

// 深色主题配色
const DARK_THEME = {
  bgPrimary: 'bg-slate-950',
  bgSecondary: 'bg-slate-900',
  bgTertiary: 'bg-slate-800',
  bgCard: 'bg-slate-900/80',
  borderPrimary: 'border-slate-800',
  borderSecondary: 'border-slate-700',
  borderAccent: 'border-cyan-500/30',
  textPrimary: 'text-slate-100',
  textSecondary: 'text-slate-300',
  textTertiary: 'text-slate-400',
  textMuted: 'text-slate-500',
  accentPrimary: 'from-cyan-500 to-blue-600',
  accentSecondary: 'from-violet-500 to-purple-600',
  accentSuccess: 'from-emerald-400 to-teal-500',
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]',
  glass: 'backdrop-blur-xl bg-slate-900/90',
};

// 浅色主题配色
const LIGHT_THEME = {
  bgPrimary: 'bg-gray-50',
  bgSecondary: 'bg-white',
  bgTertiary: 'bg-gray-100',
  bgCard: 'bg-white/80',
  borderPrimary: 'border-gray-200',
  borderSecondary: 'border-gray-300',
  borderAccent: 'border-cyan-500/30',
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textTertiary: 'text-gray-600',
  textMuted: 'text-gray-500',
  accentPrimary: 'from-cyan-600 to-blue-700',
  accentSecondary: 'from-violet-600 to-purple-700',
  accentSuccess: 'from-emerald-500 to-teal-600',
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]',
  glass: 'backdrop-blur-xl bg-white/90',
};

// 获取主题
function useModalTheme(isDark: boolean) {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

// IP类型映射
const IP_TYPE_MAP: Record<string, { name: string; icon: string }> = {
  illustration: { name: '插画', icon: '🎨' },
  pattern: { name: '图案', icon: '🧩' },
  design: { name: '设计', icon: '✏️' },
  '3d_model': { name: '3D模型', icon: '🎭' },
  digital_collectible: { name: '数字藏品', icon: '💎' },
};

// 状态映射
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  registered: { label: '已登记', color: 'emerald' },
  pending: { label: '审核中', color: 'amber' },
  expired: { label: '已过期', color: 'slate' },
};

interface CopyrightDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: CopyrightAsset | null;
  onUpdate?: () => void;
}

export function CopyrightDetailModal({ isOpen, onClose, asset, onUpdate }: CopyrightDetailModalProps) {
  const { isDark } = useTheme();
  const theme = useModalTheme(isDark);
  const [activeTab, setActiveTab] = useState<'overview' | 'certificate' | 'license'>('overview');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !asset) return null;

  const typeInfo = IP_TYPE_MAP[asset.type] || { name: asset.type, icon: '📄' };
  const statusInfo = STATUS_MAP[asset.status] || { label: asset.status, color: 'slate' };

  // 复制到剪贴板
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制到剪贴板`);
  };

  // 下载证书
  const handleDownloadCertificate = async () => {
    if (!asset.certificateUrl) {
      toast.error('暂无证书可下载');
      return;
    }
    setIsDownloading(true);
    try {
      const link = document.createElement('a');
      link.href = asset.certificateUrl;
      link.download = `版权证书_${asset.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('证书下载已开始');
    } catch (error) {
      toast.error('证书下载失败');
    } finally {
      setIsDownloading(false);
    }
  };

  // 获取状态样式
  const getStatusStyle = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      emerald: {
        bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
        text: isDark ? 'text-emerald-400' : 'text-emerald-600',
        border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
      },
      amber: {
        bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
        text: isDark ? 'text-amber-400' : 'text-amber-600',
        border: isDark ? 'border-amber-500/30' : 'border-amber-200',
      },
      slate: {
        bg: isDark ? 'bg-slate-500/20' : 'bg-gray-200',
        text: isDark ? 'text-slate-400' : 'text-gray-500',
        border: isDark ? 'border-slate-500/30' : 'border-gray-300',
      },
    };
    return colorMap[color] || colorMap.slate;
  };

  const statusStyle = getStatusStyle(statusInfo.color);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border ${theme.glass} ${theme.borderPrimary} ${theme.glowPrimary}`}
          >
            {/* 头部 */}
            <div className={`relative overflow-hidden`}>
              {/* 渐变背景 */}
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.accentPrimary} opacity-10`} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/50" />

              <div className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* 缩略图 */}
                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-20 h-20 rounded-2xl object-cover ring-2 ring-cyan-500/30 shadow-lg"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'} ring-2 ring-cyan-500/30`}>
                        <Shield className={`w-10 h-10 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      </div>
                    )}

                    {/* 基本信息 */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-xl font-bold ${theme.textPrimary}`}>{asset.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className={`text-sm ${theme.textMuted} mb-2`}>
                        {typeInfo.icon} {typeInfo.name}
                      </p>
                      <div className="flex items-center gap-4">
                        {asset.canLicense ? (
                          <span className={`flex items-center gap-1 text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            <Unlock className="w-4 h-4" />
                            可授权
                          </span>
                        ) : (
                          <span className={`flex items-center gap-1 text-sm ${theme.textMuted}`}>
                            <Lock className="w-4 h-4" />
                            未开放授权
                          </span>
                        )}
                        {asset.licenseCount !== undefined && asset.licenseCount > 0 && (
                          <span className={`text-sm ${theme.textSecondary}`}>
                            已授权 {asset.licenseCount} 次
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 关闭按钮 */}
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-xl transition-colors ${theme.bgTertiary} ${theme.textMuted} ${isDark ? 'hover:bg-slate-700 hover:text-white' : 'hover:bg-gray-200 hover:text-gray-900'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 标签页 */}
              <div className={`flex gap-1 px-6 pb-0 border-b ${theme.borderPrimary}`}>
                {[
                  { id: 'overview', label: '概览', icon: Eye },
                  { id: 'certificate', label: '证书信息', icon: Award },
                  { id: 'license', label: '授权设置', icon: DollarSign },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                      activeTab === tab.id
                        ? `border-cyan-500 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`
                        : `border-transparent ${theme.textMuted} ${isDark ? 'hover:text-slate-300' : 'hover:text-gray-700'}`
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 内容区域 */}
            <div className={`p-6 overflow-y-auto max-h-[calc(90vh-200px)] ${theme.bgPrimary}`}>
              {/* 概览标签 */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* 统计卡片 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className={`w-4 h-4 ${theme.textMuted}`} />
                        <span className={`text-xs ${theme.textMuted}`}>登记时间</span>
                      </div>
                      <p className={`font-medium ${theme.textPrimary}`}>
                        {asset.registeredAt
                          ? new Date(asset.registeredAt).toLocaleDateString('zh-CN')
                          : '-'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className={`w-4 h-4 ${theme.textMuted}`} />
                        <span className={`text-xs ${theme.textMuted}`}>有效期至</span>
                      </div>
                      <p className={`font-medium ${theme.textPrimary}`}>
                        {asset.expiresAt
                          ? new Date(asset.expiresAt).toLocaleDateString('zh-CN')
                          : '永久有效'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className={`w-4 h-4 ${theme.textMuted}`} />
                        <span className={`text-xs ${theme.textMuted}`}>授权收益</span>
                      </div>
                      <p className={`font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        ¥{(asset.totalLicenseRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 证书编号 */}
                  {asset.certificateNumber && (
                    <div className={`p-4 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                            <Hash className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                          </div>
                          <div>
                            <p className={`text-xs ${theme.textMuted} mb-0.5`}>证书编号</p>
                            <p className={`font-mono font-medium ${theme.textPrimary}`}>{asset.certificateNumber}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(asset.certificateNumber!, '证书编号')}
                          className={`p-2 rounded-lg transition-colors ${theme.bgTertiary} ${theme.textMuted} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 描述信息 */}
                  {asset.description && (
                    <div>
                      <h4 className={`text-sm font-medium mb-2 ${theme.textSecondary}`}>作品描述</h4>
                      <p className={`text-sm leading-relaxed ${theme.textTertiary}`}>{asset.description}</p>
                    </div>
                  )}

                  {/* 权利信息 */}
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>权利信息</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <User className={`w-4 h-4 ${theme.textMuted}`} />
                          <span className={`text-xs ${theme.textMuted}`}>权利人</span>
                        </div>
                        <p className={`text-sm font-medium ${theme.textPrimary}`}>{asset.owner || '当前用户'}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className={`w-4 h-4 ${theme.textMuted}`} />
                          <span className={`text-xs ${theme.textMuted}`}>权利类型</span>
                        </div>
                        <p className={`text-sm font-medium ${theme.textPrimary}`}>著作权</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 证书信息标签 */}
              {activeTab === 'certificate' && (
                <div className="space-y-6">
                  {/* 证书预览 */}
                  <div className={`p-6 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary} text-center`}>
                    {asset.certificateUrl ? (
                      <div className="space-y-4">
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'}`}>
                          <Award className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <div>
                          <h4 className={`font-medium mb-1 ${theme.textPrimary}`}>数字版权证书</h4>
                          <p className={`text-sm ${theme.textMuted}`}>证书编号: {asset.certificateNumber}</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <a
                            href={asset.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                          >
                            <Eye className="w-4 h-4" />
                            预览证书
                          </a>
                          <button
                            onClick={handleDownloadCertificate}
                            disabled={isDownloading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15'} disabled:opacity-50`}
                          >
                            {isDownloading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                下载中...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                下载证书
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <AlertCircle className={`w-10 h-10 ${theme.textMuted}`} />
                        </div>
                        <h4 className={`font-medium mb-1 ${theme.textSecondary}`}>暂无证书</h4>
                        <p className={`text-sm ${theme.textMuted}`}>证书正在生成中，请稍后查看</p>
                      </div>
                    )}
                  </div>

                  {/* 存证信息 */}
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>区块链存证信息</h4>
                    <div className={`p-4 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary} space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${theme.textMuted}`}>存证哈希</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm ${theme.textSecondary}`}>
                            {asset.blockchainHash
                              ? `${asset.blockchainHash.slice(0, 16)}...${asset.blockchainHash.slice(-16)}`
                              : '待上链'}
                          </span>
                          {asset.blockchainHash && (
                            <button
                              onClick={() => handleCopy(asset.blockchainHash!, '存证哈希')}
                              className={`p-1 rounded transition-colors ${theme.textMuted} ${isDark ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${theme.textMuted}`}>存证时间</span>
                        <span className={`text-sm ${theme.textSecondary}`}>
                          {asset.registeredAt
                            ? new Date(asset.registeredAt).toLocaleString('zh-CN')
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${theme.textMuted}`}>存证平台</span>
                        <span className={`text-sm ${theme.textSecondary}`}>IP孵化中心版权存证系统</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 授权设置标签 */}
              {activeTab === 'license' && (
                <div className="space-y-6">
                  {/* 授权状态 */}
                  <div className={`p-4 rounded-xl ${asset.canLicense ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200') : theme.bgSecondary} border ${theme.borderPrimary}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${asset.canLicense ? (isDark ? 'bg-emerald-500/20' : 'bg-emerald-100') : theme.bgTertiary}`}>
                          {asset.canLicense ? (
                            <Unlock className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          ) : (
                            <Lock className={`w-5 h-5 ${theme.textMuted}`} />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${theme.textPrimary}`}>
                            {asset.canLicense ? '已开放授权' : '未开放授权'}
                          </p>
                          <p className={`text-xs ${theme.textMuted}`}>
                            {asset.canLicense ? '其他用户可以查看并申请授权' : '其他用户无法查看此作品'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-colors ${asset.canLicense ? (isDark ? 'bg-emerald-500' : 'bg-emerald-500') : theme.bgTertiary}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${asset.canLicense ? 'left-7' : 'left-1'}`} />
                      </div>
                    </div>
                  </div>

                  {/* 授权价格 */}
                  {asset.canLicense && (
                    <div>
                      <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>授权价格</h4>
                      <div className={`p-4 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            <span className={theme.textSecondary}>单次授权价格</span>
                          </div>
                          <span className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {asset.licensePrice ? `¥${asset.licensePrice.toLocaleString()}` : '面议'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 授权统计 */}
                  <div>
                    <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>授权统计</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                        <p className={`text-2xl font-bold mb-1 ${theme.textPrimary}`}>{asset.licenseCount || 0}</p>
                        <p className={`text-xs ${theme.textMuted}`}>累计授权次数</p>
                      </div>
                      <div className={`p-4 rounded-xl ${theme.bgSecondary} border ${theme.borderPrimary}`}>
                        <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ¥{(asset.totalLicenseRevenue || 0).toLocaleString()}
                        </p>
                        <p className={`text-xs ${theme.textMuted}`}>累计授权收益</p>
                      </div>
                    </div>
                  </div>

                  {/* 授权管理入口 */}
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10' : 'bg-gradient-to-r from-cyan-50 to-blue-50'} border ${isDark ? 'border-cyan-500/20' : 'border-cyan-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                          <Settings className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${theme.textPrimary}`}>授权管理</p>
                          <p className={`text-xs ${theme.textMuted}`}>管理授权申请和合同</p>
                        </div>
                      </div>
                      <button className={`flex items-center gap-1 text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'} hover:underline`}>
                        进入管理
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className={`flex gap-3 p-6 border-t ${theme.borderPrimary} ${theme.bgSecondary}`}>
              <button
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
              >
                关闭
              </button>
              {asset.certificateUrl && (
                <button
                  onClick={handleDownloadCertificate}
                  disabled={isDownloading}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15'} disabled:opacity-50`}
                >
                  {isDownloading ? '下载中...' : '下载证书'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
