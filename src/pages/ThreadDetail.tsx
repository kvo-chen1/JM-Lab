// 社群帖子详情页面
import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Thread } from '@/pages/Community'
import { communityService } from '@/services/communityService'
import { AuthContext } from '@/contexts/authContext'
import ThreadDetailModal from '@/components/Community/ThreadDetailModal'
import { toast } from 'sonner'

interface ThreadDetailProps {
  currentUser?: {
    id: string;
    username: string;
    avatar?: string;
  } | null;
}

export const ThreadDetail: React.FC<ThreadDetailProps> = ({ currentUser: propUser }) => {
  const { id: communityId, postId } = useParams<{ id: string; postId: string }>()
  const navigate = useNavigate()
  const { user: authUser } = useContext(AuthContext)
  
  const currentUser = propUser || authUser
  
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载帖子详情
  useEffect(() => {
    const loadThread = async () => {
      if (!postId) {
        setError('帖子ID不存在')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // 从 communityService 获取帖子数据
        const threadData = await communityService.getThread(postId)
        
        console.log('Thread data loaded:', threadData)
        
        if (threadData) {
          setThread(threadData)
        } else {
          setError('未找到该帖子')
        }
      } catch (error) {
        console.error('加载帖子详情失败:', error)
        setError('加载失败，请稍后重试')
        toast.error('加载帖子失败')
      } finally {
        setLoading(false)
      }
    }

    loadThread()
  }, [postId, communityId])

  const handleClose = () => {
    // 返回社群页面
    if (communityId) {
      navigate(`/community/${communityId}`)
    } else {
      navigate(-1)
    }
  }

  const handlePostChange = (updatedThread: Thread) => {
    setThread(updatedThread)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || '帖子不存在'}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ThreadDetailModal
        thread={thread}
        communityId={communityId || thread.communityId}
        isOpen={true}
        onClose={handleClose}
        currentUser={currentUser}
        onPostChange={handlePostChange}
      />
    </div>
  )
}

export default ThreadDetail
