import React, { useState, useEffect } from 'react';
import { copyrightProtectionService } from '@/services/copyrightProtectionService';
import type { CopyrightDeclaration } from '@/types/copyright-protection';
import { LICENSE_TYPE_CONFIG as LICENSE_CONFIG } from '@/types/copyright-protection';

interface CopyrightBadgeProps {
  workId: string;
  compact?: boolean;
  showDetails?: boolean;
}

const CopyrightBadge: React.FC<CopyrightBadgeProps> = ({
  workId,
  compact = false,
  showDetails = true
}) => {
  const [declaration, setDeclaration] = useState<CopyrightDeclaration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeclaration();
  }, [workId]);

  const loadDeclaration = async () => {
    setLoading(true);
    try {
      const decl = await copyrightProtectionService.getDeclarationByWorkId(workId);
      setDeclaration(decl);
    } catch (e) {
      console.error('加载版权声明失败:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return compact ? null : (
      <div className="animate-pulse flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!declaration) {
    return null;
  }

  const licenseConfig = LICENSE_CONFIG[declaration.licenseType];

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
        <span>{licenseConfig.icon}</span>
        <span>已声明版权</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <span className="text-lg">{licenseConfig.icon}</span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-blue-800">
          {licenseConfig.label}
        </span>
        {showDetails && (
          <span className="text-xs text-blue-600">
            {declaration.copyrightHolder}
          </span>
        )}
      </div>
    </div>
  );
};

export default CopyrightBadge;
