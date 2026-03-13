import React, { useState, useEffect } from 'react';
import { copyrightProtectionService } from '@/services/copyrightProtectionService';
import type { CopyrightWithTimestamp } from '@/types/copyright-protection';
import { LICENSE_TYPE_CONFIG, WORK_TYPE_CONFIG } from '@/types/copyright-protection';

interface CopyrightDeclarationDetailProps {
  copyrightId: string;
  onClose?: () => void;
}

const CopyrightDeclarationDetail: React.FC<CopyrightDeclarationDetailProps> = ({
  copyrightId,
  onClose
}) => {
  const [data, setData] = useState<CopyrightWithTimestamp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [copyrightId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await copyrightProtectionService.getDeclarationWithTimestamp(copyrightId);
      setData(result);
    } catch (e) {
      console.error('加载版权详情失败:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        未找到版权声明信息
      </div>
    );
  }

  const licenseConfig = LICENSE_TYPE_CONFIG[data.licenseType];
  const workTypeConfig = WORK_TYPE_CONFIG[data.workType];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl w-full">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">版权声明详情</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          {data.workThumbnail && (
            <img
              src={data.workThumbnail}
              alt={data.workTitle}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{data.workTitle}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">{workTypeConfig?.icon} {workTypeConfig?.label}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                data.status === 'active' ? 'bg-green-100 text-green-700' :
                data.status === 'disputed' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {copyrightProtectionService.getStatusLabel(data.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">许可信息</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{licenseConfig.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{licenseConfig.label}</p>
                <p className="text-sm text-gray-500">{licenseConfig.description}</p>
              </div>
            </div>
            {data.customLicenseTerms && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">{data.customLicenseTerms}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">使用权限</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className={`text-center p-3 rounded-lg ${data.allowCommercialUse ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="text-2xl">{data.allowCommercialUse ? '✅' : '❌'}</span>
              <p className="text-sm mt-1">{data.allowCommercialUse ? '允许' : '禁止'}商业使用</p>
            </div>
            <div className={`text-center p-3 rounded-lg ${data.allowModification ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="text-2xl">{data.allowModification ? '✅' : '❌'}</span>
              <p className="text-sm mt-1">{data.allowModification ? '允许' : '禁止'}修改</p>
            </div>
            <div className={`text-center p-3 rounded-lg ${data.requireAttribution ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <span className="text-2xl">{data.requireAttribution ? '📝' : '🚫'}</span>
              <p className="text-sm mt-1">{data.requireAttribution ? '需要' : '无需'}署名</p>
            </div>
          </div>
        </div>

        {data.timestampRecord && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">时间戳记录</h4>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔐</span>
                <span className="font-medium text-gray-900">
                  {copyrightProtectionService.getProviderLabel(data.timestampRecord.provider)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">时间戳：</span>
                  <span className="text-gray-900">{formatDate(data.timestampRecord.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">哈希值：</span>
                  <span className="text-gray-900 font-mono text-xs">{data.timestampRecord.hash.substring(0, 16)}...</span>
                </div>
                {data.timestampRecord.blockNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">区块高度：</span>
                    <span className="text-gray-900">{data.timestampRecord.blockNumber}</span>
                  </div>
                )}
                {data.timestampRecord.verificationUrl && (
                  <div className="pt-2">
                    <a
                      href={data.timestampRecord.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      验证时间戳 →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">版权所有者</h4>
          <div className="flex items-center gap-3">
            {data.creatorAvatar && (
              <img src={data.creatorAvatar} alt="" className="w-10 h-10 rounded-full" />
            )}
            <div>
              <p className="font-medium text-gray-900">{data.copyrightHolder}</p>
              <p className="text-sm text-gray-500">创建于 {formatDate(data.createdAt)}</p>
            </div>
          </div>
        </div>

        {data.declaration && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-500 mb-3">声明内容</h4>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{data.declaration}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyrightDeclarationDetail;
