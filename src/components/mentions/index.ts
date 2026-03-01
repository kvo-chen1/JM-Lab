/**
 * @提及功能组件导出
 */

export { MentionSelector } from '../MentionSelector';
export { MentionInput, type MentionInputRef } from '../MentionInput';
export { MentionText, MentionTextSimple } from '../MentionText';
export { MentionNotificationList, MentionNotificationBadge } from '../MentionNotification';
export { CreatePostWithMentions } from '../CreatePostWithMentions';
export { CommentWithMentions, CommentListWithMentions } from '../CommentWithMentions';
export { ChatMessageWithMentions, ChatInputWithMentions, ChatMessageItem } from '../ChatMessageWithMentions';

// 导出服务
export { mentionService } from '@/services/mentionService';
export type { 
  Mention, 
  MentionWithDetails, 
  CommunityMember, 
  MentionNotification,
  MentionType,
  ContentType 
} from '@/services/mentionService';
