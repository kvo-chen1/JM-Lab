import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; tags: string[] }) => void;
  isDark: boolean;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDark
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) return;
    const tags = tagsInput.split(/[,，\s]+/).filter(Boolean);
    onSubmit({ name, description, tags });
    onClose();
    setName('');
    setDescription('');
    setTagsInput('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="创建新社群"
      className={isDark ? 'dark' : ''}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !description.trim()}>
            创建
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            社群名称
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="例如：赛博朋克设计交流"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            简介
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="简要描述社群的主题和宗旨..."
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            标签 (用逗号或空格分隔)
          </label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="例如：设计, 赛博朋克, 3D"
          />
        </div>
      </div>
    </Modal>
  );
};
