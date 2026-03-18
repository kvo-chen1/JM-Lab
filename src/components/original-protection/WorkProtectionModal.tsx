import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { copyrightProtectionService } from '@/services/copyrightProtectionService';
import type { CopyrightDeclaration, TimestampRecord } from '@/types/copyright-protection';
import { LICENSE_TYPE_CONFIG, WORK_TYPE_CONFIG } from '@/types/copyright-protection';
import {
  X,
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Download,
  Clock,
  Lock,
  Unlock,
  Edit3,
  Eye,
  ChevronRight,
  Plus,
  Image as ImageIcon,
  Video,
  Music,
  FileText as FileIcon,
  Palette,
  Box,
  Award,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface WorkProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const workTypes = [
  { id: 'image', label: '图片', icon: ImageIcon },
  { id: 'video', label: '视频', icon: Video },
  { id: 'audio', label: '音频', icon: Music },
  { id: 'text', label: '文本', icon: FileIcon },
  { id: 'design', label: '设计', icon: Palette },
  { id: 'other', label: '其他', icon: Box },
];

const licenseTypes = [
  { id: 'all_rights_reserved', label: '保留所有权利', description: '未经版权所有者许可，不得以任何形式使用作品' },
  { id: 'cc_by', label: 'CC BY 署名', description: '允许他人使用、修改和商业使用，但必须注明原作者' },
  { id: 'cc_by_sa', label: 'CC BY-SA 署名-相同方式共享', description: '允许修改和商业使用，但必须注明原作者并以相同方式授权' },
  { id: 'cc_by_nc', label: 'CC BY-NC 署名-非商业使用', description: '允许修改，但不得用于商业目的，且必须注明原作者' },
  { id: 'cc_by_nc_sa', label: 'CC BY-NC-SA 署名-非商业使用-相同方式共享', description: '允许修改但不得商业使用，必须注明原作者并以相同方式授权' },
  { id: 'cc_by_nd', label: 'CC BY-ND 署名-禁止演绎', description: '允许商业使用但不得修改作品，且必须注明原作者' },
  { id: 'cc_by_nc_nd', label: 'CC BY-NC-ND 署名-非商业使用-禁止演绎', description: '最严格的CC协议，仅允许下载和分享，不得修改或商业使用' },
  { id: 'custom', label: '自定义许可', description: '使用自定义的许可条款' },
];

export default function WorkProtectionModal({ isOpen, onClose }: WorkProtectionModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [myDeclarations, setMyDeclarations] = useState<CopyrightDeclaration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<CopyrightDeclaration | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // 创建声明表单状态
  const [formData, setFormData] = useState({
    workTitle: '',
    workType: 'image' as const,
    workUrl: '',
    declaration: '',
    copyrightHolder: '',
    licenseType: 'all_rights_reserved' as const,
    customLicenseTerms: '',
    allowCommercialUse: false,
    allowModification: false,
    requireAttribution: true,
  });

  // 加载用户的版权声明
  useEffect(() => {
    if (isOpen && activeTab === 'list') {
      loadMyDeclarations();
    }
  }, [isOpen, activeTab]);

  const loadMyDeclarations = async () => {
    setIsLoading(true);
    try {
      const declarations = await copyrightProtectionService.getMyDeclarations();
      setMyDeclarations(declarations);
    } catch (error) {
      console.error('加载版权声明失败:', error);
      toast.error('加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeclaration = async () => {
    if (!formData.workTitle.trim()) {
      toast.error('请输入作品标题');
      return;
    }

    setIsLoading(true);
    try {
      const declaration = await copyrightProtectionService.createDeclaration({
        workId: `work-${Date.now()}`,
        workTitle: formData.workTitle,
        workType: formData.workType,
        workUrl: formData.workUrl || undefined,
        declaration: formData.declaration || undefined,
        copyrightHolder: formData.copyrightHolder || undefined,
        licenseType: formData.licenseType,
        customLicenseTerms: formData.customLicenseTerms || undefined,
        allowCommercialUse: formData.allowCommercialUse,
        allowModification: formData.allowModification,
        requireAttribution: formData.requireAttribution,
      });

      // 生成时间戳
      const timestamp = await copyrightProtectionService.createTimestamp(declaration.id, 'internal');

      toast.success('作品保护申请已提交');
      setActiveTab('list');
      setFormData({
        workTitle: '',
        workType: 'image',
        workUrl: '',
        declaration: '',
        copyrightHolder: '',
        licenseType: 'all_rights_reserved',
        customLicenseTerms: '',
        allowCommercialUse: false,
        allowModification: false,
        requireAttribution: true,
      });
    } catch (error: any) {
      toast.error(error.message || '提交失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCertificate = async (declaration: CopyrightDeclaration) => {
    try {
      const timestamp = await copyrightProtectionService.getTimestampByCopyrightId(declaration.id);
      if (!timestamp) {
        toast.error('证书信息不存在');
        return;
      }

      // 生成证书内容
      const certificateContent = generateCertificateContent(declaration, timestamp);
      
      // 创建并下载文件
      const blob = new Blob([certificateContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `版权证书-${declaration.workTitle}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('证书下载成功');
    } catch (error) {
      toast.error('下载失败');
    }
  };

  const generateCertificateContent = (declaration: CopyrightDeclaration, timestamp: TimestampRecord) => {
    return `
===============================================
          原创作品版权声明证书
===============================================

作品信息:
  作品标题: ${declaration.workTitle}
  作品类型: ${WORK_TYPE_CONFIG[declaration.workType]?.label || declaration.workType}
  作品ID: ${declaration.workId}
  
版权信息:
  版权持有者: ${declaration.copyrightHolder}
  许可类型: ${LICENSE_TYPE_CONFIG[declaration.licenseType]?.label || declaration.licenseType}
  声明内容: ${declaration.declaration}
  
许可条款:
  允许商业使用: ${declaration.allowCommercialUse ? '是' : '否'}
  允许修改: ${declaration.allowModification ? '是' : '否'}
  需要署名: ${declaration.requireAttribution ? '是' : '否'}
  
时间戳信息:
  时间戳ID: ${timestamp.id}
  哈希值: ${timestamp.hash}
  创建时间: ${new Date(timestamp.timestamp).toLocaleString('zh-CN')}
  验证链接: ${timestamp.verificationUrl || 'N/A'}
  
证书编号: ${declaration.id}
声明时间: ${new Date(declaration.createdAt).toLocaleString('zh-CN')}

===============================================
本证书由平台自动生成，用于证明作品的版权声明
===============================================
`;
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    toast.success('哈希值已复制');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
              isDark ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDark ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    作品保护
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    为您的原创作品申请保护
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 标签切换 */}
            <div className={`flex border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                申请保护
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                我的保护
              </button>
            </div>

            {/* 内容区 */}
            <div className="h-[calc(90vh-140px)] overflow-y-auto p-6">
              {activeTab === 'create' ? (
                <div className="space-y-6">
                  {/* 作品类型选择 */}
                  <div>
                    <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      选择作品类型
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {workTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setFormData(prev => ({ ...prev, workType: type.id as any }))}
                          className={`p-3 rounded-xl border transition-all ${
                            formData.workType === type.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : isDark
                                ? 'border-slate-700 hover:border-slate-600'
                                : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <type.icon className={`w-6 h-6 mx-auto mb-2 ${
                            formData.workType === type.id ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                          <p className={`text-xs text-center ${
                            formData.workType === type.id
                              ? 'text-blue-600 dark:text-blue-400'
                              : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {type.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 作品信息 */}
                  <div>
                    <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      作品信息
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          作品标题 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.workTitle}
                          onChange={(e) => setFormData(prev => ({ ...prev, workTitle: e.target.value }))}
                          placeholder="请输入作品标题"
                          className={`w-full px-3 py-2 rounded-lg text-sm ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          作品链接（可选）
                        </label>
                        <input
                          type="text"
                          value={formData.workUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, workUrl: e.target.value }))}
                          placeholder="请输入作品链接"
                          className={`w-full px-3 py-2 rounded-lg text-sm ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          版权声明（可选）
                        </label>
                        <textarea
                          value={formData.declaration}
                          onChange={(e) => setFormData(prev => ({ ...prev, declaration: e.target.value }))}
                          placeholder="请输入版权声明内容"
                          rows={3}
                          className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          版权持有者
                        </label>
                        <input
                          type="text"
                          value={formData.copyrightHolder}
                          onChange={(e) => setFormData(prev => ({ ...prev, copyrightHolder: e.target.value }))}
                          placeholder={`默认为: ${user?.username || '当前用户'}`}
                          className={`w-full px-3 py-2 rounded-lg text-sm ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 许可类型 */}
                  <div>
                    <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      选择许可类型
                    </h3>
                    <div className="space-y-3">
                      {licenseTypes.map((license) => (
                        <button
                          key={license.id}
                          onClick={() => setFormData(prev => ({ ...prev, licenseType: license.id as any }))}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            formData.licenseType === license.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : isDark
                                ? 'border-slate-700 hover:border-slate-600'
                                : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.licenseType === license.id
                                ? 'border-blue-500'
                                : isDark ? 'border-slate-600' : 'border-slate-300'
                            }`}>
                              {formData.licenseType === license.id && (
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {license.label}
                              </p>
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {license.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* 自定义许可条款 */}
                    {formData.licenseType === 'custom' && (
                      <div className="mt-4">
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          自定义许可条款
                        </label>
                        <textarea
                          value={formData.customLicenseTerms}
                          onChange={(e) => setFormData(prev => ({ ...prev, customLicenseTerms: e.target.value }))}
                          placeholder="请输入自定义许可条款"
                          rows={4}
                          className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    )}

                    {/* 许可选项 */}
                    <div className="mt-4 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowCommercialUse}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowCommercialUse: e.target.checked }))}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          允许商业使用
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowModification}
                          onChange={(e) => setFormData(prev => ({ ...prev, allowModification: e.target.checked }))}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          允许修改
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requireAttribution}
                          onChange={(e) => setFormData(prev => ({ ...prev, requireAttribution: e.target.checked }))}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          需要署名
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 提交按钮 */}
                  <button
                    onClick={handleCreateDeclaration}
                    disabled={isLoading}
                    className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        申请保护
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : myDeclarations.length === 0 ? (
                    <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>暂无作品保护记录</p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="mt-4 text-blue-500 hover:text-blue-600"
                      >
                        立即申请保护
                      </button>
                    </div>
                  ) : (
                    myDeclarations.map((declaration) => (
                      <motion.div
                        key={declaration.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border ${
                          isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {declaration.workThumbnail && (
                            <img
                              src={declaration.workThumbnail}
                              alt={declaration.workTitle}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {declaration.workTitle}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                declaration.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : declaration.status === 'disputed'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}>
                                {declaration.status === 'active' ? '有效' : 
                                 declaration.status === 'disputed' ? '争议中' : '已失效'}
                              </span>
                            </div>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              类型: {WORK_TYPE_CONFIG[declaration.workType]?.label || declaration.workType}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              许可: {LICENSE_TYPE_CONFIG[declaration.licenseType]?.label || declaration.licenseType}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                              申请时间: {new Date(declaration.createdAt).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleDownloadCertificate(declaration)}
                              className={`p-2 rounded-lg ${
                                isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                              } transition-colors`}
                              title="下载证书"
                            >
                              <Download className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDeclaration(declaration);
                                setShowCertificate(true);
                              }}
                              className={`p-2 rounded-lg ${
                                isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                              } transition-colors`}
                              title="查看证书"
                            >
                              <Award className="w-4 h-4 text-green-500" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 证书详情弹窗 */}
            <AnimatePresence>
              {showCertificate && selectedDeclaration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-10"
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={`w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl p-6 ${
                      isDark ? 'bg-slate-800' : 'bg-white'
                    }`}
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        版权保护证书
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Certificate of Copyright Protection
                      </p>
                    </div>

                    <div className={`space-y-4 p-4 rounded-xl ${
                      isDark ? 'bg-slate-900/50' : 'bg-slate-50'
                    }`}>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>作品标题</p>
                        <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {selectedDeclaration.workTitle}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>作品类型</p>
                        <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {WORK_TYPE_CONFIG[selectedDeclaration.workType]?.label || selectedDeclaration.workType}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>版权持有者</p>
                        <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {selectedDeclaration.copyrightHolder}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>许可类型</p>
                        <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {LICENSE_TYPE_CONFIG[selectedDeclaration.licenseType]?.label || selectedDeclaration.licenseType}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>证书编号</p>
                        <p className={`font-mono text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {selectedDeclaration.id}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>申请时间</p>
                        <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {new Date(selectedDeclaration.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => handleDownloadCertificate(selectedDeclaration)}
                        className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        下载证书
                      </button>
                      <button
                        onClick={() => setShowCertificate(false)}
                        className={`flex-1 py-2 rounded-lg ${
                          isDark
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        } transition-colors`}
                      >
                        关闭
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
