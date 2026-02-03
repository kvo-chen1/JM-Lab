import { useState, useEffect, useContext, useRef, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

import { toast } from 'sonner';
import { TianjinImage, TianjinButton } from './TianjinStyleComponents';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { tianjinActivityService, TianjinTemplate, TianjinOfflineExperience, TianjinTraditionalBrand } from '@/services/tianjinActivityService';
import { useEventService } from '@/hooks/useEventService';

interface TianjinCreativeActivitiesProps {
  search?: string;
  activeTab?: 'templates' | 'offline' | 'brands' | 'userEvents';
}

// 用户活动接口
interface UserEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'online' | 'offline';
  media: Array<{ url: string; type: string }>;
  status: string;
}

export default memo(function TianjinCreativeActivities({ search: propSearch = '', activeTab: propActiveTab }: TianjinCreativeActivitiesProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);
  // 使用 useState 管理活动标签状态
  const [activeTab, setActiveTab] = useState<'templates' | 'offline' | 'brands' | 'userEvents'>(propActiveTab || 'offline');
  
  // 使用事件服务
  const { getEvents } = useEventService();
  
  // 用户活动数据状态
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  
  // 数据状态
  const [templates, setTemplates] = useState<TianjinTemplate[]>([]);
  const [offlineExperiences, setOfflineExperiences] = useState<TianjinOfflineExperience[]>([]);
  const [brands, setBrands] = useState<TianjinTraditionalBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 当外部传入的 activeTab 变化时，更新内部状态
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab);
    }
  }, [propActiveTab]);

  const tabListRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [search, setSearch] = useState(propSearch);
  
  // 中文注释：地域模板详情弹层状态
  const [selectedTemplate, setSelectedTemplate] = useState<TianjinTemplate | null>(null);
  const openTemplateDetail = useCallback((t: TianjinTemplate) => setSelectedTemplate(t), []);
  const closeTemplateDetail = useCallback(() => setSelectedTemplate(null), []);
  // 中文注释：线下体验详情弹层状态
  const [selectedExperience, setSelectedExperience] = useState<TianjinOfflineExperience | null>(null);
  const openExperienceDetail = useCallback((e: TianjinOfflineExperience) => setSelectedExperience(e), []);
  const closeExperienceDetail = useCallback(() => setSelectedExperience(null), []);
  // 中文注释：老字号品牌详情弹层状态
  const [selectedBrand, setSelectedBrand] = useState<TianjinTraditionalBrand | null>(null);
  const openBrandDetail = useCallback((b: TianjinTraditionalBrand) => setSelectedBrand(b), []);
  const closeBrandDetail = useCallback(() => setSelectedBrand(null), []);
  
  // 当外部搜索属性变化时，更新内部搜索状态
  useEffect(() => {
    setSearch(propSearch);
  }, [propSearch]);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [templatesData, experiencesData, brandsData, userEventsData] = await Promise.all([
          tianjinActivityService.getTemplates(),
          tianjinActivityService.getOfflineExperiences(),
          tianjinActivityService.getTraditionalBrands(),
          getEvents({ status: 'published' })
        ]);
        setTemplates(templatesData);
        setOfflineExperiences(experiencesData);
        setBrands(brandsData);
        setUserEvents(userEventsData || []);
      } catch (error) {
        console.error('Failed to fetch tianjin activities:', error);
        toast.error('加载数据失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getEvents]);

  useEffect(() => {
    const updateTabScrollState = () => {
      const el = tabListRef.current;
      if (!el) return;
      setAtStart(el.scrollLeft <= 0);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
      setHasOverflow(el.scrollWidth > el.clientWidth + 1);
    };

    const el = tabListRef.current;
    if (el) {
      updateTabScrollState();
      el.addEventListener('scroll', updateTabScrollState);
    }
    const onResize = () => updateTabScrollState();
    window.addEventListener('resize', onResize);
    return () => {
      if (el) el.removeEventListener('scroll', updateTabScrollState);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabListRef.current;
    if (!el) return;
    const delta = Math.max(100, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeTab]);
  
  const handleApplyTemplate = useCallback((templateId: number) => {
    void templateId;
    toast.success('已应用模板到您的创作空间');
  }, []);
  
  const handleBookExperience = useCallback((experienceId: number) => {
    void experienceId;
    toast.success('预约成功！我们会尽快与您联系确认详情');
  }, []);
  
  const searchLower = typeof search === 'string' ? search.trim().toLowerCase() : '';
  
  const filteredTemplates = useMemo(() => {
    return searchLower
      ? templates.filter((t) => [t.name, t.description, t.category].some((s) => typeof s === 'string' && s.toLowerCase().includes(searchLower)))
      : templates;
  }, [searchLower, templates]);
  
  const filteredExperiences = useMemo(() => {
    return searchLower
      ? offlineExperiences.filter((e) => [e.name, e.description, e.location].some((s) => typeof s === 'string' && s.toLowerCase().includes(searchLower)))
      : offlineExperiences;
  }, [searchLower, offlineExperiences]);
  
  const filteredBrands = useMemo(() => {
    return searchLower
      ? brands.filter((b) => [b.name, b.description, b.establishedYear].some((s) => typeof s === 'string' && s.toLowerCase().includes(searchLower)))
      : brands;
  }, [searchLower, brands]);
  
  // 用户活动过滤
  const filteredUserEvents = useMemo(() => {
    return searchLower
      ? userEvents.filter((event) => [event.title, event.description, event.location].some((s) => typeof s === 'string' && s.toLowerCase().includes(searchLower)))
      : userEvents;
  }, [searchLower, userEvents]);
  
  // 移除分页，直接显示所有内容
  const pagedBrands = filteredBrands;
  const pagedTemplates = filteredTemplates;
  const pagedExperiences = filteredExperiences;
  const pagedUserEvents = filteredUserEvents;
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="flex space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-10 w-24 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`p-0 md:p-0 rounded-none ${isDark ? 'bg-transparent' : 'bg-transparent'} shadow-none flex-1 flex flex-col gap-6`}
    >
      {/* 左侧主内容区 */}
      <div className="w-full">
        {/* 标签页切换 - 仅在电脑端显示 */}
        <div className="relative mb-6 hidden sm:block">
        <div
          role="tablist"
          aria-label="津味共创活动类别"
          ref={tabListRef}
          className="flex space-x-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-0 pb-2"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') scrollTabs('right');
            if (e.key === 'ArrowLeft') scrollTabs('left');
          }}
        >
          {
            [
              { id: 'offline', name: '线下体验' },
              { id: 'userEvents', name: '用户活动' },
              { id: 'templates', name: '地域模板' },
              { id: 'brands', name: '老字号联名' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'templates' | 'offline' | 'brands' | 'userEvents')}
                role="tab"
                aria-selected={activeTab === tab.id}
                title={tab.name}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold text-left transition-all duration-300 whitespace-nowrap snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
                  activeTab === tab.id 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : isDark 
                      ? 'bg-gray-700/80 hover:bg-gray-700/100 hover:text-red-400' 
                      : 'bg-gray-100 hover:bg-gray-200 hover:text-red-600'
                } ${isDark ? 'focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800' : 'focus-visible:ring-offset-2 focus-visible:ring-offset-white'}`}
              >
                {tab.name}
              </button>
            ))
          }
        </div>
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 ${
            isDark ? 'bg-gradient-to-l from-gray-800/50 to-transparent' : 'bg-gradient-to-l from-white/80 to-transparent'
          } ${!hasOverflow || atEnd ? 'opacity-0' : 'opacity-100'} transition-all duration-300`}
        ></div>
        <button
          aria-label="向左滚动类别"
          onClick={() => scrollTabs('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow-md border ${isDark ? 'border-gray-600' : 'border-gray-200'} ${!hasOverflow || atStart ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          aria-label="向右滚动类别"
          onClick={() => scrollTabs('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow-md border ${isDark ? 'border-gray-600' : 'border-gray-200'} ${!hasOverflow || atEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      
      {/* 地域模板内容 */}
      {activeTab === 'templates' && (
        <>
          {/* 移动端专属修改：columns-2 (原columns-1) 实现更紧凑的瀑布流，gap-3 */}
          <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
            {pagedTemplates.map((template) => (
              <div
                key={template.id}
                className={`break-inside-avoid mb-3 md:mb-4 rounded-xl overflow-hidden shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}
              >
                <div className="relative group">
                  <TianjinImage 
                    src={template.thumbnail} 
                    alt={template.name} 
                    className="cursor-pointer"
                    ratio="auto"
                    rounded="none"
                    onClick={() => openTemplateDetail(template)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                {/* 移动端专属修改：p-2 (原p-4) 减少内边距 */}
                <div className={`p-2 md:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm md:text-lg leading-tight line-clamp-1">{template.name}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
                    <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-red-50 border-red-100 text-red-600'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                  <p className={`text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {template.description}
                  </p>
                  <div className="flex justify-between items-center text-[10px] md:text-xs mb-2 md:mb-4">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                      <i className="fas fa-fire-alt mr-1 text-red-500"></i>
                      {template.usageCount}
                    </span>
                  </div>
                  {/* 移动端专属修改：Flex布局水平排列按钮，更紧凑 */}
                  <div className="flex md:grid md:grid-cols-2 gap-1 md:gap-2">
                    <button 
                      onClick={() => handleApplyTemplate(template.id)}
                      className="flex-1 py-1.5 md:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                      应用
                    </button>
                    <button 
                      onClick={() => openTemplateDetail(template)}
                      className={`flex-1 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors border whitespace-nowrap ${
                        isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* 线下体验内容 */}
      {activeTab === 'offline' && (
          <>
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
              {pagedExperiences.map((experience) => (
              <div
                key={experience.id}
                className={`break-inside-avoid mb-3 md:mb-4 rounded-xl overflow-hidden shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}
              >
                <div className="relative">
                  <TianjinImage src={experience.image} alt={experience.name} ratio="auto" rounded="none" onClick={() => openExperienceDetail(experience)} loading="lazy" />
                  <div className="absolute top-1 right-1 md:top-2 md:right-2">
                    <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] md:text-xs font-bold text-red-600 shadow-sm border border-red-100">
                      {experience.price}
                    </span>
                  </div>
                  {experience.rating >= 4.8 && (
                    <div className="absolute top-1 left-1 md:top-2 md:left-2">
                      <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-yellow-400 text-yellow-900 rounded-md text-[10px] md:text-xs font-bold shadow-sm flex items-center gap-1">
                        <i className="fas fa-fire"></i>
                        <span className="hidden md:inline">高分</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-2 md:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-1 md:mb-2">
                    <h4 className="font-bold text-xs md:text-lg leading-tight line-clamp-2">{experience.name}</h4>
                  </div>
                  <div className="flex items-center mb-1.5 md:mb-3 text-yellow-500 text-[10px] md:text-sm">
                    {/* 移动端只显示一颗星+分数，桌面端显示5颗星 */}
                    <div className="hidden md:flex">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`fas fa-star ${i < Math.floor(experience.rating) ? '' : 'text-gray-300'}`}></i>
                      ))}
                    </div>
                    <div className="md:hidden flex items-center">
                       <i className="fas fa-star text-xs mr-0.5"></i>
                    </div>
                    <span className={`ml-0.5 md:ml-2 text-[10px] md:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {experience.rating}
                    </span>
                  </div>
                  <p className={`text-[10px] md:text-sm mb-2 md:mb-4 line-clamp-2 leading-snug ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {experience.description}
                  </p>
                  
                  <div className={`hidden md:block mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} space-y-2`}>
                    <div className="flex items-start text-xs">
                      <i className="fas fa-map-marker-alt mt-0.5 mr-2 text-red-500 w-3"></i>
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-1`}>{experience.location}</span>
                    </div>
                    <div className="flex items-center text-xs justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-users mr-2 text-blue-500 w-3"></i>
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>剩余: <span className="font-bold text-red-500">{experience.availableSlots}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* 移动端专属修改：Flex布局水平排列按钮，更紧凑 */}
                  <div className="flex md:grid md:grid-cols-2 gap-1 md:gap-2">
                    <button 
                      onClick={() => handleBookExperience(experience.id)}
                      className="flex-1 py-1.5 md:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                      预约
                    </button>
                    <button 
                      onClick={() => openExperienceDetail(experience)}
                      className={`flex-1 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors border whitespace-nowrap ${
                        isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* 老字号联名内容 */}
      {activeTab === 'brands' && (
          <>
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
              {pagedBrands.map((brand) => (
              <div
                key={brand.id}
                className={`break-inside-avoid mb-3 md:mb-4 p-3 md:p-5 rounded-xl shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} group relative overflow-hidden`}
              >
                {/* 装饰背景图案 */}
                <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full -mr-6 -mt-6 md:-mr-8 md:-mt-8 pointer-events-none"></div>
                
                <div className="flex flex-col items-center mb-3 relative z-10">
                  <div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden p-2 md:p-2 mb-3 md:mb-4 flex-shrink-0 flex items-center justify-center border transition-colors ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'
                    } shadow-sm group-hover:border-red-200`}
                  >
                    <div className="w-full h-full">
                      <TianjinImage src={brand.logo} alt={brand.name} className="w-full h-full" ratio="square" fit="contain" rounded="lg" loading="lazy" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-sm md:text-lg mb-3 md:mb-4">{brand.name}</h4>
                  </div>
                </div>
                
                {/* 移动端专属修改：Flex布局水平排列按钮，更紧凑 */}
                <div className="flex md:grid md:grid-cols-2 gap-2 md:gap-3">
                  <button 
                    onClick={() => navigate(`/create?from=tianjin&prompt=${encodeURIComponent(brand.name + ' 联名 工具')}`)}
                    className={`flex-1 flex items-center justify-center py-2 md:py-2.5 rounded-lg text-sm md:text-sm font-semibold transition-all duration-300 bg-red-500 hover:bg-red-600 text-white shadow-sm whitespace-nowrap`}
                  >
                    <i className="fas fa-tools mr-2"></i>
                    工具
                  </button>
                  <button 
                    onClick={() => openBrandDetail(brand)}
                    className={`flex-1 flex items-center justify-center py-2 md:py-2.5 rounded-lg text-sm md:text-sm font-semibold transition-colors border whitespace-nowrap ${
                      isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* 用户活动内容 */}
      {activeTab === 'userEvents' && (
          <>
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
              {pagedUserEvents.length > 0 ? (
                pagedUserEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`break-inside-avoid mb-3 md:mb-4 rounded-xl overflow-hidden shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                  >
                    <div className="relative group">
                      <TianjinImage 
                        src={event.media?.[0]?.url || 'https://images.pexels.com/photos/2672064/pexels-photo-2672064.jpeg?auto=compress&cs=tinysrgb&w=800'}
                        alt={event.title}
                        className="cursor-pointer"
                        ratio="auto"
                        rounded="none"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    <div className={`p-2 md:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm md:text-lg leading-tight line-clamp-1">{event.title}</h4>
                      </div>
                      <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
                        <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-blue-50 border-blue-100 text-blue-600'
                        }`}>
                          {event.type === 'online' ? '线上活动' : '线下活动'}
                        </span>
                        <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-green-50 border-green-100 text-green-600'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className={`text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {event.description}
                      </p>
                      <div className="flex items-center text-[10px] md:text-xs mb-2 md:mb-4">
                        <i className="fas fa-map-marker-alt mr-1 text-red-500"></i>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-1`}>{event.location}</span>
                      </div>
                      <div className="flex items-center text-[10px] md:text-xs mb-2 md:mb-4">
                        <i className="fas fa-calendar-alt mr-1 text-blue-500"></i>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(event.startTime).toLocaleDateString('zh-CN')} - {new Date(event.endTime).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div className="flex md:grid md:grid-cols-2 gap-1 md:gap-2">
                        <button 
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="flex-1 py-1.5 md:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                        >
                          查看详情
                        </button>
                        <button 
                          onClick={() => navigate(`/events/${event.id}/edit`)}
                          className={`flex-1 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors border whitespace-nowrap ${
                            isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`w-full p-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fas fa-calendar-alt text-4xl mb-3"></i>
                  <p>暂无用户活动</p>
                  <p className="text-sm mt-2">发布活动后，将在这里显示</p>
                </div>
              )}
            </div>
          </>
      )}
      </div>
      
      {/* 右侧补充内容区 - 改为横向排列 */}
      <div className="w-full flex flex-col md:flex-row gap-4">
        {/* 热门话题 */}
        <div className={`w-full md:w-1/2 p-3 rounded-xl shadow-md ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
          <h3 className="font-bold text-base mb-3">热门话题</h3>
          <div className="space-y-2">
            {
              [
                { tag: '#国潮设计', count: 234 },
                { tag: '#天津老字号', count: 189 },
                { tag: '#文创产品', count: 156 },
                { tag: '#津味插画', count: 123 },
                { tag: '#非遗传承', count: 98 }
              ].map((topic, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${isDark ? 'bg-red-500' : 'bg-red-400'} mr-2`}></span>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{topic.tag}</span>
                  </div>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{topic.count}人参与</span>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* 近期活动 */}
        <div className={`w-full md:w-1/2 p-3 rounded-xl shadow-md ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
          <h3 className="font-bold text-base mb-3">近期活动</h3>
          <div className="space-y-3">
            {userEvents.length > 0 ? (
              userEvents.slice(0, 5).map((event, index) => (
                <div key={index} className={`flex justify-between items-center border-b pb-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center flex-1 min-w-0">
                    <span className={`inline-block w-2 h-2 rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-400'} mr-2 flex-shrink-0`}></span>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} truncate`}>{event.title}</span>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} whitespace-nowrap ml-2`}>
                    {new Date(event.startTime).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              ))
            ) : (
              <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                暂无近期活动
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 模板详情弹层 */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeTemplateDetail}></div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
              <button
                onClick={closeTemplateDetail}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedTemplate.thumbnail}
                  alt={selectedTemplate.name}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm mb-2">{selectedTemplate.category}</span>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedTemplate.description}</p>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-fire-alt mr-2 text-red-500"></i>
                    <span>{selectedTemplate.usageCount}次使用</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleApplyTemplate(selectedTemplate.id);
                      closeTemplateDetail();
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    立即应用
                  </button>
                  <button
                    onClick={closeTemplateDetail}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* 线下体验详情弹层 */}
      {selectedExperience && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeExperienceDetail}></div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedExperience.name}</h2>
              <button
                onClick={closeExperienceDetail}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedExperience.image}
                  alt={selectedExperience.name}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-500 mr-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`fas fa-star ${i < Math.floor(selectedExperience.rating) ? '' : 'text-gray-300'}`}></i>
                      ))}
                    </span>
                    <span className="text-sm text-gray-500">{selectedExperience.rating} ({selectedExperience.reviewCount}条评价)</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedExperience.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <i className="fas fa-map-marker-alt mr-2 text-red-500"></i>
                      <span>{selectedExperience.location}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-tag mr-2 text-green-500"></i>
                      <span>{selectedExperience.price}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-users mr-2 text-blue-500"></i>
                      <span>剩余名额: <span className="font-bold text-red-500">{selectedExperience.availableSlots}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleBookExperience(selectedExperience.id);
                      closeExperienceDetail();
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    立即预约
                  </button>
                  <button
                    onClick={closeExperienceDetail}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* 老字号品牌详情弹层 */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeBrandDetail}></div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedBrand.name}</h2>
              <button
                onClick={closeBrandDetail}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <img
                      src={selectedBrand.logo}
                      alt={selectedBrand.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">创立于 {selectedBrand.establishedYear} 年</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">定制工具</p>
                      <p className="text-xl font-bold">{selectedBrand.collaborationTools}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">热度指数</p>
                      <p className="text-xl font-bold">{selectedBrand.popularity}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedBrand.description}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigate(`/create?from=tianjin&prompt=${encodeURIComponent(selectedBrand.name + ' 联名 工具')}`);
                      closeBrandDetail();
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    查看联名工具
                  </button>
                  <button
                    onClick={closeBrandDetail}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});
