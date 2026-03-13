import React, { useState } from 'react';
import { copyrightCertificateService } from '@/services/copyrightCertificateService';
import { copyrightProtectionService } from '@/services/copyrightProtectionService';
import type { GenerateCertificateDTO, CertificateTemplate } from '@/types/copyright-certificate';
import { CERTIFICATE_TEMPLATE_CONFIG } from '@/types/copyright-certificate';

interface CertificateGeneratorProps {
  copyrightDeclarationId: string;
  onSuccess?: (certificate: any) => void;
  onCancel?: () => void;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  copyrightDeclarationId,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<CertificateTemplate>('standard');
  const [validUntil, setValidUntil] = useState('');
  const [declaration, setDeclaration] = useState<any>(null);

  React.useEffect(() => {
    loadDeclaration();
  }, [copyrightDeclarationId]);

  const loadDeclaration = async () => {
    const decl = await copyrightProtectionService.getDeclarationById(copyrightDeclarationId);
    setDeclaration(decl);
  };

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const dto: GenerateCertificateDTO = {
        copyrightDeclarationId,
        template,
        validUntil: validUntil || undefined
      };

      const certificate = await copyrightCertificateService.generateCertificate(dto);

      if (onSuccess) {
        onSuccess(certificate);
      }
    } catch (error: any) {
      alert(error.message || '生成证书失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-6">生成版权证书</h2>

      {declaration && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            <span className="font-medium">作品：</span>{declaration.workTitle}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">版权所有者：</span>{declaration.copyrightHolder}
          </p>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择证书模板
        </label>
        <div className="space-y-3">
          {Object.entries(CERTIFICATE_TEMPLATE_CONFIG).map(([key, config]) => (
            <label
              key={key}
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                template === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="template"
                value={key}
                checked={template === key}
                onChange={(e) => setTemplate(e.target.value as CertificateTemplate)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.icon}</span>
                  <span className="font-medium text-gray-900">{config.label}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {config.features.map((feature, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          有效期至（可选）
        </label>
        <input
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">留空表示永久有效</p>
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
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '生成中...' : '生成证书'}
        </button>
      </div>
    </div>
  );
};

export default CertificateGenerator;
