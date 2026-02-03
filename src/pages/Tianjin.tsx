import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import GradientHero from '@/components/GradientHero';
import { CulturalEvent } from '@/services/eventCalendarService';
import { tianjinActivityService } from '@/services/tianjinActivityService';
import TianjinCreativeActivities from '@/components/TianjinCreativeActivities';
import TianjinHistoricalScene from '@/components/TianjinHistoricalScene';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Tianjin() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<CulturalEvent[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'offline' | 'brands' | 'historical'>('offline');

  // 检测设备类型
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadHotspots = async () => {
      const data = await tianjinActivityService.getHotspots();
      // 适配 CulturalEvent 接口
      const events: CulturalEvent[] = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type as any,
        status: item.status as any,
        startDate: item.startDate,
        endDate: item.endDate,
        organizer: item.organizer,
        image: item.image,
        tags: item.tags,
        culturalElements: item.culturalElements,
        participantCount: item.participantCount,
        hasPrize: item.hasPrize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      setUpcomingEvents(events);
    };
    loadHotspots();
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 特色专区渐变英雄区 */}
        <GradientHero 
          title="特色专区"
          subtitle="探索特色文化、老字号与非遗传承"
          theme="heritage"
          stats={[
            { label: '老字号', value: '精选' },
            { label: '特色元素', value: '资产' },
            { label: '非遗传承', value: '导览' },
            { label: '特色应用', value: '共创' }
          ]}
          pattern={true}
          size="lg"
          // 中文注释：使用Pexels高清"红灯笼夜景"作为背景图，替代原AI生成图片，营造沉浸式氛围
          backgroundImage="https://images.pexels.com/photos/6688844/pexels-photo-6688844.jpeg?auto=compress&cs=tinysrgb&w=1920"
        >
          {/* 手机端搜索框 */}
          {isMobile && (
            <>
              <motion.div 
                className="relative w-full max-w-md mx-auto mt-6 px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="搜索地域模板、线下体验或老字号"
                    className="w-full px-5 pr-12 py-3 rounded-full text-sm font-medium text-left focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-red-500 focus:ring-offset-white hover:bg-gray-50 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg"
                    onClick={() => console.log('搜索:', searchTerm)}
                  >
                    <i className="fas fa-search text-sm"></i>
                  </button>
                </div>
              </motion.div>
              
              {/* 手机端活动类别标签页 */}
              <motion.div 
                className="w-full max-w-md mx-auto mt-6 px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2">
                  {[
                    { id: 'offline', name: '线下体验' },
                    { id: 'templates', name: '地域模板' },
                    { id: 'brands', name: '老字号联名' },
                    { id: 'historical', name: '历史场景' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      title={tab.name}
                      className={`px-6 py-3 rounded-full text-sm font-semibold text-left transition-all duration-300 whitespace-nowrap snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
                        activeTab === tab.id 
                          ? 'bg-red-500 text-white shadow-lg scale-105' 
                          : 'bg-white hover:bg-gray-50 text-gray-900 shadow-sm'
                      } focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </GradientHero>

        {/* 近期热门活动预览 - 导流模块 */}
        {!isMobile && upcomingEvents.length > 0 && (
          <section className="mt-8">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-xl font-bold flex items-center">
                <i className="fas fa-fire text-red-500 mr-2"></i>
                近期津城热点
              </h2>
              <button 
                onClick={() => navigate('/events')}
                className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'}`}
              >
                查看更多活动 <i className="fas fa-arrow-right ml-1"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className={`group cursor-pointer rounded-xl overflow-hidden shadow-md border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="relative h-24 md:h-32 overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-1.5 py-0.5 md:px-2 rounded-full text-[10px] md:text-xs font-medium bg-red-600 text-white shadow-sm">
                        即将开始
                      </span>
                    </div>
                  </div>
                  <div className="p-2 md:p-4">
                    <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-1 group-hover:text-red-500 transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2">
                      <i className="far fa-calendar-alt mr-1 md:mr-1.5"></i>
                      {event.startDate}
                    </div>
                    <p className={`text-[10px] md:text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {event.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
        
        {/* 津味共创活动 */}
        <section className="mt-8 mb-12">
          <div className="">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              
              {/* 电脑端搜索框 */}
              {!isMobile && (
                <motion.div 
                  className="relative w-full md:w-80"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <input
                    type="text"
                    placeholder="搜索地域模板、线下体验或老字号"
                    className={`w-full px-5 py-2.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-red-500 focus:ring-offset-gray-800 hover:bg-gray-650' : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-red-500 focus:ring-offset-white hover:bg-gray-150'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <i className={`fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-400'}`}></i>
                </motion.div>
              )}
            </div>
            
            {/* 电脑端标签页导航 */}
            {!isMobile && (
              <div className="mb-6">
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2">
                  {[
                    { id: 'offline', name: '线下体验' },
                    { id: 'templates', name: '地域模板' },
                    { id: 'brands', name: '老字号联名' },
                    { id: 'historical', name: '历史场景' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      title={tab.name}
                      className={`px-6 py-3 rounded-full text-sm font-semibold text-left transition-all duration-300 whitespace-nowrap snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${activeTab === tab.id ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white shadow-sm'} focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 活动内容 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ErrorBoundary>
                {activeTab === 'historical' ? (
                  <TianjinHistoricalScene />
                ) : (
                  <TianjinCreativeActivities 
                    search={searchTerm} 
                    activeTab={activeTab as any} 
                  />
                )}
              </ErrorBoundary>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
