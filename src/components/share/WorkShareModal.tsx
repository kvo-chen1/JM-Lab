import { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { X, Search, Send, Check, AlertCircle, Loader2 } from 'lucide-react';
import { WorkSelector } from './WorkSelector';
import { UserSearch } from './UserSearch';
import { WorkPreview } from './WorkPreview';
import { MessageEditor } from './MessageEditor';
import { sendWorkShareMessage } from '@/services/workShareService';
import type { Work } from '@/types/work';
import type { User } from '@/types/user';

interface WorkShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  preselectedWork?: Work | null;
}

type ShareStep = 'select-work' | 'select-user' | 'compose' | 'preview' | 'sending' | 'success';

export function WorkShareModal({ isOpen, onClose, onBack, preselectedWork }: WorkShareModalProps) {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);
  
  const [currentStep, setCurrentStep] = useState<ShareStep>(preselectedWork ? 'select-user' : 'select-work');
  const [selectedWork, setSelectedWork] = useState<Work | null>(preselectedWork || null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 重置状态当模态框打开时
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(preselectedWork ? 'select-user' : 'select-work');
      setSelectedWork(preselectedWork || null);
      setSelectedUser(null);
      setMessage('');
      setSendStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, preselectedWork]);

  const handleWorkSelect = useCallback((work: Work) => {
    setSelectedWork(work);
    setCurrentStep('select-user');
  }, []);

  const handleUserSelect = useCallback((user: User) => {
    setSelectedUser(user);
    setCurrentStep('compose');
  }, []);

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'select-user':
        if (onBack) {
          // 如果有外部传入的 onBack，优先使用（返回到分享选择界面）
          onBack();
        } else if (!preselectedWork) {
          setCurrentStep('select-work');
        }
        break;
      case 'compose':
        setCurrentStep('select-user');
        break;
      case 'preview':
        setCurrentStep('compose');
        break;
    }
  }, [currentStep, preselectedWork, onBack]);

  const handleSend = useCallback(async () => {
    if (!currentUser || !selectedWork || !selectedUser) {
      toast.error('缺少必要信息');
      return;
    }

    setSendStatus('sending');
    setCurrentStep('sending');

    try {
      const result = await sendWorkShareMessage({
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        workId: selectedWork.id,
        workTitle: selectedWork.title,
        workThumbnail: selectedWork.thumbnail,
        workType: selectedWork.type,
        message: message.trim(),
      });

      if (result.success) {
        setSendStatus('success');
        setCurrentStep('success');
        toast.success('作品分享成功！');
        
        // 3秒后自动关闭
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(result.message || '发送失败');
      }
    } catch (error) {
      console.error('分享作品失败:', error);
      setSendStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '发送失败，请重试');
      toast.error('分享失败，请重试');
    }
  }, [currentUser, selectedWork, selectedUser, message, onClose]);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'select-work':
        return !!selectedWork;
      case 'select-user':
        return !!selectedUser;
      case 'compose':
        return true;
      default:
        return false;
    }
  }, [currentStep, selectedWork, selectedUser]);

  const renderStepIndicator = () => {
    const steps = [
      { key: 'select-work', label: '选择作品', show: !preselectedWork },
      { key: 'select-user', label: '选择好友', show: true },
      { key: 'compose', label: '编辑私信', show: true },
    ].filter(s => s.show);

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
                index <= currentIndex
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < currentIndex ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:block ${
                index <= currentIndex
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-900'
                  : isDark
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-2 ${
                  index < currentIndex
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : isDark
                    ? 'bg-gray-700'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'select-work':
        return (
          <WorkSelector
            selectedWork={selectedWork}
            onSelect={handleWorkSelect}
            onCancel={onClose}
          />
        );

      case 'select-user':
        return (
          <UserSearch
            selectedUser={selectedUser}
            onSelect={handleUserSelect}
            onBack={handleBack}
            onCancel={onClose}
          />
        );

      case 'compose':
        return (
          <div className="space-y-6">
            {/* 已选作品预览 */}
            {selectedWork && (
              <WorkPreview work={selectedWork} compact />
            )}

            {/* 已选用户 */}
            {selectedUser && (
              <div
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}
              >
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  发送给：
                </span>
                <div className="flex items-center gap-2">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                      {selectedUser.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedUser.name}
                  </span>
                </div>
              </div>
            )}

            {/* 消息编辑区 */}
            <MessageEditor
              value={message}
              onChange={setMessage}
              placeholder={`给 ${selectedUser?.name} 写点什么...（可选）`}
              maxLength={500}
            />

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleBack}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                返回
              </button>
              <button
                onClick={handleSend}
                disabled={sendStatus === 'sending'}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendStatus === 'sending' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    发送私信
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 'sending':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-red-200 dark:border-red-900/30" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
            </div>
            <p className={`mt-6 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              正在发送...
            </p>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              请稍候，正在将作品分享给好友
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            <p className={`mt-6 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              分享成功！
            </p>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              作品已通过私信发送给 {selectedUser?.name}
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-medium"
            >
              完成
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
            isDark
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div
            className={`flex items-center justify-between p-6 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                分享作品
              </h2>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                将您的作品通过私信分享给好友
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 步骤指示器 */}
          {currentStep !== 'sending' && currentStep !== 'success' && renderStepIndicator()}

          {/* 错误提示 */}
          {errorMessage && (
            <div className="mx-6 mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">{renderContent()}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default WorkShareModal;
