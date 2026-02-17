import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  FileEdit,
  Image,
  Compass,
  Users,
  MessageCircle,
  Trophy,
  Calendar,
  MapPin,
  BookOpen,
  BarChart3,
  Gift,
  Crown,
  Settings,
  CheckCircle,
  LucideIcon
} from 'lucide-react';

// 图标映射表
const iconMap: Record<string, LucideIcon> = {
  'sparkles': Sparkles,
  'layout-dashboard': LayoutDashboard,
  'wand-2': Wand2,
  'file-edit': FileEdit,
  'image': Image,
  'compass': Compass,
  'users': Users,
  'message-circle': MessageCircle,
  'trophy': Trophy,
  'calendar': Calendar,
  'map-pin': MapPin,
  'book-open': BookOpen,
  'bar-chart-3': BarChart3,
  'gift': Gift,
  'crown': Crown,
  'settings': Settings,
  'check-circle': CheckCircle,
};

interface IconMapperProps {
  iconName: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const IconMapper: React.FC<IconMapperProps> = ({ 
  iconName, 
  className = "w-5 h-5",
  size = 20,
  style
}) => {
  const IconComponent = iconMap[iconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in iconMap`);
    return <span className={className} style={style}>●</span>;
  }
  
  return <IconComponent className={className} size={size} style={style} />;
};

export default IconMapper;
