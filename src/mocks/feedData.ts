/**
 * 动态内容展示系统模拟数据
 * 参考哔哩哔哩动态页面设计
 */

import { 
  FeedItem, 
  HotSearchItem, 
  RecommendedUser, 
  RecommendedCommunity,
  CommunityAnnouncement 
} from '@/types/feed';

// 模拟用户头像
const avatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily',
];

// 模拟图片
const mockImages = [
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
  'https://images.unsplash.com/photo-1682687221038-404670f01d03?w=800&q=80',
  'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&q=80',
  'https://images.unsplash.com/photo-1682686581580-d99b0a6bb299?w=800&q=80',
  'https://images.unsplash.com/photo-1682686580186-b55d2a91053c?w=800&q=80',
  'https://images.unsplash.com/photo-1682687220199-d0124f48f95b?w=800&q=80',
  'https://images.unsplash.com/photo-1682687220509-61b8a906ca19?w=800&q=80',
  'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&q=80',
];

// 生成模拟动态数据
export const generateMockFeeds = (count: number = 20): FeedItem[] => {
  const feeds: FeedItem[] = [];
  const contentTypes = ['text', 'image', 'video', 'article', 'share', 'activity', 'community'] as const;
  const authorTypes = ['user', 'brand', 'official'] as const;
  
  const authors = [
    { name: '大象新闻', type: 'brand' as const, verified: true, verifiedType: 'brand' as const, avatar: avatars[0] },
    { name: '数学汤家凤', type: 'user' as const, verified: true, verifiedType: 'personal' as const, avatar: avatars[1] },
    { name: '哔哩哔哩番剧', type: 'official' as const, verified: true, verifiedType: 'official' as const, avatar: avatars[2] },
    { name: '津脉文创', type: 'brand' as const, verified: true, verifiedType: 'brand' as const, avatar: avatars[3] },
    { name: '天津文旅', type: 'official' as const, verified: true, verifiedType: 'official' as const, avatar: avatars[4] },
    { name: '创意设计师小李', type: 'user' as const, verified: false, avatar: avatars[5] },
    { name: '海河文化', type: 'brand' as const, verified: true, verifiedType: 'brand' as const, avatar: avatars[6] },
    { name: '非遗传承人', type: 'user' as const, verified: true, verifiedType: 'personal' as const, avatar: avatars[7] },
  ];

  const contents = [
    '河南矿山开工2小时订单破亿！有员工一单签了5000万，崔培军曾说：不会辞退老员工，2026年招聘63人，涉及专业...',
    '第14题汤家凤考研数学一题一方法，详细解析来了！',
    '【哔哩哔哩漫画作品推荐】《有兽焉》：人间有神兽，来自九重天~ 随着科技的发展，往日威风凛凛的神兽们日子大不如前。',
    '天津海河夜景真的太美了！今晚的游船体验超棒，推荐大家来天津一定要体验一下！',
    '津脉文创新品发布！这次我们带来了融合传统与现代的创意产品，欢迎大家关注！',
    '今天参加了天津非遗文化展，看到了很多精美的传统工艺品，感受颇深。',
    '分享一个超实用的设计技巧，关于色彩搭配的心得体会...',
    '【活动通知】天津文创市集即将开幕，届时将有众多文创品牌参与，敬请期待！',
  ];

  for (let i = 0; i < count; i++) {
    const author = authors[i % authors.length];
    const contentType = contentTypes[i % contentTypes.length];
    const hasMedia = contentType === 'image' || contentType === 'video';
    const mediaCount = hasMedia ? Math.floor(Math.random() * 6) + 1 : 0;
    
    const feed: FeedItem = {
      id: `feed_${Date.now()}_${i}`,
      author: {
        id: `author_${i % authors.length}`,
        type: author.type,
        name: author.name,
        avatar: author.avatar,
        verified: author.verified,
        verifiedType: author.verifiedType,
        followersCount: Math.floor(Math.random() * 100000),
        isFollowing: Math.random() > 0.5,
      },
      contentType,
      content: contents[i % contents.length],
      media: hasMedia ? Array.from({ length: Math.min(mediaCount, 9) }, (_, j) => ({
        id: `media_${i}_${j}`,
        type: contentType === 'video' ? 'video' : 'image',
        url: mockImages[j % mockImages.length],
        thumbnailUrl: mockImages[j % mockImages.length],
        width: 800,
        height: 600,
        duration: contentType === 'video' ? Math.floor(Math.random() * 300) + 30 : undefined,
      })) : undefined,
      tags: ['天津', '文创', '非遗', '设计'].slice(0, Math.floor(Math.random() * 4) + 1),
      location: Math.random() > 0.7 ? '天津市' : undefined,
      likes: Math.floor(Math.random() * 5000),
      comments: Math.floor(Math.random() * 500),
      shares: Math.floor(Math.random() * 200),
      views: Math.floor(Math.random() * 50000),
      isLiked: Math.random() > 0.8,
      isCollected: Math.random() > 0.9,
      isShared: false,
      isPinned: i < 2,
      isRecommended: i < 5,
      createdAt: new Date(Date.now() - i * 3600000 * Math.random()).toISOString(),
      updatedAt: new Date(Date.now() - i * 3600000 * Math.random()).toISOString(),
    };

    feeds.push(feed);
  }

  return feeds;
};

