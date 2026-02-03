import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { TianjinEmptyState, YangliuqingCard, TianjinButton } from './TianjinStyleComponents';
import { tianjinActivityService, HistoricalSceneItem, InspirationItem } from '@/services/tianjinActivityService';

export default function TianjinHistoricalScene() {
  const { isDark = false } = useTheme() || {};
  const [activeTab, setActiveTab] = useState<'inspiration' | 'explore'>('inspiration');
  const [selectedStyle, setSelectedStyle] = useState<string>('无边框');
  const [loading, setLoading] = useState(false);
  const [historicalScenes, setHistoricalScenes] = useState<HistoricalSceneItem[]>([]);
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [scenes, inspirations] = await Promise.all([
        tianjinActivityService.getHistoricalScenes(),
        tianjinActivityService.getInspirationItems()
      ]);
      setHistoricalScenes(scenes);
      setInspirationItems(inspirations);
    };
    fetchData();
  }, []);

  const handleGenerateInspiration = () => {
    setLoading(true);
    // 模拟生成过程
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 主标题 */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold">天津卫历史场景</h2>
      </div>

      {/* 标签页 */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setActiveTab('inspiration')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${activeTab === 'inspiration' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            灵感生成
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-6 py-2 rounded-md font-medium transition-all duration-300 ${activeTab === 'explore' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            探索库
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <div className="relative flex-1">
          {/* 装饰元素 */}
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-red-100 dark:bg-red-900/30 rounded-full opacity-50"></div>
          
          <div className="relative border-2 border-blue-600 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-lg h-full">
            {activeTab === 'inspiration' ? (
              <div className="space-y-6">
                {/* 灵感生成表单 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">场景描述</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请描述您想要的历史场景..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">风格选择</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['传统风格', '现代演绎', '混搭创意'].map((style) => (
                      <button
                        key={style}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">元素选择</label>
                  <div className="flex flex-wrap gap-2">
                    {['建筑', '服饰', '民俗', '手工艺', '饮食', '节庆'].map((element) => (
                      <span
                        key={element}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                      >
                        {element}
                      </span>
                    ))}
                  </div>
                </div>
                
                <TianjinButton
                  onClick={handleGenerateInspiration}
                  primary
                  loading={loading}
                  fullWidth
                >
                  生成灵感
                </TianjinButton>
              </div>
              
              {/* 灵感结果 */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">灵感推荐</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inspirationItems.map((item) => (
                    <YangliuqingCard key={item.id}>
                      <div className="space-y-3">
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-bold">{item.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </YangliuqingCard>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 搜索和筛选 */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="搜索历史场景..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>全部类别</option>
                    <option>城市起源</option>
                    <option>经济发展</option>
                    <option>文化艺术</option>
                    <option>教育发展</option>
                    <option>民间艺术</option>
                  </select>
                </div>
              </div>
              
              {/* 历史场景列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historicalScenes.map((scene) => (
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <YangliuqingCard>
                      <div className="space-y-3">
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <img
                            src={scene.image}
                            alt={scene.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">{scene.title}</h4>
                          <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{scene.year}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{scene.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded">{scene.category}</span>
                          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">查看详情</button>
                        </div>
                      </div>
                    </YangliuqingCard>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧样式生成工具 */}
      <div className="w-full md:w-72 shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 sticky top-4">
          <h3 className="text-lg font-semibold mb-4">样式生成</h3>
          
          {/* 样式选择 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">布局样式</label>
              <div className="space-y-2">
                {['田字格', '无边框', '卷轴式', '现代网格'].map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg transition-colors ${selectedStyle === style ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
                  >
                    <span>{style}</span>
                    {selectedStyle === style && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 颜色选择 */}
            <div>
              <label className="block text-sm font-medium mb-2">色彩风格</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: '传统红', color: 'bg-red-600' },
                  { name: '青花瓷', color: 'bg-blue-500' },
                  { name: '黄土色', color: 'bg-yellow-600' },
                  { name: '墨色', color: 'bg-gray-800' },
                ].map((color) => (
                  <button
                    key={color.name}
                    className={`aspect-square rounded-lg ${color.color} border-2 border-transparent hover:border-gray-400 transition-all`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            {/* 生成按钮 */}
            <TianjinButton
              onClick={() => {}}
              primary
              fullWidth
              size="sm"
            >
              应用样式
            </TianjinButton>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
