// 津脉社区作者卡片组件
import React, { useState } from 'react'
import { User, CheckCircle, Users, Plus, UserCheck, MessageCircle, Send, UserPlus } from 'lucide-react'
import LazyImage from '../LazyImage'
import type { UserProfile } from '../../lib/supabase'

interface AuthorCardProps {
  author: UserProfile
  size?: 'small' | 'medium' | 'large'
  showFollowButton?: boolean
  showStats?: boolean
  isFollowing?: boolean
  isFriend?: boolean
  hasSentFriendRequest?: boolean
  onClick?: () => void
  onFollowClick?: () => void
  onSendFriendRequest?: () => void
  onSendMessage?: () => void
  className?: string
}

export const AuthorCard: React.FC<AuthorCardProps> = ({
  author,
  size = 'medium',
  showFollowButton = false,
  showStats = true,
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

  // 处理关注点击
  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newFollowing = !following
    setFollowing(newFollowing)
    setFollowersCount(prev => newFollowing ? prev + 1 : prev - 1)
    onFollowClick?.()
  }

  // 根据尺寸设置样式
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          avatar: 'w-8 h-8',
          name: 'text-sm',
          stats: 'text-xs',
          followButton: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3'
        }
      case 'large':
        return {
          avatar: 'w-16 h-16',
          name: 'text-lg',
          stats: 'text-sm',
          followButton: 'px-4 py-2 text-sm',
          icon: 'w-5 h-5'
        }
      default: // medium
        return {
          avatar: 'w-12 h-12',
          name: 'text-base',
          stats: 'text-sm',
          followButton: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4'
        }
    }
  }

  const sizeStyles = getSizeStyles()

  // 认证标识组件
  const VerificationBadge = () => (
    <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
      <CheckCircle className="w-3 h-3 text-white" />
    </div>
  )

  // 处理好友请求点击
  const handleSendFriendRequest = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFriendRequestSent(true)
    onSendFriendRequest?.()
  }

  // 处理私信点击
  const handleSendMessage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSendMessage?.()
  }

  // 关注按钮组件
  const FollowButton = () => (
    <button
      onClick={handleFollowClick}
      className={`flex items-center space-x-1 rounded-full transition-all duration-200 ${following
        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        : 'bg-blue-500 text-white hover:bg-blue-600'}
        ${sizeStyles.followButton}`}
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
    </button>
  )

  // 好友请求按钮组件
  const FriendRequestButton = () => (
    <button
      onClick={handleSendFriendRequest}
      disabled={friendRequestSent || isFriend}
      className={`flex items-center space-x-1 rounded-full transition-all duration-200 ${(friendRequestSent || isFriend)
        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
        : 'bg-green-500 text-white hover:bg-green-600'}
        ${sizeStyles.followButton} ml-2`}
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
    </button>
  )

  // 私信按钮组件
  const MessageButton = () => (
    <button
      onClick={handleSendMessage}
      className={`flex items-center space-x-1 rounded-full transition-all duration-200 bg-purple-500 text-white hover:bg-purple-600
        ${sizeStyles.followButton} ml-2`}
    >
      <MessageCircle className={sizeStyles.icon} />
      <span>私信</span>
    </button>
  )

  // 统计信息组件
  const StatsInfo = () => (
    <div className="flex items-center space-x-3 text-gray-500">
      <div className="flex items-center space-x-1">
        <Users className={sizeStyles.icon} />
        <span className={sizeStyles.stats}>
          {followersCount > 1000 
            ? `${(followersCount / 1000).toFixed(1)}k` 
            : followersCount
          } 粉丝
        </span>
      </div>
      {author.posts_count !== undefined && (
        <span className={sizeStyles.stats}>
          {author.posts_count} 作品
        </span>
      )}
    </div>
  )

  return (
    <div 
      className={`flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* 头像 */}
      <div 
        className="relative flex-shrink-0 cursor-pointer"
        onClick={onClick}
      >
        <div className={`${sizeStyles.avatar} bg-gray-200 rounded-full overflow-hidden`}>
          <LazyImage
            src={author.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
            alt={author.username}
            className="w-full h-full object-cover cursor-pointer"
            placeholder="blur"
          />
        </div>
        {/* 认证标识 */}
        {author.is_verified && (
          <div className="absolute -bottom-1 -right-1">
            <VerificationBadge />
          </div>
        )}
      </div>

      {/* 用户信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className={`font-medium text-gray-900 ${sizeStyles.name} truncate`}>
            {author.username}
          </h4>
          {/* 小尺寸的认证标识 */}
          {author.is_verified && size === 'small' && (
            <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
          )}
        </div>
        
        {/* 简介 */}
        {author.bio && size !== 'small' && (
          <p className="text-gray-600 text-sm truncate">
            {author.bio}
          </p>
        )}

        {/* 统计信息 */}
        {showStats && size !== 'small' && <StatsInfo />}
      </div>

      {/* 操作按钮区域 */}
      {showFollowButton && (
        <div className="flex-shrink-0 flex items-center space-x-2">
          <FollowButton />
          <FriendRequestButton />
          <MessageButton />
        </div>
      )}
    </div>
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
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无作者</h3>
        <p className="text-gray-500">还没有创作者加入社区</p>
      </div>
    )
  }

  return (
    <div className={`grid ${getGridCols()} gap-4`}>
      {authors.map((author) => (
        <AuthorCard
          key={author.id}
          author={author}
          size={size}
          showFollowButton={true}
          showStats={true}
          onClick={() => onAuthorClick?.(author.id)}
          onFollowClick={() => onFollowClick?.(author.id)}
          onSendFriendRequest={() => onSendFriendRequest?.(author.id)}
          onSendMessage={() => onSendMessage?.(author.id)}
          className="border border-gray-200 hover:border-gray-300"
        />
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

  // 处理关注点击
  const handleFollowClick = () => {
    setFollowing(!following)
    onFollowClick?.()
  }

  // 处理好友请求点击
  const handleSendFriendRequest = () => {
    setFriendRequestSent(true)
    onSendFriendRequest?.()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        {/* 头像 */}
        <div className="relative flex-shrink-0 cursor-pointer">
          <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
            <LazyImage
              src={author.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
              alt={author.username}
              className="w-full h-full object-cover cursor-pointer"
              placeholder="blur"
            />
          </div>
          {author.is_verified && (
            <div className="absolute -bottom-1 -right-1">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {author.username}
            </h3>
            {author.is_verified && (
              <CheckCircle className="w-5 h-5 text-blue-500" />
            )}
          </div>

          {author.bio && (
            <p className="text-gray-600 mb-4">
              {author.bio}
            </p>
          )}

          {/* 统计信息 */}
          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>
                {author.followers_count || 0} 粉丝
              </span>
            </div>
            <span>{author.following_count || 0} 关注</span>
            <span>{author.posts_count || 0} 作品</span>
          </div>

          {/* 操作按钮区域 */}
          <div className="flex flex-wrap gap-3">
            {/* 关注按钮 */}
            <button
              onClick={handleFollowClick}
              className={`px-6 py-2 rounded-full transition-all duration-200 ${following
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {following ? '已关注' : '关注'}
            </button>

            {/* 好友请求按钮 */}
            <button
              onClick={handleSendFriendRequest}
              disabled={friendRequestSent || isFriend}
              className={`px-6 py-2 rounded-full transition-all duration-200 ${(friendRequestSent || isFriend)
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600'}`}
            >
              {isFriend ? '已好友' : friendRequestSent ? '已发送' : '加好友'}
            </button>

            {/* 私信按钮 */}
            <button
              onClick={onSendMessage}
              className="px-6 py-2 rounded-full transition-all duration-200 bg-purple-500 text-white hover:bg-purple-600"
            >
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>私信</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthorCard
