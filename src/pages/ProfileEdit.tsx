import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { useTheme } from '@/hooks/useTheme'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Link as LinkIcon,
  Github,
  Twitter,
  Tag,
  Image as ImageIcon,
  X,
  Camera
} from 'lucide-react'
import { userService } from '@/services/apiService'
import { validationService } from '@/services/validationService'
import { useAnalyticsStore } from '@/stores/useAnalyticsStore'
import { uploadImage } from '@/services/imageService'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// 辅助函数：base64 转 File
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

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
    bio: user?.bio || '',
    location: user?.location || '',
    occupation: user?.occupation || '',
    website: user?.website || '',
    github: user?.github || '',
    twitter: user?.twitter || '',
    interests: user?.interests?.join(', ') || '',
    avatar: user?.avatar || '',
    coverImage: user?.coverImage || '',
  })
  
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '')
  const [coverPreview, setCoverPreview] = useState<string>(user?.coverImage || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  
  // 标签管理
  const [tags, setTags] = useState<string[]>(user?.tags || [])
  const [newTag, setNewTag] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'basic' | 'social' | 'tags'>('basic')

  // 当 user 数据变化时同步表单数据（用于初始加载和刷新）
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age?.toString() || '',
        bio: user.bio || '',
        location: user.location || '',
        occupation: user.occupation || '',
        website: user.website || '',
        github: user.github || '',
        twitter: user.twitter || '',
        interests: user.interests?.join(', ') || '',
        avatar: user.avatar || '',
        coverImage: user.coverImage || '',
      })
      setAvatarPreview(user.avatar || '')
      setCoverPreview(user.coverImage || '')
      setTags(user.tags || [])
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // 图片压缩函数
  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
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
        
        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB')
        return
      }
      
      setAvatarFile(file)
      
      compressImage(file).then(compressedDataUrl => {
        if (compressedDataUrl.length > 100000) {
          compressImage(file, 600, 600, 0.6).then(smallerDataUrl => {
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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('封面图片大小不能超过10MB')
        return
      }
      
      setCoverFile(file)
      
      compressImage(file, 1200, 400, 0.8).then(compressedDataUrl => {
        setCoverPreview(compressedDataUrl);
        setFormData(prev => ({ ...prev, coverImage: compressedDataUrl }));
      })
    }
  }

  // 标签管理
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      let finalAvatarUrl = avatarPreview;
      let finalCoverUrl = coverPreview;

      // 上传头像
      if (avatarPreview && avatarPreview.startsWith('data:image')) {
        try {
          const file = dataURLtoFile(avatarPreview, `avatar-${Date.now()}.jpg`);
          const uploadedUrl = await uploadImage(file);
          // 接受任何非空的 URL（包括 blob: 和 http(s): URL）
          if (uploadedUrl && typeof uploadedUrl === 'string' && uploadedUrl.length > 0) {
            finalAvatarUrl = uploadedUrl;
          } else {
            throw new Error('头像上传返回无效URL');
          }
        } catch (uploadError) {
          console.error('头像上传失败:', uploadError);
          setError('头像上传失败，请重试或使用较小的图片');
          setIsLoading(false);
          return;
        }
      }

      // 上传封面
      if (coverPreview && coverPreview.startsWith('data:image')) {
        try {
          const file = dataURLtoFile(coverPreview, `cover-${Date.now()}.jpg`);
          const uploadedUrl = await uploadImage(file);
          // 接受任何非空的 URL（包括 blob: 和 http(s): URL）
          if (uploadedUrl && typeof uploadedUrl === 'string' && uploadedUrl.length > 0) {
            finalCoverUrl = uploadedUrl;
          } else {
            throw new Error('封面上传返回无效URL');
          }
        } catch (uploadError) {
          console.error('封面上传失败:', uploadError);
          setError('封面上传失败，请重试或使用较小的图片');
          setIsLoading(false);
          return;
        }
      }

      const updatedUser = {
        id: user?.id,
        username: formData.username,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : undefined,
        bio: formData.bio,
        location: formData.location,
        occupation: formData.occupation,
        website: formData.website,
        github: formData.github,
        twitter: formData.twitter,
        interests: formData.interests ? formData.interests.split(',').map(interest => interest.trim()) : [],
        tags: tags,
        avatar: finalAvatarUrl,
        coverImage: finalCoverUrl,
      }
      
      // 前端数据验证
      const validationResult = validationService.validateUserPartial(updatedUser);
      if (!validationResult.success) {
        const errorMsg = Object.values(validationResult.errors || {}).join('; ');
        setError(errorMsg || '输入数据格式有误');
        setIsLoading(false);
        return;
      }
      
      // 构造数据库更新对象
      // 注意：我们需要同时更新一级列和 metadata 列，以保持数据同步
      // Supabase users 表使用 avatar_url 列，不是 avatar 列
      const updatesForDb: any = {
        username: updatedUser.username,
        age: updatedUser.age,
        bio: updatedUser.bio,
        interests: updatedUser.interests,
        tags: updatedUser.tags,
        avatar_url: finalAvatarUrl, // 使用正确的列名
        cover_image: finalCoverUrl, // 添加封面图片列
        updated_at: new Date().toISOString(), // 使用 ISO 格式时间戳
        metadata: {
            ...user?.metadata, // 保留原有 metadata
            username: updatedUser.username,
            age: updatedUser.age,
            bio: updatedUser.bio,
            location: updatedUser.location,
            occupation: updatedUser.occupation,
            website: updatedUser.website,
            github: updatedUser.github,
            twitter: updatedUser.twitter,
            interests: updatedUser.interests,
            tags: updatedUser.tags,
            avatar: finalAvatarUrl,
            coverImage: finalCoverUrl
        }
      };
      // 只在手机号不为空时更新（避免唯一约束冲突）
      if (updatedUser.phone && updatedUser.phone.trim() !== '') {
        updatesForDb.phone = updatedUser.phone;
        updatesForDb.metadata.phone = updatedUser.phone;
      }

      // 1. 更新后端数据库 (通过 API)
      const token = localStorage.getItem('token');
      if (token) {
        // 构建请求数据，不发送空字符串的手机号（避免唯一约束冲突）
        const apiData: any = {
          username: updatedUser.username,
          age: updatedUser.age,
          bio: updatedUser.bio,
          location: updatedUser.location,
          occupation: updatedUser.occupation,
          website: updatedUser.website,
          github: updatedUser.github,
          twitter: updatedUser.twitter,
          interests: updatedUser.interests,
          tags: updatedUser.tags,
          avatar: finalAvatarUrl,
          coverImage: finalCoverUrl
        };
        // 只在手机号不为空时发送
        if (updatedUser.phone && updatedUser.phone.trim() !== '') {
          apiData.phone = updatedUser.phone;
        }

        const response = await fetch('/api/auth/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '未知错误' }));
          console.error('后端 API 更新失败:', errorData);
          throw new Error('保存到数据库失败: ' + (errorData.message || '服务器错误'));
        }

        const result = await response.json();
        console.log('后端 API 更新成功:', result);
      }

      // 2. 同步更新 Supabase 数据库 (public.users) - 使用 supabaseAdmin 绕过 RLS
      try {
        const { error: dbError } = await supabaseAdmin
          .from('users')
          .update(updatesForDb)
          .eq('id', user?.id);
          
        if (dbError) {
          console.error('Supabase 数据库更新失败:', dbError);
          // 不阻断流程，因为后端已经更新成功
        } else {
          console.log('Supabase 数据库更新成功');
        }
      } catch (dbErr) {
        console.error('Supabase 数据库更新异常:', dbErr);
        // 不阻断流程
      }

      // 3. 同步更新 Supabase Auth User Metadata (这对 AuthContext 很重要)
      if (supabase) {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: updatesForDb.metadata
        });
        
        if (authUpdateError) {
          console.error('Supabase Auth Metadata 更新失败:', authUpdateError);
          // 不阻断流程，因为数据库已经更新
        }
      }

      // 记录用户行为日志
      await logUserAction('profile_update', { 
        userId: user?.id,
        updatedFields: Object.keys(updatedUser).filter(key => key !== 'id' && key !== 'avatar'), // 避免记录过大的头像数据
        timestamp: Date.now()
      });

      // 更新 Context，触发全局状态刷新，并同步到数据库
      await updateUser(updatedUser as any)
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
      
      <div className={`max-w-3xl mx-auto rounded-2xl shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {/* 封面图 */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          {coverPreview ? (
            <img 
              src={coverPreview} 
              alt="封面预览" 
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/20" />
          <label 
            htmlFor="cover-upload" 
            className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 dark:bg-gray-800/90 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ImageIcon className="w-4 h-4" />
            <span>更换封面</span>
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        <div className="p-6">
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

          {/* 标签页切换 */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'basic', label: '基本信息', icon: User },
              { id: 'social', label: '社交账号', icon: LinkIcon },
              { id: 'tags', label: '个人标签', icon: Tag },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息标签页 */}
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 头像上传 */}
              <div className="space-y-3">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  头像
                </label>
                <div className="flex items-center space-x-6">
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
                          <User className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <label 
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-red-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      支持 JPG、PNG 格式，最大 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    用户名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="请输入用户名"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    邮箱
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'} border`}
                    />
                  </div>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    邮箱不可直接修改
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    手机号
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="请输入手机号"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    年龄
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      min="0"
                      max="120"
                      className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="请输入年龄"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  个人简介
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none`}
                  placeholder="介绍一下自己..."
                />
                <p className={`text-xs text-right ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formData.bio.length}/500
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    所在地
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="例如：北京"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    职业
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      placeholder="例如：设计师"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  兴趣爱好
                </label>
                <textarea
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  rows={2}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  placeholder="请输入兴趣爱好，用逗号分隔"
                />
              </div>
            </motion.div>
          )}

          {/* 社交账号标签页 */}
          {activeTab === 'social' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  个人网站
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  GitHub
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="GitHub 用户名"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Twitter
                </label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="Twitter 用户名"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 个人标签标签页 */}
          {activeTab === 'tags' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  个人标签
                </label>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  添加标签展示你的技能和兴趣，最多10个
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        isDark 
                          ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={20}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    placeholder="输入标签后按回车添加"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || tags.length >= 10}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    添加
                  </button>
                </div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {tags.length}/10 个标签
                </p>
              </div>
            </motion.div>
          )}
          
          <div className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
              className={`flex-1 py-3 rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50`}
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
      </div>
    </main>
  )
}