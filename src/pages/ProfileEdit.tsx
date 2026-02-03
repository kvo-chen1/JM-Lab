import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { useTheme } from '@/hooks/useTheme'
import { Link, useNavigate } from 'react-router-dom'
import { userService } from '@/services/apiService'
import { validationService } from '@/services/validationService'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'

export default function ProfileEdit() {
  const { user, updateUser } = useContext(AuthContext)
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const { logUserAction } = useAnalyticsStore()
  
  // 记录页面访问
  useEffect(() => {
    logUserAction('page_view', { page: 'profile_edit', userId: user?.id });
  }, [logUserAction, user?.id]);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age?.toString() || '',
    interests: user?.interests?.join(', ') || '',
    avatar: user?.avatar || ''
  })
  
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }
      
      // 检查文件大小（最大5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB')
        return
      }
      
      setAvatarFile(file)
      
      // 创建预览URL并压缩图片
      const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.7) => {
        return new Promise<string>((resolve) => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          img.onload = () => {
            // 计算压缩后的尺寸
            let width = img.width
            let height = img.height
            
            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height
                height = maxHeight
              }
            }
            
            // 设置canvas尺寸
            canvas.width = width
            canvas.height = height
            
            // 绘制压缩后的图片
            ctx?.drawImage(img, 0, 0, width, height)
            
            // 转换为base64
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
            resolve(compressedDataUrl)
          }
          
          img.src = URL.createObjectURL(file)
        })
      }
      
      // 压缩图片
      compressImage(file).then(compressedDataUrl => {
        console.log('原始图片大小:', (file.size / 1024).toFixed(2), 'KB');
        console.log('压缩后base64长度:', compressedDataUrl.length);
        console.log('压缩后估计大小:', (compressedDataUrl.length * 0.75 / 1024).toFixed(2), 'KB');
        
        // 进一步限制大小
        if (compressedDataUrl.length > 100000) {
          console.log('图片仍然过大，再次压缩');
          // 更严格的压缩
          compressImage(file, 600, 600, 0.6).then(smallerDataUrl => {
            console.log('再次压缩后base64长度:', smallerDataUrl.length);
            console.log('再次压缩后估计大小:', (smallerDataUrl.length * 0.75 / 1024).toFixed(2), 'KB');
            setAvatarPreview(smallerDataUrl);
            setFormData(prev => ({ ...prev, avatar: smallerDataUrl }));
          });
        } else {
          setAvatarPreview(compressedDataUrl);
          setFormData(prev => ({ ...prev, avatar: compressedDataUrl }));
        }
      })
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const updatedUser = {
        id: user?.id,
        username: formData.username,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : undefined,
        interests: formData.interests ? formData.interests.split(',').map(interest => interest.trim()) : [],
        avatar: avatarPreview
      }
      
      // 前端数据验证
      const validationResult = validationService.validateUserPartial(updatedUser);
      if (!validationResult.success) {
        const errorMsg = Object.values(validationResult.errors || {}).join('; ');
        setError(errorMsg || '输入数据格式有误');
        setIsLoading(false);
        return;
      }
      
      // 先调用后端 API 持久化
      await userService.updateUser(updatedUser);
      
      // 记录用户行为日志
      await logUserAction('profile_update', { 
        userId: user?.id,
        updatedFields: Object.keys(updatedUser).filter(key => key !== 'id' && key !== 'avatar'), // 避免记录过大的头像数据
        timestamp: Date.now()
      });

      updateUser(updatedUser)
      setSuccess('个人资料更新成功！')
      
      // 1秒后跳转回设置页面
      setTimeout(() => {
        navigate('/settings')
      }, 1000)
    } catch (err) {
      console.error('更新个人资料失败:', err)
      const errorMessage = err instanceof Error ? err.message : '更新失败'
      
      // 处理令牌无效错误
      if (errorMessage.includes('令牌无效') || errorMessage.includes('缺少用户信息') || errorMessage.includes('401')) {
        // 清除无效令牌
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          localStorage.removeItem('isAuthenticated')
        }
        
        // 跳转到登录页面
        setTimeout(() => {
          navigate('/login')
        }, 1000)
        
        setError('登录已过期，请重新登录')
      } else {
        setError('更新失败，请重试')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">编辑个人资料</h1>
        <Link 
          to="/settings" 
          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        >
          <i className="fas fa-arrow-left mr-2"></i>返回设置
        </Link>
      </div>
      
      <div className={`max-w-2xl mx-auto rounded-2xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-lg">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 头像上传 */}
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              头像
            </label>
            <div className="flex items-center space-x-6">
              {/* 头像预览 */}
              <div className="relative">
                <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-md`}>
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="头像预览" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <i className="fas fa-user text-4xl ${isDark ? 'text-gray-500' : 'text-gray-400'}"></i>
                    </div>
                  )}
                </div>
                {/* 编辑按钮 */}
                <div className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full shadow-lg">
                  <i className="fas fa-camera text-sm"></i>
                </div>
              </div>
              
              {/* 上传按钮 */}
              <div>
                <label htmlFor="avatar-upload" className={`cursor-pointer px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'} flex items-center space-x-2`}>
                  <i className="fas fa-upload"></i>
                  <span>选择图片</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  支持 JPG、PNG 格式，最大 5MB
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              用户名
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="请输入用户名"
            />
          </div>
          
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              邮箱
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled
              className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'} border`}
              placeholder="请输入邮箱"
            />
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              邮箱不可直接修改，请联系管理员
            </p>
          </div>
          
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              手机号
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="请输入手机号"
            />
          </div>
          
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              年龄
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
              max="120"
              className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="请输入年龄"
            />
          </div>
          
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              兴趣爱好
            </label>
            <textarea
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="请输入兴趣爱好，用逗号分隔"
            ></textarea>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className={`flex-1 py-3 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 rounded-lg transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>保存中...</>
              ) : (
                '保存修改'
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}