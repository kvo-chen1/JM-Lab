/**
 * 文化主题活动日历服务 - 提供活动日历相关功能
 */

// 活动类型定义
export type EventType = 'theme' | 'collaboration' | 'competition' | 'workshop' | 'exhibition';

// 活动状态类型
export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

// 文化主题活动接口
export interface CulturalEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  onlineLink?: string;
  organizer: string;
  image: string;
  tags: string[];
  culturalElements: string[];
  participantCount: number;
  maxParticipants?: number;
  registrationDeadline?: string;
  hasPrize: boolean;
  prizeDescription?: string;
  rules?: string[];
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

// 活动参与记录接口
export interface EventParticipation {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  registeredAt: string;
  status: 'registered' | 'submitted' | 'completed' | 'winner';
  submissionId?: string;
  submissionTitle?: string;
  submissionDescription?: string;
  submissionImage?: string;
  ranking?: number;
}

// 活动日历服务类
class EventCalendarService {
  // 本地存储键名
  private EVENTS_KEY = 'jmzf_cultural_events';
  private PARTICIPATIONS_KEY = 'jmzf_event_participations';
  private USER_EVENTS_KEY = 'jmzf_user_events';

  // 模拟数据
  private events: CulturalEvent[] = [
    {
      id: 'event-001',
      title: '国潮文化创意设计大赛',
      description: '融合传统中国文化元素与现代设计风格的创意设计大赛',
      type: 'competition',
      status: 'upcoming',
      startDate: '2025-12-15',
      endDate: '2026-01-31',
      startTime: '00:00',
      endTime: '23:59',
      organizer: '津脉智坊',
      image: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=800',
      tags: ['国潮', '设计', '大赛'],
      culturalElements: ['中国传统纹样', '中国传统色彩', '传统工艺'],
      participantCount: 128,
      maxParticipants: 500,
      registrationDeadline: '2026-01-15',
      hasPrize: true,
      prizeDescription: '一等奖1名：10000元现金 + 荣誉证书\n二等奖3名：5000元现金 + 荣誉证书\n三等奖5名：2000元现金 + 荣誉证书\n优秀奖10名：荣誉证书',
      rules: [
        '参赛作品必须为原创，未侵犯他人知识产权',
        '作品需融合至少一种中国传统元素',
        '每人最多可提交3件作品',
        '提交格式为PNG、JPG或SVG',
        '作品分辨率不低于1920x1080'
      ],
      requirements: [
        '提交作品设计说明（100-500字）',
        '说明作品中使用的文化元素及其来源',
        '提供作品创作过程（可选）'
      ],
      createdAt: '2025-11-01T00:00:00.000Z',
      updatedAt: '2025-11-10T00:00:00.000Z'
    },
    {
      id: 'event-002',
      title: '天津文化创意工作坊',
      description: '学习天津传统文化元素，创作具有天津特色的创意作品',
      type: 'workshop',
      status: 'ongoing',
      startDate: '2025-11-01',
      endDate: '2025-12-31',
      startTime: '14:00',
      endTime: '17:00',
      location: '天津市和平区文化中心',
      organizer: '天津文化创意产业协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Tianjin%20cultural%20creative%20workshop%20banner',
      tags: ['天津', '文化', '工作坊'],
      culturalElements: ['杨柳青年画', '泥人张', '天津方言', '天津小吃'],
      participantCount: 45,
      maxParticipants: 100,
      registrationDeadline: '2025-12-20',
      hasPrize: false,
      createdAt: '2025-10-15T00:00:00.000Z',
      updatedAt: '2025-11-05T00:00:00.000Z'
    },
    {
      id: 'event-003',
      title: '非遗文化数字创意展',
      description: '展示非遗文化的数字创意作品，推动非遗文化的传承与创新',
      type: 'exhibition',
      status: 'upcoming',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      onlineLink: 'https://exhibition.example.com',
      organizer: '中国非遗保护中心',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Intangible%20cultural%20heritage%20digital%20exhibition%20banner',
      tags: ['非遗', '数字创意', '展览'],
      culturalElements: ['非遗', '传统工艺', '民族文化'],
      participantCount: 0,
      hasPrize: false,
      createdAt: '2025-11-20T00:00:00.000Z',
      updatedAt: '2025-11-20T00:00:00.000Z'
    },
    {
      id: 'event-004',
      title: '传统文化元素AI共创活动',
      description: '使用AI工具创作融合传统文化元素的作品',
      type: 'collaboration',
      status: 'completed',
      startDate: '2025-09-01',
      endDate: '2025-10-31',
      startTime: '00:00',
      endTime: '23:59',
      onlineLink: 'https://collab.example.com',
      organizer: '津脉智坊',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20culture%20AI%20collaboration%20event%20banner',
      tags: ['AI', '共创', '传统文化'],
      culturalElements: ['中国传统纹样', '书法', '国画', '传统色彩'],
      participantCount: 234,
      hasPrize: true,
      prizeDescription: '优秀作品将获得AI创作工具免费使用权限',
      createdAt: '2025-08-15T00:00:00.000Z',
      updatedAt: '2025-10-31T00:00:00.000Z'
    },
    // 新增活动：即将开始的主题活动
    {
      id: 'event-005',
      title: '传统文化主题活动周',
      description: '为期一周的传统文化主题活动，包括讲座、体验和展示',
      type: 'theme',
      status: 'upcoming',
      startDate: '2025-11-20',
      endDate: '2025-11-27',
      startTime: '09:00',
      endTime: '18:00',
      location: '北京市朝阳区文化中心',
      organizer: '中国传统文化促进会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20culture%20theme%20week%20event%20banner',
      tags: ['传统文化', '主题活动', '讲座'],
      culturalElements: ['儒家文化', '道家思想', '传统礼仪', '茶文化'],
      participantCount: 89,
      maxParticipants: 200,
      registrationDeadline: '2025-11-15',
      hasPrize: false,
      createdAt: '2025-10-20T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增活动：即将开始的竞赛活动
    {
      id: 'event-006',
      title: '汉字文化创意设计大赛',
      description: '以汉字为核心元素，创作具有创意的设计作品',
      type: 'competition',
      status: 'upcoming',
      startDate: '2025-12-01',
      endDate: '2026-01-15',
      startTime: '00:00',
      endTime: '23:59',
      organizer: '中国文字博物馆',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20character%20cultural%20creative%20design%20competition%20banner',
      tags: ['汉字', '设计', '大赛'],
      culturalElements: ['汉字文化', '书法', '篆刻', '传统排版'],
      participantCount: 156,
      maxParticipants: 300,
      registrationDeadline: '2025-12-25',
      hasPrize: true,
      prizeDescription: '一等奖1名：8000元现金 + 荣誉证书\n二等奖2名：4000元现金 + 荣誉证书\n三等奖5名：1500元现金 + 荣誉证书\n优秀奖20名：荣誉证书',
      rules: [
        '参赛作品必须以汉字为核心元素',
        '作品需体现汉字的文化内涵',
        '每人最多可提交2件作品',
        '提交格式为PNG、JPG或PDF',
        '作品分辨率不低于300dpi'
      ],
      requirements: [
        '提交作品设计说明（150-800字）',
        '说明作品的创意来源和文化意义',
        '提供作品高清图片'
      ],
      createdAt: '2025-10-10T00:00:00.000Z',
      updatedAt: '2025-11-05T00:00:00.000Z'
    },
    // 新增活动：即将开始的工作坊
    {
      id: 'event-007',
      title: '传统剪纸艺术工作坊',
      description: '学习中国传统剪纸艺术，创作精美剪纸作品',
      type: 'workshop',
      status: 'upcoming',
      startDate: '2025-11-25',
      endDate: '2025-12-25',
      startTime: '10:00',
      endTime: '12:00',
      location: '上海市黄浦区群众艺术馆',
      organizer: '上海民间文艺家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20paper%20cutting%20art%20workshop%20banner',
      tags: ['剪纸', '传统工艺', '工作坊'],
      culturalElements: ['剪纸艺术', '传统纹样', '民俗文化'],
      participantCount: 23,
      maxParticipants: 50,
      registrationDeadline: '2025-11-20',
      hasPrize: false,
      createdAt: '2025-10-25T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增活动：进行中的协作活动
    {
      id: 'event-008',
      title: '传统音乐数字协作计划',
      description: '邀请音乐人合作创作融合传统音乐元素的数字音乐作品',
      type: 'collaboration',
      status: 'ongoing',
      startDate: '2025-10-15',
      endDate: '2025-12-15',
      startTime: '00:00',
      endTime: '23:59',
      onlineLink: 'https://music-collab.example.com',
      organizer: '中国音乐家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20music%20digital%20collaboration%20project%20banner',
      tags: ['音乐', '协作', '传统音乐'],
      culturalElements: ['传统乐器', '古典音乐', '民族音乐', '戏曲元素'],
      participantCount: 145,
      hasPrize: true,
      prizeDescription: '优秀作品将在全国数字音乐平台推广',
      createdAt: '2025-09-20T00:00:00.000Z',
      updatedAt: '2025-10-15T00:00:00.000Z'
    },
    // 新增活动：进行中的展览
    {
      id: 'event-009',
      title: '中国传统陶瓷艺术展',
      description: '展示中国传统陶瓷艺术的发展历程和精美作品',
      type: 'exhibition',
      status: 'ongoing',
      startDate: '2025-11-05',
      endDate: '2025-12-05',
      startTime: '09:00',
      endTime: '17:00',
      location: '广州市天河区艺术博物馆',
      organizer: '中国陶瓷工业协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20traditional%20ceramic%20art%20exhibition%20banner',
      tags: ['陶瓷', '传统工艺', '展览'],
      culturalElements: ['陶瓷艺术', '景德镇陶瓷', '钧瓷', '青花瓷'],
      participantCount: 345,
      hasPrize: false,
      createdAt: '2025-10-05T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增活动：已结束的主题活动
    {
      id: 'event-010',
      title: '中秋文化主题活动',
      description: '庆祝中秋节，体验传统中秋文化活动',
      type: 'theme',
      status: 'completed',
      startDate: '2025-09-15',
      endDate: '2025-09-17',
      startTime: '18:00',
      endTime: '21:00',
      location: '全国各地文化广场',
      organizer: '中国民间文艺家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Mid-Autumn%20Festival%20cultural%20theme%20event%20banner',
      tags: ['中秋节', '传统节日', '主题活动'],
      culturalElements: ['中秋文化', '月饼文化', '赏月习俗', '嫦娥奔月'],
      participantCount: 567,
      hasPrize: true,
      prizeDescription: '参与活动可获得传统月饼礼盒',
      createdAt: '2025-08-15T00:00:00.000Z',
      updatedAt: '2025-09-17T00:00:00.000Z'
    },
    // 新增活动：已结束的工作坊
    {
      id: 'event-011',
      title: '传统书法入门工作坊',
      description: '学习中国传统书法的基本技巧和理论',
      type: 'workshop',
      status: 'completed',
      startDate: '2025-08-01',
      endDate: '2025-08-31',
      startTime: '14:00',
      endTime: '16:00',
      location: '深圳市南山区图书馆',
      organizer: '深圳书法家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20calligraphy%20beginner%20workshop%20banner',
      tags: ['书法', '传统艺术', '工作坊'],
      culturalElements: ['书法艺术', '楷书', '行书', '文房四宝'],
      participantCount: 67,
      maxParticipants: 80,
      hasPrize: false,
      createdAt: '2025-07-10T00:00:00.000Z',
      updatedAt: '2025-08-31T00:00:00.000Z'
    },
    // 新增活动：已结束的竞赛
    {
      id: 'event-012',
      title: '传统建筑摄影大赛',
      description: '拍摄中国传统建筑，展示传统建筑之美',
      type: 'competition',
      status: 'completed',
      startDate: '2025-07-01',
      endDate: '2025-08-31',
      startTime: '00:00',
      endTime: '23:59',
      organizer: '中国摄影家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20architecture%20photography%20competition%20banner',
      tags: ['摄影', '建筑', '传统建筑'],
      culturalElements: ['传统建筑', '故宫', '园林', '古村落'],
      participantCount: 342,
      hasPrize: true,
      prizeDescription: '一等奖1名：5000元现金 + 摄影器材\n二等奖3名：2000元现金 + 摄影器材\n三等奖5名：1000元现金 + 摄影器材\n优秀奖20名：摄影器材优惠券',
      rules: [
        '参赛作品必须拍摄中国传统建筑',
        '作品需体现传统建筑的美感和文化内涵',
        '每人最多可提交5件作品',
        '提交格式为JPG或RAW',
        '作品分辨率不低于3000x2000像素'
      ],
      requirements: [
        '提交作品拍摄地点和时间',
        '说明作品的构图思路和文化意义',
        '提供作品原始文件'
      ],
      createdAt: '2025-06-15T00:00:00.000Z',
      updatedAt: '2025-08-31T00:00:00.000Z'
    },
    // 新增主题活动 - 1
    {
      id: 'event-013',
      title: '春节文化主题活动',
      description: '庆祝春节，体验传统春节文化活动，包括写春联、剪窗花、包饺子等',
      type: 'theme',
      status: 'upcoming',
      startDate: '2026-01-20',
      endDate: '2026-02-10',
      startTime: '09:00',
      endTime: '18:00',
      location: '全国各地文化中心',
      organizer: '中国民间文艺家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Spring%20Festival%20cultural%20theme%20event%20banner',
      tags: ['春节', '传统节日', '文化体验'],
      culturalElements: ['春节文化', '春联', '窗花', '饺子', '鞭炮'],
      participantCount: 0,
      maxParticipants: 1000,
      registrationDeadline: '2026-01-15',
      hasPrize: true,
      prizeDescription: '参与活动可获得春节文化大礼包',
      createdAt: '2025-11-01T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增主题活动 - 2
    {
      id: 'event-014',
      title: '端午文化节',
      description: '纪念屈原，体验传统端午文化，包括包粽子、赛龙舟、挂艾草等活动',
      type: 'theme',
      status: 'upcoming',
      startDate: '2026-06-10',
      endDate: '2026-06-15',
      startTime: '08:00',
      endTime: '20:00',
      location: '杭州市西湖区文化广场',
      organizer: '杭州市文化和旅游局',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Dragon%20Boat%20Festival%20cultural%20event%20banner',
      tags: ['端午节', '龙舟赛', '粽子'],
      culturalElements: ['端午文化', '屈原', '龙舟', '粽子', '艾草'],
      participantCount: 123,
      maxParticipants: 500,
      registrationDeadline: '2026-06-05',
      hasPrize: true,
      prizeDescription: '龙舟赛冠军队伍将获得10000元奖金',
      createdAt: '2025-11-05T00:00:00.000Z',
      updatedAt: '2025-11-05T00:00:00.000Z'
    },
    // 新增主题活动 - 3
    {
      id: 'event-015',
      title: '中秋赏月文化活动',
      description: '中秋佳节，一起赏月、品月饼、听中秋故事，感受传统中秋文化',
      type: 'theme',
      status: 'upcoming',
      startDate: '2026-09-18',
      endDate: '2026-09-20',
      startTime: '17:00',
      endTime: '22:00',
      location: '北京市海淀区颐和园',
      organizer: '北京市文化和旅游局',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Mid-Autumn%20Festival%20moon%20viewing%20event%20banner',
      tags: ['中秋节', '赏月', '月饼'],
      culturalElements: ['中秋文化', '月亮', '月饼', '嫦娥奔月', '吴刚伐桂'],
      participantCount: 89,
      maxParticipants: 300,
      registrationDeadline: '2026-09-15',
      hasPrize: false,
      createdAt: '2025-11-10T00:00:00.000Z',
      updatedAt: '2025-11-10T00:00:00.000Z'
    },
    // 新增主题活动 - 4
    {
      id: 'event-016',
      title: '汉服文化主题展',
      description: '展示传统汉服文化，包括汉服走秀、汉服制作工艺、汉服文化讲座等',
      type: 'theme',
      status: 'ongoing',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
      startTime: '10:00',
      endTime: '17:00',
      location: '成都市锦江区博物馆',
      organizer: '中国汉服文化协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Hanfu%20cultural%20theme%20exhibition%20banner',
      tags: ['汉服', '传统文化', '服饰'],
      culturalElements: ['汉服文化', '传统服饰', '礼仪', '刺绣'],
      participantCount: 234,
      maxParticipants: 500,
      hasPrize: false,
      createdAt: '2025-10-15T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增主题活动 - 5
    {
      id: 'event-017',
      title: '茶文化体验周',
      description: '体验中国传统茶文化，包括茶艺表演、茶叶品鉴、茶文化讲座等',
      type: 'theme',
      status: 'ongoing',
      startDate: '2025-11-10',
      endDate: '2025-11-17',
      startTime: '14:00',
      endTime: '18:00',
      location: '上海市静安区茶文化中心',
      organizer: '中国茶叶流通协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Tea%20culture%20experience%20week%20banner',
      tags: ['茶文化', '茶艺', '茶叶品鉴'],
      culturalElements: ['茶文化', '茶道', '茶艺', '茶叶', '茶具'],
      participantCount: 156,
      maxParticipants: 200,
      hasPrize: false,
      createdAt: '2025-10-20T00:00:00.000Z',
      updatedAt: '2025-11-10T00:00:00.000Z'
    },
    // 新增主题活动 - 6
    {
      id: 'event-018',
      title: '重阳敬老文化活动',
      description: '庆祝重阳节，弘扬敬老爱老传统，包括老年书画展、健康讲座、文艺表演等',
      type: 'theme',
      status: 'completed',
      startDate: '2025-10-15',
      endDate: '2025-10-20',
      startTime: '09:00',
      endTime: '16:00',
      location: '南京市玄武区老年活动中心',
      organizer: '南京市老龄工作委员会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Double%20Ninth%20Festival%20elderly%20care%20event%20banner',
      tags: ['重阳节', '敬老', '传统文化'],
      culturalElements: ['重阳节', '敬老文化', '菊花', '登高', '茱萸'],
      participantCount: 456,
      hasPrize: false,
      createdAt: '2025-09-20T00:00:00.000Z',
      updatedAt: '2025-10-20T00:00:00.000Z'
    },
    // 新增协作活动 - 1
    {
      id: 'event-019',
      title: '传统工艺数字保护计划',
      description: '邀请设计师和技术人员合作，将传统工艺数字化保护和传承',
      type: 'collaboration',
      status: 'upcoming',
      startDate: '2025-12-01',
      endDate: '2026-03-31',
      startTime: '00:00',
      endTime: '23:59',
      onlineLink: 'https://craft-digital.example.com',
      organizer: '中国非物质文化遗产保护中心',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20craft%20digital%20preservation%20collaboration%20banner',
      tags: ['传统工艺', '数字化', '协作'],
      culturalElements: ['传统工艺', '数字技术', '文化传承'],
      participantCount: 56,
      maxParticipants: 200,
      registrationDeadline: '2025-11-25',
      hasPrize: true,
      prizeDescription: '优秀项目将获得10万元资助',
      createdAt: '2025-10-01T00:00:00.000Z',
      updatedAt: '2025-10-01T00:00:00.000Z'
    },
    // 新增协作活动 - 2
    {
      id: 'event-020',
      title: '传统文化短视频创作营',
      description: '邀请内容创作者和传统文化专家合作，创作高质量的传统文化短视频',
      type: 'collaboration',
      status: 'ongoing',
      startDate: '2025-10-01',
      endDate: '2025-12-31',
      startTime: '00:00',
      endTime: '23:59',
      onlineLink: 'https://culture-video.example.com',
      organizer: '中国文化传媒集团',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20culture%20short%20video%20creation%20camp%20banner',
      tags: ['短视频', '创作', '传统文化'],
      culturalElements: ['传统文化', '数字媒体', '内容创作'],
      participantCount: 189,
      maxParticipants: 300,
      hasPrize: true,
      prizeDescription: '优秀作品将获得平台流量支持和奖金',
      createdAt: '2025-09-15T00:00:00.000Z',
      updatedAt: '2025-10-01T00:00:00.000Z'
    },
    // 新增协作活动 - 3
    {
      id: 'event-021',
      title: '古村落保护与发展设计竞赛',
      description: '邀请建筑师、设计师和当地居民合作，为古村落保护与发展提供设计方案',
      type: 'collaboration',
      status: 'ongoing',
      startDate: '2025-11-01',
      endDate: '2026-02-28',
      startTime: '00:00',
      endTime: '23:59',
      organizer: '中国建筑学会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Ancient%20village%20protection%20and%20development%20design%20competition%20banner',
      tags: ['古村落', '保护', '设计', '协作'],
      culturalElements: ['古村落', '传统建筑', '乡村振兴'],
      participantCount: 102,
      maxParticipants: 150,
      registrationDeadline: '2025-12-31',
      hasPrize: true,
      prizeDescription: '一等奖1名：20万元奖金 + 项目落地机会\n二等奖2名：10万元奖金\n三等奖3名：5万元奖金',
      createdAt: '2025-10-10T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增协作活动 - 4
    {
      id: 'event-022',
      title: '传统音乐与现代音乐融合创作',
      description: '邀请传统音乐家和现代音乐人合作，创作融合传统音乐元素的现代音乐作品',
      type: 'collaboration',
      status: 'completed',
      startDate: '2025-08-01',
      endDate: '2025-10-31',
      startTime: '00:00',
      endTime: '23:59',
      onlineLink: 'https://music-fusion.example.com',
      organizer: '中国音乐家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20and%20modern%20music%20fusion%20creation%20banner',
      tags: ['音乐', '融合', '传统音乐', '现代音乐'],
      culturalElements: ['传统音乐', '现代音乐', '乐器', '旋律'],
      participantCount: 234,
      hasPrize: true,
      prizeDescription: '优秀作品将在全国音乐平台推广',
      createdAt: '2025-07-15T00:00:00.000Z',
      updatedAt: '2025-10-31T00:00:00.000Z'
    },
    // 新增竞赛活动 - 1
    {
      id: 'event-023',
      title: '中国传统纹样设计大赛',
      description: '以中国传统纹样为元素，创作具有现代感的设计作品',
      type: 'competition',
      status: 'upcoming',
      startDate: '2025-12-10',
      endDate: '2026-02-28',
      startTime: '00:00',
      endTime: '23:59',
      organizer: '中国美术家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20traditional%20pattern%20design%20competition%20banner',
      tags: ['纹样', '设计', '传统元素'],
      culturalElements: ['传统纹样', '中国结', '云纹', '龙纹', '凤纹'],
      participantCount: 89,
      maxParticipants: 500,
      registrationDeadline: '2026-02-15',
      hasPrize: true,
      prizeDescription: '一等奖1名：15000元现金 + 荣誉证书\n二等奖3名：8000元现金 + 荣誉证书\n三等奖5名：5000元现金 + 荣誉证书\n优秀奖20名：1000元现金 + 荣誉证书',
      rules: [
        '参赛作品必须以中国传统纹样为核心元素',
        '作品需体现传统与现代的融合',
        '每人最多可提交3件作品',
        '提交格式为PNG、JPG或AI',
        '作品分辨率不低于300dpi'
      ],
      requirements: [
        '提交作品设计说明',
        '说明使用的传统纹样及其文化内涵',
        '提供作品高清图片'
      ],
      createdAt: '2025-11-01T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增竞赛活动 - 2
    {
      id: 'event-024',
      title: '传统美食创意大赛',
      description: '以传统美食为基础，创作具有创意的新菜品',
      type: 'competition',
      status: 'upcoming',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      startTime: '00:00',
      endTime: '23:59',
      organizer: '中国烹饪协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20food%20creative%20competition%20banner',
      tags: ['美食', '烹饪', '传统美食', '创意'],
      culturalElements: ['传统美食', '烹饪技艺', '饮食文化'],
      participantCount: 123,
      maxParticipants: 300,
      registrationDeadline: '2026-03-15',
      hasPrize: true,
      prizeDescription: '一等奖1名：8000元现金 + 美食专栏机会\n二等奖2名：5000元现金\n三等奖3名：3000元现金\n优秀奖10名：1000元现金',
      rules: [
        '参赛作品必须以传统美食为基础',
        '作品需体现创意和创新性',
        '每人最多可提交2件作品',
        '提交作品制作视频和图片',
        '说明作品的传统渊源和创意点'
      ],
      createdAt: '2025-11-10T00:00:00.000Z',
      updatedAt: '2025-11-10T00:00:00.000Z'
    },
    // 新增竞赛活动 - 3
    {
      id: 'event-025',
      title: '传统故事新编创作大赛',
      description: '以中国传统故事为基础，创作具有现代意义的新故事',
      type: 'competition',
      status: 'ongoing',
      startDate: '2025-10-01',
      endDate: '2025-12-31',
      startTime: '00:00',
      endTime: '23:59',
      onlineLink: 'https://story-reimagined.example.com',
      organizer: '中国作家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20story%20reimagined%20creative%20competition%20banner',
      tags: ['故事', '创作', '传统故事', '新编'],
      culturalElements: ['传统故事', '神话传说', '民间故事'],
      participantCount: 234,
      maxParticipants: 1000,
      registrationDeadline: '2025-12-15',
      hasPrize: true,
      prizeDescription: '一等奖1名：10000元现金 + 出版机会\n二等奖2名：5000元现金\n三等奖5名：2000元现金\n优秀奖20名：500元现金',
      rules: [
        '参赛作品必须以中国传统故事为基础',
        '作品需体现现代意义和价值观',
        '每人最多可提交1件作品',
        '作品字数在3000-10000字之间',
        '提交作品电子文档'
      ],
      createdAt: '2025-09-15T00:00:00.000Z',
      updatedAt: '2025-10-01T00:00:00.000Z'
    },
    // 新增竞赛活动 - 4
    {
      id: 'event-026',
      title: '传统乐器演奏大赛',
      description: '展示传统乐器演奏技艺，传承和弘扬传统音乐文化',
      type: 'competition',
      status: 'completed',
      startDate: '2025-08-01',
      endDate: '2025-09-30',
      startTime: '00:00',
      endTime: '23:59',
      organizer: '中国音乐家协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20musical%20instrument%20performance%20competition%20banner',
      tags: ['乐器', '演奏', '传统音乐'],
      culturalElements: ['传统乐器', '古筝', '琵琶', '二胡', '笛子'],
      participantCount: 345,
      hasPrize: true,
      prizeDescription: '一等奖1名：10000元现金 + 演出机会\n二等奖3名：5000元现金\n三等奖5名：2000元现金\n优秀奖10名：1000元现金',
      rules: [
        '参赛作品必须使用传统乐器演奏',
        '可以演奏传统曲目或改编曲目',
        '每人最多可提交1件作品',
        '提交演奏视频',
        '视频时长不超过10分钟'
      ],
      createdAt: '2025-07-10T00:00:00.000Z',
      updatedAt: '2025-09-30T00:00:00.000Z'
    },
    // 新增工作坊活动 - 1
    {
      id: 'event-027',
      title: '传统木雕技艺工作坊',
      description: '学习传统木雕技艺，创作精美的木雕作品',
      type: 'workshop',
      status: 'upcoming',
      startDate: '2025-12-05',
      endDate: '2025-12-12',
      startTime: '10:00',
      endTime: '17:00',
      location: '福州市鼓楼区工艺美术学院',
      organizer: '福建省工艺美术协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20wood%20carving%20art%20workshop%20banner',
      tags: ['木雕', '传统工艺', '手工'],
      culturalElements: ['木雕技艺', '传统雕刻', '木材'],
      participantCount: 12,
      maxParticipants: 30,
      registrationDeadline: '2025-11-30',
      hasPrize: false,
      createdAt: '2025-11-01T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增工作坊活动 - 2
    {
      id: 'event-028',
      title: '传统造纸工艺体验',
      description: '学习传统造纸工艺，亲手制作纸张',
      type: 'workshop',
      status: 'ongoing',
      startDate: '2025-11-01',
      endDate: '2025-12-31',
      startTime: '14:00',
      endTime: '16:00',
      location: '昆明市官渡区文化创意园',
      organizer: '云南省非物质文化遗产保护中心',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20paper%20making%20workshop%20banner',
      tags: ['造纸', '传统工艺', '体验'],
      culturalElements: ['造纸术', '传统工艺', '纤维'],
      participantCount: 67,
      maxParticipants: 200,
      hasPrize: false,
      createdAt: '2025-10-15T00:00:00.000Z',
      updatedAt: '2025-11-01T00:00:00.000Z'
    },
    // 新增工作坊活动 - 3
    {
      id: 'event-029',
      title: '传统染织技艺工作坊',
      description: '学习传统染织技艺，包括扎染、蜡染、蓝印花布等',
      type: 'workshop',
      status: 'completed',
      startDate: '2025-09-01',
      endDate: '2025-09-30',
      startTime: '10:00',
      endTime: '17:00',
      location: '苏州市吴江区丝绸博物馆',
      organizer: '苏州市文化和旅游局',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20textile%20dyeing%20workshop%20banner',
      tags: ['染织', '传统工艺', '扎染', '蜡染'],
      culturalElements: ['染织技艺', '扎染', '蜡染', '蓝印花布'],
      participantCount: 123,
      maxParticipants: 150,
      hasPrize: false,
      createdAt: '2025-08-15T00:00:00.000Z',
      updatedAt: '2025-09-30T00:00:00.000Z'
    },
    // 新增展览活动 - 1
    {
      id: 'event-030',
      title: '中国传统书画展',
      description: '展示中国传统书画作品，包括书法、国画、篆刻等',
      type: 'exhibition',
      status: 'upcoming',
      startDate: '2026-01-10',
      endDate: '2026-03-10',
      startTime: '09:00',
      endTime: '17:00',
      location: '北京市东城区中国美术馆',
      organizer: '中国美术馆',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20traditional%20calligraphy%20and%20painting%20exhibition%20banner',
      tags: ['书画', '传统艺术', '展览'],
      culturalElements: ['书法', '国画', '篆刻', '传统美学'],
      participantCount: 0,
      maxParticipants: 5000,
      hasPrize: false,
      createdAt: '2025-11-05T00:00:00.000Z',
      updatedAt: '2025-11-05T00:00:00.000Z'
    }
  ];

  // 模拟参与记录数据
  private participations: EventParticipation[] = [];

  constructor() {
    // 初始化时从本地存储加载数据
    this.loadData();
  }

  // 加载数据
  private loadData(): void {
    try {
      const eventsRaw = localStorage.getItem(this.EVENTS_KEY);
      if (eventsRaw) {
        this.events = JSON.parse(eventsRaw);
      }

      const participationsRaw = localStorage.getItem(this.PARTICIPATIONS_KEY);
      if (participationsRaw) {
        this.participations = JSON.parse(participationsRaw);
      }
    } catch (error) {
      console.error('Failed to load event data:', error);
    }
  }

  // 保存活动数据
  private saveEvents(): void {
    try {
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  // 保存参与记录数据
  private saveParticipations(): void {
    try {
      localStorage.setItem(this.PARTICIPATIONS_KEY, JSON.stringify(this.participations));
    } catch (error) {
      console.error('Failed to save participations:', error);
    }
  }

  /**
   * 获取所有文化主题活动
   */
  getAllEvents(): CulturalEvent[] {
    return [...this.events];
  }

  /**
   * 根据ID获取单个活动
   */
  getEventById(id: string): CulturalEvent | undefined {
    return this.events.find(event => event.id === id);
  }

  /**
   * 根据状态获取活动
   */
  getEventsByStatus(status: EventStatus): CulturalEvent[] {
    return this.events.filter(event => event.status === status);
  }

  /**
   * 根据类型获取活动
   */
  getEventsByType(type: EventType): CulturalEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * 获取即将开始的活动
   */
  getUpcomingEvents(limit?: number): CulturalEvent[] {
    const now = new Date();
    return this.events
      .filter(event => event.status === 'upcoming' || event.status === 'ongoing')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit);
  }

  /**
   * 获取最近结束的活动
   */
  getRecentCompletedEvents(limit?: number): CulturalEvent[] {
    return this.events
      .filter(event => event.status === 'completed')
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      .slice(0, limit);
  }

  /**
   * 根据文化元素获取活动
   */
  getEventsByCulturalElement(element: string): CulturalEvent[] {
    return this.events.filter(event => event.culturalElements.includes(element));
  }

  /**
   * 根据标签获取活动
   */
  getEventsByTag(tag: string): CulturalEvent[] {
    return this.events.filter(event => event.tags.includes(tag));
  }

  /**
   * 搜索活动
   */
  searchEvents(keyword: string): CulturalEvent[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.events.filter(event => 
      event.title.toLowerCase().includes(lowerKeyword) ||
      event.description.toLowerCase().includes(lowerKeyword) ||
      event.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      event.culturalElements.some(element => element.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * 创建新活动
   */
  createEvent(event: Omit<CulturalEvent, 'id' | 'participantCount' | 'createdAt' | 'updatedAt'>): CulturalEvent {
    const newEvent: CulturalEvent = {
      ...event,
      id: `event-${Date.now()}`,
      participantCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  /**
   * 更新活动信息
   */
  updateEvent(id: string, updates: Partial<Omit<CulturalEvent, 'id' | 'createdAt'>>): boolean {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) {
      return false;
    }

    this.events[index] = {
      ...this.events[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveEvents();
    return true;
  }

  /**
   * 注册参加活动
   */
  registerForEvent(
    eventId: string,
    userId: string,
    userName: string,
    userAvatar: string
  ): EventParticipation {
    const event = this.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // 检查是否已达到最大参与人数
    if (event.maxParticipants && event.participantCount >= event.maxParticipants) {
      throw new Error('Event is full');
    }

    // 检查是否已注册
    const existingParticipation = this.participations.find(
      p => p.eventId === eventId && p.userId === userId
    );

    if (existingParticipation) {
      return existingParticipation;
    }

    const participation: EventParticipation = {
      id: `participation-${Date.now()}`,
      eventId,
      userId,
      userName,
      userAvatar,
      registeredAt: new Date().toISOString(),
      status: 'registered'
    };

    this.participations.push(participation);
    this.saveParticipations();

    // 更新活动参与人数
    this.updateEvent(eventId, { participantCount: event.participantCount + 1 });

    return participation;
  }

  /**
   * 提交活动作品
   */
  submitEventWork(
    participationId: string,
    workId: string,
    title: string,
    description: string,
    image: string
  ): boolean {
    const index = this.participations.findIndex(p => p.id === participationId);
    if (index === -1) {
      return false;
    }

    this.participations[index] = {
      ...this.participations[index],
      status: 'submitted',
      submissionId: workId,
      submissionTitle: title,
      submissionDescription: description,
      submissionImage: image
    };

    this.saveParticipations();
    return true;
  }

  /**
   * 获取活动参与记录
   */
  getEventParticipations(eventId: string): EventParticipation[] {
    return this.participations.filter(p => p.eventId === eventId);
  }

  /**
   * 获取用户的活动参与记录
   */
  getUserParticipations(userId: string): EventParticipation[] {
    return this.participations.filter(p => p.userId === userId);
  }

  /**
   * 获取活动统计信息
   */
  getEventStats(): {
    totalEvents: number;
    upcomingEvents: number;
    ongoingEvents: number;
    completedEvents: number;
    totalParticipants: number;
    averageParticipantsPerEvent: number;
    eventsByType: Record<EventType, number>;
  } {
    const totalEvents = this.events.length;
    const upcomingEvents = this.events.filter(e => e.status === 'upcoming').length;
    const ongoingEvents = this.events.filter(e => e.status === 'ongoing').length;
    const completedEvents = this.events.filter(e => e.status === 'completed').length;
    const totalParticipants = this.participations.length;
    const averageParticipantsPerEvent = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;
    
    const eventsByType: Record<EventType, number> = {
      theme: this.events.filter(e => e.type === 'theme').length,
      collaboration: this.events.filter(e => e.type === 'collaboration').length,
      competition: this.events.filter(e => e.type === 'competition').length,
      workshop: this.events.filter(e => e.type === 'workshop').length,
      exhibition: this.events.filter(e => e.type === 'exhibition').length
    };

    return {
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      totalParticipants,
      averageParticipantsPerEvent,
      eventsByType
    };
  }
}

// 导出单例实例
export default new EventCalendarService();
