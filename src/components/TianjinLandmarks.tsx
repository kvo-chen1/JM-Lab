import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Landmark {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  color: string;
  icon: string;
  year: string;
  style: string;
}

const landmarks: Landmark[] = [
  {
    id: 'tianjineye',
    name: '天津之眼',
    nameEn: 'Tianjin Eye',
    description: '世界上唯一建在桥上的摩天轮，现代天津的标志性建筑',
    color: '#C0C5CE',
    icon: '🎡',
    year: '2008',
    style: '现代建筑'
  },
  {
    id: 'wudadao',
    name: '五大道',
    nameEn: 'Five Great Avenues',
    description: '拥有2000多栋小洋楼的历史文化街区，体现近代天津的多元文化',
    color: '#A0522D',
    icon: '🏛️',
    year: '1900s',
    style: '近代建筑'
  },
  {
    id: 'tianjinzhan',
    name: '天津站',
    nameEn: 'Tianjin Railway Station',
    description: '具有百年历史的交通枢纽，见证天津的城市发展',
    color: '#1E5F8E',
    icon: '🚂',
    year: '1888',
    style: '欧式建筑'
  },
  {
    id: 'tianta',
    name: '天塔',
    nameEn: 'Tianjin Radio & TV Tower',
    description: '天津广播电视塔，城市天际线的重要组成部分',
    color: '#4A90B8',
    icon: '🗼',
    year: '1991',
    style: '现代建筑'
  },
  {
    id: 'gulou',
    name: '天津鼓楼',
    nameEn: 'Tianjin Drum Tower',
    description: '天津老城厢的中心，始建于明代，历史悠久',
    color: '#D4A84B',
    icon: '🥁',
    year: '1404',
    style: '明代建筑'
  },
  {
    id: 'cishan',
    name: '瓷房子',
    nameEn: 'Porcelain House',
    description: '用古瓷器装饰的法式建筑，独特的艺术景观',
    color: '#87CEEB',
    icon: '🏺',
    year: '2007',
    style: '艺术建筑'
  }
];

export function TianjinLandmarks() {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* 地标卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {landmarks.map((landmark, index) => {
          const isHovered = hoveredId === landmark.id;
          
          return (
            <motion.div
              key={landmark.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative p-4 rounded-xl cursor-pointer transition-all duration-300
                ${isHovered 
                  ? 'shadow-lg transform -translate-y-1' 
                  : 'shadow-sm'
                }
              `}
              style={{
                background: `linear-gradient(135deg, ${landmark.color}15, ${landmark.color}05)`,
                border: `2px solid ${isHovered ? landmark.color : landmark.color + '30'}`,
              }}
              onMouseEnter={() => setHoveredId(landmark.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setSelectedLandmark(landmark)}
            >
              {/* 年份标签 */}
              <div 
                className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: landmark.color + '30',
                  color: landmark.color
                }}
              >
                {landmark.year}
              </div>
              
              {/* 图标 */}
              <div className="text-4xl mb-3">{landmark.icon}</div>
              
              {/* 名称 */}
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                {landmark.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {landmark.nameEn}
              </p>
              
              {/* 建筑风格标签 */}
              <div 
                className="mt-3 inline-block px-2 py-1 rounded text-xs"
                style={{ 
                  backgroundColor: landmark.color + '20',
                  color: landmark.color
                }}
              >
                {landmark.style}
              </div>
              
              {/* 悬停指示器 */}
              {isHovered && (
                <motion.div
                  layoutId="hover-indicator"
                  className="absolute bottom-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: landmark.color }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedLandmark && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLandmark(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{
                borderTop: `4px solid ${selectedLandmark.color}`
              }}
            >
              {/* 头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{selectedLandmark.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedLandmark.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedLandmark.nameEn}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLandmark(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 信息 */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: selectedLandmark.color + '20',
                      color: selectedLandmark.color
                    }}
                  >
                    {selectedLandmark.style}
                  </span>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: selectedLandmark.color + '15',
                      color: selectedLandmark.color
                    }}
                  >
                    建于 {selectedLandmark.year}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedLandmark.description}
                </p>

                {/* 色彩关联 */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    主题色彩关联
                  </p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 shadow-md"
                      style={{ backgroundColor: selectedLandmark.color }}
                    />
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {selectedLandmark.color}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 说明文字 */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        点击卡片查看地标详情
      </div>
    </div>
  );
}

export default TianjinLandmarks;
