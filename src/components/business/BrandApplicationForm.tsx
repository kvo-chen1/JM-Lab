import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { uploadBrandLogo } from '@/services/storageService';
import { 
  Send, 
  Building2, 
  User, 
  Phone, 
  Mail,
  FileText, 
  Upload,
  Image as ImageIcon,
  X,
  Loader2
} from 'lucide-react';

interface BrandApplicationFormProps {
  isDark: boolean;
  onSubmit: (data: {
    brandName: string;
    brandLogo: string;
    description: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
  }) => void;
}

const BrandApplicationForm: React.FC<BrandApplicationFormProps> = ({ isDark, onSubmit }) => {
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证品牌名称是否已填写
    if (!brandName.trim()) {
      toast.error('请先填写品牌名称');
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // 上传文件
      const result = await uploadBrandLogo(file, brandName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.error) {
        toast.error(result.error);
        setBrandLogo('');
      } else if (result.url) {
        setBrandLogo(result.url);
        toast.success('Logo上传成功！');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败，请重试');
      setBrandLogo('');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // 清空文件输入，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 点击上传区域
  const handleUploadClick = () => {
    if (!brandName.trim()) {
      toast.error('请先填写品牌名称');
      return;
    }
    fileInputRef.current?.click();
  };

  // 删除已上传的Logo
  const handleRemoveLogo = () => {
    setBrandLogo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      brandName,
      brandLogo,
      description,
      contactName,
      contactPhone,
      contactEmail,
    });
  };

  const isValid = brandName.trim() && description.trim() && contactName.trim() && contactPhone.trim();

  return (
    <section className="mb-16">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
          <Building2 className="w-4 h-4 text-blue-500" />
          <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            品牌入驻申请
          </span>
        </div>
        <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          提交品牌入驻申请
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          填写品牌信息，我们将在1-3个工作日内完成审核
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className={`
          max-w-2xl mx-auto p-8 rounded-3xl
          ${isDark 
            ? 'bg-slate-800/50 border border-slate-700' 
            : 'bg-white border border-gray-200'}
        `}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 品牌Logo上传 */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                品牌Logo
              </div>
            </label>
            
            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex items-center gap-4">
              {brandLogo ? (
                <div className="relative">
                  <img 
                    src={brandLogo} 
                    alt="Brand Logo" 
                    className="w-20 h-20 rounded-xl object-cover border-2 border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className={`
                    w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all
                    ${isDark 
                      ? 'border-slate-600 hover:border-blue-500 bg-slate-800' 
                      : 'border-gray-300 hover:border-blue-500 bg-gray-50'}
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isUploading ? (
                    <div className="relative">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      {uploadProgress > 0 && (
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-blue-500">
                          {uploadProgress}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-400">上传</span>
                    </>
                  )}
                </button>
              )}
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>建议尺寸：200×200px</p>
                <p>支持格式：JPG、PNG、WebP</p>
                <p>最大大小：2MB</p>
                {!brandName.trim() && (
                  <p className="text-amber-500 mt-1">* 请先填写品牌名称</p>
                )}
              </div>
            </div>
          </div>

          {/* 品牌名称 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                品牌名称 *
              </div>
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="请输入品牌名称"
              className={`
                w-full px-4 py-3 rounded-xl transition-all
                ${isDark 
                  ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                  : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
          </div>

          {/* 品牌介绍 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                品牌介绍 *
              </div>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请简要介绍您的品牌，包括品牌历史、产品特色、目标用户等..."
              rows={4}
              className={`
                w-full px-4 py-3 rounded-xl resize-none transition-all
                ${isDark 
                  ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                  : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
          </div>

          {/* 分隔线 */}
          <div className={`border-t ${isDark ? 'border-slate-700' : 'border-gray-200'} pt-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              联系人信息
            </h3>
          </div>

          {/* 联系人姓名 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                联系人姓名 *
              </div>
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="请输入联系人姓名"
              className={`
                w-full px-4 py-3 rounded-xl transition-all
                ${isDark 
                  ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                  : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
          </div>

          {/* 联系电话 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                联系电话 *
              </div>
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="请输入联系电话"
              className={`
                w-full px-4 py-3 rounded-xl transition-all
                ${isDark 
                  ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                  : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
          </div>

          {/* 联系邮箱 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                联系邮箱
              </div>
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="请输入联系邮箱（选填）"
              className={`
                w-full px-4 py-3 rounded-xl transition-all
                ${isDark 
                  ? 'bg-slate-800 text-white placeholder-gray-500 border border-slate-700 focus:border-blue-500' 
                  : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500'}
                focus:outline-none focus:ring-2 focus:ring-blue-500/20
              `}
            />
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={!isValid}
            className={`
              w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all
              ${isValid
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]'
                : (isDark ? 'bg-slate-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
              }
            `}
          >
            <Send className="w-5 h-5" />
            提交入驻申请
          </button>

          <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            提交即表示您同意我们的服务条款和隐私政策，我们将在1-3个工作日内完成审核
          </p>
        </form>
      </motion.div>
    </section>
  );
};

export default BrandApplicationForm;
