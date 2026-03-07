/**
 * 授权状态组件 - 显示品牌授权申请的状态
 */
import React from 'react';
import { BrandAuthorization } from '@/services/brandService';

interface AuthorizationStatusProps {
  authorization: BrandAuthorization;
  showDetails?: boolean;
  compact?: boolean;
}

const AuthorizationStatus: React.FC<AuthorizationStatusProps> = ({
  authorization,
  showDetails = true,
  compact = false,
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '审核中',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: '⏳',
        };
      case 'approved':
        return {
          label: '已批准',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          icon: '✅',
        };
      case 'rejected':
        return {
          label: '已拒绝',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: '❌',
        };
      case 'completed':
        return {
          label: '已完成',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: '🎉',
        };
      case 'cancelled':
        return {
          label: '已取消',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: '🚫',
        };
      default:
        return {
          label: '未知',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          icon: '❓',
        };
    }
  };

  const statusConfig = getStatusConfig(authorization.status);

  if (compact) {
    return (
      <span
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          ${statusConfig.bgColor} ${statusConfig.textColor}
        `}
      >
        <span>{statusConfig.icon}</span>
        <span>{statusConfig.label}</span>
      </span>
    );
  }

  return (
    <div
      className={`
        rounded-xl border-2 p-4
        ${statusConfig.bgColor} ${statusConfig.borderColor}
      `}
    >
      {/* 状态头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{statusConfig.icon}</span>
          <span className={`font-semibold ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(authorization.created_at).toLocaleDateString('zh-CN')}
        </span>
      </div>

      {showDetails && (
        <div className="space-y-2 text-sm">
          {/* 品牌信息 */}
          {authorization.brand && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">品牌方:</span>
              <span className="font-medium text-gray-800">{authorization.brand.name}</span>
            </div>
          )}

          {/* IP资产信息 */}
          {authorization.ip_asset && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">IP资产:</span>
              <span className="font-medium text-gray-800">{authorization.ip_asset.name}</span>
            </div>
          )}

          {/* 授权期限 */}
          {authorization.proposed_duration && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">授权期限:</span>
              <span className="font-medium text-gray-800">{authorization.proposed_duration}个月</span>
            </div>
          )}

          {/* 期望价格 */}
          {authorization.proposed_price && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">期望价格:</span>
              <span className="font-medium text-[#C02C38]">
                ¥{authorization.proposed_price.toLocaleString()}
              </span>
            </div>
          )}

          {/* 有效期 */}
          {authorization.started_at && authorization.expired_at && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">有效期:</span>
              <span className="font-medium text-gray-800">
                {new Date(authorization.started_at).toLocaleDateString('zh-CN')} -
                {new Date(authorization.expired_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
          )}

          {/* 品牌回复 */}
          {authorization.brand_response && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <span className="text-gray-500 text-xs">品牌方回复:</span>
              <p className="text-gray-700 mt-1">{authorization.brand_response}</p>
            </div>
          )}

          {/* 合同和证书链接 */}
          {(authorization.contract_url || authorization.certificate_url) && (
            <div className="flex gap-2 mt-3">
              {authorization.contract_url && (
                <a
                  href={authorization.contract_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  查看合同
                </a>
              )}
              {authorization.certificate_url && (
                <a
                  href={authorization.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  查看证书
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthorizationStatus;
