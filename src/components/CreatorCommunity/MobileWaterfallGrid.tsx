import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import LazyImage from '../LazyImage';
// import { CompactAuthorCard } from './AuthorCard';
import type { PostWithAuthor } from '../../lib/supabase';
import { useResponsive } from '../../utils/responsiveDesign';

interface MobileWaterfallGridProps {
  posts: PostWithAuthor[];
  likedPosts?: Set<string>;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void; // Kept for interface consistency, though maybe not used in minimal view
  onPostClick?: (post: PostWithAuthor) => void; // Optional click handler
}

/**
 * Mobile Waterfall Grid Layout
 * 
 * Features:
 * - Responsive column count (2 for portrait, 3 for landscape/larger phones)
 * - 8dp gap spacing
 * - 4dp border radius
 * - Soft shadows (elevation 2dp)
 * - Haptic feedback support
 * - Smooth scroll animations
 * - Lazy loading images
 */
export const MobileWaterfallGrid: React.FC<MobileWaterfallGridProps> = ({
  posts,
  likedPosts,
  onLike,
  onPostClick
}) => {
  const { width } = useResponsive();

  // Determine column count based on screen width
  // < 480px: 2 columns (Standard Mobile Portrait)
  // 480px - 768px: 3 columns (Mobile Landscape / Large Phone)
  // >= 768px: Default to 4 (though this component is intended for mobile only)
  const columnsCount = useMemo(() => {
    if (width < 480) return 2;
    if (width < 768) return 3;
    return 4;
  }, [width]);

  // Split posts into columns for waterfall effect
  const columns = useMemo(() => {
    const cols: PostWithAuthor[][] = Array.from({ length: columnsCount }, () => []);
    posts.forEach((post, i) => {
      cols[i % columnsCount].push(post);
    });
    return cols;
  }, [posts, columnsCount]);

  // Haptic feedback helper
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5); // Light vibration for tactile feedback
    }
  };

  return (
    <div className="flex gap-2 p-2 pb-20">
      {columns.map((colPosts, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-2 flex-1">
          {colPosts.map((post, postIndex) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "100px" }}
              transition={{ duration: 0.4, delay: (postIndex % 5) * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-[4px] shadow-sm overflow-hidden active:scale-95 transition-transform duration-100"
              onClick={() => {
                triggerHaptic();
                onPostClick?.(post);
              }}
            >
              {/* Image Area */}
              <div className="relative">
                <LazyImage
                  src={typeof post.attachments?.[0] === 'string' ? post.attachments[0] : post.attachments?.[0]?.url || '/images/placeholder-image.jpg'}
                  alt={post.title}
                  ratio="auto"
                  className="w-full"
                  placeholder="color"
                  // Using medium quality for list view to optimize performance
                  quality="medium"
                />
              </div>

              {/* Minimal Content Area */}
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 leading-tight">
                  {post.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{post.author?.username || 'Unknown'}</span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic();
                      onLike?.(post.id);
                    }}
                    className={`transition-colors p-1 ${
                      likedPosts?.has(post.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart size={14} className={likedPosts?.has(post.id) ? 'fill-current' : ''} />
                    <span className="sr-only">Like</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
};
