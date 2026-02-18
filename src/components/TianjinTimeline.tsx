import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Clock, MapPin, Crown } from 'lucide-react';

interface TimelineEvent {
  id: number;
  year: string;
  title: string;
  description: string;
  category: '政治' | '文化' | '建筑' | '商业';
  icon: string;
  color: string;
  details?: string;
}

const timelineEvents: TimelineEvent[] = [
  {
    id: 1,
    year: '1404',
    title: '天津设卫',
    description: '明永乐二年，天津正式设卫，成为中国古代唯一有确切建城时间记录的城市',
    category: '政治',
    icon: '🏰',
    color: '#8B4513',
    details: '明成祖朱棣赐名"天津"，意为"天子经过的渡口"，天津卫、天津左卫、天津右卫三卫并立'
  },
  {
    id: 2,
    year: '1650',
    title: '漕运兴盛',
    description: '天津成为南北漕运的重要枢纽，"九河下梢"的地位确立',
    category: '商业',
    icon: '⛵',
    color: '#1E5F8E',
    details: '每年经天津转运的漕粮达400万石，天津成为北方最大的商品集散地'
  },
  {
    id: 3,
    year: '1860',
    title: '开埠通商',
    description: '天津被迫开埠，九国租界设立，开启近代化进程',
    category: '政治',
    icon: '🏛️',
    color: '#A0522D',
    details: '英、法、美、德、日、俄、比、意、奥九国在天津设立租界，形成独特的城市风貌'
  },
  {
    id: 4,
    year: '1888',
    title: '天津站建成',
    description: '天津火车站建成，成为中国最早的火车站之一',
    category: '建筑',
    icon: '🚂',
    color: '#4A90B8',
    details: '津沽铁路通车，天津成为中国北方铁路交通的枢纽'
  },
  {
    id: 5,
    year: '1858',
    title: '狗不理创立',
    description: '高贵友创立狗不理包子铺，天津"三绝"之首诞生',
    category: '文化',
    icon: '🥟',
    color: '#8B4513',
    details: '狗不理包子以其选料精细、制作讲究而闻名，成为天津饮食文化的代表'
  },
  {
    id: 6,
    year: '1900s',
    title: '五大道建设',
    description: '五大道地区开始建设，形成独特的近代建筑群',
    category: '建筑',
    icon: '🏘️',
    color: '#A0522D',
    details: '成都道、重庆道、常德道、大理道、睦南道五条道路及周边地区，形成2000多栋小洋楼'
  },
  {
    id: 7,
    year: '1927',
    title: '十八街麻花',
    description: '桂发祥十八街麻花创立，天津"三绝"之一',
    category: '文化',
    icon: '🥨',
    color: '#C68E17',
    details: '范贵才、范贵林兄弟在南市十八街开设麻花铺，以香、甜、酥、脆著称'
  },
  {
    id: 8,
    year: '1949',
    title: '天津解放',
    description: '天津解放，成为新中国的重要工业基地',
    category: '政治',
    icon: '🎊',
    color: '#C21807',
    details: '1949年1月15日天津解放，随后成为北方重要的工业中心和港口城市'
  },
  {
    id: 9,
    year: '1991',
    title: '天塔建成',
    description: '天津广播电视塔建成，成为城市新地标',
    category: '建筑',
    icon: '🗼',
    color: '#4A90B8',
    details: '天塔高415.2米，是当时亚洲最高的塔，成为天津现代化建设的象征'
  },
  {
    id: 10,
    year: '2008',
    title: '天津之眼',
    description: '天津之眼摩天轮建成，成为世界上唯一建在桥上的摩天轮',
    category: '建筑',
    icon: '🎡',
    color: '#C0C5CE',
    details: '天津之眼高120米，建在永乐桥上，成为天津的新地标和旅游景点'
  },
  {
    id: 11,
    year: '2015',
    title: '自贸区设立',
    description: '中国（天津）自由贸易试验区正式挂牌',
    category: '商业',
    icon: '💼',
    color: '#D4A84B',
    details: '天津自贸区成为中国北方首个自贸区，推动天津进一步开放发展'
  },
  {
    id: 12,
    year: '2024',
    title: '津门雅韵',
    description: '天津城市特色主题诞生，数字化传承城市文化',
    category: '文化',
    icon: '💻',
    color: '#1E5F8E',
    details: '以数字化方式展现天津600年历史，让更多人了解和喜爱这座城市'
  }
];

