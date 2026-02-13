import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, Sparkles } from 'lucide-react';

interface Festival {
  id: number;
  name: string;
  date: string;
  month: number;
  day: number;
  type: '传统' | '现代' | '文化' | '美食';
  description: string;
  activities: string[];
  location?: string;
  color: string;
  icon: string;
}

const festivals: Festival[] = [
  {
    id: 1,
    name: '天津庙会',
    date: '农历正月初一至十五',
    month: 1,
    day: 1,
    type: '传统',
    description: '天津传统民俗活动，包括踩高跷、舞狮、杂技等表演',
    activities: ['踩高跷', '舞狮表演', '杂技', '民间艺术展示', '传统小吃'],
    location: '古文化街、天后宫',
    color: '#C21807',
    icon: '🏮'
  },
  {
    id: 2,
    name: '杨柳青年画节',
    date: '农历腊月二十三至正月十五',
    month: 1,
    day: 23,
    type: '文化',
    description: '展示杨柳青年画制作技艺，传承非物质文化遗产',
    activities: ['年画制作体验', '年画展览', '非遗展示', '民俗表演'],
    location: '杨柳青镇',
    color: '#228B22',
    icon: '🖼️'
  },
  {
    id: 3,
    name: '天津国际马拉松',
    date: '每年4月中旬',
    month: 4,
    day: 15,
    type: '现代',
    description: '天津规模最大的体育赛事，路线经过多个地标建筑',
    activities: ['全程马拉松', '半程马拉松', '迷你马拉松', '健身跑'],
    location: '天津市区',
    color: '#1E5F8E',
    icon: '🏃'
  },
  {
    id: 4,
    name: '天津五大道文化旅游节',
    date: '每年5月',
    month: 5,
    day: 1,
    type: '文化',
    description: '展示五大道历史文化，包括建筑导览、艺术展览等活动',
    activities: ['建筑导览', '艺术展览', '音乐会', '文化讲座', '摄影比赛'],
    location: '五大道地区',
    color: '#A0522D',
    icon: '🏛️'
  },
  {
    id: 5,
    name: '端午节海河龙舟赛',
    date: '农历五月初五',
    month: 6,
    day: 5,
    type: '传统',
    description: '在海河上举行的传统龙舟比赛，场面壮观',
    activities: ['龙舟比赛', '水上表演', '民俗展示', '美食品尝'],
    location: '海河',
    color: '#4A9B5E',
    icon: '🐲'
  },
  {
    id: 6,
    name: '天津夏季达沃斯论坛',
    date: '每年6-7月',
    month: 6,
    day: 15,
    type: '现代',
    description: '世界经济论坛新领军者年会，汇聚全球精英',
    activities: ['论坛会议', '展览展示', '文化交流', '商务洽谈'],
    location: '梅江会展中心',
    color: '#D4A84B',
    icon: '🌐'
  },
  {
    id: 7,
    name: '天津啤酒节',
    date: '每年7-8月',
    month: 7,
    day: 15,
    type: '美食',
    description: '天津夏季最大的户外美食节，汇集各地美食',
    activities: ['啤酒品鉴', '美食摊位', '音乐演出', '互动游戏'],
    location: '奥林匹克中心',
    color: '#E8C878',
    icon: '🍺'
  },
  {
    id: 8,
    name: '天津相声节',
    date: '每年9月',
    month: 9,
    day: 1,
    type: '文化',
    description: '纪念天津相声艺术，举办系列演出和活动',
    activities: ['相声演出', '曲艺表演', '大师讲座', '新人展演'],
    location: '各剧场',
    color: '#8B4513',
    icon: '🎭'
  },
  {
    id: 9,
    name: '中秋节海河赏月',
    date: '农历八月十五',
    month: 9,
    day: 15,
    type: '传统',
    description: '天津人在海河边赏月、吃月饼的传统习俗',
    activities: ['赏月活动', '月饼品尝', '文艺演出', '灯光秀'],
    location: '海河沿岸',
    color: '#C0C5CE',
    icon: '🌕'
  },
  {
    id: 10,
    name: '天津国际车展',
    date: '每年9-10月',
    month: 10,
    day: 1,
    type: '现代',
    description: '北方地区重要的汽车展览，展示最新车型和技术',
    activities: ['新车发布', '试乘试驾', '技术展示', '购车优惠'],
    location: '梅江会展中心',
    color: '#4A90B8',
    icon: '🚗'
  },
  {
    id: 11,
    name: '天津美食节',
    date: '每年10月',
    month: 10,
    day: 15,
    type: '美食',
    description: '展示天津特色美食，包括"三绝"和各类小吃',
    activities: ['美食品尝', '厨艺展示', '美食比赛', '文化讲座'],
    location: '南市食品街',
    color: '#C68E17',
    icon: '🍜'
  },
  {
    id: 12,
    name: '天津妈祖文化旅游节',
    date: '农历三月二十三',
    month: 4,
    day: 23,
    type: '文化',
    description: '纪念妈祖诞辰，举办盛大的祭祀和文化活动',
    activities: ['祭祀仪式', '巡游表演', '文化展览', '民俗活动'],
    location: '天后宫',
    color: '#87CEEB',
    icon: '🙏'
  }
];

