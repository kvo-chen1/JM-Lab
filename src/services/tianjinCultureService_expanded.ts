/**
 * 天津历史文化知识库服务 - 扩展数据
 * 提供天津历史、文化、艺术等相关知识的查询和管理功能
 */

import { KnowledgeItem } from './tianjinCultureService';

// 扩展的天津文化知识数据
export const additionalKnowledgeBase: KnowledgeItem[] = [
  {
    id: 'tj-009',
    title: '李鸿章',
    category: '历史人物',
    subcategory: '晚清名臣',
    content: '李鸿章（1823-1901），字渐甫，号少荃，安徽合肥人，晚清名臣，洋务运动的主要领导人之一。他在天津任职期间，大力发展近代工业，创办了天津机器局、北洋水师学堂等重要机构，对天津的近代化进程产生了深远影响。天津的李鸿章故居和北洋大臣衙门旧址至今仍是重要的历史遗迹。',
    imageUrl: 'https://picsum.photos/seed/lihongzhang/600/300',
    relatedItems: ['tj-006', 'tj-022'],
    sources: ['《清史稿》', '《李鸿章传》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-010',
    title: '天津教案',
    category: '历史事件',
    subcategory: '近代外交',
    content: '天津教案发生于1870年，是晚清时期一起重大的中外冲突事件。起因是天津民众怀疑法国天主教堂拐骗儿童，引发民众围攻教堂和法国领事馆，导致多名外国传教士和修女死亡。事件发生后，清政府在外国压力下处死16名中国人，流放25人，并赔偿白银49万两。此事件反映了晚清时期中外矛盾的尖锐性。',
    relatedItems: ['tj-009', 'tj-008'],
    sources: ['《清史稿》', '《天津通史》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-011',
    title: '十八街麻花',
    category: '地方小吃',
    subcategory: '传统美食',
    content: '十八街麻花是天津著名的传统小吃，始创于清代，因产于天津南市十八街而得名。其特点是香、酥、脆、甜，制作工艺独特，采用发面、和面、搓条、拧花、油炸等多道工序。十八街麻花不仅口感独特，而且久放不绵，是天津人逢年过节、走亲访友的必备礼品。',
    imageUrl: 'https://picsum.photos/seed/mahua/600/300',
    relatedItems: ['tj-005', 'tj-021'],
    sources: ['《天津小吃志》', '《中华名吃》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-012',
    title: '耳朵眼炸糕',
    category: '地方小吃',
    subcategory: '传统美食',
    content: '耳朵眼炸糕是天津"三绝"之一，始创于清代光绪年间，因店铺位于耳朵眼胡同而得名。炸糕选用优质糯米做皮，红豆沙做馅，经油炸而成，外酥里嫩，香甜可口。耳朵眼炸糕制作工艺精细，选料讲究，是天津人喜爱的传统小吃，也是外地游客来津必尝的美食。',
    imageUrl: 'https://picsum.photos/seed/erduoyan/600/300',
    relatedItems: ['tj-005', 'tj-011'],
    sources: ['《天津小吃志》', '《中国名点》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-013',
    title: '天津快板',
    category: '文学艺术',
    subcategory: '曲艺',
    content: '天津快板是流行于天津地区的一种曲艺形式，以天津方言表演，节奏明快，语言诙谐幽默。表演者手持竹板，边打边说，内容多反映社会生活和民间故事。天津快板具有浓厚的地方特色，是天津曲艺文化的重要组成部分，深受天津市民喜爱。',
    relatedItems: ['tj-007', 'tj-003'],
    sources: ['《中国曲艺志·天津卷》', '《天津曲艺史》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-014',
    title: '煎饼果子',
    category: '地方小吃',
    subcategory: '传统早餐',
    content: '煎饼果子是天津最具代表性的传统早餐，由绿豆面煎饼、鸡蛋、油条（果子）或薄脆组成，配以甜面酱、葱花、香菜等调料。天津煎饼果子制作讲究，饼皮酥脆，果子香酥，酱料浓郁，是天津人早餐的首选。正宗的天津煎饼果子只在天津才能品尝到最地道的味道。',
    imageUrl: 'https://picsum.photos/seed/jianbing/600/300',
    relatedItems: ['tj-005', 'tj-011'],
    sources: ['《天津饮食文化》', '《中国早餐文化》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-015',
    title: '风筝魏',
    category: '传统技艺',
    subcategory: '风筝制作',
    content: '风筝魏是天津著名的风筝制作世家，创始于清代同治年间，以魏元泰为代表。风筝魏制作的风筝造型优美，工艺精湛，飞行稳定，被誉为"风筝之王"。其代表作有"锣鼓燕"、"仙鹤童子"等，多次在国际风筝比赛中获奖。风筝魏的制作技艺已被列入国家级非物质文化遗产名录。',
    imageUrl: 'https://picsum.photos/seed/fengzheng/600/300',
    relatedItems: ['tj-001', 'tj-002'],
    sources: ['《中国传统工艺全集》', '《天津民间艺术志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-016',
    title: '古文化街',
    category: '文化遗产',
    subcategory: '历史街区',
    content: '天津古文化街位于南开区东北角，是一条以经营文化用品为主的商业步行街。街道两旁店铺林立，主要经营古玩、字画、文房四宝、民俗工艺品等。古文化街保留了传统的建筑风格和商业模式，是天津传统文化的重要展示窗口，也是游客了解天津文化的好去处。',
    imageUrl: 'https://picsum.photos/seed/guwenhuajie/600/300',
    relatedItems: ['tj-008', 'tj-022'],
    sources: ['《天津地方志》', '《天津旅游指南》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-017',
    title: '袁世凯',
    category: '历史人物',
    subcategory: '北洋军阀',
    content: '袁世凯（1859-1916），字慰亭，河南项城人，北洋军阀首领，中华民国首任大总统。他在天津小站练兵期间，创建了新式陆军，培养了一大批军事人才，对近代中国军事现代化产生了重要影响。天津的袁世凯故居和北洋军阀相关遗迹是研究近代史的重要资料。',
    imageUrl: 'https://picsum.photos/seed/yuanshikai/600/300',
    relatedItems: ['tj-009', 'tj-006'],
    sources: ['《中华民国史》', '《袁世凯传》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-018',
    title: '天津港',
    category: '历史事件',
    subcategory: '港口发展',
    content: '天津港是中国北方最大的综合性港口，也是中国最早的对外通商口岸之一。1860年《北京条约》签订后，天津被辟为通商口岸，天津港开始近代化发展。经过一百多年的发展，天津港已成为世界级大港，是京津冀地区对外开放的重要门户，在中国经济发展中占有重要地位。',
    imageUrl: 'https://picsum.photos/seed/tianjingang/600/300',
    relatedItems: ['tj-010', 'tj-022'],
    sources: ['《天津港史》', '《中国港口发展史》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-019',
    title: '皇会',
    category: '民俗文化',
    subcategory: '传统节庆',
    content: '天津皇会是为庆祝天后宫妈祖诞辰而举行的盛大庙会活动，始于元代，盛于清代。皇会期间，各种民间花会、高跷、舞狮、舞龙等表演队伍沿街巡游，场面热闹非凡。皇会是天津最具特色的民俗活动之一，已被列入国家级非物质文化遗产名录。',
    relatedItems: ['tj-008', 'tj-016'],
    sources: ['《天津民俗志》', '《中国庙会文化》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-020',
    title: '相声',
    category: '文学艺术',
    subcategory: '曲艺',
    content: '天津是相声的重要发源地之一，被誉为"曲艺之乡"。天津相声以马三立、侯宝林等大师为代表，语言幽默风趣，表演生动活泼，深受观众喜爱。天津的茶馆相声更是独具特色，观众可以在品茶的同时欣赏精彩的相声表演，体验地道的天津文化。',
    relatedItems: ['tj-007', 'tj-013'],
    sources: ['《中国曲艺志·天津卷》', '《相声艺术论》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-021',
    title: '锅巴菜',
    category: '地方小吃',
    subcategory: '传统早餐',
    content: '锅巴菜是天津特有的传统早餐，由绿豆面煎饼切条后，配以卤汁、芝麻酱、香菜等调料制成。锅巴菜口感独特，既有煎饼的韧性，又有卤汁的鲜美，是天津人早餐桌上不可或缺的美食。与煎饼果子一样，锅巴菜也是天津饮食文化的重要代表。',
    imageUrl: 'https://picsum.photos/seed/guobacai/600/300',
    relatedItems: ['tj-014', 'tj-005'],
    sources: ['《天津饮食文化》', '《天津小吃大全》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-022',
    title: '海河',
    category: '历史事件',
    subcategory: '地理水系',
    content: '海河是天津的母亲河，由北运河、永定河、大清河、子牙河、南运河五大支流汇合而成，流经天津市区后注入渤海。海河对天津的城市发展具有决定性影响，天津的城市布局和经济发展都围绕海河展开。海河两岸风光秀丽，是天津城市景观的重要组成部分。',
    imageUrl: 'https://picsum.photos/seed/haihe/600/300',
    relatedItems: ['tj-004', 'tj-018'],
    sources: ['《海河志》', '《天津地理志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-023',
    title: '大悲禅院',
    category: '宗教信仰',
    subcategory: '佛教',
    content: '大悲禅院位于天津市河北区，是天津现存规模最大、历史最为悠久的佛教寺院。寺院始建于清代顺治年间，历经多次修缮扩建。大悲禅院建筑宏伟，香火旺盛，是天津佛教活动的中心。寺内供奉的千手观音像高达数米，是寺院的镇寺之宝。',
    imageUrl: 'https://picsum.photos/seed/dabeichanyuan/600/300',
    relatedItems: ['tj-008', 'tj-016'],
    sources: ['《天津佛教史》', '《中国佛教寺院志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tj-024',
    title: '独乐寺',
    category: '宗教信仰',
    subcategory: '佛教',
    content: '独乐寺位于天津市蓟州区，是中国现存最古老的木结构建筑之一，始建于唐代，辽代重建。寺内的山门和观音阁是中国古代建筑的杰作，具有极高的历史和艺术价值。独乐寺是研究中国古代建筑史的重要实物资料，也是天津重要的文化遗产。',
    imageUrl: 'https://picsum.photos/seed/dulesi/600/300',
    relatedItems: ['tj-023', 'tj-006'],
    sources: ['《中国古代建筑史》', '《天津文物志》'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];
