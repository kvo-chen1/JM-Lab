import { useTheme } from '@/hooks/useTheme';
import {
  CertificationLevel,
  CertificationStatus,
  CertificationLevelConfig,
} from '@/types/certification';

interface Props {
  level: CertificationLevelConfig;
  currentLevel: CertificationLevel;
  currentStatus: CertificationStatus;
  onSelect: () => void;
}

export default function CertificationLevelCard({
  level,
  currentLevel,
  currentStatus,
  onSelect,
}: Props) {
  const { isDark } = useTheme();

  const isCurrent = currentLevel === level.level && currentStatus === 'approved';
  const isApplied = currentLevel === level.level && currentStatus === 'pending';

  const getLevelColor = () => {
    switch (level.color) {
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
          border: 'border-yellow-400',
          text: 'text-yellow-600',
        };
      case 'blue':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-400',
          text: 'text-blue-600',
        };
      default:
        return {
          bg: 'bg-gray-400',
          border: 'border-gray-400',
          text: 'text-gray-600',
        };
    }
  };

  const colors = getLevelColor();

  return (
    <div
      className={`relative p-6 rounded-xl border-2 transition-all ${
        isCurrent
          ? `${colors.border} ${isDark ? 'bg-gray-800' : 'bg-white'}`
          : isDark
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} text-white`}>
            当前等级
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
          <i className={`fas fa-${level.icon} text-xl text-white`}></i>
        </div>
        <div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {level.name}
          </h3>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {level.nameEn}
          </p>
        </div>
      </div>

      <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {level.description}
      </p>

      {level.requirements.length > 0 && (
        <div className="mb-4">
          <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            申请条件
          </h4>
          <ul className="space-y-1">
            {level.requirements.slice(0, 3).map((req) => (
              <li key={req.id} className="flex items-center gap-2 text-xs">
                <i
                  className={`fas fa-${req.type === 'required' ? 'asterisk' : 'circle'} text-[8px] ${
                    req.type === 'required' ? 'text-red-500' : 'text-gray-400'
                  }`}
                ></i>
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{req.description}</span>
              </li>
            ))}
            {level.requirements.length > 3 && (
              <li className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                还有 {level.requirements.length - 3} 项条件...
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <h4 className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          核心权益
        </h4>
        <div className="flex flex-wrap gap-2">
          {level.benefits.slice(0, 4).map((benefit) => (
            <span
              key={benefit.id}
              className={`px-2 py-1 rounded text-xs ${
                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {benefit.name}
            </span>
          ))}
          {level.benefits.length > 4 && (
            <span className={`px-2 py-1 rounded text-xs ${colors.text}`}>
              +{level.benefits.length - 4}
            </span>
          )}
        </div>
      </div>

      {!isCurrent && (
        <button
          onClick={onSelect}
          disabled={isApplied}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
            isApplied
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : level.color === 'gold'
              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:from-yellow-500 hover:to-yellow-700'
              : level.color === 'blue'
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          {isApplied ? '审核中' : level.level === 'normal' ? '默认等级' : '申请认证'}
        </button>
      )}
    </div>
  );
}
