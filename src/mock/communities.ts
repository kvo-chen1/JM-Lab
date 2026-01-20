// 社群mock数据

export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  topic: string;
  avatar: string;
  isActive: boolean;
}

// 创作者社群列表
export const mockCommunities: Community[] = [
  {
    id: '1',
    name: '国潮创作联盟',
    description: '专注国潮设计与创作的交流社群',
    memberCount: 1256,
    topic: '国潮',
    avatar: 'https://picsum.photos/seed/guochao/200/200',
    isActive: true
  },
  {
    id: '2',
    name: '非遗传承圈',
    description: '保护和传承非物质文化遗产的社群',
    memberCount: 892,
    topic: '非遗',
    avatar: 'https://picsum.photos/seed/feiyi/200/200',
    isActive: true
  },
  {
    id: '3',
    name: '极简设计公社',
    description: '追求简约、极致设计理念的社群',
    memberCount: 1567,
    topic: '极简',
    avatar: 'https://picsum.photos/seed/jijian/200/200',
    isActive: true
  },
  {
    id: '4',
    name: '赛博朋克爱好者',
    description: '赛博朋克风格设计与创作交流',
    memberCount: 2034,
    topic: '赛博朋克',
    avatar: 'https://picsum.photos/seed/cyberpunk/200/200',
    isActive: true
  },
  {
    id: '5',
    name: '3D艺术创作室',
    description: '3D建模与艺术创作的专业社群',
    memberCount: 1876,
    topic: '3D艺术',
    avatar: 'https://picsum.photos/seed/3dart/200/200',
    isActive: true
  },
  {
    id: '6',
    name: '插画师联盟',
    description: '插画创作与分享的社群',
    memberCount: 2543,
    topic: '插画',
    avatar: 'https://picsum.photos/seed/illustration/200/200',
    isActive: true
  },
  {
    id: '7',
    name: 'UI设计圈',
    description: 'UI/UX设计交流与学习社群',
    memberCount: 3121,
    topic: 'UI设计',
    avatar: 'https://picsum.photos/seed/ui/200/200',
    isActive: true
  },
  {
    id: '8',
    name: '数字艺术先锋',
    description: '探索数字艺术前沿的社群',
    memberCount: 1456,
    topic: '数字艺术',
    avatar: 'https://picsum.photos/seed/digitalart/200/200',
    isActive: true
  },
  {
    id: '9',
    name: '工艺创新实验室',
    description: '传统工艺与现代创新结合的社群',
    memberCount: 987,
    topic: '工艺创新',
    avatar: 'https://picsum.photos/seed/innovation/200/200',
    isActive: true
  },
  {
    id: '10',
    name: '传统文化复兴社',
    description: '传统文化与现代设计融合的社群',
    memberCount: 1678,
    topic: '传统文化',
    avatar: 'https://picsum.photos/seed/traditional/200/200',
    isActive: true
  }
];

// 用户加入的社群ID列表
export const userJoinedCommunities: string[] = ['1', '2', '3', '4', '7'];

// 根据话题获取推荐社群
export const getCommunitiesByTopic = (topic: string): Community[] => {
  return mockCommunities.filter(community => community.topic === topic || topic === '全部');
};

// 获取用户加入的社群
export const getUserCommunities = (): Community[] => {
  return mockCommunities.filter(community => userJoinedCommunities.includes(community.id));
};
