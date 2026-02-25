// 作品类型定义

export interface Work {
  id: string;
  title: string;
  thumbnail: string;
  cover_url?: string;  // 视频作品的封面图字段
  url?: string;  // 视频/音频文件的URL
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  status: '已发布' | '草稿';
  createdAt: string | number;
  views: number;
  likes: number;
  description?: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
}

export interface WorkShare {
  id: string;
  senderId: string;
  receiverId: string;
  workId: string;
  workTitle: string;
  workThumbnail?: string;
  workType?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  sender?: {
    username: string;
    avatarUrl?: string;
  };
  receiver?: {
    username: string;
    avatarUrl?: string;
  };
}
