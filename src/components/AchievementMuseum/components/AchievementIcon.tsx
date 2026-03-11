import React from 'react';
import * as LucideIcons from 'lucide-react';

// 图标映射：Font Awesome 名称 -> Lucide 图标名称
const iconNameMapping: Record<string, string> = {
  'star': 'Star',
  'fire': 'Flame',
  'thumbs-up': 'ThumbsUp',
  'book': 'BookOpen',
  'image': 'Image',
  'handshake': 'Handshake',
  'graduation-cap': 'GraduationCap',
  'pen-tool': 'PenTool',
  'layers': 'Layers',
  'zap': 'Zap',
  'crown': 'Crown',
  'heart': 'Heart',
  'award': 'Award',
  'message-circle': 'MessageCircle',
  'bookmark': 'Bookmark',
  'share-2': 'Share',
  'cpu': 'Cpu',
  'video': 'Video',
  'film': 'Film',
  'shield': 'Shield',
  'landmark': 'Landmark',
  'target': 'Target',
  'users': 'Users',
  'user-check': 'UserCheck',
  'trophy': 'Trophy',
  'calendar': 'Calendar',
  'calendar-check': 'CalendarCheck',
  'calendar-days': 'CalendarDays',
  'sparkles': 'Sparkles',
  'clock': 'Clock',
  'lock': 'Lock',
  'unlock': 'UnlockIcon',
  'share': 'Share2',
  'chevron-right': 'ChevronRight'
};

interface AchievementIconProps {
  icon: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackClassName?: string;
}

export const AchievementIcon: React.FC<AchievementIconProps> = ({ 
  icon, 
  className = '', 
  style,
  fallbackClassName = ''
}) => {
  const iconName = iconNameMapping[icon || 'star'];
  
  if (iconName) {
    const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} style={style} />;
    }
  }
  
  // Fallback to Font Awesome if no mapping exists
  return (
    <i 
      className={`fas fa-${icon || 'star'} ${fallbackClassName}`}
      style={style}
    />
  );
};

export default AchievementIcon;
