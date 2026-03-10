// 文化元素连连看游戏服务，用于管理游戏关卡和卡片数据

// 文化元素卡片类型定义
export interface Card {
  id: string;           // 卡片唯一标识
  imageUrl: string;     // 卡片图片URL
  name: string;         // 元素名称
  description: string;  // 元素描述
  culturalElement: string;  // 文化元素类型
  category: string;     // 分类（如：天津文化、传统艺术等）
}

// 游戏关卡类型定义
export interface Level {
  id: string;           // 关卡唯一标识
  name: string;         // 关卡名称
  description: string;  // 关卡描述
  cards: Card[];        // 关卡包含的卡片
  gridSize: {           // 关卡网格尺寸
    rows: number;       // 行数
    cols: number;       // 列数
  };
  difficulty: 'easy' | 'medium' | 'hard';  // 难度级别
  unlockCondition?: {   // 解锁条件（可选）
    type: 'score' | 'level';  // 条件类型
    value: number;      // 条件值
  };
  reward: string;       // 通关奖励
  culturalTheme: string;  // 文化主题
  imageUrl?: string;    // 关卡封面图（可选）
}

// 游戏进度类型定义
export interface GameProgress {
  userId: string;       // 用户ID
  completedLevels: string[];  // 已完成关卡
  totalScore: number;   // 总得分
  levelScores: Record<string, number>;  // 各关卡得分
  unlockedHints: number;  // 可用提示次数
  bestTimes: Record<string, number>;  // 各关卡最佳时间（秒）
  lastPlayed: Date;     // 最后游戏时间
}

// 文化元素连连看游戏服务类
class CulturalMatchingGameService {
  private cards: Card[] = [];
  private levels: Level[] = [];
  private gameProgress: Map<string, GameProgress> = new Map();
  private nextCardId = 1;
  private nextLevelId = 1;

  constructor() {
    this.initCards();
    this.initLevels();
  }

  // 初始化卡片数据
  private initCards(): void {
    this.cards = [
      // 天津文化主题卡片
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Yangliuqing%20New%20Year%20Painting%20traditional%20Chinese%20art',
        name: '杨柳青年画',
        description: '中国四大木版年画之一，以色彩鲜艳、构图饱满著称',
        culturalElement: '传统绘画',
        category: '天津文化'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Nirenzhang%20clay%20sculpture%20traditional%20Chinese%20art',
        name: '泥人张彩塑',
        description: '天津传统民间艺术，以细腻的造型和生动的表情著称',
        culturalElement: '传统雕塑',
        category: '天津文化'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Tianjin%20crosstalk%20performance%20traditional%20Chinese%20art',
        name: '天津相声',
        description: '中国北方传统曲艺形式，以幽默风趣的对话著称',
        culturalElement: '传统曲艺',
        category: '天津文化'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Tianjin%20mahua%20traditional%20Chinese%20snack',
        name: '天津麻花',
        description: '天津传统名点，以酥脆香甜著称',
        culturalElement: '传统美食',
        category: '天津文化'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Goubuli%20steamed%20buns%20traditional%20Chinese%20food',
        name: '狗不理包子',
        description: '天津传统名点，以皮薄馅大、鲜香可口著称',
        culturalElement: '传统美食',
        category: '天津文化'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Tianjin%20dialect%20conversation%20illustration',
        name: '天津方言',
        description: '天津地区的方言，以幽默风趣、表现力强著称',
        culturalElement: '方言文化',
        category: '天津文化'
      },
      
      // 中国传统艺术主题卡片
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Beijing%20Opera%20face%20paint%20traditional%20Chinese%20art',
        name: '京剧脸谱',
        description: '京剧艺术的重要组成部分，以色彩象征人物性格',
        culturalElement: '传统戏曲',
        category: '传统艺术'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20calligraphy%20art%20traditional%20writing',
        name: '书法艺术',
        description: '中国传统艺术形式，以毛笔书写汉字为表现手段',
        culturalElement: '传统书画',
        category: '传统艺术'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Traditional%20Chinese%20patterns%20cloud%20design',
        name: '传统纹样',
        description: '中国传统装饰图案，具有丰富的文化内涵',
        culturalElement: '传统工艺',
        category: '传统艺术'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20knot%20traditional%20decorative%20art',
        name: '中国结',
        description: '中国传统手工艺品，象征吉祥如意',
        culturalElement: '传统工艺',
        category: '传统艺术'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20paper%20cutting%20art%20traditional%20craft',
        name: '剪纸艺术',
        description: '中国传统民间艺术，以剪刀或刻刀在纸上剪刻花纹',
        culturalElement: '传统工艺',
        category: '传统艺术'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Blue%20and%20white%20porcelain%20traditional%20Chinese%20ceramics',
        name: '青花瓷',
        description: '中国传统瓷器品种，以青花为装饰手法',
        culturalElement: '传统工艺',
        category: '传统艺术'
      },
      
