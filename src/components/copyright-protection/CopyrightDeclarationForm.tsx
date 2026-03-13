import React, { useState } from 'react';
import { copyrightProtectionService } from '@/services/copyrightProtectionService';
import type { CreateCopyrightDeclarationDTO, WorkType } from '@/types/copyright-protection';
import { LICENSE_TYPE_CONFIG, WORK_TYPE_CONFIG } from '@/types/copyright-protection';

interface CopyrightDeclarationFormProps {
  workId: string;
  workTitle: string;
  workType: WorkType;
  workUrl?: string;
  workThumbnail?: string;
  onSuccess?: (declaration: any) => void;
  onCancel?: () => void;
}

const CopyrightDeclarationForm: React.FC<CopyrightDeclarationFormProps> = ({
  workId,
  workTitle,
  workType,
  workUrl,
  workThumbnail,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    licenseType: 'all_rights_reserved' as CreateCopyrightDeclarationDTO['licenseType'],
    copyrightHolder: '',
    declaration: '',
    customLicenseTerms: '',
    allowCommercialUse: false,
    allowModification: false,
    requireAttribution: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dto: CreateCopyrightDeclarationDTO = {
        workId,
        workTitle,
        workType,
        workUrl,
        workThumbnail,
        licenseType: formData.licenseType,
        copyrightHolder: formData.copyrightHolder || undefined,
        declaration: formData.declaration || undefined,
        customLicenseTerms: formData.licenseType === 'custom' ? formData.customLicenseTerms : undefined,
        allowCommercialUse: formData.allowCommercialUse,
        allowModification: formData.allowModification,
        requireAttribution: formData.requireAttribution
      };

      const declaration = await copyrightProtectionService.createDeclaration(dto);

      const timestamp = await copyrightProtectionService.createTimestamp(
        declaration.id,
        'internal'
      );

      if (onSuccess) {
        onSuccess({ ...declaration, timestampRecord: timestamp });
      }
    } catch (error: any) {
      alert(error.message || '创建版权声明失败');
    } finally {
      setLoading(false);
    }
  };

  const selectedLicense = LICENSE_TYPE_CONFIG[formData.licenseType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">版权声明</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">作品：</span>{workTitle}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">类型：</span>{WORK_TYPE_CONFIG[workType]?.label || workType}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          版权所有者
        </label>
        <input
          type="text"
          value={formData.copyrightHolder}
          onChange={(e) => setFormData({ ...formData, copyrightHolder: e.target.value })}
          placeholder="默认为创作者本人"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          许可类型
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(LICENSE_TYPE_CONFIG).map(([key, config]) => (
            <label
              key={key}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                formData.licenseType === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="licenseType"
                value={key}
                checked={formData.licenseType === key}
                onChange={(e) => setFormData({ ...formData, licenseType: e.target.value as any })}
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

      {formData.licenseType === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自定义许可条款
          </label>
          <textarea
            value={formData.customLicenseTerms}
            onChange={(e) => setFormData({ ...formData, customLicenseTerms: e.target.value })}
            placeholder="请详细描述您的自定义许可条款..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          版权声明（可选）
        </label>
        <textarea
          value={formData.declaration}
          onChange={(e) => setFormData({ ...formData, declaration: e.target.value })}
          placeholder="添加额外的版权声明内容..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.requireAttribution}
            onChange={(e) => setFormData({ ...formData, requireAttribution: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">使用时需要注明作者</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.allowCommercialUse}
            onChange={(e) => setFormData({ ...formData, allowCommercialUse: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">允许商业使用</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.allowModification}
            onChange={(e) => setFormData({ ...formData, allowModification: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">允许修改和演绎</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '创建中...' : '创建版权声明'}
        </button>
      </div>
    </form>
  );
};

export default CopyrightDeclarationForm;
