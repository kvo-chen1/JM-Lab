/**
 * 奖品展示组件
 * 支持多种布局方式展示奖品信息
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  Prize,
  PrizeDisplayConfig,
  PrizeLevel,
  PrizeCombinationType,
  PRIZE_LEVEL_COLORS,
  PRIZE_TYPE_NAMES,
} from '@/types/prize';
import {
  Gift,
  Trophy,
  Medal,
  Crown,
  Star,
  Award,
  Users,
  Coins,
} from 'lucide-react';

interface PrizeDisplayProps {
  prizes: Prize[];
  config?: Partial<PrizeDisplayConfig>;
  className?: string;
}

export const PrizeDisplay: React.FC<PrizeDisplayProps> = ({
  prizes,
  config = {},
  className = '',
}) => {
  const { isDark } = useTheme();

  // 合并默认配置
  const displayConfig: PrizeDisplayConfig = useMemo(() => ({
    layout: 'podium',
    showValue: true,
    showQuantity: true,
    animationEnabled: true,
    highlightTopThree: true,
    cardStyle: 'modern',
    ...config,
  }), [config]);

  // 按等级排序
  const sortedPrizes = useMemo(() => {
    return [...prizes].sort((a, b) => a.level - b.level);
  }, [prizes]);

  // 领奖台布局 - 前三名特殊展示
  const renderPodiumLayout = () => {
    const topThree = sortedPrizes.slice(0, 3);
    const others = sortedPrizes.slice(3);

    // 领奖台顺序：2, 1, 3
    const podiumOrder = [
      topThree.find(p => p.level === PrizeLevel.SECOND),
      topThree.find(p => p.level === PrizeLevel.FIRST),
      topThree.find(p => p.level === PrizeLevel.THIRD),
    ].filter(Boolean) as Prize[];

    return (
      <div className="space-y-6">
        {/* 领奖台 */}
        {podiumOrder.length > 0 && (
          <div className="flex items-end justify-center gap-2 sm:gap-4">
            {podiumOrder.map((prize, index) => {
              const isFirst = prize.level === PrizeLevel.FIRST;
              const heightClass = isFirst ? 'h-32 sm:h-40' : index === 0 ? 'h-24 sm:h-32' : 'h-20 sm:h-28';
              const rankNumber = isFirst ? 1 : index === 0 ? 2 : 3;

              return (
                <motion.div
                  key={prize.id}
                  initial={displayConfig.animationEnabled ? { opacity: 0, y: 50 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex flex-col items-center flex-1 max-w-[140px]"
                >
                  {/* 奖品信息 */}
                  <div className={`text-center mb-2 ${isFirst ? 'scale-105' : ''}`}>
                    <div className="text-xs text-gray-500 mb-1 truncate px-1">
                      {prize.singlePrize?.name || (prize.subPrizes ? `${prize.subPrizes.length}项组合` : prize.rankName)}
                    </div>
                  </div>

                  {/* 领奖台底座 */}
                  <div
                    className={`w-full ${heightClass} rounded-t-xl flex flex-col items-center justify-end pb-3`}
                    style={{
                      background: `linear-gradient(180deg, ${prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level]} 0%, ${adjustColorOpacity(prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level], 0.7)} 100%)`,
                    }}
                  >
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {rankNumber}
                    </span>
                    <span className="text-xs text-white/80 mt-0.5 truncate px-2 w-full text-center">
                      {prize.rankName}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 奖品卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPrizes.map((prize, index) => (
            <motion.div
              key={prize.id}
              initial={displayConfig.animationEnabled ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PrizeCard
                prize={prize}
                config={displayConfig}
                variant="compact"
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // 网格布局
  const renderGridLayout = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedPrizes.map((prize, index) => (
        <motion.div
          key={prize.id}
          initial={displayConfig.animationEnabled ? { opacity: 0, scale: 0.9 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <PrizeCard
            prize={prize}
            config={displayConfig}
            variant="default"
          />
        </motion.div>
      ))}
    </div>
  );

  // 列表布局
  const renderListLayout = () => (
    <div className="space-y-4">
      {sortedPrizes.map((prize, index) => (
        <motion.div
          key={prize.id}
          initial={displayConfig.animationEnabled ? { opacity: 0, x: -20 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <PrizeListItem
            prize={prize}
            config={displayConfig}
          />
        </motion.div>
      ))}
    </div>
  );

  // 根据布局类型渲染
  const renderContent = () => {
    if (prizes.length === 0) {
      return (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">暂无奖品信息</p>
        </div>
      );
    }

    switch (displayConfig.layout) {
      case 'podium':
        return renderPodiumLayout();
      case 'list':
        return renderListLayout();
      case 'grid':
      default:
        return renderGridLayout();
    }
  };

  return (
    <div className={`prize-display ${className}`}>
      {renderContent()}
    </div>
  );
};

// 奖品卡片组件
interface PrizeCardProps {
  prize: Prize;
  config: PrizeDisplayConfig;
  variant?: 'default' | 'podium' | 'compact';
  rank?: number;
}

const PrizeCard: React.FC<PrizeCardProps> = ({
  prize,
  config,
  variant = 'default',
  rank,
}) => {
  const { isDark } = useTheme();
  const isCompound = prize.combinationType === PrizeCombinationType.COMPOUND;

  // 获取奖品总价值
  const totalValue = useMemo(() => {
    if (isCompound && prize.subPrizes) {
      return prize.subPrizes.reduce((sum, sub) => {
        return sum + (sub.prize.value || 0) * sub.quantity;
      }, 0);
    }
    return prize.singlePrize?.value || 0;
  }, [prize, isCompound]);

  // 获取奖品总数量
  const totalQuantity = useMemo(() => {
    if (isCompound && prize.subPrizes) {
      return prize.subPrizes.reduce((sum, sub) => sum + sub.quantity, 0);
    }
    return prize.singlePrize?.quantity || 0;
  }, [prize, isCompound]);

  const cardStyles = {
    default: 'p-6',
    podium: 'p-4 w-40 sm:w-48',
    compact: 'p-4',
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      } ${cardStyles[variant]} ${
        prize.isHighlight && config.highlightTopThree && prize.level <= 3
          ? 'ring-2'
          : ''
      }`}
      style={{
        boxShadow: prize.isHighlight && prize.level <= 3
          ? `0 8px 32px ${adjustColorOpacity(prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level], 0.3)}`
          : undefined,
        '--tw-ring-color': prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level],
      } as React.CSSProperties}
    >
      {/* 等级标识 */}
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level] }}
      />

      {/* 等级徽章 */}
      {variant !== 'podium' && (
        <div className="flex items-center justify-between mb-4">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: adjustColorOpacity(prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level], 0.15),
              color: prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level],
            }}
          >
            {prize.level <= 3 ? (
              <Trophy className="w-4 h-4" />
            ) : (
              <Medal className="w-4 h-4" />
            )}
            {prize.rankName}
          </div>
          {rank && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600">
              <Crown className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      {/* 奖品图片 */}
      <div className={`relative mb-4 rounded-xl overflow-hidden ${
        variant === 'podium' ? 'aspect-square' : 'aspect-video'
      }`}>
        {isCompound ? (
          // 复合奖品展示
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-8 h-8 text-gray-400" />
                <span className="text-2xl text-gray-400">+</span>
                <Award className="w-8 h-8 text-gray-400" />
              </div>
              <span className="text-sm text-gray-500">复合奖励</span>
            </div>
          </div>
        ) : prize.singlePrize?.imageUrl ? (
          <img
            src={prize.singlePrize.imageUrl}
            alt={prize.singlePrize.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Gift className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* 数量徽章 */}
        {config.showQuantity && totalQuantity > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-lg flex items-center gap-1">
            <Users className="w-3 h-3" />
            ×{totalQuantity}
          </div>
        )}
      </div>

      {/* 奖品信息 */}
      <div className="space-y-2">
        {isCompound ? (
          // 复合奖品列表
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {prize.rankName}礼包
            </h4>
            <ul className="space-y-1">
              {prize.subPrizes?.slice(0, 3).map((sub, idx) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {sub.prize.name}
                  {sub.quantity > 1 && (
                    <span className="text-xs text-gray-400">×{sub.quantity}</span>
                  )}
                </li>
              ))}
              {(prize.subPrizes?.length || 0) > 3 && (
                <li className="text-sm text-gray-500">
                  还有 {(prize.subPrizes?.length || 0) - 3} 项奖励...
                </li>
              )}
            </ul>
          </div>
        ) : (
          // 单一奖品
          <>
            <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
              {prize.singlePrize?.name}
            </h4>
            {prize.singlePrize?.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {prize.singlePrize.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                {prize.singlePrize?.type && PRIZE_TYPE_NAMES[prize.singlePrize.type]}
              </span>
            </div>
          </>
        )}

        {/* 价值显示 */}
        {config.showValue && totalValue > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 text-sm">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">价值：</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                ¥{totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 奖品列表项组件
interface PrizeListItemProps {
  prize: Prize;
  config: PrizeDisplayConfig;
}

const PrizeListItem: React.FC<PrizeListItemProps> = ({ prize, config }) => {
  const { isDark } = useTheme();
  const isCompound = prize.combinationType === PrizeCombinationType.COMPOUND;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
      style={{
        borderLeft: `4px solid ${prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level]}`,
      }}
    >
      {/* 等级 */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{
          backgroundColor: adjustColorOpacity(prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level], 0.15),
        }}
      >
        <span
          className="text-lg font-bold"
          style={{ color: prize.highlightColor || PRIZE_LEVEL_COLORS[prize.level] }}
        >
          {prize.level <= 3 ? (
            <Trophy className="w-6 h-6" />
          ) : (
            <Medal className="w-6 h-6" />
          )}
        </span>
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {prize.rankName}
          </h4>
          {prize.isHighlight && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {isCompound
            ? `${prize.subPrizes?.length || 0} 项奖励组合`
            : prize.singlePrize?.name}
        </p>
      </div>

      {/* 数量和价格 */}
      <div className="text-right">
        {config.showQuantity && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ×{isCompound
              ? prize.subPrizes?.reduce((sum, s) => sum + s.quantity, 0)
              : prize.singlePrize?.quantity}
          </div>
        )}
        {config.showValue && (
          <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
            ¥{isCompound
              ? prize.subPrizes?.reduce((sum, s) => sum + (s.prize.value || 0) * s.quantity, 0)?.toLocaleString()
              : prize.singlePrize?.value?.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

// 辅助函数：调整颜色透明度
function adjustColorOpacity(color: string, opacity: number): string {
  // 处理十六进制颜色
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // 处理 rgb/rgba 颜色
  if (color.startsWith('rgb')) {
    return color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, `rgba($1, $2, $3, ${opacity})`);
  }
  return color;
}

export default PrizeDisplay;
