import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { mockCommunities, Community } from '@/mock/communities';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; topic: string; communityIds: string[] }) => void;
  isDark: boolean;
  topics?: string[];
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDark,
  topics = ['国潮', '非遗', '极简', '赛博朋克']
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState(topics[0]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  // 根据选中的话题过滤相关社群
  const filteredCommunities = mockCommunities.filter(community => 
    community.topic === topic || topic === '全部'
  );

  // 处理社群选择
  const handleCommunityToggle = (communityId: string) => {
    setSelectedCommunities(prev => 
      prev.includes(communityId)
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    if (selectedCommunities.length === 0) {
      alert('请至少选择一个社群');
      return;
    }
    onSubmit({ title, content, topic, communityIds: selectedCommunities });
    onClose();
    setTitle('');
    setContent('');
    setSelectedCommunities([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="发布新帖"
      className={isDark ? 'dark' : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!title.trim() || !content.trim() || selectedCommunities.length === 0}
          >
            发布到 {selectedCommunities.length} 个社群
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            标题
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="请输入标题..."
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            话题/分类
          </label>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTopic(t);
                  // 切换话题时清空已选社群
                  setSelectedCommunities([]);
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  topic === t
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isDark
                    ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            选择社群 ({selectedCommunities.length} 个已选)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                onClick={() => handleCommunityToggle(community.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedCommunities.includes(community.id)
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
                    : isDark
                    ? 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={community.avatar}
                      alt={community.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm font-medium">{community.name}</div>
                      <div className="text-xs opacity-70">{community.memberCount} 成员</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedCommunities.includes(community.id)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isDark
                      ? 'border-gray-500'
                      : 'border-gray-400'
                  }`}>
                    {selectedCommunities.includes(community.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredCommunities.length === 0 && (
            <div className="text-center py-4 text-sm opacity-70">
              暂无相关社群
            </div>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="分享你的想法..."
          />
        </div>
      </div>
    </Modal>
  );
};
