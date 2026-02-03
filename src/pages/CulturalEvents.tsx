import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import GradientHero from '@/components/GradientHero';
import EventCalendar from '@/components/EventCalendar';
import { useEventService } from '@/hooks/useEventService';
import { Event } from '@/types';

// 文化活动页面
export default function CulturalEvents() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [ongoingEvents, setOngoingEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  
  const { getEvents } = useEventService();

  // 加载数据
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        // 获取所有活动
        const allEvents = await getEvents();
        
        // 过滤即将开始的活动（未来7天内）
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const filteredUpcoming = allEvents
          .filter(event => {
            const eventStart = new Date(event.startTime);
            return eventStart >= now && eventStart <= nextWeek;
          })
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 3);
        
        // 过滤进行中的活动
        const filteredOngoing = allEvents
          .filter(event => {
            const eventStart = new Date(event.startTime);
            const eventEnd = new Date(event.endTime);
            return eventStart <= now && eventEnd >= now;
          });
        
        setUpcomingEvents(filteredUpcoming);
        setOngoingEvents(filteredOngoing);
        setTotalEvents(allEvents.length);
        
        // 计算总参与人数（如果数据中有这个字段）
        const participantsCount = allEvents.reduce((sum, event) => {
          return sum + (event.participantCount || 0);
        }, 0);
        setTotalParticipants(participantsCount);
      } catch (error) {
        console.error('加载活动失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [getEvents]);

  const handleCreateEvent = () => {
    navigate('/create');
  };

  // 活动统计数据
  const stats = {
    totalEvents,
    totalParticipants,
    upcomingEvents: upcomingEvents.length,
    ongoingEvents: ongoingEvents.length,
    completedEvents: 0
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 渐变英雄区 */}
      <GradientHero 
        title="津脉活动"
        subtitle="参与津脉活动，探索传统文化魅力"
        theme="heritage"
        stats={[
          { label: '总活动数', value: `${stats.totalEvents}` },
          { label: '参与人数', value: `${stats.totalParticipants.toLocaleString()}` },
          { label: '即将开始', value: `${stats.upcomingEvents}` }
        ]}
        pattern={true}
        // 中文注释：使用在线图片测试背景图显示
        backgroundImage="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
      />


        {/* 即将开始的活动 */}
        {upcomingEvents.length > 0 && (
          <motion.section
            className="hidden sm:block mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">即将开始的活动</h2>
              <button 
                onClick={() => navigate('/tianjin')}
                className={`text-xs sm:text-sm font-medium transition-colors ${isDark ? 'text-red-500 hover:text-red-400' : 'text-red-600 hover:text-red-500'}`}
              >
                查看全部 <i className="fas fa-arrow-right ml-1"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all hover:shadow-lg cursor-pointer`}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/events/${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/events/${event.id}`)}
                >
                  <img 
                    src={event.media && event.media.length > 0 ? event.media[0].url : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20cultural%20event%20banner&image_size=landscape_16_9'} 
                    alt={event.title} 
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <div className={`p-3 sm:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] sm:text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        即将开始
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-500">
                        {new Date(event.startTime).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold mb-2 line-clamp-2">{event.title}</h3>
                    <p className={`text-xs sm:text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                      {event.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-sm text-gray-500 flex items-center gap-1">
                        <i className="fas fa-users text-xs"></i>
                        {event.participantCount || 0}人已参与
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // 处理报名逻辑
                        }}
                        className="text-[10px] sm:text-xs font-medium text-red-600 hover:underline px-2 py-1 rounded transition-colors hover:text-red-500"
                      >
                        报名
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* 活动日历组件 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >

          <EventCalendar />
        </motion.section>

        {/* 快速参与区 */}
        <motion.section
          className={`mt-8 sm:mt-12 p-5 sm:p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gradient-to-r from-red-50 to-pink-50'} text-center`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-3">准备好参与津脉活动了吗？</h2>
          <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            选择一个主题，创作你的作品，展示传统文化魅力
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={handleCreateEvent}
              className="px-6 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <i className="fas fa-paint-brush"></i>
              开始创作
            </button>
            <button 
              onClick={() => navigate('/explore')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto ${isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-white hover:bg-gray-100 shadow-md'}`}
            >
              <i className="fas fa-eye"></i>
              探索作品
            </button>
            <button 
              onClick={() => navigate('/my-activities')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full sm:w-auto ${isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-white hover:bg-gray-100 shadow-md'}`}
            >
              <i className="fas fa-user"></i>
              我的活动
            </button>
          </div>
        </motion.section>

        {/* 页脚 */}
        <footer className={`border-t mt-8 sm:mt-12 ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-4 px-4 z-10 relative`}>
          <div className="flex flex-col items-center justify-center text-center">
            <p className={`text-xs sm:text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              © 2025 津脉智坊. 保留所有权利
            </p>
            <div className="flex flex-wrap justify-center space-x-4 sm:space-x-6">
              <a href="/privacy" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
              <a href="/terms" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
              <a href="/help" className={`text-xs sm:text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
            </div>
          </div>
        </footer>
    </main>
  );
}