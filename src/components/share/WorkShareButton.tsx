import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { Share2 } from 'lucide-react';
import { WorkShareModal } from './WorkShareModal';
import { toast } from 'sonner';
import type { Work } from '@/types/work';

interface WorkShareButtonProps {
  work?: Work;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function WorkShareButton({
  work,
  variant = 'default',
  size = 'md',
  className = '',
  showLabel = true,
}: WorkShareButtonProps) {
  const { isDark } = useTheme();
  const { isAuthenticated } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error('请先登录后再分享作品');
      return;
    }
    setIsModalOpen(true);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    default: 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg hover:shadow-red-500/25',
    outline: `border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:border-red-500 hover:text-red-400' : 'border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500'}`,
    ghost: `${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`,
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={`
          flex items-center gap-2 rounded-xl font-medium transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        <Share2 className={iconSizes[size]} />
        {showLabel && <span>分享</span>}
      </motion.button>

      <WorkShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedWork={work}
      />
    </>
  );
}

export default WorkShareButton;
