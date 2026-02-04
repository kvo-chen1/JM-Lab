import { useState, useContext, useEffect } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { useTheme } from '@/hooks/useTheme'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

export default function AccountSecurity() {
  const { user, enableTwoFactorAuth, verifyTwoFactorCode, resendTwoFactorCode, disableTwoFactorAuth } = useContext(AuthContext)
  const { isDark } = useTheme()
  const navigate = useNavigate()
  
  // 双因素认证状态
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false)
  const [showVerificationCode, setShowVerificationCode] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // 安全日志状态
  const [securityLogs, setSecurityLogs] = useState<any[]>([])
  
  // 登录设备状态
  const [loginDevices, setLoginDevices] = useState<any[]>([])
  
  // 监听用户数据变化
  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(user.twoFactorEnabled || false)
    }
  }, [user]);
  
  useEffect(() => {
    // 获取真实的安全日志
    const fetchLogs = async () => {
      try {
        // 模拟安全日志数据
        const mockLogs = [
          {
            id: '1',
            action: '登录',
            ip: '192.168.1.1',
            device: 'Chrome 120',
            time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            location: '北京'
          },
          {
            id: '2',
            action: '修改密码',
            ip: '203.0.113.5',
            device: 'Safari 17',
            time: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd HH:mm:ss'),
            location: '上海'
          },
          {
            id: '3',
            action: '注册账号',
            ip: '172.16.0.1',
            device: 'Firefox 115',
            time: format(new Date(Date.now() - 172800000), 'yyyy-MM-dd HH:mm:ss'),
            location: '广州'
          }
        ];
        setSecurityLogs(mockLogs);
      } catch (error) {
        console.error('Failed to fetch security logs:', error);
      }
    };
    
    // 获取登录设备
    const fetchDevices = async () => {
      try {
        // 模拟登录设备数据
        const mockDevices = [
          {
            id: '1',
            device: 'Chrome 120',
            ip: '192.168.1.1',
            location: '北京',
            lastActive: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            isCurrent: true
          },
          {
            id: '2',
            device: 'Safari 17',
            ip: '203.0.113.5',
            location: '上海',
            lastActive: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd HH:mm:ss'),
            isCurrent: false
          }
        ];
        setLoginDevices(mockDevices);
      } catch (error) {
        console.error('Failed to fetch login devices:', error);
      }
    };
    
    if (user) {
      fetchLogs();
      fetchDevices();
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
  
  const handleResendCode = async () => {
    setResendLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const result = await resendTwoFactorCode()
      if (result) {
        setSuccess('验证码已重新发送')
      } else {
        setError('重新发送验证码失败')
      }
    } catch (err) {
      setError('重新发送验证码失败，请重试')
    } finally {
      setResendLoading(false)
    }
  }
  
  const handleDisableTwoFactor = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const result = await disableTwoFactorAuth()
      if (result) {
        setTwoFactorEnabled(false)
        setSuccess('双因素认证已成功禁用')
      } else {
        setError('禁用双因素认证失败')
      }
    } catch (err) {
      setError('禁用双因素认证失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLogoutDevice = async (deviceId: string) => {
    // 模拟登出设备
    setLoginDevices(prev => prev.filter(device => device.id !== deviceId))
    setSuccess('设备已成功登出')
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
                        onClick={handleResendCode}
                        className="text-blue-500 hover:underline ml-2"
                        disabled={resendLoading || isLoading}
                      >
                        {resendLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          '重新发送'
                        )}
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
                  登录时，您将需要输入密码和通过邮箱收到的验证码。
                </p>
                <button
                  onClick={handleDisableTwoFactor}
                  className={`px-6 py-2.5 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    '禁用双因素认证'
                  )}
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
              {loginDevices.map(device => (
                <div key={device.id} className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'} flex justify-between items-center`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      <i className={device.device.includes('Mobile') ? 'fas fa-mobile-alt text-xl' : 'fas fa-desktop text-xl'}></i>
                    </div>
                    <div>
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{device.device}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{device.ip} | {device.location}</div>
                      <div className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-600'} mt-1`}>
                        {device.isCurrent ? '当前设备' : device.lastActive}
                      </div>
                    </div>
                  </div>
                  {device.isCurrent ? (
                    <button className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} disabled>
                      正在使用
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleLogoutDevice(device.id)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${isDark ? 'bg-red-900/30 hover:bg-red-800/30 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
                    >
                      登出
                    </button>
                  )}
                </div>
              ))}
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
              {securityLogs.length === 0 && (
                <div className={`p-6 text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <i className="fas fa-info-circle text-xl mb-2"></i>
                  <p>暂无安全日志</p>
                </div>
              )}
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