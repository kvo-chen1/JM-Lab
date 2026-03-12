import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useJinbi } from '@/hooks/useJinbi';
import JinbiInsufficientModal from './JinbiInsufficientModal';

interface JinbiCostIndicatorProps {
  serviceType: string;
  serviceSubtype?: string;
  customCost?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onInsufficient?: () => void;
}

export const JinbiCostIndicator: React.FC<JinbiCostIndicatorProps> = ({
  serviceType,
  serviceSubtype,
  customCost,
  showLabel = true,
  size = 'md',
  onInsufficient,
}) => {
  const { isDark } = useTheme();
  const { balance, pricing, getServiceCost, checkBalance } = useJinbi();
  const [cost, setCost] = useState<number>(customCost || 0);
  const [hasEnough, setHasEnough] = useState<boolean>(true);
  const [showModal, setShowModal] = useState(false);

  const availableBalance = balance?.availableBalance || 0;

  // 计算服务费用
  useEffect(() => {
    if (customCost !== undefined) {
      setCost(customCost);
    } else {
      getServiceCost(serviceType, serviceSubtype).then(setCost);
    }
  }, [serviceType, serviceSubtype, customCost, getServiceCost]);

  // 检查余额
  useEffect(() => {
    checkBalance(cost).then((result) => {
      setHasEnough(result.sufficient);
    });
  }, [cost, availableBalance, checkBalance]);

  const handleClick = () => {
    if (!hasEnough) {
      setShowModal(true);
      onInsufficient?.();
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <>
      <motion.div
        whileHover={!hasEnough ? { scale: 1.02 } : {}}
        whileTap={!hasEnough ? { scale: 0.98 } : {}}
        onClick={!hasEnough ? handleClick : undefined}
        className={`
          inline-flex items-center rounded-full font-medium
          transition-all duration-200
          ${sizeClasses[size]}
          ${hasEnough
            ? isDark
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : isDark
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 cursor-pointer hover:bg-rose-500/20'
              : 'bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100'
          }
        `}
      >
        {hasEnough ? (
          <CheckCircle2 size={iconSizes[size]} className="text-emerald-500" />
        ) : (
          <AlertCircle size={iconSizes[size]} className="text-rose-500" />
        )}
        <Coins size={iconSizes[size]} className={hasEnough ? 'text-amber-500' : 'text-rose-400'} />
        <span>{(cost || 0).toLocaleString()} 津币</span>
        {!hasEnough && <span className="text-xs opacity-70">(余额不足)</span>}
      </motion.div>

      <JinbiInsufficientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        requiredAmount={cost}
        currentBalance={availableBalance}
        serviceName="此服务"
      />
    </>
  );
};

export default JinbiCostIndicator;
