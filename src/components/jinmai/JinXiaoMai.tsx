import { motion } from 'framer-motion';
import React, { useState } from 'react';

export type JinXiaoMaiExpression = 'smile' | 'happy' | 'thinking' | 'surprised' | 'cheer';

export interface JinXiaoMaiProps {
  expression?: JinXiaoMaiExpression;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mode?: 'default' | 'creation' | 'ipIncubation' | 'mall' | 'community';
  festival?: 'spring' | 'lantern' | 'dragonBoat' | null;
  animate?: boolean;
  className?: string;
}

const expressionLabels = {
  smile: '微笑',
  happy: '开心',
  thinking: '思考',
  surprised: '惊讶',
  cheer: '加油',
};

export function JinXiaoMai({
  expression = 'smile',
  size = 'md',
  mode = 'default',
  festival = null,
  animate = true,
  className = '',
}: JinXiaoMaiProps) {
  const sizeConfig = {
    sm: { container: 'w-16 h-16', head: 24, eye: 4, body: 20 },
    md: { container: 'w-24 h-24', head: 36, eye: 6, body: 30 },
    lg: { container: 'w-32 h-32', head: 48, eye: 8, body: 40 },
    xl: { container: 'w-40 h-40', head: 60, eye: 10, body: 50 },
  };

  const config = sizeConfig[size];

  const modeAccessories = {
    default: null,
    creation: { type: 'wand', color: '#F4D03F' },
    ipIncubation: { type: 'stars', count: 3 },
    mall: { type: 'badge', color: '#F4D03F' },
    community: { type: 'bubbles', count: 2 },
  };

  const festivalColors = {
    spring: { primary: '#E74C3C', secondary: '#C0392B', accent: '#F4D03F' },
    lantern: { primary: '#E67E22', secondary: '#D35400', accent: '#F39C12' },
    dragonBoat: { primary: '#27AE60', secondary: '#1E8449', accent: '#82E0AA' },
  };

  const colors = festival
    ? festivalColors[festival]
    : { primary: '#4A90D9', secondary: '#48C9B0', accent: '#F4D03F' };

  const renderEyes = () => {
    const eyeY = config.head * 0.35;
    const eyeSpacing = config.head * 0.2;
    const centerX = config.head / 2;

    switch (expression) {
      case 'happy':
        return (
          <>
            <motion.path
              d={`M ${centerX - eyeSpacing - config.eye} ${eyeY} Q ${centerX - eyeSpacing} ${eyeY - config.eye} ${centerX - eyeSpacing + config.eye} ${eyeY}`}
              stroke={colors.primary}
              strokeWidth={config.eye * 0.4}
              fill="none"
              strokeLinecap="round"
              animate={animate ? { scaleY: [1, 0.3, 1] } : {}}
              transition={{ duration: 0.3, repeat: animate ? Infinity : 0, repeatDelay: 2 }}
            />
            <motion.path
              d={`M ${centerX + eyeSpacing - config.eye} ${eyeY} Q ${centerX + eyeSpacing} ${eyeY - config.eye} ${centerX + eyeSpacing + config.eye} ${eyeY}`}
              stroke={colors.primary}
              strokeWidth={config.eye * 0.4}
              fill="none"
              strokeLinecap="round"
              animate={animate ? { scaleY: [1, 0.3, 1] } : {}}
              transition={{ duration: 0.3, repeat: animate ? Infinity : 0, repeatDelay: 2 }}
            />
          </>
        );
      case 'thinking':
        return (
          <>
            <circle cx={centerX - eyeSpacing} cy={eyeY} r={config.eye} fill={colors.primary} />
            <circle cx={centerX + eyeSpacing} cy={eyeY} r={config.eye * 0.6} fill={colors.primary} />
            <circle cx={centerX + eyeSpacing + config.eye * 0.2} cy={eyeY - config.eye * 0.3} r={config.eye * 0.2} fill="white" />
          </>
        );
      case 'surprised':
        return (
          <>
            <circle cx={centerX - eyeSpacing} cy={eyeY} r={config.eye * 1.3} fill={colors.primary} />
            <circle cx={centerX + eyeSpacing} cy={eyeY} r={config.eye * 1.3} fill={colors.primary} />
            <circle cx={centerX - eyeSpacing} cy={eyeY} r={config.eye * 0.4} fill="white" />
            <circle cx={centerX + eyeSpacing} cy={eyeY} r={config.eye * 0.4} fill="white" />
          </>
        );
      case 'cheer':
        return (
          <>
            <path
              d={`M ${centerX - eyeSpacing - config.eye} ${eyeY + config.eye * 0.3} Q ${centerX - eyeSpacing} ${eyeY - config.eye} ${centerX - eyeSpacing + config.eye} ${eyeY + config.eye * 0.3}`}
              stroke={colors.primary}
              strokeWidth={config.eye * 0.4}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${centerX + eyeSpacing - config.eye} ${eyeY + config.eye * 0.3} Q ${centerX + eyeSpacing} ${eyeY - config.eye} ${centerX + eyeSpacing + config.eye} ${eyeY + config.eye * 0.3}`}
              stroke={colors.primary}
              strokeWidth={config.eye * 0.4}
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
      default:
        return (
          <>
            <ellipse cx={centerX - eyeSpacing} cy={eyeY} rx={config.eye} ry={config.eye * 1.2} fill={colors.primary} />
            <ellipse cx={centerX + eyeSpacing} cy={eyeY} rx={config.eye} ry={config.eye * 1.2} fill={colors.primary} />
            <circle cx={centerX - eyeSpacing - config.eye * 0.2} cy={eyeY - config.eye * 0.3} r={config.eye * 0.25} fill="white" />
            <circle cx={centerX + eyeSpacing - config.eye * 0.2} cy={eyeY - config.eye * 0.3} r={config.eye * 0.25} fill="white" />
          </>
        );
    }
  };

  const renderMouth = () => {
    const mouthY = config.head * 0.65;
    const centerX = config.head / 2;

    switch (expression) {
      case 'happy':
        return (
          <motion.path
            d={`M ${centerX - config.eye} ${mouthY} Q ${centerX} ${mouthY + config.eye * 1.5} ${centerX + config.eye} ${mouthY}`}
            stroke={colors.primary}
            strokeWidth={config.eye * 0.3}
            fill="none"
            strokeLinecap="round"
            animate={animate ? { scaleY: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: animate ? Infinity : 0 }}
          />
        );
      case 'surprised':
        return (
          <ellipse cx={centerX} cy={mouthY} rx={config.eye * 0.5} ry={config.eye * 0.7} fill={colors.primary} />
        );
      case 'thinking':
        return (
          <path
            d={`M ${centerX - config.eye * 0.5} ${mouthY} Q ${centerX} ${mouthY - config.eye * 0.3} ${centerX + config.eye * 0.5} ${mouthY}`}
            stroke={colors.primary}
            strokeWidth={config.eye * 0.25}
            fill="none"
            strokeLinecap="round"
          />
        );
      case 'cheer':
        return (
          <path
            d={`M ${centerX - config.eye * 0.8} ${mouthY} Q ${centerX} ${mouthY + config.eye * 0.8} ${centerX + config.eye * 0.8} ${mouthY}`}
            stroke={colors.primary}
            strokeWidth={config.eye * 0.3}
            fill="none"
            strokeLinecap="round"
          />
        );
      default:
        return (
          <path
            d={`M ${centerX - config.eye * 0.7} ${mouthY} Q ${centerX} ${mouthY + config.eye * 0.5} ${centerX + config.eye * 0.7} ${mouthY}`}
            stroke={colors.primary}
            strokeWidth={config.eye * 0.3}
            fill="none"
            strokeLinecap="round"
          />
        );
    }
  };

  const renderCheeks = () => {
    if (expression === 'happy' || expression === 'cheer') {
      const cheekY = config.head * 0.5;
      const cheekSpacing = config.head * 0.28;
      const centerX = config.head / 2;
      return (
        <>
          <circle cx={centerX - cheekSpacing} cy={cheekY} r={config.eye * 0.6} fill="#F5B041" opacity={0.5} />
          <circle cx={centerX + cheekSpacing} cy={cheekY} r={config.eye * 0.6} fill="#F5B041" opacity={0.5} />
        </>
      );
    }
    return null;
  };

  const renderAccessory = () => {
    const accessory = modeAccessories[mode];
    if (!accessory) return null;

    const centerX = config.head / 2;

    switch (accessory.type) {
      case 'wand':
        return (
          <motion.g
            animate={animate ? { rotate: [-10, 10, -10] } : {}}
            transition={{ duration: 2, repeat: animate ? Infinity : 0 }}
          >
            <line
              x1={config.head * 0.8}
              y1={config.head * 0.7}
              x2={config.head * 1.1}
              y2={config.head * 0.3}
              stroke={accessory.color}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={config.head * 1.15} cy={config.head * 0.25} r={6} fill={accessory.color} />
            <motion.circle
              cx={config.head * 1.15}
              cy={config.head * 0.25}
              r={10}
              fill="none"
              stroke={accessory.color}
              strokeWidth={1}
              opacity={0.5}
              animate={animate ? { scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] } : {}}
              transition={{ duration: 1, repeat: animate ? Infinity : 0 }}
            />
          </motion.g>
        );
      case 'stars':
        return (
          <g>
            {[0, 1, 2].map((i) => (
              <motion.polygon
                key={i}
                points={`${centerX - 20 + i * 20},${config.head * 0.15} ${centerX - 17 + i * 20},${config.head * 0.22} ${centerX - 23 + i * 20},${config.head * 0.22}`}
                fill={colors.accent}
                animate={animate ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 1.5, repeat: animate ? Infinity : 0, delay: i * 0.3 }}
              />
            ))}
          </g>
        );
      case 'badge':
        return (
          <g transform={`translate(${config.head * 0.6}, ${config.head * 0.15})`}>
            <circle r={10} fill={accessory.color} />
            <polygon points="0,-6 2,-2 6,-2 3,1 4,5 0,3 -4,5 -3,1 -6,-2 -2,-2" fill="white" transform={{ rotate: 15 }} />
          </g>
        );
      case 'bubbles':
        return (
          <g>
            {[0, 1].map((i) => (
              <motion.circle
                key={i}
                cx={config.head * 0.9 + i * 15}
                cy={config.head * 0.3 - i * 10}
                r={4}
                fill="#76D7C4"
                opacity={0.6}
                animate={animate ? { y: [0, -10, 0], opacity: [0.6, 0.2, 0.6] } : {}}
                transition={{ duration: 2, repeat: animate ? Infinity : 0, delay: i * 0.5 }}
              />
            ))}
          </g>
        );
      default:
        return null;
    }
  };

  const renderFestivalDecoration = () => {
    if (!festival) return null;

    switch (festival) {
      case 'spring':
        return (
          <g>
            <path d="M 0 0 L 5 5 L 0 10 L -5 5 Z" fill={colors.accent} transform="translate(-5, -15) scale(0.5)" />
            <circle cx={config.head * 0.3} cy={-5} r={4} fill={colors.accent} />
          </g>
        );
      case 'lantern':
        return (
          <motion.g
            animate={animate ? { swing: [-5, 5, -5] } : {}}
            transition={{ duration: 2, repeat: animate ? Infinity : 0 }}
            style={{ transformOrigin: `${config.head * 0.7}px ${-5}px` }}
          >
            <ellipse cx={config.head * 0.7} cy={-5} rx={6} ry={8} fill={colors.primary} />
            <line x1={config.head * 0.7} y1={-13} x2={config.head * 0.7} y2={-15} stroke={colors.primary} strokeWidth={1} />
          </motion.g>
        );
      case 'dragonBoat':
        return (
          <g>
            <ellipse cx={-5} cy={-8} rx={8} ry={4} fill={colors.primary} transform="rotate(-20)" />
            <ellipse cx={config.head + 5} cy={-8} rx={8} ry={4} fill={colors.primary} transform="rotate(20)" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <motion.svg
        width={config.container.split(' ')[0]}
        height={config.container.split(' ')[1]}
        viewBox={`0 0 ${config.head * 1.5} ${config.head * 1.8}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
            <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#76D7C4" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          animate={
            animate
              ? {
                  y: [0, -5, 0],
                }
              : {}
          }
          transition={{ duration: 3, repeat: animate ? Infinity : 0, ease: 'easeInOut' }}
        >
          {renderFestivalDecoration()}

          <motion.g
            animate={animate ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 4, repeat: animate ? Infinity : 0 }}
          >
            <ellipse
              cx={config.head * 0.75}
              cy={config.head * 1.4}
              rx={config.body * 0.6}
              ry={config.body * 0.5}
              fill="url(#bodyGradient)"
              opacity={0.3}
              filter="url(#glow)"
            />

            <ellipse
              cx={config.head * 0.75}
              cy={config.head * 1.2}
              rx={config.body * 0.5}
              ry={config.body * 0.6}
              fill="url(#bodyGradient)"
            />

            <ellipse
              cx={config.head * 0.75 - config.body * 0.15}
              cy={config.head * 1.1}
              rx={config.body * 0.15}
              ry={config.body * 0.2}
              fill="white"
              opacity={0.2}
            />
          </motion.g>

          <motion.g
            animate={animate ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 2.5, repeat: animate ? Infinity : 0 }}
          >
            <motion.path
              d={`M ${config.head * 0.5} ${config.head * 0.6} Q ${config.head * 0.3} ${config.head * 0.3} ${config.head * 0.4} ${config.head * 0.15}`}
              stroke={colors.primary}
              strokeWidth={config.eye * 0.5}
              fill="none"
              strokeLinecap="round"
              animate={animate ? { opacity: [0.8, 1, 0.8] } : {}}
              transition={{ duration: 3, repeat: animate ? Infinity : 0 }}
            />
            <motion.path
              d={`M ${config.head * 0.5} ${config.head * 0.6} Q ${config.head * 0.6} ${config.head * 0.35} ${config.head * 0.55} ${config.head * 0.2}`}
              stroke={colors.secondary}
              strokeWidth={config.eye * 0.4}
              fill="none"
              strokeLinecap="round"
              animate={animate ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={{ duration: 3.5, repeat: animate ? Infinity : 0 }}
            />
          </motion.g>

          <motion.ellipse
            cx={config.head * 0.75}
            cy={config.head * 0.5}
            rx={config.head * 0.45}
            ry={config.head * 0.5}
            fill="url(#bodyGradient)"
            animate={animate ? { scale: [1, 1.01, 1] } : {}}
            transition={{ duration: 2, repeat: animate ? Infinity : 0 }}
          />

          <ellipse
            cx={config.head * 0.6}
            cy={config.head * 0.35}
            rx={config.head * 0.12}
            ry={config.head * 0.15}
            fill="white"
            opacity={0.25}
          />

          {renderEyes()}
          {renderMouth()}
          {renderCheeks()}

          <circle
            cx={config.head * 0.75}
            cy={config.head * 0.18}
            r={config.eye * 0.4}
            fill={colors.accent}
          />

          {renderAccessory()}

          <motion.path
            d={`M ${config.head * 1.1} ${config.head * 1.3} Q ${config.head * 1.4} ${config.head * 1.5} ${config.head * 1.3} ${config.head * 1.6}`}
            stroke={colors.secondary}
            strokeWidth={config.eye * 0.4}
            fill="none"
            strokeLinecap="round"
            animate={
              animate
                ? {
                    d: [
                      `M ${config.head * 1.1} ${config.head * 1.3} Q ${config.head * 1.4} ${config.head * 1.5} ${config.head * 1.3} ${config.head * 1.6}`,
                      `M ${config.head * 1.15} ${config.head * 1.25} Q ${config.head * 1.5} ${config.head * 1.4} ${config.head * 1.35} ${config.head * 1.65}`,
                      `M ${config.head * 1.1} ${config.head * 1.3} Q ${config.head * 1.4} ${config.head * 1.5} ${config.head * 1.3} ${config.head * 1.6}`,
                    ],
                  }
                : {}
            }
            transition={{ duration: 3, repeat: animate ? Infinity : 0 }}
          />
        </motion.g>

        {animate && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.circle
                key={i}
                cx={config.head * 0.3 + i * config.head * 0.2}
                cy={config.head * 1.7}
                r={2}
                fill={colors.secondary}
                opacity={0}
                animate={{
                  y: [0, -20 - i * 5],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </motion.svg>

      {size === 'lg' || size === 'xl' ? (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {expressionLabels[expression]}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default JinXiaoMai;
