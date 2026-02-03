// 注意：模拟数据已移除，系统现在使用真实数据API
// 此文件仅保留类型定义供其他模块使用

export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  topic: string;
  avatar: string;
  cover?: string;
  isActive: boolean;
  tags: string[];
  bookmarks: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  layoutType?: 'standard' | 'compact' | 'expanded';
  enabledModules?: {
    posts?: boolean;
    chat?: boolean;
    members?: boolean;
    announcements?: boolean;
  };
  isSpecial?: boolean;
}

// 模拟数据已移除
export const mockCommunities: Community[] = [];

// 用户加入的社群ID列表已移除
export const userJoinedCommunities: string[] = [];

// 根据话题获取推荐社群 - 现在返回空数组
export const getCommunitiesByTopic = (topic: string): Community[] => {
  console.warn('getCommunitiesByTopic: 模拟数据已禁用，请使用真实数据API');
  return [];
};

// 获取用户加入的社群 - 现在返回空数组
export const getUserCommunities = (): Community[] => {
  console.warn('getUserCommunities: 模拟数据已禁用，请使用真实数据API');
  return [];
};

// 推荐社群已移除
export const recommendedCommunities: Community[] = [];
