import { useState, useEffect, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import certificationService from '@/services/certificationService';
import {
  CertificationInfo,
  CERTIFICATION_LEVELS,
} from '@/types/certification';

interface BenefitItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  value: boolean | string | number;
  enabled: boolean;
}

export default function CertificationBenefits() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);

  const [certificationInfo, setCertificationInfo] = useState<CertificationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadCertificationInfo();
    }
  }, [user?.id]);

  const loadCertificationInfo = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const info = await certificationService.getCertificationInfo(user.id);
      setCertificationInfo(info);
    } catch (error) {
      console.error('加载认证信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllBenefits = (): BenefitItem[] => {
    const currentLevel = certificationInfo?.level || 'normal';
    const currentLevelIndex = CERTIFICATION_LEVELS.findIndex((l) => l.level === currentLevel);

    const allBenefits: BenefitItem[] = [];

    CERTIFICATION_LEVELS.forEach((level, index) => {
      level.benefits.forEach((benefit) => {
        const existingBenefit = allBenefits.find((b) => b.id === benefit.id);
        if (!existingBenefit) {
          allBenefits.push({
            ...benefit,
            enabled: index <= currentLevelIndex && certificationInfo?.status === 'approved',
          });
        }
      });
    });

    return allBenefits;
  };

  const benefits = getAllBenefits();
  const currentLevelConfig = CERTIFICATION_LEVELS.find(
    (l) => l.level === (certificationInfo?.level || 'normal')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-2xl text-red-500"></i>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            认证权益
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            当前等级：{currentLevelConfig?.name}
          </p>
        </div>
        <button
          onClick={loadCertificationInfo}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <i className="fas fa-sync-alt text-gray-400"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            className={`p-4 rounded-lg border transition-all ${
              benefit.enabled
                ? isDark
                  ? 'bg-green-900/20 border-green-800'
                  : 'bg-green-50 border-green-200'
                : isDark
                ? 'bg-gray-700 border-gray-600 opacity-60'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  benefit.enabled
                    ? 'bg-green-100 text-green-600'
                    : isDark
                    ? 'bg-gray-600 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <i className={`fas fa-${benefit.icon}`}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-sm font-medium ${
                      benefit.enabled
                        ? isDark
                          ? 'text-green-400'
                          : 'text-green-700'
                        : isDark
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }`}
                  >
                    {benefit.name}
                  </h3>
                  {benefit.enabled && (
                    <i className="fas fa-check-circle text-green-500 text-xs"></i>
                  )}
                </div>
                <p
                  className={`text-xs mt-1 ${
                    benefit.enabled
                      ? isDark
                        ? 'text-gray-400'
                        : 'text-gray-600'
                      : isDark
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                >
                  {benefit.description}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs ${
                    benefit.enabled
                      ? isDark
                        ? 'text-gray-400'
                        : 'text-gray-600'
                      : isDark
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                >
                  {typeof benefit.value === 'boolean'
                    ? benefit.enabled
                      ? '已开启'
                      : '未开启'
                    : benefit.value}
                </span>
                <div
                  className={`px-2 py-0.5 rounded text-xs ${
                    benefit.enabled
                      ? 'bg-green-100 text-green-600'
                      : isDark
                      ? 'bg-gray-600 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {benefit.enabled ? '已解锁' : '未解锁'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {certificationInfo?.status !== 'approved' && (
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-3">
            <i className="fas fa-info-circle text-yellow-500"></i>
            <div>
              <p className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                升级认证等级以解锁更多权益
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                申请更高级别的认证，享受更多专属功能和权益
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
