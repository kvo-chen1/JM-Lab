import { useState, useEffect, useCallback } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import certificationService from '@/services/certificationService';
import { CertificationInfo, CertificationLevel } from '@/types/certification';

export function useCertification(userId?: string) {
  const { user } = useAuthCheck();
  const targetUserId = userId || user?.id;

  const [certificationInfo, setCertificationInfo] = useState<CertificationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCertificationInfo = useCallback(async () => {
    if (!targetUserId) {
      setCertificationInfo(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await certificationService.getCertificationInfo(targetUserId);
      setCertificationInfo(info);
    } catch (err) {
      console.error('加载认证信息失败:', err);
      setError('加载认证信息失败');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    loadCertificationInfo();
  }, [loadCertificationInfo]);

  const checkEligibility = useCallback(
    async (level: CertificationLevel) => {
      if (!targetUserId) {
        return { eligible: false, reasons: ['请先登录'], suggestions: [] };
      }
      return certificationService.checkEligibility(targetUserId, level);
    },
    [targetUserId]
  );

  const isVerified = certificationInfo?.status === 'approved' && certificationInfo.level !== 'normal';
  const isSigned = certificationInfo?.status === 'approved' && certificationInfo.level === 'signed';
  const certificationLevel = certificationInfo?.level || 'normal';

  return {
    certificationInfo,
    loading,
    error,
    refresh: loadCertificationInfo,
    checkEligibility,
    isVerified,
    isSigned,
    certificationLevel,
  };
}

export default useCertification;
