import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import GradientHero from '@/components/GradientHero';
import eventCalendarService, { CulturalEvent } from '@/services/eventCalendarService';
import TianjinCreativeActivities from '@/components/TianjinCreativeActivities';
import ErrorBoundary from '@/components/ErrorBoundary';

// 主题类型定义
type ThemeType = 'light' | 'dark';

export default function Tianjin() {
  const { isDark, theme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState<CulturalEvent[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'offline' | 'brands'>('offline');

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
    // 使用专门针对"近期津城热点"的定制数据，而非通用的活动数据
    const tianjinHotspots: CulturalEvent[] = [
      {
        id: 'hotspot-001',
        title: '津湾广场灯光秀',
        description: '海河畔的璀璨明珠，光影交织的视觉盛宴，展现天津现代与历史的交融之美。',
        type: 'theme',
        status: 'ongoing',
        startDate: '每周五-周日',
        endDate: '长期',
        organizer: '天津市文旅局',
        // 替换为Pexels高清实景图：城市夜景（更稳定的图源）
        image: 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: ['灯光秀', '夜游', '打卡'],
        culturalElements: ['海河文化', '现代光影'],
        participantCount: 9999,
        hasPrize: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'hotspot-002',
        title: '五大道海棠节',
        description: '漫步万国建筑博览群，共赴一场春日花约，感受"万国建筑博览会"的独特魅力。',
        type: 'theme',
        status: 'upcoming',
        startDate: '2025-04-01',
        endDate: '2025-04-10',
        organizer: '和平区旅游局',
        // 替换为Pexels高清实景图：春日花卉（更稳定的图源）
        image: 'https://images.pexels.com/photos/2058498/pexels-photo-2058498.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: ['赏花', '摄影', '历史街区'],
        culturalElements: ['洋楼文化', '海棠花'],
        participantCount: 5000,
        hasPrize: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'hotspot-003',
        title: '西北角早点美食节',
        description: '碳水快乐星球，寻找最地道的天津老味，体验"津门第一早"的烟火气。',
        type: 'theme',
        status: 'ongoing',
        startDate: '长期开放',
        endDate: '长期',
        organizer: '红桥区商务局',
        // 替换为Pexels高清实景图：中式面点（更稳定的图源）
        image: 'https://images.pexels.com/photos/2291599/pexels-photo-2291599.jpeg?auto=compress&cs=tinysrgb&w=800',
        tags: ['美食', '早点', '老味'],
        culturalElements: ['津味美食', '市井文化'],
        participantCount: 8888,
        hasPrize: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    setUpcomingEvents(tianjinHotspots);
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>

      
      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 天津特色专区渐变英雄区 */}
        <GradientHero 
          title="天津特色专区"
          subtitle="探索天津特色文化、老字号与非遗传承"
          theme="heritage"
          stats={[
            { label: '津门老字号', value: '精选' },
            { label: '天津元素', value: '资产' },
            { label: '非遗传承', value: '导览' },
            { label: '津味应用', value: '共创' }
          ]}
          pattern={true}
          size="lg"
          // 中文注释：使用Pexels高清"红灯笼夜景"作为背景图，替代原AI生成图片，营造沉浸式氛围
          backgroundImage="https://images.pexels.com/photos/6688844/pexels-photo-6688844.jpeg?auto=compress&cs=tinysrgb&w=1920"
          actions={[
            {
              label: '探索老字号地图',
              onClick: () => navigate('/tianjin/map'),
              primary: true
            }
          ]}
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
                    { id: 'brands', name: '老字号联名' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'templates' | 'offline' | 'brands')}
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
        {!isMobile && (
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
            
            {/* 天津地图入口 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 hidden md:block"
            >
              <div className={`p-6 rounded-2xl shadow-lg ${isDark ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">探索天津老字号历史地图</h2>
                    <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>通过交互式地图了解天津老字号的历史分布与文化传承</p>
                  </div>
                  <button
                    onClick={() => navigate('/tianjin/map')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} flex items-center gap-2`}
                  >
                    <i className="fas fa-map-marked-alt"></i>
                    查看天津地图
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 活动内容 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ErrorBoundary>
                <TianjinCreativeActivities search={searchTerm} activeTab={activeTab} />
              </ErrorBoundary>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}