const categoryColors = {
  '政治': { bg: '#FFEBEE', text: '#C21807', border: '#EF5350' },
  '文化': { bg: '#FFF3E0', text: '#E65100', border: '#FF9800' },
  '建筑': { bg: '#E3F2FD', text: '#1565C0', border: '#2196F3' },
  '商业': { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' }
};

export function TianjinTimeline() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(timelineEvents.length / itemsPerPage);

  const currentEvents = timelineEvents.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handlePrev = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="space-y-6">
      {/* 时间轴 */}
      <div className="relative">
        {/* 中心线 */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#1E5F8E] via-[#A0522D] to-[#D4A84B] rounded-full opacity-30" />

        {/* 事件列表 */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {currentEvents.map((event, index) => {
              const isLeft = index % 2 === 0;
              const catColors = categoryColors[event.category];

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'} gap-4`}
                >
                  {/* 内容卡片 */}
                  <div 
                    className={`flex-1 ${isLeft ? 'text-right' : 'text-left'}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div 
                      className="inline-block p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
                      style={{ 
                        backgroundColor: catColors.bg + '60',
                        border: `2px solid ${catColors.border}40`
                      }}
                    >
                      {/* 年份 */}
                      <div 
                        className="text-2xl font-bold mb-1"
                        style={{ color: event.color }}
                      >
                        {event.year}
                      </div>
                      
                      {/* 标题 */}
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {event.title}
                      </h4>
                      
                      {/* 描述 */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {event.description}
                      </p>

                      {/* 分类标签 */}
                      <span 
                        className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: catColors.bg,
                          color: catColors.text
                        }}
                      >
                        {event.category}
                      </span>
                    </div>
                  </div>

                  {/* 中心点 */}
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg cursor-pointer"
                      style={{ 
                        backgroundColor: event.color,
                        boxShadow: `0 0 20px ${event.color}50`
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.icon}
                    </motion.div>
                  </div>

                  {/* 空白占位 */}
                  <div className="flex-1" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 分页控制 */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className={`p-2 rounded-full transition-all duration-300 ${
            currentPage === 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-[#1E5F8E] hover:bg-[#1E5F8E]/10'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex gap-2">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentPage
                  ? 'bg-[#1E5F8E] w-8'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className={`p-2 rounded-full transition-all duration-300 ${
            currentPage === totalPages - 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-[#1E5F8E] hover:bg-[#1E5F8E]/10'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
              style={{ borderTop: `4px solid ${selectedEvent.color}` }}
            >
              {/* 头部 */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ 
                      backgroundColor: selectedEvent.color + '20',
                      border: `2px solid ${selectedEvent.color}40`
                    }}
                  >
                    {selectedEvent.icon}
                  </div>
                  <div className="flex-1">
                    <div 
                      className="text-3xl font-bold mb-1"
                      style={{ color: selectedEvent.color }}
                    >
                      {selectedEvent.year}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedEvent.title}
                    </h3>
                    <span 
                      className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: categoryColors[selectedEvent.category].bg,
                        color: categoryColors[selectedEvent.category].text
                      }}
                    >
                      {selectedEvent.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* 内容 */}
              <div className="px-6 pb-6 space-y-4">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedEvent.description}
                </p>

                {selectedEvent.details && (
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <Crown className="w-4 h-4" style={{ color: selectedEvent.color }} />
                      详细资料
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEvent.details}
                    </p>
                  </div>
                )}

                {/* 时间信息 */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>距今 {2024 - parseInt(selectedEvent.year)} 年</span>
                  </div>
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-2xl text-gray-400">×</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 统计信息 */}
      <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-gradient-to-r from-[#1E5F8E]/5 via-[#A0522D]/5 to-[#D4A84B]/5">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#1E5F8E]">620</div>
          <div className="text-xs text-gray-600">建城历史(年)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#A0522D]">12</div>
          <div className="text-xs text-gray-600">历史事件</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#D4A84B]">4</div>
          <div className="text-xs text-gray-600">历史阶段</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#4A9B5E]">∞</div>
          <div className="text-xs text-gray-600">文化传承</div>
        </div>
      </div>
    </div>
  );
}

export default TianjinTimeline;
