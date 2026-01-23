export interface CulturalKnowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  imageUrl?: string; // Optional image URL
  source?: string;   // Optional source info
  viewCount: number;
  likes: number;
  createdAt: string;
}

export const jinmenKnowledgeData: CulturalKnowledge[] = [
  {
    id: '1',
    title: '天津杨柳青年画',
    content: '天津杨柳青年画是中国著名的民间木版年画之一，始于明代崇祯年间，盛于清代，以色彩艳丽、线条细腻、构图饱满著称。它是中国首批国家级非物质文化遗产。',
    category: '传统艺术',
    tags: ['天津文化', '年画', '非遗'],
    viewCount: 1245,
    likes: 342,
    createdAt: '2024-10-15',
    imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=800&auto=format&fit=crop' // Chinese traditional painting style
  },
  {
    id: '2',
    title: '狗不理包子',
    content: '“狗不理”始创于1858年（清咸丰八年），是天津“三绝”之首。其包子褶花匀称，每个包子不少于15个褶，口感鲜香，肥而不腻。',
    category: '老字号美食',
    tags: ['美食', '老字号', '天津三绝'],
    viewCount: 3500,
    likes: 890,
    createdAt: '2024-10-20',
    source: '津门老字号名录',
    imageUrl: 'https://images.unsplash.com/photo-1626804475297-411dbe63c4eb?q=80&w=800&auto=format&fit=crop' // Steamed buns (Dim Sum)
  },
  {
    id: '3',
    title: '桂发祥十八街麻花',
    content: '桂发祥十八街麻花是天津“三绝”之一，以香、甜、酥、脆、久放不绵著称。其制作工艺独特，夹馅丰富，是馈赠亲友的佳品。',
    category: '老字号美食',
    tags: ['美食', '老字号', '天津三绝'],
    viewCount: 2800,
    likes: 650,
    createdAt: '2024-10-25',
    imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=800&auto=format&fit=crop' // Fried dough pastry
  },
  {
    id: '4',
    title: '耳朵眼炸糕',
    content: '耳朵眼炸糕始创于清光绪年间，因店铺紧靠耳朵眼胡同而得名。其外皮酥脆不皮，内馅香甜爽口，是天津“三绝”之一。',
    category: '老字号美食',
    tags: ['美食', '老字号', '天津三绝'],
    viewCount: 2100,
    likes: 540,
    createdAt: '2024-11-01',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800&auto=format&fit=crop' // Fried golden snack
  },
  {
    id: '5',
    title: '泥人张彩塑',
    content: '泥人张彩塑是天津的一项民间艺术，由张明山创始于清代道光年间。其作品形象生动，色彩丰富，具有很高的艺术价值。',
    category: '传统艺术',
    tags: ['非遗', '泥人', '传统艺术'],
    viewCount: 1900,
    likes: 420,
    createdAt: '2024-11-05',
    imageUrl: 'https://images.unsplash.com/photo-1599582324717-589905b41052?q=80&w=800&auto=format&fit=crop' // Clay sculpture / art
  },
  {
    id: '6',
    title: '风筝魏',
    content: '风筝魏是天津著名风筝制作艺人魏元泰创造的风筝艺术。其风筝做工精细，飞行平稳，并在1915年巴拿马万国博览会上获得金奖。',
    category: '传统艺术',
    tags: ['非遗', '风筝', '传统技艺'],
    viewCount: 1600,
    likes: 380,
    createdAt: '2024-11-08',
    imageUrl: 'https://images.unsplash.com/photo-1534531173927-aeb928d54385?q=80&w=800&auto=format&fit=crop' // Kite in sky
  },
  {
    id: '7',
    title: '劝业场',
    content: '天津劝业场始建于1928年，是天津商业的象征之一，建筑风格中西合璧，承载了天津近代商业发展的历史记忆。',
    category: '历史建筑',
    tags: ['地标', '历史建筑', '商业文化'],
    viewCount: 2200,
    likes: 450,
    createdAt: '2024-11-12',
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=800&auto=format&fit=crop' // Historic architecture
  }
];