      // 中国文化符号主题卡片
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20dragon%20symbol%20traditional%20culture',
        name: '龙',
        description: '中国传统文化中的祥瑞动物，象征权力和尊贵',
        culturalElement: '文化符号',
        category: '文化符号'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20phoenix%20symbol%20traditional%20culture',
        name: '凤',
        description: '中国传统文化中的祥瑞动物，象征吉祥和美好',
        culturalElement: '文化符号',
        category: '文化符号'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Chinese%20character%20Fu%20symbol%20good%20luck',
        name: '福字',
        description: '中国传统文化中的吉祥符号，象征幸福和福气',
        culturalElement: '文化符号',
        category: '文化符号'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Traditional%20Chinese%20cloud%20pattern%20design',
        name: '祥云',
        description: '中国传统文化中的吉祥图案，象征祥瑞和好运',
        culturalElement: '文化符号',
        category: '文化符号'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Bagua%20symbol%20traditional%20Chinese%20philosophy',
        name: '八卦',
        description: '中国传统文化中的哲学符号，象征宇宙万物的变化规律',
        culturalElement: '文化符号',
        category: '文化符号'
      },
      {
        id: `card-${this.nextCardId++}`,
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=512x512&prompt=Taiji%20symbol%20yin%20yang%20traditional%20Chinese%20philosophy',
        name: '太极',
        description: '中国传统文化中的哲学符号，象征阴阳对立统一',
        culturalElement: '文化符号',
        category: '文化符号'
      }
    ];
  }

  // 初始化关卡数据
  private initLevels(): void {
    // 为每个关卡创建卡片副本（每个卡片需要出现两次）
    const createLevelCards = (cardIds: number[], count: number = 2): Card[] => {
      const selectedCards = cardIds.map(id => this.cards[id - 1]);
      const levelCards: Card[] = [];
      
      // 每个卡片添加指定数量的副本
      for (const card of selectedCards) {
        for (let i = 0; i < count; i++) {
          levelCards.push({
            ...card,
            id: `${card.id}-copy-${i}`
          });
        }
      }
      
      return levelCards;
    };

    this.levels = [
      {
        id: `level-${this.nextLevelId++}`,
        name: '天津文化入门',
        description: '了解天津的传统特色文化元素',
        cards: createLevelCards([1, 2, 3, 4]), // 杨柳青年画、泥人张彩塑、天津相声、天津麻花
        gridSize: { rows: 4, cols: 4 },
        difficulty: 'easy',
        reward: '解锁天津文化素材包',
        culturalTheme: '天津地方文化',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20cultural%20heritage%20tourism'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '传统艺术探索',
        description: '探索中国传统艺术形式',
        cards: createLevelCards([7, 8, 9, 10, 11, 12]), // 京剧脸谱、书法艺术、传统纹样、中国结、剪纸艺术、青花瓷
        gridSize: { rows: 6, cols: 4 },
        difficulty: 'medium',
        unlockCondition: { type: 'level', value: 1 },
        reward: '解锁传统纹样素材包',
        culturalTheme: '中国传统艺术',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20art%20collection'
      },
      {
        id: `level-${this.nextLevelId++}`,
        name: '文化符号挑战',
        description: '挑战识别中国文化符号',
        cards: createLevelCards([13, 14, 15, 16, 17, 18, 1, 2]), // 龙、凤、福字、祥云、八卦、太极、杨柳青年画、泥人张彩塑
        gridSize: { rows: 4, cols: 8 },
        difficulty: 'hard',
        unlockCondition: { type: 'level', value: 2 },
        reward: '解锁高级配色方案',
        culturalTheme: '中国文化符号',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cultural%20symbols%20collection'
      }
    ];
  }

  // 获取所有关卡
  getLevels(): Level[] {
    return [...this.levels];
  }

  // 根据ID获取关卡
  getLevelById(levelId: string): Level | undefined {
    return this.levels.find(level => level.id === levelId);
  }

  // 获取所有卡片
  getCards(): Card[] {
    return [...this.cards];
  }

  // 根据ID获取卡片
  getCardById(cardId: string): Card | undefined {
    // 处理副本卡片ID，提取原始卡片ID
    const originalCardId = cardId.split('-copy-')[0];
    return this.cards.find(card => card.id === originalCardId);
  }

  // 获取用户游戏进度
  getGameProgress(userId: string): GameProgress {
    if (!this.gameProgress.has(userId)) {
      const progress: GameProgress = {
        userId,
        completedLevels: [],
        totalScore: 0,
        levelScores: {},
        unlockedHints: 3,
        bestTimes: {},
        lastPlayed: new Date()
      };
      this.gameProgress.set(userId, progress);
    }
    return this.gameProgress.get(userId)!;
  }

  // 更新用户游戏进度
  updateGameProgress(userId: string, progress: Partial<GameProgress>): GameProgress {
    const currentProgress = this.getGameProgress(userId);
    const updatedProgress: GameProgress = {
      ...currentProgress,
      ...progress,
      lastPlayed: new Date()
    };
    this.gameProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  // 检查卡片是否匹配
  checkMatch(card1: Card, card2: Card): boolean {
    // 比较原始卡片ID（去除副本标识）
    const originalId1 = card1.id.split('-copy-')[0];
    const originalId2 = card2.id.split('-copy-')[0];
    return originalId1 === originalId2;
  }

  // 计算关卡得分
  calculateScore(matchCount: number, timeTaken: number, difficulty: string): number {
    const baseScore = matchCount * 10;
    // 时间奖励（根据难度调整）
    const timeBonusMultiplier = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.8
    }[difficulty as 'easy' | 'medium' | 'hard'] || 0.5;
    
    const timeBonus = Math.max(0, 600 - timeTaken) * timeBonusMultiplier;
    
    // 难度系数
    const difficultyMultiplier = {
      easy: 1.0,
      medium: 1.2,
      hard: 1.5
    }[difficulty as 'easy' | 'medium' | 'hard'] || 1.0;
    
    return Math.round((baseScore + timeBonus) * difficultyMultiplier);
  }

  // 完成关卡
  completeLevel(userId: string, levelId: string, score: number, timeTaken: number): GameProgress {
    const progress = this.getGameProgress(userId);
    
    // 更新最佳时间
    const updatedBestTimes = {
      ...progress.bestTimes
    };
    
    if (!updatedBestTimes[levelId] || timeTaken < updatedBestTimes[levelId]) {
      updatedBestTimes[levelId] = timeTaken;
    }
    
    // 更新进度
    const updatedProgress: GameProgress = {
      ...progress,
      completedLevels: [...new Set([...progress.completedLevels, levelId])],
      totalScore: progress.totalScore + score,
      levelScores: {
        ...progress.levelScores,
        [levelId]: score
      },
      bestTimes: updatedBestTimes,
      lastPlayed: new Date()
    };
    
    this.gameProgress.set(userId, updatedProgress);
    return updatedProgress;
  }

  // 使用提示
  useHint(userId: string): boolean {
    const progress = this.getGameProgress(userId);
    if (progress.unlockedHints > 0) {
      this.updateGameProgress(userId, {
        unlockedHints: progress.unlockedHints - 1
      });
      return true;
    }
    return false;
  }

  // 解锁新提示
  unlockHint(userId: string): void {
    const progress = this.getGameProgress(userId);
    this.updateGameProgress(userId, {
      unlockedHints: progress.unlockedHints + 1
    });
  }

  // 检查关卡是否解锁
  isLevelUnlocked(userId: string, levelId: string): boolean {
    const level = this.getLevelById(levelId);
    if (!level || !level.unlockCondition) {
      return true;
    }
    
    const progress = this.getGameProgress(userId);
    const { unlockCondition } = level;
    
    if (unlockCondition.type === 'level') {
      return progress.completedLevels.length >= unlockCondition.value;
    } else if (unlockCondition.type === 'score') {
      return progress.totalScore >= unlockCondition.value;
    }
    
    return false;
  }

  // 打乱卡片顺序
  shuffleCards(cards: Card[]): Card[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// 创建单例实例
const culturalMatchingGameService = new CulturalMatchingGameService();

export default culturalMatchingGameService;
