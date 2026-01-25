import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { useTheme } from '@/hooks/useTheme'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function AccountSecurity() {
  const { user, enableTwoFactorAuth, verifyTwoFactorCode } = useContext(AuthContext)
  const { isDark } = useTheme()
  const navigate = useNavigate()
  
  // 双因素认证状态
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showVerificationCode, setShowVerificationCode] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // 安全日志状态
  const [securityLogs, setSecurityLogs] = useState<any[]>([])
  
  useEffect(() => {
    // 获取真实的安全日志
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/users/activities');
        if (response.ok) {
          const data = await response.json();
          const logs = data.map((item: any) => {
            const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
            let actionName = item.action_type;
            
            // 格式化操作名称
            if (item.action_type === 'LOGIN' || item.action_type === 'login') actionName = '登录';
            else if (item.action_type === 'UPDATE_PASSWORD') actionName = '修改密码';
            else if (item.action_type === 'REGISTER') actionName = '注册账号';
            
            // 格式化设备信息 (从User-Agent解析)
            let deviceName = '未知设备';
            if (item.user_agent) {
              if (item.user_agent.includes('Chrome')) deviceName = 'Chrome';
              else if (item.user_agent.includes('Safari')) deviceName = 'Safari';
              else if (item.user_agent.includes('Firefox')) deviceName = 'Firefox';
              else if (item.user_agent.includes('Edge')) deviceName = 'Edge';
              else if (item.user_agent.includes('Mobile')) deviceName = 'Mobile Device';
            }
            
            return {
              id: item.id,
              action: actionName,
              ip: item.ip_address || '未知IP',
              device: deviceName,
              time: format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss'),
              location: '未知位置', // 实际需要IP库解析
              raw_details: details
            };
          });
          setSecurityLogs(logs);
        }
      } catch (error) {
        console.error('Failed to fetch security logs:', error);
      }
    };
    
    if (user) {
      fetchLogs();
    }
  }, [user]);
  
  const handleEnableTwoFactor = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const result = await enableTwoFactorAuth()
      if (result) {
        setShowVerificationCode(true)
        setSuccess('请输入收到的验证码')
      } else {
        setError('启用双因素认证失败')
      }
    } catch (err) {
      setError('启用双因素认证失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('请输入验证码')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const result = await verifyTwoFactorCode(verificationCode)
      if (result) {
        setTwoFactorEnabled(true)
        setShowVerificationCode(false)
        setSuccess('双因素认证已成功启用')
      } else {
        setError('验证码无效，请重试')
      }
    } catch (err) {
      setError('验证失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDisableTwoFactor = () => {
    setTwoFactorEnabled(false)
    setSuccess('双因素认证已成功禁用')
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">账号安全设置</h1>
        <Link 
          to="/settings" 
          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        >
          <i className="fas fa-arrow-left mr-2"></i>返回设置
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：安全设置 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 双因素认证 */}
          <div className={`rounded-2xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="font-medium mb-4 flex items-center">
              <i className="fas fa-shield-alt text-lg mr-2 text-blue-500"></i>
              双因素认证
            </h2>
            
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
            
            {!twoFactorEnabled ? (
              <div className="space-y-4">
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  启用双因素认证可提高您的账号安全性，登录时需要额外的验证码验证。
                </p>
                
                {showVerificationCode ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        验证码
                      </label>
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="请输入6位验证码"
                          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        />
                        <button
                          onClick={handleVerifyCode}
                          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            '验证'
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>验证码已发送到您的邮箱：{user?.email}</p>
                      <button 
                        onClick={() => {/* 重新发送验证码逻辑 */}} 
                        className="text-blue-500 hover:underline ml-2"
                        disabled={isLoading}
                      >
                        重新发送
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleEnableTwoFactor}
                      className={`px-6 py-2.5 rounded-lg transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <><i className="fas fa-spinner fa-spin mr-2"></i>处理中...</>
                      ) : (
                        '启用双因素认证'
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 text-xl mr-3"></i>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    双因素认证已启用
                  </span>
                </div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  登录时，您将需要输入密码和通过邮箱或验证码应用收到的验证码。
                </p>
                <button
                  onClick={handleDisableTwoFactor}
                  className={`px-6 py-2.5 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  禁用双因素认证
                </button>
              </div>
            )}
          </div>
          
          {/* 登录设备管理 */}
          <div className={`rounded-2xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="font-medium mb-4 flex items-center">
              <i className="fas fa-laptop text-lg mr-2 text-green-500"></i>
              登录设备管理
            </h2>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'} flex justify-between items-center`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <i className="fas fa-desktop text-xl"></i>
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Chrome 120</div>
                    <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>192.168.1.1 | 北京</div>
                    <div className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-600'} mt-1`}>当前设备</div>
                  </div>
                </div>
                <button className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} disabled>
                  正在使用
                </button>
              </div>
              
              <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'} flex justify-between items-center`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <i className="fas fa-mobile-alt text-xl"></i>
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Safari 17</div>
                    <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>203.0.113.5 | 上海</div>
                    <div className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-600'} mt-1`}>2024-12-27 18:45</div>
                  </div>
                </div>
                <button className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-red-900/30 hover:bg-red-800/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}>
                  登出
                </button>
              </div>
            </div>
            
            <div className={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <p>定期检查您的登录设备，确保没有未授权的访问。</p>
            </div>
          </div>
          
          {/* 密码安全建议 */}
          <div className={`rounded-2xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="font-medium mb-4 flex items-center">
              <i className="fas fa-key text-lg mr-2 text-purple-500"></i>
              密码安全建议
            </h2>
            
            <ul className="space-y-3">
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  使用至少8个字符的强密码，包含字母、数字和特殊字符
                </span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  避免在多个网站使用相同的密码
                </span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  定期更改密码，建议每3个月更新一次
                </span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  启用双因素认证以增强账号安全性
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* 右侧：安全日志 */}
        <div className={`lg:col-span-1 space-y-6`}>
          <div className={`rounded-2xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="font-medium mb-4 flex items-center">
              <i className="fas fa-history text-lg mr-2 text-orange-500"></i>
              最近安全日志
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {securityLogs.map(log => (
                <div key={log.id} className={`p-3 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex justify-between items-start">
                    <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {log.action}
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {log.time}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <div>{log.device}</div>
                    <div>{log.ip} | {log.location}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className={`w-full mt-4 py-2 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              查看全部日志
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}