import React, { useState, useEffect } from 'react';
import { similarityDetectionService } from '@/services/similarityDetectionService';
import type { InfringementAlert } from '@/types/similarity-detection';
import { SEVERITY_CONFIG, ALERT_TYPE_CONFIG } from '@/types/similarity-detection';

interface InfringementAlertListProps {
  status?: string;
  onAlertClick?: (alert: InfringementAlert) => void;
}

const InfringementAlertList: React.FC<InfringementAlertListProps> = ({
  status,
  onAlertClick
}) => {
  const [alerts, setAlerts] = useState<InfringementAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [status]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await similarityDetectionService.getAlerts(status);
      setAlerts(data);
    } catch (e) {
      console.error('加载预警失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    await similarityDetectionService.updateAlertStatus(alertId, 'dismissed', '用户标记为误报');
    loadAlerts();
  };

  const handleConfirm = async (alertId: string) => {
    await similarityDetectionService.updateAlertStatus(alertId, 'confirmed', '用户确认侵权');
    loadAlerts();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-32"></div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <span className="text-4xl mb-4 block">✅</span>
        <p>暂无侵权预警</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map(alert => {
        const severityConfig = SEVERITY_CONFIG[alert.severity];
        const alertTypeConfig = ALERT_TYPE_CONFIG[alert.alertType];

        return (
          <div
            key={alert.id}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              alert.status === 'pending' ? 'border-l-4' : ''
            }`}
            style={{ borderLeftColor: alert.status === 'pending' ? severityConfig.color.replace('text-', '') : undefined }}
            onClick={() => onAlertClick?.(alert)}
          >
            <div className={`${severityConfig.bgColor} p-4`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{severityConfig.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${severityConfig.color}`}>
                        {severityConfig.label}
                      </h3>
                      <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                        {alertTypeConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  alert.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                  alert.status === 'confirmed' ? 'bg-red-200 text-red-800' :
                  alert.status === 'dismissed' ? 'bg-gray-200 text-gray-700' :
                  'bg-green-200 text-green-800'
                }`}>
                  {alert.status === 'pending' ? '待处理' :
                   alert.status === 'confirmed' ? '已确认' :
                   alert.status === 'dismissed' ? '已忽略' : '已解决'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white">
              <div className="flex items-center gap-4 mb-3">
                {alert.workThumbnail && (
                  <img
                    src={alert.workThumbnail}
                    alt={alert.workTitle}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{alert.workTitle}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(alert.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              {alert.similarityResults.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">相似作品：</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {alert.similarityResults.slice(0, 3).map((result, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 bg-gray-50 rounded p-2 min-w-[120px]"
                      >
                        {result.targetWorkThumbnail && (
                          <img
                            src={result.targetWorkThumbnail}
                            alt={result.targetWorkTitle}
                            className="w-full h-16 object-cover rounded mb-1"
                          />
                        )}
                        <p className="text-xs text-gray-700 truncate">{result.targetWorkTitle}</p>
                        <p className="text-xs text-blue-600">
                          相似度: {(result.similarityScore * 100).toFixed(0)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded p-3 mb-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">建议：</span>{alert.recommendation}
                </p>
              </div>

              {alert.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirm(alert.id);
                    }}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    确认侵权
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(alert.id);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    忽略（误报）
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InfringementAlertList;
