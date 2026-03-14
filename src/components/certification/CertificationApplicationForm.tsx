import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import certificationService, { SubmitApplicationParams } from '@/services/certificationService';
import {
  CertificationLevel,
  CertificationType,
  CERTIFICATION_LEVELS,
  CERTIFICATION_TYPE_NAMES,
} from '@/types/certification';
import { toast } from 'sonner';

interface Props {
  level: CertificationLevel;
  eligibility: {
    eligible: boolean;
    reasons: string[];
    suggestions: string[];
  } | null;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CertificationApplicationForm({ level, eligibility, onClose, onSubmit }: Props) {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    type: 'individual' as CertificationType,
    realName: '',
    idNumber: '',
    portfolioUrl: '',
    personalBio: '',
    reason: '',
    expectedBenefits: '',
    organizationName: '',
    businessLicense: '',
    organizationCode: '',
    socialLinks: {
      weibo: '',
      wechat: '',
      douyin: '',
      bilibili: '',
      xiaohongshu: '',
      website: '',
      other: '',
    },
  });

  const [files, setFiles] = useState<{
    idCardFront?: File;
    idCardBack?: File;
    portfolioFiles: File[];
  }>({ portfolioFiles: [] });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const levelConfig = CERTIFICATION_LEVELS.find((l) => l.level === level);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [socialField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (field: 'idCardFront' | 'idCardBack', file: File | undefined) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handlePortfolioFilesChange = (newFiles: File[]) => {
    setFiles((prev) => ({ ...prev, portfolioFiles: newFiles }));
  };

  const uploadFiles = async () => {
    const uploadedUrls: { idCardFront?: string; idCardBack?: string; portfolioFiles: string[] } = {
      portfolioFiles: [],
    };

    if (files.idCardFront) {
      const result = await certificationService.uploadMaterial(files.idCardFront, 'image');
      if (result.success && result.url) {
        uploadedUrls.idCardFront = result.url;
      } else {
        throw new Error('身份证正面上传失败');
      }
    }

    if (files.idCardBack) {
      const result = await certificationService.uploadMaterial(files.idCardBack, 'image');
      if (result.success && result.url) {
        uploadedUrls.idCardBack = result.url;
      } else {
        throw new Error('身份证背面上传失败');
      }
    }

    for (const file of files.portfolioFiles) {
      const result = await certificationService.uploadMaterial(file, 'image');
      if (result.success && result.url) {
        uploadedUrls.portfolioFiles.push(result.url);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!formData.realName.trim()) {
      toast.error('请填写真实姓名');
      return;
    }

    if (!formData.personalBio.trim()) {
      toast.error('请填写个人简介');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('请填写申请理由');
      return;
    }

    if (formData.type === 'individual' && !files.idCardFront) {
      toast.error('请上传身份证正面照片');
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      const uploadedUrls = await uploadFiles();
      setUploading(false);

      const params: SubmitApplicationParams = {
        level,
        type: formData.type,
        realName: formData.realName,
        idNumber: formData.idNumber,
        idCardFront: uploadedUrls.idCardFront,
        idCardBack: uploadedUrls.idCardBack,
        portfolioUrl: formData.portfolioUrl,
        portfolioFiles: uploadedUrls.portfolioFiles,
        personalBio: formData.personalBio,
        socialLinks: formData.socialLinks,
        organizationName: formData.organizationName,
        businessLicense: formData.businessLicense,
        organizationCode: formData.organizationCode,
        reason: formData.reason,
        expectedBenefits: formData.expectedBenefits,
        materials: [],
      };

      const result = await certificationService.submitApplication(params);

      if (result.success) {
        onSubmit();
      }
    } catch (error: any) {
      console.error('提交申请失败:', error);
      toast.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            申请{levelConfig?.name}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {levelConfig?.description}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {eligibility && !eligibility.eligible && (
        <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
            <div>
              <h4 className="font-medium text-yellow-600">暂不满足申请条件</h4>
              <ul className="mt-2 space-y-1 text-sm">
                {eligibility.reasons.map((reason, index) => (
                  <li key={index} className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    • {reason}
                  </li>
                ))}
              </ul>
              {eligibility.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    改进建议：
                  </p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {eligibility.suggestions.map((suggestion, index) => (
                      <li key={index} className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            认证类型 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(CERTIFICATION_TYPE_NAMES) as CertificationType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleInputChange('type', type)}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  formData.type === type
                    ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : isDark
                    ? 'border-gray-700 hover:border-gray-600 text-gray-300'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {CERTIFICATION_TYPE_NAMES[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              真实姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.realName}
              onChange={(e) => handleInputChange('realName', e.target.value)}
              placeholder="请输入真实姓名"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              身份证号
            </label>
            <input
              type="text"
              value={formData.idNumber}
              onChange={(e) => handleInputChange('idNumber', e.target.value)}
              placeholder="请输入身份证号（选填）"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
          </div>
        </div>

        {formData.type === 'individual' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                身份证正面 <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                {files.idCardFront ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(files.idCardFront)}
                      alt="身份证正面"
                      className="max-h-32 mx-auto rounded"
                    />
                    <button
                      onClick={() => handleFileChange('idCardFront', undefined)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-4">
                    <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>点击上传身份证正面</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange('idCardFront', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                身份证背面
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
                  isDark ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                {files.idCardBack ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(files.idCardBack)}
                      alt="身份证背面"
                      className="max-h-32 mx-auto rounded"
                    />
                    <button
                      onClick={() => handleFileChange('idCardBack', undefined)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-4">
                    <i className="fas fa-cloud-upload-alt text-2xl text-gray-400 mb-2"></i>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>点击上传身份证背面</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange('idCardBack', e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {(formData.type === 'organization' || formData.type === 'brand') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                机构/企业名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                placeholder="请输入机构/企业名称"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                统一社会信用代码
              </label>
              <input
                type="text"
                value={formData.organizationCode}
                onChange={(e) => handleInputChange('organizationCode', e.target.value)}
                placeholder="请输入统一社会信用代码"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500`}
              />
            </div>
          </div>
        )}

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            个人简介 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.personalBio}
            onChange={(e) => handleInputChange('personalBio', e.target.value)}
            placeholder="请介绍您的创作经历、专业背景等"
            rows={3}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            作品集链接
          </label>
          <input
            type="url"
            value={formData.portfolioUrl}
            onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
            placeholder="请输入您的作品集网站链接"
            className={`w-full px-4 py-2 rounded-lg border ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            社交媒体账号
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'weibo', label: '微博', icon: 'weibo' },
              { key: 'douyin', label: '抖音', icon: 'tiktok' },
              { key: 'bilibili', label: 'B站', icon: 'play-circle' },
              { key: 'xiaohongshu', label: '小红书', icon: 'book' },
            ].map((social) => (
              <div key={social.key}>
                <div className="relative">
                  <i className={`fab fa-${social.icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}></i>
                  <input
                    type="text"
                    value={formData.socialLinks[social.key as keyof typeof formData.socialLinks]}
                    onChange={(e) => handleInputChange(`socialLinks.${social.key}`, e.target.value)}
                    placeholder={social.label}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            申请理由 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder="请说明您为什么要申请认证"
            rows={3}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            期望获得的权益
          </label>
          <textarea
            value={formData.expectedBenefits}
            onChange={(e) => handleInputChange('expectedBenefits', e.target.value)}
            placeholder="请描述您期望通过认证获得的权益和帮助"
            rows={2}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          />
        </div>
      </div>

      <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
        <button
          onClick={onClose}
          disabled={submitting}
          className={`px-6 py-2 rounded-lg ${
            isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || (eligibility && !eligibility.eligible)}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {uploading ? '上传中...' : '提交中...'}
            </>
          ) : (
            '提交申请'
          )}
        </button>
      </div>
    </div>
  );
}