const typeColors = {
  '传统': { bg: '#FFEBEE', text: '#C21807', border: '#EF5350' },
  '现代': { bg: '#E3F2FD', text: '#1565C0', border: '#2196F3' },
  '文化': { bg: '#FFF3E0', text: '#E65100', border: '#FF9800' },
  '美食': { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' }
};

const months = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
];

export function TianjinFestivalCalendar() {
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const currentMonthFestivals = festivals.filter(f => f.month === currentMonth + 1);
  const upcomingFestivals = festivals
    .filter(f => {
      const festivalDate = new Date(2024, f.month - 1, f.day);
      const today = new Date();
      return festivalDate >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(2024, a.month - 1, a.day);
      const dateB = new Date(2024, b.month - 1, b.day);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 月份选择 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(prev => (prev === 0 ? 11 : prev - 1))}
          className="p-2 rounded-full hover:bg-[#1E5F8E]/10 text-[#1E5F8E] transition-colors"
        >
          ←
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {months[currentMonth]}
        </h3>
        <button
          onClick={() => setCurrentMonth(prev => (prev === 11 ? 0 : prev + 1))}
          className="p-2 rounded-full hover:bg-[#1E5F8E]/10 text-[#1E5F8E] transition-colors"
        >
          →
        </button>
      </div>

      {/* 当月节日 */}
      <div className="space-y-3">
        {currentMonthFestivals.length > 0 ? (
          currentMonthFestivals.map((festival, index) => {
            const catColors = typeColors[festival.type];
            return (
              <motion.div
                key={festival.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedFestival(festival)}
                className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg"
                style={{ 
                  backgroundColor: catColors.bg + '40',
                  border: `2px solid ${catColors.border}30`
                }}
              >
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: festival.color + '20' }}
                >
                  {festival.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {festival.name}
                    </h4>
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: catColors.bg,
                        color: catColors.text
                      }}
                    >
                      {festival.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {festival.date}
                  </p>
                </div>
                <div className="text-right">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: festival.color }}
                  >
                    {festival.day}
                  </div>
                  <div className="text-xs text-gray-500">日</div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>本月暂无特色节日</p>
          </div>
        )}
      </div>

      {/* 即将到来的节日 */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#1E5F8E]/5 via-[#A0522D]/5 to-[#D4A84B]/5">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4A84B]" />
          即将到来的节日
        </h4>
        <div className="space-y-2">
          {upcomingFestivals.map((festival) => (
            <div 
              key={festival.id}
              onClick={() => setSelectedFestival(festival)}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">{festival.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {festival.name}
                </div>
                <div className="text-xs text-gray-500">
                  {festival.month}月{festival.day}日
                </div>
              </div>
              <span 
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ 
                  backgroundColor: typeColors[festival.type].bg,
                  color: typeColors[festival.type].text
                }}
              >
                {festival.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedFestival && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFestival(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
              style={{ borderTop: `4px solid ${selectedFestival.color}` }}
            >
              {/* 头部 */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={() => setSelectedFestival(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                    style={{ 
                      backgroundColor: selectedFestival.color + '20',
                      border: `2px solid ${selectedFestival.color}40`
                    }}
                  >
                    {selectedFestival.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedFestival.name}
                    </h3>
                    <span 
                      className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: typeColors[selectedFestival.type].bg,
                        color: typeColors[selectedFestival.type].text
                      }}
                    >
                      {selectedFestival.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* 内容 */}
              <div className="px-6 pb-6 space-y-4">
                {/* 日期 */}
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" style={{ color: selectedFestival.color }} />
                  <span>{selectedFestival.date}</span>
                </div>

                {/* 地点 */}
                {selectedFestival.location && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" style={{ color: selectedFestival.color }} />
                    <span>{selectedFestival.location}</span>
                  </div>
                )}

                {/* 描述 */}
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedFestival.description}
                </p>

                {/* 活动 */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: selectedFestival.color }} />
                    主要活动
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFestival.activities.map((activity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ 
                          backgroundColor: selectedFestival.color + '20',
                          color: selectedFestival.color
                        }}
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {Object.entries(typeColors).map(([type, colors]) => {
          const count = festivals.filter(f => f.type === type).length;
          return (
            <div key={type} className="p-2 rounded-lg" style={{ backgroundColor: colors.bg + '40' }}>
              <div className="text-lg font-bold" style={{ color: colors.text }}>{count}</div>
              <div className="text-xs text-gray-600">{type}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TianjinFestivalCalendar;
