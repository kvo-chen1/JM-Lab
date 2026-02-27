import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import errorService, { ErrorInfo } from '../services/errorService';
import { feedbackService } from '@/services/feedbackService';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '@/contexts/authContext';

interface ErrorFeedbackProps {
  errorInfo?: ErrorInfo;
  error?: Error;
  onClose: () => void;
  autoShow?: boolean;
}

const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({ errorInfo, error, onClose, autoShow = false }) => {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorInfo | null>(errorInfo || null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('功能异常');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [contactError, setContactError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  // 获取当前登录用户ID
  useEffect(() => {
    console.log('[ErrorFeedback] 正在获取用户会话...');
    console.log('[ErrorFeedback] AuthContext user:', user);
    
    // 优先使用 AuthContext 中的用户
    if (user?.id) {
      setUserId(user.id);
      setUserEmail(user.email || '');
      console.log('[ErrorFeedback] 从 AuthContext 获取用户ID:', user.id);
      return;
    }
    
    // 如果 AuthContext 没有，尝试从 Supabase 获取
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[ErrorFeedback] 获取会话失败:', error);
        return;
      }
      if (session?.user?.id) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        console.log('[ErrorFeedback] 从 Supabase 获取用户ID:', session.user.id);
        console.log('[ErrorFeedback] 当前用户邮箱:', session.user.email);
      } else {
        console.warn('[ErrorFeedback] 用户未登录，session:', session);
      }
    });
  }, [user]);
  
  // 生成表单控件基础样式
  const getFormControlStyles = (hasError = false) => {
    const baseStyles = `w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 hover:shadow-md`;
    const darkStyles = `bg-gray-700 border-gray-600 text-white placeholder-gray-400 border hover:border-gray-500 focus:border-red-400 focus:ring-offset-gray-800`;
    const lightStyles = `bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 border hover:border-gray-300 focus:border-red-400 focus:ring-offset-white`;
    const errorStyles = hasError ? ` border-red-500 focus:ring-red-500` : '';
    
    return `${baseStyles} ${isDark ? darkStyles : lightStyles}${errorStyles}`;
  };
  
  // 生成标签样式
  const getLabelStyles = () => {
    return `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  };
  
  // 处理直接传递的 Error 对象
  useEffect(() => {
    if (error && !errorDetails) {
      const loggedError = errorService.logError(error);
      setErrorDetails(loggedError);
    }
  }, [error, errorDetails]);
  
  // 自动显示时，尝试从错误服务获取最新错误
  if (autoShow && !errorDetails) {
    const stats = errorService.getErrorStats();
    if (stats.recent.length > 0) {
      setErrorDetails(stats.recent[stats.recent.length - 1]);
    }
  }
  
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // 验证联系方式格式
    if (!validateContactInfo(contactInfo)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 将反馈类型映射到数据库支持的类型
      const typeMap: Record<string, any> = {
        '功能异常': 'bug',
        '界面问题': 'bug',
        '性能问题': 'bug',
        '建议改进': 'feature',
        '其他': 'other'
      };

      // 如果未填写联系方式，使用用户邮箱
      const finalContactInfo = contactInfo.trim() || userEmail;
      
      console.log('[ErrorFeedback] 准备提交反馈:', {
        userId,
        userEmail,
        finalContactInfo,
        description: description.substring(0, 50) + '...'
      });
      
      // 提交反馈到数据库
      const result = await feedbackService.submitFeedback({
        type: typeMap[feedbackType] || 'other',
        title: errorDetails?.errorType || feedbackType,
        content: description,
        contact_info: finalContactInfo,
        contact_type: finalContactInfo.includes('@') ? 'email' : 'phone',
        screenshots: [],
        page_url: window.location.href,
        user_id: userId
      });
      
      console.log('[ErrorFeedback] 提交结果:', result);

      // 提交成功后显示更丰富的反馈
      toast.success(
        <div className="flex items-center gap-2">
          <i className="fas fa-check-circle text-green-500 text-lg"></i>
          <div>
            <div className="font-medium">提交成功！</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">感谢您的反馈，我们会尽快处理</div>
          </div>
        </div>,
        { duration: 3000 }
      );

      // 清空表单
      setDescription('');
      setContactInfo('');
      setFeedbackType('功能异常');
      setScreenshots([]);
      setIncludeLogs(true);
      setContactError('');
      setDragActive(false);

      // 延迟关闭弹窗，让用户有时间看到成功提示
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('[ErrorFeedback] 提交失败:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <i className="fas fa-times-circle text-red-500 text-lg"></i>
          <div>
            <div className="font-medium">提交失败</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {error?.message || '请稍后再试'}
            </div>
          </div>
        </div>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    if (errorType.includes('NETWORK')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (errorType.includes('PERMISSION')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (errorType.includes('MODEL')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (errorType.includes('VALIDATION')) return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  };

  // 验证联系方式格式（邮箱或手机号）
  const validateContactInfo = (value: string) => {
    if (!value) {
      setContactError('');
      return true;
    }
    
    // 邮箱正则
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // 手机号正则（支持国内手机号）
    const phoneRegex = /^1[3-9]\d{9}$/;
    
    if (emailRegex.test(value) || phoneRegex.test(value)) {
      setContactError('');
      return true;
    } else {
      setContactError('请输入有效的邮箱或手机号');
      return false;
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContactInfo(value);
    validateContactInfo(value);
  };

  // 拖拽事件处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // 处理文件拖拽上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        setScreenshots(prev => [...prev, ...imageFiles]);
      }
    }
  };

  // 处理文件选择上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setScreenshots(prev => [...prev, ...Array.from(files)]);
    }
    // 重置输入，允许重新选择相同的文件
    e.target.value = '';
  };

  // 移除截图
  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[70] flex items-center justify-center ${isDark ? 'bg-gray-900/80' : 'bg-gray-50/80'} backdrop-blur-md transition-opacity duration-300`}
    >
      <motion.div 
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl max-w-2xl w-full mx-4 overflow-hidden md:max-h-[90vh] md:overflow-y-auto`}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-750' : 'from-white to-gray-50'}`}>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: 0 }}
            >
              <i className="fas fa-bug text-red-600"></i>
            </motion.div>
            问题反馈
          </h3>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            aria-label="关闭"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClose()}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 错误信息展示 */}
          {errorDetails && (
            <motion.div 
              className={`p-5 rounded-xl ${isDark ? 'bg-gray-750/80' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full ${getErrorTypeColor(errorDetails.errorType)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <i className="fas fa-exclamation-triangle text-lg"></i>
                </div>
                <div className="flex-1">
                  {/* 修复建议 */}
                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <i className="fas fa-lightbulb text-yellow-500"></i>
                      推荐解决方案:
                    </h5>
                    <ul className="space-y-2 text-sm">
                      {errorService.getErrorFixSuggestions(errorDetails.errorType).map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <i className="fas fa-check-circle text-green-500 mt-0.5 flex-shrink-0"></i>
                          <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* 反馈表单 */}
          <div className="space-y-5">
            {/* 反馈类型 */}
            <div>
              <label htmlFor="feedbackType" className={getLabelStyles()}>反馈类型</label>
              <select
                id="feedbackType"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className={getFormControlStyles()}
                tabIndex={0}
                aria-label="反馈类型"
              >
                <option value="功能异常">功能异常</option>
                <option value="界面问题">界面问题</option>
                <option value="性能问题">性能问题</option>
                <option value="建议改进">建议改进</option>
                <option value="其他">其他</option>
              </select>
            </div>

            {/* 问题描述 */}
            <div>
              <label htmlFor="description" className={getLabelStyles()}>问题描述 <span className="text-red-500">*</span></label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="请详细描述您遇到的问题，以便我们更好地解决..."
                className={`${getFormControlStyles(!description.trim() && description.length > 0)} resize-none h-36`}
                required
                tabIndex={0}
                aria-required="true"
                maxLength={500}
                aria-describedby="description-count"
              ></textarea>
              <div className="flex justify-between items-center mt-1">
                {!description.trim() && description.length > 0 && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 flex items-center gap-1"
                  >
                    <i className="fas fa-exclamation-circle"></i>
                    请输入问题描述
                  </motion.p>
                )}
                <p id="description-count" className={`text-xs ${description.length > 400 ? 'text-yellow-500' : description.length === 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {description.length}/500
                </p>
              </div>
            </div>
            
            {/* 联系方式（选填） */}
            <div>
              <label htmlFor="contactInfo" className={getLabelStyles()}>
                联系方式
                <span className="text-xs text-gray-500 ml-1">(选填)</span>
              </label>
              <input
                id="contactInfo"
                type="text"
                value={contactInfo}
                onChange={handleContactChange}
                placeholder="如需其他联系方式可在此填写"
                className={getFormControlStyles(!!contactError)}
                tabIndex={0}
                aria-label="联系方式"
                aria-describedby={contactError ? 'contact-error' : undefined}
              />
              {!contactInfo.trim() && !contactError && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-gray-500 mt-1 flex items-center gap-1"
                >
                  <i className="fas fa-info-circle"></i>
                  我们会通过您的账号联系您，如需其他联系方式可填写
                </motion.p>
              )}
              {contactError && (
              <motion.p 
                id="contact-error"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 mt-1 flex items-center gap-1"
              >
                <i className="fas fa-exclamation-circle"></i>
                {contactError}
              </motion.p>
            )}
            </div>

            {/* 截图上传 */}
            <div>
              <label className={getLabelStyles()}>截图上传 (可选)</label>
              <div className="space-y-3">
                {/* 已上传截图 */}
                {screenshots.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {screenshots.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                      >
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg border ${
                          isDark ? 'border-gray-600' : 'border-gray-200'
                        } overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-sm`}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`截图 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeScreenshot(index)}
                          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label={`删除截图 ${index + 1}`}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && removeScreenshot(index)}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {/* 上传按钮 */}
                <label 
                  htmlFor="screenshotUpload"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 border-2 border-dashed ${
                    isDark 
                      ? `border-gray-600 hover:border-red-500 hover:bg-gray-700/50 ${dragActive ? 'border-red-500 bg-gray-700/50' : ''}` 
                      : `border-gray-200 hover:border-red-500 hover:bg-gray-50 ${dragActive ? 'border-red-500 bg-gray-100/80' : ''}`
                  }`}
                >
                  <i className="fas fa-cloud-upload-alt text-gray-500 dark:text-gray-400"></i>
                  <span className={`text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {dragActive ? '释放文件以上传' : '点击上传截图或拖拽文件到此处'}
                  </span>
                  <input
                    id="screenshotUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            {/* 包含日志选项 */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeLogs"
                checked={includeLogs}
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="w-5 h-5 rounded text-red-600 focus:ring-red-500 transition-all duration-200"
                tabIndex={0}
              />
              <label htmlFor="includeLogs" className={`text-sm ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                包含错误日志信息（有助于我们更快定位问题）
              </label>
            </div>
          </div>
        </div>
        
        <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3 bg-gradient-to-r ${isDark ? 'from-gray-800 to-gray-750' : 'from-white to-gray-50'} flex-wrap`}>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 sm:px-5 rounded-lg transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClose()}
          >
            取消
          </button>
          <motion.button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim() || !!contactError}
            className={`px-5 py-2.5 sm:px-6 rounded-lg transition-all duration-300 hover:scale-105 font-medium ${
              isSubmitting || !description.trim() || !!contactError
                ? 'bg-gray-500 cursor-not-allowed text-gray-200' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
            }`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && description.trim() && !contactError && handleSubmit()}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.05 }}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <i className="fas fa-spinner fa-spin"></i>
                </motion.div>
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                >
                  提交中...
                </motion.span>
              </div>
            ) : (
              <motion.span
                initial={{ opacity: 1 }}
                whileTap={{ opacity: 0.8 }}
              >
                提交反馈
              </motion.span>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ErrorFeedback;