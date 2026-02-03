// 帖子详情页面 - Pinterest风格
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import postsApi, { Post } from '../services/postService'
import { useCommunityStore, useLikeStatus } from '../stores/communityStore'
import type { UserProfile } from '../lib/supabase'
import PostDetailModal from '@/components/PostDetailModal'

interface PostDetailProps {
  currentUser?: UserProfile
}

export const PostDetail: React.FC<PostDetailProps> = ({ currentUser: propUser }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentUser: storeUser } = useCommunityStore()
  
  const currentUser = propUser || storeUser
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { isLiked } = useLikeStatus(id || '')
  
  // 加载帖子详情
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)
        // 从 postsApi 获取帖子数据
        const allPosts = await postsApi.getPosts(undefined, currentUser?.id)
        const postData = allPosts.find(p => p.id === id)

        if (postData) {
          setPost(postData)
          
          // 同步点赞状态到 store
          if (postData.isLiked) {
            const currentLiked = useCommunityStore.getState().likedPosts
            if (!currentLiked.has(id)) {
                const newSet = new Set(currentLiked)
                newSet.add(id)
                useCommunityStore.setState({ likedPosts: newSet })
            }
          }
        } else {
          setError("未找到该作品")
        }
      } catch (error) {
        console.error('加载帖子详情失败:', error)
        setError("加载失败，请稍后重试")
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id])

  // 处理点赞
  const handleLike = async (postId: string) => {
    if (!postId) return

    try {
      if (post?.isLiked) {
        await postsApi.unlikePost(postId, currentUser?.id)
      } else {
        await postsApi.likePost(postId, currentUser?.id)
      }
      
      // 更新本地帖子状态
      const updatedPost = await postsApi.getPosts().then(posts => posts.find(p => p.id === postId))
      if (updatedPost) {
        setPost(updatedPost)
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
    }
  }

  // 处理添加评论
  const handleAddComment = async (postId: string, content: string) => {
    if (!postId) return

    try {
      const updatedPost = await postsApi.addComment(postId, content, undefined, compatibleUser as any)
      if (updatedPost) {
        setPost(updatedPost)
      }
    } catch (error) {
      console.error('添加评论失败:', error)
    }
  }

  // 处理分享
  const handleShare = async (postId: string) => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || '作品分享',
          url: url
        })
      } catch (error) {
        console.error('分享失败:', error)
      }
    } else {
      navigator.clipboard.writeText(url)
      // alert('链接已复制到剪贴板')
    }
  }
  
  // 构造兼容的用户对象
  const compatibleUser = currentUser ? {
    id: currentUser.id,
    username: currentUser.username || currentUser.full_name || 'User',
    email: currentUser.email || '',
    avatar: currentUser.avatar_url || '',
    isAdmin: false,
    membershipLevel: 'free',
    membershipStatus: 'active'
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-100">
      <PostDetailModal
        post={post}
        isOpen={true} // 永远打开
        onClose={() => navigate(-1)} // 返回上一页
        onLike={handleLike}
        onComment={handleAddComment}
        onShare={handleShare}
        loading={loading}
        error={error}
        currentUser={compatibleUser as any}
      />
    </div>
  )
}

export default PostDetail
