import React, { useState } from 'react';
import { infringementReportService } from '@/services/infringementReportService';
import type { CreateInfringementReportDTO, InfringementType } from '@/types/infringement-report';
import { INFRINGEMENT_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types/infringement-report';

interface InfringementReportFormProps {
  targetType: 'work' | 'user' | 'product' | 'external';
  targetId: string;
  targetTitle?: string;
  targetUrl?: string;
  targetThumbnail?: string;
  targetCreatorId?: string;
  targetCreatorName?: string;
  onSuccess?: (report: any) => void;
  onCancel?: () => void;
}

const InfringementReportForm: React.FC<InfringementReportFormProps> = ({
  targetType,
  targetId,
  targetTitle,
  targetUrl,
  targetThumbnail,
  targetCreatorId,
  targetCreatorName,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    infringementType: '' as InfringementType,
    priority: 'normal' as CreateInfringementReportDTO['priority'],
    title: '',
    description: '',
    originalWorkUrl: '',
    originalWorkTitle: '',
    originalCreationDate: '',
    reporterEmail: '',
    reporterPhone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.infringementType || !formData.title || !formData.description) {
        alert('请填写必填项');
        return;
      }
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const dto: CreateInfringementReportDTO = {
        targetType,
        targetId,
        targetTitle,
        targetUrl,
        targetThumbnail,
        targetCreatorId,
        targetCreatorName,
        infringementType: formData.infringementType,
        priority: formData.priority,
        title: formData.title,
        description: formData.description,
        originalWorkUrl: formData.originalWorkUrl || undefined,
        originalWorkTitle: formData.originalWorkTitle || undefined,
        originalCreationDate: formData.originalCreationDate || undefined,
        reporterEmail: formData.reporterEmail || undefined,
        reporterPhone: formData.reporterPhone || undefined
      };

      const report = await infringementReportService.createReport(dto);
      
      if (onSuccess) {
        onSuccess(report);
      }
    } catch (error: any) {
      alert(error.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">
          <span className="font-medium">举报对象：</span>
          {targetTitle || targetId}
        </p>
        {targetCreatorName && (
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">创作者：</span>{targetCreatorName}
          </p>
        )}
      </div>

      {step === 1 && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              侵权类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(INFRINGEMENT_TYPE_CONFIG).map(([key, config]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.infringementType === key
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="infringementType"
                    value={key}
                    checked={formData.infringementType === key}
                    onChange={(e) => setFormData({ ...formData, infringementType: e.target.value as InfringementType })}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span className="font-medium text-gray-900">{config.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              优先级
            </label>
            <div className="flex gap-2">
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <label
                  key={key}
                  className={`flex-1 text-center p-2 border rounded-lg cursor-pointer transition-all ${
                    formData.priority === key
                      ? `${config.bgColor} ${config.color} border-current`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={key}
                    checked={formData.priority === key}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{config.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              举报标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="简要描述侵权情况"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请详细描述侵权情况，包括具体侵权内容、时间、地点等..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              下一步
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">提示：</span>
              提供原创作品信息可以帮助我们更快处理您的举报
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原创作品链接
            </label>
            <input
              type="url"
              value={formData.originalWorkUrl}
              onChange={(e) => setFormData({ ...formData, originalWorkUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原创作品名称
            </label>
            <input
              type="text"
              value={formData.originalWorkTitle}
              onChange={(e) => setFormData({ ...formData, originalWorkTitle: e.target.value })}
              placeholder="原创作品的名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原创创作时间
            </label>
            <input
              type="date"
              value={formData.originalCreationDate}
              onChange={(e) => setFormData({ ...formData, originalCreationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">联系方式（可选）</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.reporterEmail}
                  onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                  placeholder="用于接收处理进度通知"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">电话</label>
                <input
                  type="tel"
                  value={formData.reporterPhone}
                  onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                  placeholder="用于紧急联系"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              上一步
            </button>
            <div className="flex gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '提交中...' : '提交举报'}
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  );
};

export default InfringementReportForm;
