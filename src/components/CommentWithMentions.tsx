/**
 * 评论组件（支持@提及）
 * 用于显示和回复评论
 */

import React, { useRef, useState } from 'react';
import { MessageCircle, Reply, Heart, MoreHorizontal } from 'lucide-react';
import { MentionInput, MentionInputRef } from './MentionInput';
import { MentionText } from './MentionText';
import Avatar from '@/components/ui/Avatar';
import { mentionService } from '@/services/mentionService';
import { useAuth } from '@/contexts/authContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from '@/utils/dateUtils';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
  parentId?: string;
}

interface CommentWithMentionsProps {
  communityId: string;
  postId: string;
  comment: Comment;
  onReply?: (commentId: string, content: string, mentionedUserIds: string[]) => Promise<void>;
  onLike?: (commentId: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}

export const CommentWithMentions: React.FC<CommentWithMentionsProps> = ({
  communityId,
  postId,
  comment,
  onReply,
  onLike,
  onDelete,
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const mentionInputRef = useRef<MentionInputRef>(null);

  const handleReply = async () => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    const content = mentionInputRef.current?.getContent() || '';
    if (!content.trim()) {
      toast.error('请输入回复内容');
      return;
    }

    const mentionedUserIds = mentionInputRef.current?.getMentionedUserIds() || [];

    try {
      await onReply?.(comment.id, content, mentionedUserIds);
      mentionInputRef.current?.setContent('');
      setIsReplying(false);
      toast.success('回复成功');
    } catch (error) {
      console.error('Error replying:', error);
      toast.error('回复失败，请重试');
    }
  };

  const handleLike = async () => {
    if (!user?.id) {
      toast.error('请先登录');
      return;
    }

    try {
      await onLike?.(comment.id);
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('操作失败，请重试');
    }
  };

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      {/* 头像 */}
      <Avatar
        src={comment.authorAvatar}
        alt={comment.authorName}
        size="medium"
      >
        {comment.authorName[0]?.toUpperCase()}
      </Avatar>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        {/* 头部信息 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {comment.authorName}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(comment.createdAt)}
          </span>
        </div>

        {/* 评论内容（支持@提及高亮） */}
        <div className="text-gray-700 dark:text-gray-300 mb-2">
          <MentionText
            content={comment.content}
            onMentionClick={(username) => {
              console.log('Clicked mention:', username);
            }}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm transition-colors ${
              comment.isLiked
                ? 'text-red-500'
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
            <span>{comment.likes || 0}</span>
          </button>

          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Reply className="w-4 h-4" />
            <span>回复</span>
          </button>

          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                {showReplies ? '收起回复' : `查看 ${comment.replies.length} 条回复`}
              </span>
            </button>
          )}

          {user?.id === comment.authorId && (
            <button
              onClick={() => onDelete?.(comment.id)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>删除</span>
            </button>
          )}
        </div>

        {/* 回复输入框 */}
        {isReplying && (
          <div className="mt-3">
            <MentionInput
              ref={mentionInputRef}
              communityId={communityId}
              placeholder={`回复 ${comment.authorName}...`}
              initialContent={`@${comment.authorName} `}
              maxLength={500}
              rows={3}
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => setIsReplying(false)}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReply}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                发送回复
              </button>
            </div>
          </div>
        )}

        {/* 子回复列表 */}
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
            {comment.replies.map((reply) => (
              <CommentWithMentions
                key={reply.id}
                communityId={communityId}
                postId={postId}
                comment={reply}
                onReply={onReply}
                onLike={onLike}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 评论列表组件
interface CommentListWithMentionsProps {
  communityId: string;
  postId: string;
  comments: Comment[];
  onReply?: (commentId: string, content: string, mentionedUserIds: string[]) => Promise<void>;
  onLike?: (commentId: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}

export const CommentListWithMentions: React.FC<CommentListWithMentionsProps> = ({
  communityId,
  postId,
  comments,
  onReply,
  onLike,
  onDelete,
}) => {
  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentWithMentions
          key={comment.id}
          communityId={communityId}
          postId={postId}
          comment={comment}
          onReply={onReply}
          onLike={onLike}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CommentWithMentions;