// 热搜数据
export const mockHotSearch: HotSearchItem[] = [
  { id: '1', rank: 1, title: '天津文创市集开幕', heat: 9854321, trend: 'up', isHot: true, category: '活动' },
  { id: '2', rank: 2, title: '海河夜景摄影大赛', heat: 8765432, trend: 'up', isNew: true, category: '摄影' },
  { id: '3', rank: 3, title: '非遗传承人访谈', heat: 7654321, trend: 'stable', category: '文化' },
  { id: '4', rank: 4, title: '津脉文创新品发布', heat: 6543210, trend: 'down', category: '产品' },
  { id: '5', rank: 5, title: '天津美食地图', heat: 5432109, trend: 'up', category: '美食' },
  { id: '6', rank: 6, title: '五大道历史建筑', heat: 4321098, trend: 'stable', category: '旅游' },
  { id: '7', rank: 7, title: '意式风情区打卡', heat: 3210987, trend: 'up', isNew: true, category: '旅游' },
  { id: '8', rank: 8, title: '天津方言挑战赛', heat: 2109876, trend: 'down', category: '娱乐' },
  { id: '9', rank: 9, title: '狗不理包子制作', heat: 1098765, trend: 'stable', category: '美食' },
  { id: '10', rank: 10, title: '天津之眼摩天轮', heat: 987654, trend: 'up', category: '旅游' },
];

// 推荐用户/品牌
export const mockRecommendedUsers: RecommendedUser[] = [
  {
    id: 'user_1',
    type: 'brand',
    name: '津脉文创',
    avatar: avatars[3],
    bio: '传承天津文化，创新文创产品',
    followersCount: 125000,
    worksCount: 328,
    isFollowing: false,
  },
  {
    id: 'user_2',
    type: 'official',
    name: '天津文旅',
    avatar: avatars[4],
    bio: '天津市文化和旅游局官方账号',
    followersCount: 890000,
    worksCount: 1256,
    isFollowing: true,
  },
  {
    id: 'user_3',
    type: 'user',
    name: '创意设计师小王',
    avatar: avatars[5],
    bio: '专注品牌设计与文创产品开发',
    followersCount: 45000,
    worksCount: 89,
    isFollowing: false,
  },
  {
    id: 'user_4',
    type: 'brand',
    name: '海河文化',
    avatar: avatars[6],
    bio: '海河沿岸文化推广与活动策划',
    followersCount: 67000,
    worksCount: 156,
    isFollowing: false,
  },
  {
    id: 'user_5',
    type: 'user',
    name: '非遗传承人',
    avatar: avatars[7],
    bio: '传统手工艺传承人，分享非遗文化',
    followersCount: 23000,
    worksCount: 67,
    isFollowing: false,
  },
];

// 推荐社群
export const mockRecommendedCommunities: RecommendedCommunity[] = [
  {
    id: 'community_1',
    name: '天津文创爱好者',
    avatar: avatars[0],
    description: '分享天津文创产品，交流设计心得',
    membersCount: 12580,
    postsCount: 3456,
    isJoined: false,
  },
  {
    id: 'community_2',
    name: '海河摄影俱乐部',
    avatar: avatars[1],
    description: '记录海河美景，分享摄影作品',
    membersCount: 8900,
    postsCount: 2345,
    isJoined: true,
  },
  {
    id: 'community_3',
    name: '天津美食探店',
    avatar: avatars[2],
    description: '发现天津地道美食，分享探店体验',
    membersCount: 25600,
    postsCount: 5678,
    isJoined: false,
  },
  {
    id: 'community_4',
    name: '非遗文化传承',
    avatar: avatars[3],
    description: '传承非遗文化，弘扬传统技艺',
    membersCount: 5600,
    postsCount: 1234,
    isJoined: false,
  },
];

// 社区公告
export const mockAnnouncements: CommunityAnnouncement[] = [
  {
    id: 'announce_1',
    title: '社区中心',
    content: '欢迎来到津脉社区！这里有最新的活动信息和社区动态。',
    type: 'system',
    createdAt: new Date().toISOString(),
    isRead: false,
    link: '/community',
  },
  {
    id: 'announce_2',
    title: '文创市集活动',
    content: '本周六天津文创市集将在意式风情区举办，欢迎参与！',
    type: 'activity',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: false,
    link: '/events/1',
  },
  {
    id: 'announce_3',
    title: '新功能上线',
    content: '动态发布功能全新升级，支持更多媒体类型！',
    type: 'feature',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isRead: true,
  },
];

// 导出所有模拟数据
export const mockFeedData = {
  feeds: generateMockFeeds(30),
  hotSearch: mockHotSearch,
  recommendedUsers: mockRecommendedUsers,
  recommendedCommunities: mockRecommendedCommunities,
  announcements: mockAnnouncements,
};

export default mockFeedData;
