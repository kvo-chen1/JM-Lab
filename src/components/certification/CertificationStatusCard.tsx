import { useTheme } from '@/hooks/useTheme';
import { CertificationInfo, CERTIFICATION_LEVELS, CERTIFICATION_STATUS_NAMES } from '@/types/certification';

interface Props {
  certificationInfo: CertificationInfo | null;
  onRefresh: () => void;
}

export default function CertificationStatusCard({ certificationInfo, onRefresh }: Props) {
  const { isDark } = useTheme();

  if (!certificationInfo) return null;

  const levelConfig = CERTIFICATION_LEVELS.find((l) => l.level === certificationInfo.level);
  const statusName = CERTIFICATION_STATUS_NAMES[certificationInfo.status];

  const getStatusColor = () => {
    switch (certificationInfo.status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'rejected':
        return 'red';
      case 'revoked':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              levelConfig?.color === 'gold'
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                : levelConfig?.color === 'blue'
                ? 'bg-blue-500'
                : 'bg-gray-400'
            }`}
          >
            <i className={`fas fa-${levelConfig?.icon || 'user'} text-2xl text-white`}></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {levelConfig?.name}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  statusColor === 'green'
                    ? 'bg-green-100 text-green-600'
                    : statusColor === 'yellow'
                    ? 'bg-yellow-100 text-yellow-600'
                    : statusColor === 'red'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {statusName}
              </span>
            </div>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {levelConfig?.description}
            </p>
            {certificationInfo.verifiedAt && (
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                认证时间：{new Date(certificationInfo.verifiedAt).toLocaleDateString('zh-CN')}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onRefresh}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <i className="fas fa-sync-alt text-gray-400"></i>
        </button>
      </div>

      {certificationInfo.status === 'approved' && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            已解锁权益
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {levelConfig?.benefits.slice(0, 4).map((benefit) => (
              <div
                key={benefit.id}
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <i className={`fas fa-${benefit.icon} text-red-500`}></i>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {benefit.name}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {typeof benefit.value === 'boolean' ? '已开启' : benefit.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {certificationInfo.status === 'pending' && (
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-3">
            <i className="fas fa-clock text-yellow-500"></i>
            <div>
              <p className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                审核中
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                您的认证申请正在审核中，通常需要1-3个工作日
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
