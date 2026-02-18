// 好友请求组件
import React, { useEffect } from 'react'
import { useCommunityStore } from '../../stores/communityStore'
import { UserPlus, Check, X, User, Bell } from 'lucide-react'
import LazyImage from '../LazyImage'

interface FriendRequestsProps {
  isOpen: boolean
  onClose: () => void
}

export const FriendRequests: React.FC<FriendRequestsProps> = ({ isOpen, onClose }) => {
  const {
    receivedFriendRequests,
    fetchFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest
  } = useCommunityStore()
  
  // 初始化好友请求列表
  useEffect(() => {
    if (isOpen) {
      fetchFriendRequests()
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">好友请求</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* 好友请求列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {receivedFriendRequests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无好友请求</h3>
              <p className="text-gray-500">当有新的好友请求时，会在这里显示</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedFriendRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* 用户信息 */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                        <LazyImage
                          src={request.sender?.avatar_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=默认用户头像，简洁现代风格&image_size=square'}
                          alt={request.sender?.username || '用户'}
                          className="w-full h-full object-cover"
                          placeholder="blur"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {request.sender?.username || '未知用户'}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {request.sender?.bio || '暂无简介'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => rejectFriendRequest(request.id)}
                      className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      拒绝
                    </button>
                    <button
                      onClick={() => acceptFriendRequest(request.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      接受
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 底部 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default FriendRequests
