import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { similarityDetectionService } from '@/services/similarityDetectionService';
import type { SimilarityResult, SimilarityCheckResponse } from '@/types/similarity-detection';
import {
  X,
  Search,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Flag,
  Image as ImageIcon,
  FileImage,
  ChevronRight,
  Shield,
  RefreshCw
} from 'lucide-react';

interface PlagiarismCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReport?: (result: SimilarityResult) => void;
}

const workTypes = [
  { id: 'image', label: '图片', icon: ImageIcon },
  { id: 'video', label: '视频', icon: FileText },
  { id: 'text', label: '文本', icon: FileText },
  { id: 'design', label: '设计', icon: FileImage },
];

export default function PlagiarismCheckModal({ isOpen, onClose, onReport }: PlagiarismCheckModalProps) {
  const { isDark } = useTheme();
  const [checkMethod, setCheckMethod] = useState<'link' | 'upload'>('link');
  const [workUrl, setWorkUrl] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('image');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<SimilarityCheckResponse | null>(null);
  const [selectedResult, setSelectedResult] = useState<SimilarityResult | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('文件大小不能超过10MB');
        return;
      }
      setUploadedFile(file);
      toast.success('文件上传成功');
    }
  }, []);

  const handleCheck = useCallback(async () => {
    if (checkMethod === 'link' && !workUrl.trim()) {
      toast.error('请输入作品链接');
      return;
    }
    if (checkMethod === 'upload' && !uploadedFile) {
      toast.error('请上传文件');
      return;
    }

    setIsChecking(true);
    try {
      const imageUrl = checkMethod === 'link' ? workUrl : URL.createObjectURL(uploadedFile!);
      
      const result = await similarityDetectionService.checkSimilarity({
        workId: `check-${Date.now()}`,
        title: workTitle || '未命名作品',
        description: workDescription,
        imageUrl: selectedWorkType === 'image' || selectedWorkType === 'design' ? imageUrl : undefined,
        textContent: workDescription,
        workType: selectedWorkType as any,
        creatorId: 'current-user',
      });

      setCheckResult(result);
      
      if (result.success) {
        if (result.hasSimilarWorks) {
          toast.warning(`检测到 ${result.similarityResults.length} 个相似作品`);
        } else {
          toast.success('未检测到相似作品，您的内容很可能是原创的');
        }
      } else {
        toast.error(result.message || '检测失败');
      }
    } catch (error) {
      console.error('查重失败:', error);
      toast.error('查重过程中出现错误');
    } finally {
      setIsChecking(false);
    }
  }, [checkMethod, workUrl, uploadedFile, workTitle, workDescription, selectedWorkType]);

  const handleReport = useCallback((result: SimilarityResult) => {
    if (onReport) {
      onReport(result);
    } else {
      toast.info('举报功能即将跳转');
    }
  }, [onReport]);

  const getSimilarityColor = (score: number) => {
    if (score >= 0.85) return 'text-red-500';
    if (score >= 0.75) return 'text-orange-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSimilarityBg = (score: number) => {
    if (score >= 0.85) return 'bg-red-50 dark:bg-red-900/20';
    if (score >= 0.75) return 'bg-orange-50 dark:bg-orange-900/20';
    if (score >= 0.6) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-green-50 dark:bg-green-900/20';
  };

  const resetCheck = useCallback(() => {
    setCheckResult(null);
    setWorkUrl('');
    setWorkTitle('');
    setWorkDescription('');
    setUploadedFile(null);
    setSelectedResult(null);
  }, []);

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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    查重治理
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    检测内容原创度和相似度
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

            {/* 内容区 */}
            <div className="flex h-[calc(90vh-80px)]">
              {/* 左侧导航 */}
              <div className={`w-64 p-4 border-r ${
                isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="space-y-2">
                  <div className={`p-4 rounded-xl ${
                    isDark ? 'bg-slate-800/50' : 'bg-white'
                  } border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      检测说明
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed`}>
                      系统将对您的作品进行全网比对，检测是否存在相似或重复内容。
                    </p>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>&lt; 60% 相似度</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>60-75% 相似度</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>75-85% 相似度</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>&gt; 85% 相似度</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧内容 */}
              <div className="flex-1 overflow-y-auto p-6">
                {!checkResult ? (
                  <div className="space-y-6">
                    {/* 作品类型选择 */}
                    <div>
                      <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        选择作品类型
                      </h3>
                      <div className="flex gap-3">
                        {workTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setSelectedWorkType(type.id)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                              selectedWorkType === type.id
                                ? 'bg-blue-500 text-white'
                                : isDark
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            <type.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 检测方式选择 */}
                    <div>
                      <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        选择检测方式
                      </h3>
                      <div className="flex gap-4 mb-4">
                        <button
                          onClick={() => setCheckMethod('link')}
                          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                            checkMethod === 'link'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : isDark
                                ? 'border-slate-700 hover:border-slate-600'
                                : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <ExternalLink className={`w-6 h-6 mb-2 ${
                            checkMethod === 'link' ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                          <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            输入链接
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            粘贴作品链接进行检测
                          </p>
                        </button>
                        <button
                          onClick={() => setCheckMethod('upload')}
                          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                            checkMethod === 'upload'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : isDark
                                ? 'border-slate-700 hover:border-slate-600'
                                : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Upload className={`w-6 h-6 mb-2 ${
                            checkMethod === 'upload' ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`} />
                          <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            上传文件
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            上传作品文件进行检测
                          </p>
                        </button>
                      </div>

                      {/* 作品标题 */}
                      <div className="mb-4">
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          作品标题
                        </label>
                        <input
                          type="text"
                          value={workTitle}
                          onChange={(e) => setWorkTitle(e.target.value)}
                          placeholder="请输入作品标题"
                          className={`w-full px-3 py-2 rounded-lg text-sm ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>

                      {/* 链接输入或文件上传 */}
                      {checkMethod === 'link' ? (
                        <div>
                          <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            作品链接 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={workUrl}
                            onChange={(e) => setWorkUrl(e.target.value)}
                            placeholder="请粘贴作品链接"
                            className={`w-full px-3 py-2 rounded-lg text-sm ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            上传文件 <span className="text-red-500">*</span>
                          </label>
                          <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
                            isDark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-300 hover:border-slate-400'
                          } transition-colors cursor-pointer`}>
                            <input
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="plagiarism-file-upload"
                              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                            />
                            <label htmlFor="plagiarism-file-upload" className="cursor-pointer">
                              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                点击上传文件
                              </p>
                              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                                支持图片、视频、文档格式，最大10MB
                              </p>
                            </label>
                          </div>
                          {uploadedFile && (
                            <div className={`mt-2 p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center gap-2`}>
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {uploadedFile.name}
                              </span>
                              <button
                                onClick={() => setUploadedFile(null)}
                                className="ml-auto text-red-500 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 作品描述 */}
                      <div className="mt-4">
                        <label className={`block text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          作品描述（可选）
                        </label>
                        <textarea
                          value={workDescription}
                          onChange={(e) => setWorkDescription(e.target.value)}
                          placeholder="请输入作品描述，有助于提高检测准确性"
                          rows={3}
                          className={`w-full px-3 py-2 rounded-lg text-sm resize-none ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>

                    {/* 开始检测按钮 */}
                    <button
                      onClick={handleCheck}
                      disabled={isChecking}
                      className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          检测中...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          开始检测
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 检测结果概览 */}
                    <div className={`p-6 rounded-xl ${
                      checkResult.hasSimilarWorks
                        ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                        : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        {checkResult.hasSimilarWorks ? (
                          <AlertTriangle className="w-8 h-8 text-orange-500" />
                        ) : (
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                        )}
                        <div>
                          <h3 className={`text-lg font-semibold ${
                            checkResult.hasSimilarWorks ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'
                          }`}>
                            {checkResult.hasSimilarWorks ? '检测到相似作品' : '未检测到相似作品'}
                          </h3>
                          <p className={`text-sm ${
                            checkResult.hasSimilarWorks ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {checkResult.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 相似作品列表 */}
                    {checkResult.similarityResults.length > 0 && (
                      <div>
                        <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          相似作品列表
                        </h3>
                        <div className="space-y-3">
                          {checkResult.similarityResults.map((result, index) => (
                            <motion.div
                              key={result.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`p-4 rounded-xl border ${
                                isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'
                              } hover:shadow-md transition-shadow cursor-pointer`}
                              onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
                            >
                              <div className="flex items-center gap-4">
                                {result.targetWorkThumbnail && (
                                  <img
                                    src={result.targetWorkThumbnail}
                                    alt={result.targetWorkTitle}
                                    className="w-20 h-20 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                      {result.targetWorkTitle}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      getSimilarityBg(result.similarityScore)
                                    } ${getSimilarityColor(result.similarityScore)}`}>
                                      {(result.similarityScore * 100).toFixed(1)}% 相似
                                    </span>
                                  </div>
                                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    创作者: {result.targetCreatorName}
                                  </p>
                                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>
                                    检测类型: {result.similarityType === 'image' ? '图片相似' : '文本相似'}
                                  </p>
                                </div>
                                <ChevronRight className={`w-5 h-5 transition-transform ${
                                  selectedResult?.id === result.id ? 'rotate-90' : ''
                                } ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                              </div>

                              {/* 展开详情 */}
                              <AnimatePresence>
                                {selectedResult?.id === result.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className={`mt-4 pt-4 border-t ${
                                      isDark ? 'border-slate-700' : 'border-slate-200'
                                    }`}>
                                      <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                        {result.details?.description}
                                      </p>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReport(result);
                                          }}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                          <Flag className="w-4 h-4" />
                                          举报侵权
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`/work/${result.targetWorkId}`, '_blank');
                                          }}
                                          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${
                                            isDark
                                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                          } transition-colors`}
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                          查看作品
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={resetCheck}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          isDark
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        } transition-colors`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        重新检测
                      </button>
                      {checkResult.hasSimilarWorks && (
                        <button
                          onClick={() => {
                            // 批量举报
                            toast.info('批量举报功能开发中');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          批量举报
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
