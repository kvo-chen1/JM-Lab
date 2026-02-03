import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TianjinButton } from '@/components/TianjinStyleComponents';
import { ActivityParticipation } from '@/types';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import eventBus from '@/services/enhancedEventBus';

// 模拟数据
const MOCK_PARTICIPATIONS: ActivityParticipation[] = [
  {
    id: '1',
    userId: 'user1',
    eventId: 'evt1',
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2023-05-20'),
    registrationDate: new Date('2023-05-15'),
    status: 'submitted',
    progress: 50,
    currentStep: 2,
    event: {
      id: 'evt1',
      title: '天津非遗文创设计大赛',
      description: '探索天津传统文化，设计现代文创产品',
      content: '',
      startTime: new Date('2023-06-01'),
      endTime: new Date('2023-07-01'),
      organizerId: 'org1',
      participants: 120,
      isPublic: true,
      type: 'online',
      status: 'published',
      media: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 1000,
      shareCount: 50,
      likeCount: 200,
    }
  },
  {
    id: '2',
    userId: 'user1',
    eventId: 'evt2',
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2023-06-10'),
    registrationDate: new Date('2023-06-10'),
    status: 'registered',
    progress: 25,
    currentStep: 1,
    event: {
      id: 'evt2',
      title: '“津味”美食摄影展',
      description: '拍摄你眼中的天津美食',
      content: '',
      startTime: new Date('2023-06-15'),
      endTime: new Date('2023-07-15'),
      organizerId: 'org1',
      participants: 85,
      isPublic: true,
      type: 'offline',
      status: 'published',
      media: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 500,
      shareCount: 30,
      likeCount: 120,
    }
  },
  {
    id: '3',
    userId: 'user1',
    eventId: 'evt3',
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2023-05-01'),
    registrationDate: new Date('2023-04-01'),
    submissionDate: new Date('2023-04-20'),
    status: 'awarded',
    progress: 100,
    currentStep: 4,
    ranking: 1,
    award: '一等奖',
    event: {
      id: 'evt3',
      title: '海河故事短视频大赛',
      description: '用镜头讲述海河的故事',
      content: '',
      startTime: new Date('2023-04-01'),
      endTime: new Date('2023-05-01'),
      organizerId: 'org2',
      participants: 300,
      isPublic: true,
      type: 'online',
      status: 'published',
      media: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 5000,
      shareCount: 200,
      likeCount: 800,
    }
  }
];

