import { useTheme } from '@/hooks/useTheme';
import { CertificationLevel, CERTIFICATION_LEVELS } from '@/types/certification';

interface Props {
  level: CertificationLevel;
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function CertificationBadge({
  level,
  status,
  size = 'md',
  showText = false,
}: Props) {
  const { isDark } = useTheme();

  const levelConfig = CERTIFICATION_LEVELS.find((l) => l.level === level);

  if (!levelConfig || status !== 'approved') return null;

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  const getBadgeColor = () => {
    switch (levelConfig.color) {
      case 'gold':
        return 'text-yellow-500';
      case 'blue':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      <i className={`fas fa-${levelConfig.icon} ${sizeClasses[size]} ${getBadgeColor()}`}></i>
      {showText && (
        <span className={`text-xs font-medium ${getBadgeColor()}`}>
          {levelConfig.name}
        </span>
      )}
    </span>
  );
}
