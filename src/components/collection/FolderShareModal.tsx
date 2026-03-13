import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { X, Share2, Copy, Link, Globe, Lock, Check, Twitter, MessageCircle } from 'lucide-react';
import { CollectionFolder, FolderVisibility } from '@/types/collectionFolder';
import { collectionFolderService } from '@/services/collectionFolderService';
import { toast } from 'sonner';

interface FolderShareModalProps {
  folder: CollectionFolder | null;
  onClose: () => void;
}

export default function FolderShareModal({ folder, onClose }: FolderShareModalProps) {
  const { isDark } = useTheme();
  const [shareUrl, setShareUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (folder) {
      setIsPublic(folder.visibility === FolderVisibility.PUBLIC);
      loadShareInfo();
    }
  }, [folder]);

  const loadShareInfo = async () => {
    if (!folder) return;
    setIsLoading(true);
    const info = await collectionFolderService.getShareInfo(folder.id);
    if (info) {
      setShareUrl(info.share_url);
    }
    setIsLoading(false);
  };

  const handleToggleVisibility = async () => {
    if (!folder) return;
    const newVisibility = await collectionFolderService.toggleFolderVisibility(folder.id);
    if (newVisibility) {
      setIsPublic(newVisibility === FolderVisibility.PUBLIC);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('链接已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleShareToTwitter = () => {
    const text = `来看看我的收藏夹"${folder?.name}"`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleShareToWeChat = () => {
    toast.info('请复制链接后在微信中分享');
    handleCopyLink();
  };

  if (!folder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-md mx-4 rounded-2xl shadow-xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Share2 className="w-5 h-5" />
            分享收藏夹
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {folder.name}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {folder.item_count} 个作品
            </p>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <Lock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isPublic ? '公开' : '私有'}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isPublic ? '任何人都可以查看' : '仅自己可见'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleVisibility}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isPublic ? 'bg-green-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            >
              <motion.div
                animate={{ x: isPublic ? 24 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </button>
          </div>

          {isPublic && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  分享链接
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors ${
                      copied
                        ? 'bg-green-500 text-white'
                        : isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  分享到
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleShareToTwitter}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                      isDark
                        ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button
                    onClick={handleShareToWeChat}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                      isDark
                        ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    微信
                  </button>
                </div>
              </div>
            </>
          )}

          {!isPublic && (
            <div className={`p-4 rounded-lg text-center ${
              isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700'
            }`}>
              <Lock className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">
                收藏夹当前为私有状态，开启公开后即可分享
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