export default function MyActivities() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed' | 'awarded'>('all');
  const [participations, setParticipations] = useState<ActivityParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 提取为公共函数
  const fetchActivities = async () => {
    if (!user?.id) {
      setParticipations([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // 尝试从后端API获取活动数据
      const response = await fetch(`/api/activities/participations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data) {
          setParticipations(data.data);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // 如果API调用失败，使用空数组
      console.log('API调用失败，使用空数组');
      setParticipations([]);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('获取活动数据失败:', error);
      toast.error('获取活动数据失败，请稍后重试');
      // 出错时使用空数组
      setParticipations([]);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 为新用户初始化活动数据
  useEffect(() => {
    fetchActivities();
  }, [user]);

  // 监听用户登录事件和活动注册事件，确保数据初始化
  useEffect(() => {
    const handleLogin = () => {
      // 用户登录后重新加载数据
      setTimeout(fetchActivities, 500);
    };

    const handleActivityRegistered = () => {
      // 活动注册成功后重新加载数据
      fetchActivities();
    };

    eventBus.on('auth:login', handleLogin);
    eventBus.on('auth:register', handleLogin);
    eventBus.on('activity:registered', handleActivityRegistered);

    return () => {
      eventBus.off('auth:login', handleLogin);
      eventBus.off('auth:register', handleLogin);
      eventBus.off('activity:registered', handleActivityRegistered);
    };
  }, [user]);

  // 处理取消报名
  const handleCancelRegistration = async (participationId: string) => {
    if (window.confirm('确定要取消报名吗？')) {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));
        // 实际逻辑应调用API
        // await fetch(`/api/activities/participations/${participationId}/cancel`, {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        //     'Content-Type': 'application/json',
        //   },
        // });
        toast.success('已取消报名');
        // 重新加载数据
        fetchActivities();
      } catch (error) {
        console.error('取消报名失败:', error);
        toast.error('取消报名失败，请稍后重试');
      }
    }
  };

  // 处理手动刷新
  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const filteredList = participations.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in_progress') return ['registered', 'submitted', 'reviewing'].includes(p.status);
    if (activeTab === 'completed') return ['completed', 'awarded'].includes(p.status);
    if (activeTab === 'awarded') return p.status === 'awarded';
    return true;
  });

  const getStepStatus = (currentStep: number, stepIndex: number) => {
    if (currentStep > stepIndex) return 'completed';
    if (currentStep === stepIndex) return 'current';
    return 'pending';
  };

  const steps = [
    { title: '报名成功', icon: 'fa-check-circle' },
    { title: '作品提交', icon: 'fa-upload' },
    { title: '评审中', icon: 'fa-search' },
    { title: '结果公布', icon: 'fa-trophy' },
  ];

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 头部标题 */}
        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">我的活动</h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>管理您的参与进度，展示您的才华</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} transition-colors flex items-center ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`fas ${refreshing ? 'fa-spinner fa-spin' : 'fa-sync-alt'} mr-2`}></i>
                刷新
              </button>
              <button 
                onClick={() => navigate('/activities')}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} transition-colors flex items-center`}
              >
                <i className="fas fa-calendar-plus mr-2"></i>
                主办方中心
              </button>
              <TianjinButton onClick={() => navigate('/events')}>
                <i className="fas fa-compass mr-2"></i>
                发现更多活动
              </TianjinButton>
              <button 
                onClick={() => navigate('/admin?tab=campaigns')}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} transition-colors flex items-center`}
              >
                <i className="fas fa-cog mr-2"></i>
                活动管理
              </button>
            </div>
          </div>

        {/* 数据概览看板 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: '累计参与', value: participations.length, icon: 'fa-flag', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            { label: '获得奖项', value: participations.filter(p => p.status === 'awarded').length, icon: 'fa-trophy', color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
            { label: '作品浏览', value: '12.5k', icon: 'fa-eye', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
            { label: '社群互动', value: '86', icon: 'fa-comments', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <i className={`fas ${stat.icon} ${stat.color} text-xl`}></i>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 标签页切换 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', name: '全部活动' },
              { id: 'in_progress', name: '进行中' },
              { id: 'completed', name: '已结束' },
              { id: 'awarded', name: '获奖记录' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-red-600 text-red-600 dark:text-red-400 dark:border-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* 活动列表 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
              <p>加载中...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700">
              <i className="fas fa-clipboard-list text-4xl text-gray-400 mb-4"></i>
              <p className="text-lg text-gray-500">暂无相关活动记录</p>
              <button 
                onClick={() => navigate('/activities')}
                className="mt-4 text-red-600 hover:text-red-700 font-medium"
              >
                去发现精彩活动 &rarr;
              </button>
            </div>
          ) : (
            filteredList.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-xl shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* 左侧：活动基本信息 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              item.event.type === 'online' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            }`}>
                              {item.event.type === 'online' ? '线上' : '线下'}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              item.status === 'awarded' 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {item.status === 'registered' ? '已报名' :
                               item.status === 'submitted' ? '已提交' :
                               item.status === 'reviewing' ? '评审中' :
                               item.status === 'awarded' ? '已获奖' : '已结束'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold mb-2 hover:text-red-600 cursor-pointer transition-colors"
                              onClick={() => navigate(`/activities/${item.eventId}`)}>
                            {item.event.title}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-3 line-clamp-2`}>
                            {item.event.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span><i className="fas fa-calendar mr-1"></i> {new Date(item.event.startTime).toLocaleDateString()} - {new Date(item.event.endTime).toLocaleDateString()}</span>
                            <span><i className="fas fa-user mr-1"></i> {item.event.participants} 人参与</span>
                          </div>
                        </div>
                      </div>

                      {/* 进度条 */}
                      <div className="mt-6">
                        <div className="relative">
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                            <div style={{ width: `${item.progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500 transition-all duration-500"></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            {steps.map((step, idx) => {
                              const status = getStepStatus(item.currentStep, idx + 1);
                              return (
                                <div key={idx} className={`flex flex-col items-center ${
                                  status === 'completed' ? 'text-red-500 font-medium' : 
                                  status === 'current' ? 'text-red-600 font-bold' : ''
                                }`}>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                                    status === 'completed' || status === 'current' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
                                  }`}>
                                    <i className={`fas ${step.icon}`}></i>
                                  </div>
                                  <span>{step.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 右侧：操作区 */}
                    <div className="w-full md:w-64 flex flex-col gap-3 justify-center border-l border-gray-100 dark:border-gray-700 pl-0 md:pl-6">
                      {item.status === 'registered' && (
                        <TianjinButton 
                          onClick={() => navigate(`/create?eventId=${item.eventId}`)}
                          className="w-full justify-center"
                        >
                          <i className="fas fa-upload mr-2"></i>
                          提交作品
                        </TianjinButton>
                      )}
                      
                      {['submitted', 'reviewing'].includes(item.status) && (
                        <button className="w-full py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
                          <i className="fas fa-eye mr-2"></i>
                          查看作品
                        </button>
                      )}

                      {item.status === 'awarded' && (
                         <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                           <i className="fas fa-trophy text-yellow-500 text-2xl mb-1 block"></i>
                           <span className="font-bold text-yellow-700 dark:text-yellow-400">{item.award}</span>
                           <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">恭喜您获奖！</p>
                         </div>
                      )}

                      <button 
                        onClick={() => navigate(`/activities/${item.eventId}`)}
                        className="w-full py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        活动详情
                      </button>

                      {item.status === 'registered' && (
                        <button 
                          onClick={() => handleCancelRegistration(item.id)}
                          className="text-xs text-gray-400 hover:text-red-500 text-center mt-2"
                        >
                          取消报名
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
