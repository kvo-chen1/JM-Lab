import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { 
  Calendar, 
  MapPin, 
  Tag, 
  Filter,
  RotateCcw,
  Plus,
  ChevronRight,
  Sparkles,
  Users,
  Trophy,
  Lightbulb,
  Palette,
  Building2
} from 'lucide-react';
import { EventStatus, EventCategory, EventType, FilterState } from '@/hooks/useEventFilters';

interface LeftSidebarProps {
  filters: FilterState;
  setStatus: (status: EventStatus) => void;
  setCategory: (category: EventCategory) => void;
  setType: (type: EventType) => void;
  toggleTag: (tag: string) => void;
  resetFilters: () => void;
  activeFiltersCount: number;
  onCreateEvent: () => void;
  popularTags: string[];
}

const categoryConfig: { id: EventCategory; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'all', label: '全部活动', icon: Sparkles, color: 'text-purple-500' },
  { id: 'theme', label: '主题活动', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'collaboration', label: '协作活动', icon: Users, color: 'text-blue-500' },
  { id: 'competition', label: '竞赛活动', icon: Trophy, color: 'text-rose-500' },
  { id: 'workshop', label: '工作坊', icon: Palette, color: 'text-emerald-500' },
  { id: 'exhibition', label: '文化展览', icon: Building2, color: 'text-indigo-500' },
];

const statusConfig: { id: EventStatus; label: string; color: string; bgColor: string }[] = [
  { id: 'all', label: '全部', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { id: 'upcoming', label: '即将开始', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { id: 'ongoing', label: '进行中', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { id: 'completed', label: '已结束', color: 'text-gray-500', bgColor: 'bg-gray-100' },
];

const typeConfig: { id: EventType; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: '全部类型', icon: Filter },
  { id: 'online', label: '线上活动', icon: MapPin },
  { id: 'offline', label: '线下活动', icon: MapPin },
];

export default function LeftSidebar({
  filters,
  setStatus,
  setCategory,
  setType,
  toggleTag,
  resetFilters,
  activeFiltersCount,
  onCreateEvent,
  popularTags,
}: LeftSidebarProps) {
  const { isDark } = useTheme();

  return (
    <aside className={`w-full lg:w-[280px] flex-shrink-0 space-y-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      {/* 创建活动按钮 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onCreateEvent}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-500/25 transition-all"
      >
        <Plus className="w-5 h-5" />
        创建活动
      </motion.button>

      {/* 活动分类 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          活动分类
        </h3>
        <nav className="space-y-1">
          {categoryConfig.map((category) => {
            const Icon = category.icon;
            const isActive = filters.category === category.id;
            return (
              <motion.button
                key={category.id}
                whileHover={{ x: 4 }}
                onClick={() => setCategory(category.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? isDark 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-red-50 text-red-600 border border-red-100'
                    : isDark
                      ? 'hover:bg-gray-700/50 text-gray-300'
                      : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : category.color}`} />
                <span className="font-medium">{category.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* 状态筛选 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          活动状态
        </h3>
        <div className="flex flex-wrap gap-2">
          {statusConfig.map((status) => {
            const isActive = filters.status === status.id;
            return (
              <button
                key={status.id}
                onClick={() => setStatus(status.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                    : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : `${status.bgColor} ${status.color} hover:shadow-md`
                }`}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 活动类型 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-500" />
          活动形式
        </h3>
        <div className="space-y-2">
          {typeConfig.map((type) => {
            const Icon = type.icon;
            const isActive = filters.type === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setType(type.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : isDark
                      ? 'hover:bg-gray-700/50 text-gray-300'
                      : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{type.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="typeIndicator"
                    className="w-2 h-2 rounded-full bg-emerald-500 ml-auto"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 热门标签 */}
      {popularTags.length > 0 && (
        <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-500" />
            热门标签
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => {
              const isSelected = filters.tags.includes(tag);
              return (
                <motion.button
                  key={tag}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-500 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* 重置筛选 */}
      {activeFiltersCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={resetFilters}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
            isDark
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          重置筛选 ({activeFiltersCount})
        </motion.button>
      )}
    </aside>
  );
}
