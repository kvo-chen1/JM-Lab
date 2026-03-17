/**
 * 盲盒管理组件 - 后台管理
 * 功能：盲盒列表管理、添加/编辑盲盒、开启记录查看
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import blindBoxService, { BlindBox, BlindBoxContent } from '@/services/blindBoxService';
import {
  Gift,
  Plus,
  Edit3,
  Trash2,
  Search,
  Grid3X3,
  List,
  History,
  Eye,
  TrendingUp,
  Package,
  Users,
} from 'lucide-react';

interface BlindBoxHistoryItem {
  id: string;
  userId: string;
  userName: string;
  boxName: string;
  contentName: string;
  rarity: string;
  openedAt: Date;
}

const BlindBoxManagement: React.FC = () => {
  const { isDark } = useTheme();
  const [currentView, setCurrentView] = useState<'list' | 'history'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [blindBoxes, setBlindBoxes] = useState<BlindBox[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBox, setEditingBox] = useState<BlindBox | null>(null);
  const [historyRecords, setHistoryRecords] = useState<BlindBoxHistoryItem[]>([]);

  // 加载盲盒数据
  useEffect(() => {
    const boxes = blindBoxService.getAllBlindBoxes();
    setBlindBoxes(boxes);
  }, []);

  // 模拟加载历史记录
  useEffect(() => {
    // 这里应该从数据库加载真实的开启记录
    // 目前使用模拟数据
    const mockHistory: BlindBoxHistoryItem[] = [
      {
        id: '1',
        userId: 'user1',
        userName: '张三',
        boxName: '创意新手盲盒',
        contentName: '水墨风格背景',
        rarity: 'common',
        openedAt: new Date(),
      },
      {
        id: '2',
        userId: 'user2',
        userName: '李四',
        boxName: '文化传承盲盒',
        contentName: '大师级书法',
        rarity: 'rare',
        openedAt: new Date(Date.now() - 3600000),
      },
    ];
    setHistoryRecords(mockHistory);
  }, []);

  // 过滤盲盒
  const filteredBoxes = blindBoxes.filter((box) => {
    const matchesSearch = box.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         box.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = rarityFilter === 'all' || box.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      case 'legendary': return '传奇';
      default: return '普通';
    }
  };

  // 处理添加盲盒
  const handleAddBox = (boxData: Partial<BlindBox>) => {
    // 这里应该调用 API 添加到数据库
    toast.success('添加盲盒成功');
    setShowAddModal(false);
    // 刷新列表
    const boxes = blindBoxService.getAllBlindBoxes();
    setBlindBoxes(boxes);
  };

  // 处理编辑盲盒
  const handleEditBox = (boxData: Partial<BlindBox>) => {
    // 这里应该调用 API 更新数据库
    toast.success('编辑盲盒成功');
    setEditingBox(null);
    // 刷新列表
    const boxes = blindBoxService.getAllBlindBoxes();
    setBlindBoxes(boxes);
  };

  // 处理删除盲盒
  const handleDeleteBox = (boxId: string) => {
    if (confirm('确定要删除这个盲盒吗？')) {
      // 这里应该调用 API 删除
      toast.success('删除盲盒成功');
      // 刷新列表
      const boxes = blindBoxService.getAllBlindBoxes();
      setBlindBoxes(boxes);
    }
  };

  // 添加/编辑表单组件
  const BlindBoxFormModal: React.FC<{
    box?: BlindBox;
    onClose: () => void;
    onSubmit: (data: Partial<BlindBox>) => void;
  }> = ({ box, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      name: box?.name || '',
      description: box?.description || '',
      price: box?.price || 50,
      rarity: box?.rarity || 'common',
      totalCount: box?.totalCount || 1000,
      image: box?.image || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
          <h2 className="text-2xl font-bold mb-6">{box ? '编辑盲盒' : '添加盲盒'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">盲盒名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">所需积分</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">稀有度</label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value as BlindBox['rarity'] })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                >
                  <option value="common">普通</option>
                  <option value="rare">稀有</option>
                  <option value="epic">史诗</option>
                  <option value="legendary">传奇</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">总数量</label>
                <input
                  type="number"
                  value={formData.totalCount}
                  onChange={(e) => setFormData({ ...formData, totalCount: parseInt(e.target.value) || 0 })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">图片 URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">盲盒管理</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                currentView === 'list'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : isDark
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <Gift className="w-4 h-4" />
              盲盒列表
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                currentView === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : isDark
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <History className="w-4 h-4" />
              开启记录
            </button>
          </div>
        </div>

        {currentView === 'list' ? (
          <>
            {/* 筛选和搜索 */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className={`relative flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
                <input
                  type="text"
                  placeholder="搜索盲盒..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
                <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <option value="all">全部稀有度</option>
                <option value="common">普通</option>
                <option value="rare">稀有</option>
                <option value="epic">史诗</option>
                <option value="legendary">传奇</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加盲盒
              </button>
            </div>

            {/* 盲盒列表 */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBoxes.map((box) => (
                  <div
                    key={box.id}
                    className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={box.image}
                        alt={box.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getRarityColor(box.rarity)}`}>
                        {getRarityLabel(box.rarity)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-2">{box.name}</h3>
                      <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {box.description}
                      </p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-purple-500 font-bold">{box.price} 积分</span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          剩余：{box.remainingCount}/{box.totalCount}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingBox(box)}
                          className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteBox(box.id)}
                          className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg`}>
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="text-left p-4 text-sm font-medium">盲盒名称</th>
                      <th className="text-left p-4 text-sm font-medium">稀有度</th>
                      <th className="text-left p-4 text-sm font-medium">价格</th>
                      <th className="text-left p-4 text-sm font-medium">库存</th>
                      <th className="text-left p-4 text-sm font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBoxes.map((box) => (
                      <tr key={box.id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={box.image} alt={box.name} className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                              <div className="font-medium">{box.name}</div>
                              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-1`}>
                                {box.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs text-white ${getRarityColor(box.rarity)}`}>
                            {getRarityLabel(box.rarity)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-purple-500 font-medium">{box.price} 积分</span>
                        </td>
                        <td className="p-4">
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            {box.remainingCount}/{box.totalCount}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingBox(box)}
                              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                              title="编辑"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBox(box.id)}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* 开启记录 */
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5" />
                盲盒开启记录
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="text-left p-4 text-sm font-medium">用户</th>
                    <th className="text-left p-4 text-sm font-medium">盲盒名称</th>
                    <th className="text-left p-4 text-sm font-medium">获得内容</th>
                    <th className="text-left p-4 text-sm font-medium">稀有度</th>
                    <th className="text-left p-4 text-sm font-medium">开启时间</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((record) => (
                    <tr key={record.id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                            <Users className="w-4 h-4" />
                          </div>
                          <span>{record.userName}</span>
                        </div>
                      </td>
                      <td className="p-4">{record.boxName}</td>
                      <td className="p-4">{record.contentName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs text-white ${getRarityColor(record.rarity)}`}>
                          {getRarityLabel(record.rarity)}
                        </span>
                      </td>
                      <td className="p-4 text-sm opacity-70">
                        {record.openedAt.toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 添加/编辑弹窗 */}
        {showAddModal && (
          <BlindBoxFormModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddBox}
          />
        )}

        {editingBox && (
          <BlindBoxFormModal
            box={editingBox}
            onClose={() => setEditingBox(null)}
            onSubmit={handleEditBox}
          />
        )}
      </div>
    </div>
  );
};

export default BlindBoxManagement;
