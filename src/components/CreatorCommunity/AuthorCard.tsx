// 津脉社区作者卡片组件 - 优化版
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, CheckCircle, Users, Plus, UserCheck, MessageCircle, Send, UserPlus, MapPin, Calendar, ExternalLink } from 'lucide-react'
import LazyImage from '../LazyImage'
import type { UserProfile } from '../../lib/supabase'

interface AuthorCardProps {
  author: UserProfile
  size?: 'small' | 'medium' | 'large'
  showFollowButton?: boolean
  showStats?: boolean
  showBio?: boolean
  showLocation?: boolean
  isFollowing?: boolean
  isFriend?: boolean
  hasSentFriendRequest?: boolean
  onClick?: () => void
  onFollowClick?: () => void
  onSendFriendRequest?: () => void
  onSendMessage?: () => void
  className?: string
}

// 认证徽章组件
const VerificationBadge = ({ size = 'small' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeClasses = {
    small: 'w-3.5 h-3.5',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800`}
    >
      <svg className="w-2/3 h-2/3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </motion.div>
  )
}

// 统计项组件
const StatItem = ({ icon, value, label, isDark }: { icon: string; value: string | number; label: string; isDark: boolean }) => (
  <div className="flex flex-col items-center">
    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
  </div>
)

export const AuthorCard: React.FC<AuthorCardProps> = ({
  author,
  size = 'medium',
  showFollowButton = false,
  showStats = true,
  showBio = true,
  showLocation = false,
  isFollowing = false,
  isFriend = false,
  hasSentFriendRequest = false,
  onClick,
  onFollowClick,
  onSendFriendRequest,
  onSendMessage,
  className = ''
}) => {
  const [following, setFollowing] = useState(isFollowing)
  const [followersCount, setFollowersCount] = useState(author.followers_count || 0)
  const [friendRequestSent, setFriendRequestSent] = useState(hasSentFriendRequest)
  const [showPreview, setShowPreview] = useState(false)

  // 处理关注点击
  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newFollowing = !following
    setFollowing(newFollowing)
    setFollowersCount(prev => newFollowing ? prev + 1 : Math.max(0, prev - 1))
    onFollowClick?.()
  }

  // 处理好友请求点击
  const handleSendFriendRequest = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isFriend && !friendRequestSent) {
      setFriendRequestSent(true)
      onSendFriendRequest?.()
    }
  }

  // 处理私信点击
  const handleSendMessage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSendMessage?.()
  }

  // 根据尺寸设置样式
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-2',
          avatar: 'w-9 h-9',
          name: 'text-sm',
          bio: 'text-xs',
          stats: 'text-xs',
          button: 'px-2.5 py-1 text-xs',
          icon: 'w-3.5 h-3.5'
        }
      case 'large':
        return {
          container: 'p-5',
          avatar: 'w-20 h-20',
          name: 'text-xl',
          bio: 'text-sm',
          stats: 'text-sm',
          button: 'px-5 py-2.5 text-sm',
          icon: 'w-5 h-5'
        }
      default: // medium
        return {
          container: 'p-3',
          avatar: 'w-12 h-12',
          name: 'text-base',
          bio: 'text-sm',
          stats: 'text-sm',
          button: 'px-4 py-2 text-sm',
          icon: 'w-4 h-4'
        }
    }
  }

  const sizeStyles = getSizeStyles()

  // 关注按钮组件
  const FollowButton = () => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleFollowClick}
      className={`flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200 ${
        following
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
      } ${sizeStyles.button}`}
    >
      {following ? (
        <>
          <UserCheck className={sizeStyles.icon} />
          <span>已关注</span>
        </>
      ) : (
        <>
          <Plus className={sizeStyles.icon} />
          <span>关注</span>
        </>
      )}
    </motion.button>
  )

  // 好友请求按钮组件
  const FriendRequestButton = () => (
    <motion.button
      whileHover={{ scale: isFriend || friendRequestSent ? 1 : 1.05 }}
      whileTap={{ scale: isFriend || friendRequestSent ? 1 : 0.95 }}
      onClick={handleSendFriendRequest}
      disabled={friendRequestSent || isFriend}
      className={`flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200 ${
        isFriend
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : friendRequestSent
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
          : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30'
      } ${sizeStyles.button} disabled:cursor-not-allowed`}
    >
      {isFriend ? (
        <>
          <User className={sizeStyles.icon} />
          <span>已好友</span>
        </>
      ) : friendRequestSent ? (
        <>
          <Send className={sizeStyles.icon} />
          <span>已发送</span>
        </>
      ) : (
        <>
          <UserPlus className={sizeStyles.icon} />
          <span>加好友</span>
        </>
      )}
    </motion.button>
  )

  // 私信按钮组件
  const MessageButton = () => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSendMessage}
      className={`flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200 bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/30 ${sizeStyles.button}`}
    >
      <MessageCircle className={sizeStyles.icon} />
      <span>私信</span>
    </motion.button>
  )

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        onClick={onClick}
        onMouseEnter={() => size === 'medium' && setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        className={`flex items-center gap-3 rounded-xl transition-all cursor-pointer ${
          isFollowing ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        } ${sizeStyles.container} ${className}`}
      >
        {/* 头像 */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative flex-shrink-0"
        >
          <div className={`${sizeStyles.avatar} bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-transparent`}>
            <LazyImage
              src={author.avatar_url || author.avatar || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
              alt={author.username}
              className="w-full h-full object-cover"
              placeholder="blur"
            />
          </div>
          {/* 认证标识 */}
          {author.is_verified && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <VerificationBadge size={size === 'small' ? 'small' : 'medium'} />
            </div>
          )}
        </motion.div>

        {/* 用户信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className={`font-semibold text-gray-900 dark:text-white truncate ${sizeStyles.name}`}>
              {author.username}
            </h4>
            {/* 小尺寸的认证标识 */}
            {author.is_verified && size === 'small' && (
              <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            )}
          </div>

          {/* 简介 */}
          {showBio && author.bio && size !== 'small' && (
            <p className={`text-gray-500 dark:text-gray-400 truncate mt-0.5 ${sizeStyles.bio}`}>
              {author.bio}
            </p>
          )}

          {/* 位置信息 */}
          {showLocation && author.location && size !== 'small' && (
            <div className={`flex items-center gap-1 text-gray-400 mt-0.5 ${sizeStyles.stats}`}>
              <MapPin className="w-3 h-3" />
              <span className="truncate">{author.location}</span>
            </div>
          )}

          {/* 统计信息 */}
          {showStats && size !== 'small' && (
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span className={`${sizeStyles.stats}`}>
                  {followersCount > 1000
                    ? `${(followersCount / 1000).toFixed(1)}k`
                    : followersCount
                  } 粉丝
                </span>
              </div>
              {author.posts_count !== undefined && (
                <span className={`text-gray-400 ${sizeStyles.stats}`}>
                  {author.posts_count} 作品
                </span>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮区域 */}
        {showFollowButton && (
          <div className="flex-shrink-0 flex items-center gap-2">
            <FollowButton />
            {size !== 'small' && <FriendRequestButton />}
            {size === 'large' && <MessageButton />}
          </div>
        )}
      </motion.div>

      {/* 悬停预览卡片 */}
      <AnimatePresence>
        {showPreview && size === 'medium' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5"
            style={{ marginTop: '8px' }}
          >
            {/* 预览卡片头部 */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-transparent">
                <LazyImage
                  src={author.avatar_url || ''}
                  alt={author.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                    {author.username}
                  </h3>
                  {author.is_verified && <VerificationBadge size="small" />}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  @{author.username?.toLowerCase().replace(/\s/g, '')}
                </p>
              </div>
            </div>

            {/* 简介 */}
            {author.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {author.bio}
              </p>
            )}

            {/* 统计 */}
            <div className="flex items-center justify-around py-3 border-y border-gray-100 dark:border-gray-700 mb-4">
              <StatItem icon="" value={followersCount > 1000 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount} label="粉丝" isDark={false} />
              <StatItem icon="" value={author.following_count || 0} label="关注" isDark={false} />
              <StatItem icon="" value={author.posts_count || 0} label="作品" isDark={false} />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <FollowButton />
              <FriendRequestButton />
              <MessageButton />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// 作者卡片网格组件（用于展示多个作者）
interface AuthorGridProps {
  authors: UserProfile[]
  size?: 'small' | 'medium' | 'large'
  columns?: number
  onAuthorClick?: (authorId: string) => void
  onFollowClick?: (authorId: string) => void
  onSendFriendRequest?: (authorId: string) => void
  onSendMessage?: (authorId: string) => void
}

export const AuthorGrid: React.FC<AuthorGridProps> = ({
  authors,
  size = 'medium',
  columns = 3,
  onAuthorClick,
  onFollowClick,
  onSendFriendRequest,
  onSendMessage
}) => {
  const getGridCols = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2'
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }
  }

  if (!authors || authors.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">暂无作者</h3>
        <p className="text-gray-500 dark:text-gray-400">还没有创作者加入社区</p>
      </motion.div>
    )
  }

  return (
    <div className={`grid ${getGridCols()} gap-4`}>
      {authors.map((author, index) => (
        <motion.div
          key={author.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <AuthorCard
            author={author}
            size={size}
            showFollowButton={true}
            showStats={true}
            showBio={true}
            onClick={() => onAuthorClick?.(author.id)}
            onFollowClick={() => onFollowClick?.(author.id)}
            onSendFriendRequest={() => onSendFriendRequest?.(author.id)}
            onSendMessage={() => onSendMessage?.(author.id)}
            className="border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
          />
        </motion.div>
      ))}
    </div>
  )
}

// 作者信息卡片（用于详情页）
interface AuthorInfoCardProps {
  author: UserProfile
  isFollowing?: boolean
  isFriend?: boolean
  hasSentFriendRequest?: boolean
  onFollowClick?: () => void
  onSendFriendRequest?: () => void
  onSendMessage?: () => void
}

export const AuthorInfoCard: React.FC<AuthorInfoCardProps> = ({
  author,
  isFollowing = false,
  isFriend = false,
  hasSentFriendRequest = false,
  onFollowClick,
  onSendFriendRequest,
  onSendMessage
}) => {
  const [following, setFollowing] = useState(isFollowing)
  const [friendRequestSent, setFriendRequestSent] = useState(hasSentFriendRequest)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-start gap-5">
        {/* 头像 */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative flex-shrink-0"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full overflow-hidden ring-4 ring-offset-4 ring-offset-white dark:ring-offset-gray-800 ring-transparent">
            <LazyImage
              src={author.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
              alt={author.username}
              className="w-full h-full object-cover"
              placeholder="blur"
            />
          </div>
          {author.is_verified && (
            <div className="absolute -bottom-1 -right-1">
              <VerificationBadge size="large" />
            </div>
          )}
        </motion.div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {author.username}
            </h3>
            {author.is_verified && (
              <CheckCircle className="w-6 h-6 text-blue-500" />
            )}
          </div>

          <p className="text-gray-500 dark:text-gray-400 mb-1">
            @{author.username?.toLowerCase().replace(/\s/g, '')}
          </p>

          {author.bio && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {author.bio}
            </p>
          )}

          {/* 统计信息 */}
          <div className="flex items-center gap-6 text-sm mb-5">
            <div className="flex items-center gap-2 text-gray-500">
              <Users className="w-4 h-4" />
              <span>
                <strong className="text-gray-900 dark:text-white">{author.followers_count || 0}</strong> 粉丝
              </span>
            </div>
            <div className="text-gray-500">
              <strong className="text-gray-900 dark:text-white">{author.following_count || 0}</strong> 关注
            </div>
            <div className="text-gray-500">
              <strong className="text-gray-900 dark:text-white">{author.posts_count || 0}</strong> 作品
            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className="flex flex-wrap gap-3">
            {/* 关注按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setFollowing(!following)
                onFollowClick?.()
              }}
              className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                following
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
              }`}
            >
              {following ? '已关注' : '关注'}
            </motion.button>

            {/* 好友请求按钮 */}
            <motion.button
              whileHover={{ scale: isFriend || friendRequestSent ? 1 : 1.02 }}
              whileTap={{ scale: isFriend || friendRequestSent ? 1 : 0.98 }}
              onClick={() => {
                if (!isFriend && !friendRequestSent) {
                  setFriendRequestSent(true)
                  onSendFriendRequest?.()
                }
              }}
              disabled={friendRequestSent || isFriend}
              className={`px-6 py-2.5 rounded-full font-medium transition-all disabled:cursor-not-allowed ${
                isFriend
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : friendRequestSent
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30'
              }`}
            >
              {isFriend ? '已好友' : friendRequestSent ? '已发送' : '加好友'}
            </motion.button>

            {/* 私信按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSendMessage}
              className="px-6 py-2.5 rounded-full font-medium bg-purple-500 text-white hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/30 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>私信</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AuthorCard
