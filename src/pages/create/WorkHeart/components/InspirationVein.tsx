import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { 
  useInspirationVeins,
  useCurrentVein,
  useVeinViewMode,
  useWorkHeartStore 
} from '../hooks/useWorkHeartStore';
import { ViewMode, InspirationVein as InspirationVeinType } from '../types/workheart';

const VIEW_MODES: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'timeline', label: '时间轴', icon: 'stream' },
  { id: 'tree', label: '树状图', icon: 'sitemap' },
  { id: 'network', label: '网络图', icon: 'project-diagram' },
  { id: 'compare', label: '对比', icon: 'columns' }
];

// 时间轴视图
function TimelineView({ vein }: { vein: InspirationVeinType }) {
  const { isDark } = useTheme();
  const nodes = Object.values(vein.nodes).sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="space-y-4">
      {nodes.map((node, index) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex gap-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
        >
          {/* 时间线 */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${
              node.type === 'root' 
                ? 'bg-red-500' 
                : node.type === 'iteration' 
                  ? 'bg-blue-500' 
                  : node.type === 'reference'
                    ? 'bg-green-500'
                    : 'bg-purple-500'
            }`}></div>
            {index < nodes.length - 1 && (
              <div className={`w-0.5 flex-1 my-1 ${
                isDark ? 'bg-slate-700' : 'bg-slate-200'
              }`}></div>
            )}
          </div>

          {/* 内容 */}
          <div className={`flex-1 pb-4 ${
            isDark ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <div className={`p-4 rounded-xl border ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    node.type === 'root'
                      ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                      : node.type === 'iteration'
                        ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                        : node.type === 'reference'
                          ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                          : isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {node.type === 'root' ? '起点' : 
                     node.type === 'iteration' ? '迭代' : 
                     node.type === 'reference' ? '参考' : '衍生'}
                  </span>
                  <h4 className={`font-semibold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {node.title}
                  </h4>
                </div>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(node.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {node.description && (
                <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {node.description}
                </p>
              )}

              {node.imageUrl && (
                <img 
                  src={node.imageUrl} 
                  alt={node.title}
                  className="w-32 h-32 object-cover rounded-lg mt-2"
                />
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// 树状视图
function TreeView({ vein }: { vein: InspirationVeinType }) {
  const { isDark } = useTheme();
  const rootNode = vein.nodes[vein.rootNodeId];

  const renderNode = (nodeId: string, level: number = 0) => {
    const node = vein.nodes[nodeId];
    if (!node) return null;

    return (
      <div key={node.id} className="ml-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-3 rounded-lg border mb-2 ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}
          style={{ marginLeft: level * 20 }}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              node.type === 'root' ? 'bg-red-500' : 
              node.type === 'iteration' ? 'bg-blue-500' : 
              node.type === 'reference' ? 'bg-green-500' : 'bg-purple-500'
            }`}></div>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {node.title}
            </span>
          </div>
        </motion.div>
        {node.childrenIds.map((childId) => renderNode(childId, level + 1))}
      </div>
    );
  };

  return (
    <div className="overflow-auto">
      {renderNode(rootNode.id)}
    </div>
  );
}

// 网络视图
function NetworkView({ vein }: { vein: InspirationVeinType }) {
  const { isDark } = useTheme();
  const nodes = Object.values(vein.nodes);

  return (
    <div className={`relative h-96 rounded-xl border overflow-hidden ${
      isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'
    }`}>
      {/* 简化的网络可视化 */}
      <svg className="w-full h-full">
        {nodes.map((node, i) => {
          const x = 50 + (i % 3) * 150;
          const y = 50 + Math.floor(i / 3) * 100;
          
          return (
            <g key={node.id}>
              {/* 连接线 */}
              {node.parentId && (
                <line
                  x1={x}
                  y1={y}
                  x2={50 + (nodes.findIndex(n => n.id === node.parentId) % 3) * 150}
                  y2={50 + Math.floor(nodes.findIndex(n => n.id === node.parentId) / 3) * 100}
                  stroke={isDark ? '#475569' : '#cbd5e1'}
                  strokeWidth="2"
                />
              )}
              {/* 节点 */}
              <circle
                cx={x}
                cy={y}
                r="30"
                fill={node.type === 'root' ? '#ef4444' : 
                      node.type === 'iteration' ? '#3b82f6' : 
                      node.type === 'reference' ? '#22c55e' : '#a855f7'}
                opacity="0.8"
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="10"
              >
                {node.title.slice(0, 4)}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* 图例 */}
      <div className={`absolute bottom-2 right-2 p-2 rounded-lg text-xs ${
        isDark ? 'bg-slate-800/80' : 'bg-white/80'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span>起点</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>迭代</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span>衍生</span>
        </div>
      </div>
    </div>
  );
}

// 对比视图
function CompareView({ vein }: { vein: InspirationVeinType }) {
  const { isDark } = useTheme();
  const nodesWithImages = Object.values(vein.nodes).filter(n => n.imageUrl);

  if (nodesWithImages.length < 2) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <i className="fas fa-images text-3xl mb-2"></i>
        <p>需要至少2个带图片的节点才能对比</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {nodesWithImages.slice(0, 4).map((node) => (
        <div 
          key={node.id}
          className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          {node.imageUrl && (
            <img 
              src={node.imageUrl} 
              alt={node.title}
              className="w-full aspect-square object-cover"
            />
          )}
          <div className="p-3">
            <h4 className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {node.title}
            </h4>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {new Date(node.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InspirationVeinComponent() {
  const { isDark } = useTheme();
  const veins = useInspirationVeins();
  const currentVein = useCurrentVein();
  const viewMode = useVeinViewMode();
  const { createVein, setCurrentVein, setVeinViewMode } = useWorkHeartStore();
  
  const [newVeinName, setNewVeinName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateVein = () => {
    if (!newVeinName.trim()) {
      toast.warning('请输入脉络名称');
      return;
    }
    createVein(newVeinName);
    setNewVeinName('');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            灵感脉络
          </h3>
          
          {/* 视图切换 */}
          <div className={`flex rounded-lg p-1 ${
            isDark ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setVeinViewMode(mode.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === mode.id
                    ? isDark 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-white text-slate-900 shadow-sm'
                    : isDark 
                      ? 'text-slate-400 hover:text-white' 
                      : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <i className={`fas fa-${mode.icon}`}></i>
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark 
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
        >
          <i className="fas fa-plus mr-2"></i>
          新建脉络
        </button>
      </div>

      {/* 脉络列表 */}
      {veins.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {veins.map((vein) => (
            <button
              key={vein.id}
              onClick={() => setCurrentVein(vein.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentVein?.id === vein.id
                  ? isDark 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-red-100 text-red-600 border border-red-200'
                  : isDark 
                    ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                    : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <i className="fas fa-project-diagram mr-2"></i>
              {vein.name}
              <span className={`ml-2 text-xs ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {Object.keys(vein.nodes).length} 节点
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 创建新脉络表单 */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              创建新脉络
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVeinName}
                onChange={(e) => setNewVeinName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateVein()}
                placeholder="输入脉络名称..."
                className={`flex-1 px-3 py-2 rounded-lg text-sm border outline-none transition-colors ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500' 
                    : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
              <button
                onClick={handleCreateVein}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                创建
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                取消
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 脉络内容 */}
      {currentVein ? (
        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {currentVein.name}
              </h4>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                创建于 {new Date(currentVein.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${
                isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {Object.keys(currentVein.nodes).length} 节点
              </span>
            </div>
          </div>

          {/* 根据视图模式渲染不同内容 */}
          {viewMode === 'timeline' && <TimelineView vein={currentVein} />}
          {viewMode === 'tree' && <TreeView vein={currentVein} />}
          {viewMode === 'network' && <NetworkView vein={currentVein} />}
          {viewMode === 'compare' && <CompareView vein={currentVein} />}
        </div>
      ) : (
        <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            <i className="fas fa-project-diagram text-3xl"></i>
          </div>
          <p className="text-sm font-medium">暂无灵感脉络</p>
          <p className="text-xs mt-1">创建一个新脉络来追踪你的创意演化</p>
        </div>
      )}
    </div>
  );
}
