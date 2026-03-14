/**
 * 创建帖子组件（支持@提及）
 * 示例：展示如何在帖子发布中集成@提及功能
 */

import React, { useRef, useState } from 'react';
import { Send, Image, Link, X } from 'lucide-react';
import { MentionInput, MentionInputRef } from './MentionInput';
import { MentionText } from './MentionText';
import { useAuth } from '@/contexts/authContext';
import { toast } from 'sonner';

interface CreatePostWithMentionsProps {
  communityId: string;
  onSubmit?: (post: {
    content: string;
    mentionedUserIds: string[];
  }) => Promise<void>;
  onCancel?: () => void;
}

export const CreatePostWithMentions: React.FC<CreatePostWithMentionsProps> = ({
  communityId,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const mentionInputRef = useRef<MentionInputRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    const content = mentionInputRef.current?.getContent() || '';
    if (!content.trim()) {
      toast.error('请输入内容');
      return;
    }

    const mentionedUserIds = mentionInputRef.current?.getMentionedUserIds() || [];

    setIsSubmitting(true);
    try {
      // 调用父组件的提交函数
      await onSubmit?.({ content, mentionedUserIds });
      
      // 清空输入
      mentionInputRef.current?.setContent('');
      toast.success('发布成功');
    } catch (error) {
      console.error('Error submitting post:', error);
      toast.error('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = (content: string) => {
    // 可以在这里实时处理内容变化
    console.log('Content changed:', content);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          发布新帖子
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* @提及输入框 */}
      <MentionInput
        ref={mentionInputRef}
        communityId={communityId}
        placeholder="分享你的想法... 使用 @ 提及社群成员"
        onChange={handleContentChange}
        maxLength={2000}
        rows={6}
      />

      {/* 工具栏 */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="添加图片"
          >
            <Image className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="添加链接"
          >
            <Link className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showPreview
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            预览
          </button>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                发布中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                发布
              </>
            )}
          </button>
        </div>
      </div>

      {/* 预览区域 */}
      {showPreview && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            预览
          </h4>
          <div className="text-gray-900 dark:text-gray-100">
            <MentionText
              content={mentionInputRef.current?.getContent() || ''}
              onMentionClick={(username) => {
                console.log('Clicked mention:', username);
              }}
            />
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>提示：输入 @ 后输入成员名称可以快速提及社群成员</p>
      </div>
    </div>
  );
};

export default CreatePostWithMentions;
