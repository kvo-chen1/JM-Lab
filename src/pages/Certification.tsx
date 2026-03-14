import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import certificationService from '@/services/certificationService';
import {
  CertificationLevel,
  CertificationInfo,
  CERTIFICATION_LEVELS,
} from '@/types/certification';
import CertificationApplicationForm from '@/components/certification/CertificationApplicationForm';
import CertificationStatusCard from '@/components/certification/CertificationStatusCard';
import CertificationLevelCard from '@/components/certification/CertificationLevelCard';
import { toast } from 'sonner';

export default function CertificationPage() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);

  const [certificationInfo, setCertificationInfo] = useState<CertificationInfo | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<CertificationLevel | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reasons: string[];
    suggestions: string[];
  } | null>(null);

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

  const handleSelectLevel = async (level: CertificationLevel) => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    setSelectedLevel(level);

    if (level !== 'normal') {
      const result = await certificationService.checkEligibility(user.id, level);
      setEligibility(result);
    }

    setShowApplicationForm(true);
  };

  const handleApplicationSubmit = () => {
    setShowApplicationForm(false);
    setSelectedLevel(null);
    setEligibility(null);
    loadCertificationInfo();
  };

  const currentLevel = certificationInfo?.level || 'normal';
  const currentStatus = certificationInfo?.status || 'none';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            创作者认证中心
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            申请认证，解锁更多创作权益
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <i className="fas fa-spinner fa-spin text-3xl text-red-500"></i>
          </div>
        ) : (
          <>
            {currentStatus !== 'none' && currentStatus !== 'rejected' && (
              <div className="mb-8">
                <CertificationStatusCard
                  certificationInfo={certificationInfo}
                  onRefresh={loadCertificationInfo}
                />
              </div>
            )}

            {currentStatus === 'rejected' && (
              <div className={`mb-8 p-4 rounded-xl ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <i className="fas fa-exclamation-circle text-red-500 text-xl mt-0.5"></i>
                  <div>
                    <h3 className="font-semibold text-red-500">认证申请被拒绝</h3>
                    <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      您可以重新提交申请，请确保满足认证要求
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                认证等级
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CERTIFICATION_LEVELS.map((level) => (
                  <CertificationLevelCard
                    key={level.level}
                    level={level}
                    currentLevel={currentLevel}
                    currentStatus={currentStatus}
                    onSelect={() => handleSelectLevel(level.level)}
                  />
                ))}
              </div>
            </div>

            {certificationInfo && (
              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  当前数据统计
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>作品数量</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {certificationInfo.stats.totalWorks}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总浏览量</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {certificationInfo.stats.totalViews}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>总点赞数</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {certificationInfo.stats.totalLikes}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>粉丝数量</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {certificationInfo.stats.totalFollowers}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showApplicationForm && selectedLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <CertificationApplicationForm
                level={selectedLevel}
                eligibility={eligibility}
                onClose={() => {
                  setShowApplicationForm(false);
                  setSelectedLevel(null);
                  setEligibility(null);
                }}
                onSubmit={handleApplicationSubmit}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
