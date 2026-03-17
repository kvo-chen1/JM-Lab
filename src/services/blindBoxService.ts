/**
 * 作品盲盒服务模块 - 提供盲盒生成、购买和打开功能
 */

// 盲盒类型定义
export interface BlindBox {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  available: boolean;
  totalCount: number;
  remainingCount: number;
}

// 盲盒内容类型定义
export interface BlindBoxContent {
  id: string;
  type: '作品' | '模板' | '素材' | '成就';
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  value: number;
  creator?: string;
  unlockable: boolean;
}

// 盲盒开启结果类型定义
export interface BlindBoxOpeningResult {
  blindBox: BlindBox;
  content: BlindBoxContent;
  isNew: boolean;
  timestamp: Date;
}

// 盲盒服务类
class BlindBoxService {
  // 盲盒数据
  private blindBoxes: BlindBox[] = [
    {
      id: '1',
      name: '创意新手盲盒',
      description: '适合新手的入门盲盒，包含基础创作资源',
      price: 50,
      rarity: 'common',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop',
      available: true,
      totalCount: 1000,
      remainingCount: 850
    },
    {
      id: '2',
      name: '文化传承盲盒',
      description: '包含传统文化元素的盲盒，适合喜欢文化创作的用户',
      price: 100,
      rarity: 'rare',
      image: 'https://images.unsplash.com/photo-1516962241656-7b4e9c89a9a5?w=400&h=400&fit=crop',
      available: true,
      totalCount: 500,
      remainingCount: 320
    },
    {
      id: '3',
      name: '大师之作盲盒',
      description: '包含知名创作者作品的高级盲盒，有机会获得稀有资源',
      price: 200,
      rarity: 'epic',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb39279c23?w=400&h=400&fit=crop',
      available: true,
      totalCount: 200,
      remainingCount: 85
    },
    {
      id: '4',
      name: '传奇典藏盲盒',
      description: '限量版盲盒，包含稀有度极高的创作资源和成就',
      price: 500,
      rarity: 'legendary',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop',
      available: true,
      totalCount: 50,
      remainingCount: 12
    }
  ];

  // 盲盒内容池
  private blindBoxContents: BlindBoxContent[] = [
    // 普通内容
    { id: 'c1', type: '素材', name: '水墨风格背景', description: '传统水墨风格的创作背景', rarity: 'common', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=400&fit=crop', value: 20, unlockable: true },
    { id: 'c2', type: '模板', name: '国潮海报模板', description: '适合国潮风格的海报设计模板', rarity: 'common', image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop', value: 30, unlockable: true },
    { id: 'c3', type: '作品', name: '古风插画', description: '精美的古风插画作品', rarity: 'common', image: 'https://images.unsplash.com/photo-1515462277194-4ed9f16a8b9d?w=400&h=400&fit=crop', value: 40, creator: '古风大师', unlockable: true },
    { id: 'c4', type: '素材', name: '传统纹样', description: '中国传统纹样集合', rarity: 'common', image: 'https://images.unsplash.com/photo-1528696892704-5e11528b1509?w=400&h=400&fit=crop', value: 25, unlockable: true },
    
    // 稀有内容
    { id: 'r1', type: '模板', name: '非遗文化模板', description: '包含非遗文化元素的高级模板', rarity: 'rare', image: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=400&h=400&fit=crop', value: 80, unlockable: true },
    { id: 'r2', type: '作品', name: '大师级书法', description: '知名书法家的书法作品', rarity: 'rare', image: 'https://images.unsplash.com/photo-1516962241656-7b4e9c89a9a5?w=400&h=400&fit=crop', value: 120, creator: '书法大师', unlockable: true },
    { id: 'r3', type: '素材', name: '3D 文化资产', description: '可用于 3D 创作的文化资产', rarity: 'rare', image: 'https://images.unsplash.com/photo-1633356122544-f133545a994c?w=400&h=400&fit=crop', value: 100, unlockable: true },
    { id: 'r4', type: '成就', name: '盲盒收藏家', description: '开启 10 个盲盒获得的成就', rarity: 'rare', image: 'https://images.unsplash.com/photo-1533230676238-8a7c8072a453?w=400&h=400&fit=crop', value: 0, unlockable: false },
    
    // 史诗内容
    { id: 'e1', type: '作品', name: '国潮 IP 设计', description: '完整的国潮 IP 设计方案', rarity: 'epic', image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop', value: 300, creator: 'IP 设计师', unlockable: true },
    { id: 'e2', type: '模板', name: '品牌合作模板', description: '与知名品牌合作的限定模板', rarity: 'epic', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=400&fit=crop', value: 250, unlockable: true },
    { id: 'e3', type: '素材', name: '动态文化素材', description: '可用于动画的动态文化素材', rarity: 'epic', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop', value: 200, unlockable: true },
    
    // 传奇内容
    { id: 'l1', type: '作品', name: '典藏级国画', description: '具有收藏价值的国画作品', rarity: 'legendary', image: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=400&h=400&fit=crop', value: 1000, creator: '国画大师', unlockable: true },
    { id: 'l2', type: '成就', name: '传奇收藏家', description: '开启 50 个盲盒获得的传奇成就', rarity: 'legendary', image: 'https://images.unsplash.com/photo-1533230676238-8a7c8072a453?w=400&h=400&fit=crop', value: 0, unlockable: false },
    { id: 'l3', type: '模板', name: '定制化创作模板', description: '可定制的高级创作模板', rarity: 'legendary', image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop', value: 800, unlockable: true },
  ];

  // 盲盒开启历史
  private openingHistory: BlindBoxOpeningResult[] = [];
  
  // 用户收藏的盲盒内容
  private userCollections: Map<string, Set<string>> = new Map(); // userId -> Set<contentId>

  // 获取所有盲盒
  getAllBlindBoxes(): BlindBox[] {
    return [...this.blindBoxes];
  }

  // 获取单个盲盒
  getBlindBoxById(id: string): BlindBox | undefined {
    return this.blindBoxes.find(box => box.id === id);
  }

  // 购买盲盒
  purchaseBlindBox(boxId: string, userId: string): boolean {
    const box = this.getBlindBoxById(boxId);
    if (box && box.available && box.remainingCount > 0) {
      box.remainingCount--;
      // 当剩余数量为0时，标记为不可用
      if (box.remainingCount === 0) {
        box.available = false;
      }
      return true;
    }
    return false;
  }

  // 随机生成盲盒内容
  private generateRandomContent(rarity: BlindBox['rarity']): BlindBoxContent {
    // 根据盲盒稀有度调整内容稀有度的概率
    const rarityProbabilities = {
      common: { common: 0.7, rare: 0.25, epic: 0.04, legendary: 0.01 },
      rare: { common: 0.4, rare: 0.45, epic: 0.1, legendary: 0.05 },
      epic: { common: 0.2, rare: 0.3, epic: 0.4, legendary: 0.1 },
      legendary: { common: 0.1, rare: 0.2, epic: 0.3, legendary: 0.4 }
    };

    const probabilities = rarityProbabilities[rarity];
    const random = Math.random();
    let selectedRarity: BlindBoxContent['rarity'] = 'common';
    let cumulativeProbability = 0;

    // 根据概率选择内容稀有度
    for (const [r, prob] of Object.entries(probabilities) as [BlindBoxContent['rarity'], number][]) {
      cumulativeProbability += prob;
      if (random <= cumulativeProbability) {
        selectedRarity = r;
        break;
      }
    }

    // 从对应稀有度的内容池中随机选择一个
    const eligibleContents = this.blindBoxContents.filter(content => content.rarity === selectedRarity);
    const randomIndex = Math.floor(Math.random() * eligibleContents.length);
    return { ...eligibleContents[randomIndex] };
  }

  // 打开盲盒
  openBlindBox(boxId: string, userId: string): BlindBoxOpeningResult | null {
    const box = this.getBlindBoxById(boxId);
    // 确保box和box.available存在
    if (!box || typeof box.available === 'undefined') {
      return null;
    }

    // 生成盲盒内容
    const content = this.generateRandomContent(box.rarity);
    
    // 创建开启结果
    const result: BlindBoxOpeningResult = {
      blindBox: { ...box },
      content,
      isNew: true, // 模拟是否为新获得的内容
      timestamp: new Date()
    };

    // 记录开启历史
    this.openingHistory.push(result);

    return result;
  }

  // 获取盲盒开启历史
  getOpeningHistory(userId: string): BlindBoxOpeningResult[] {
    // 这里可以根据userId过滤，但目前我们简化处理，返回所有历史
    return [...this.openingHistory];
  }

  // 获取用户拥有的盲盒内容
  getUserBlindBoxContents(userId: string): BlindBoxContent[] {
    // 模拟用户拥有的内容，实际应该从数据库或localStorage获取
    const userContents: BlindBoxContent[] = [];
    this.openingHistory.forEach(result => {
      if (!userContents.some(content => content.id === result.content.id)) {
        userContents.push(result.content);
      }
    });
    return userContents;
  }
  
  // 切换用户对某个盲盒内容的收藏状态
  toggleCollection(userId: string, contentId: string): boolean {
    if (!this.userCollections.has(userId)) {
      this.userCollections.set(userId, new Set());
    }
    
    const userCollection = this.userCollections.get(userId)!;
    
    if (userCollection.has(contentId)) {
      userCollection.delete(contentId);
      return false; // 取消收藏
    } else {
      userCollection.add(contentId);
      return true; // 收藏成功
    }
  }
  
  // 检查某个盲盒内容是否被用户收藏
  isContentCollected(userId: string, contentId: string): boolean {
    const userCollection = this.userCollections.get(userId);
    return userCollection ? userCollection.has(contentId) : false;
  }
  
  // 获取用户收藏的所有盲盒内容
  getUserCollections(userId: string): BlindBoxContent[] {
    const userCollection = this.userCollections.get(userId);
    if (!userCollection || userCollection.size === 0) {
      return [];
    }
    
    return this.blindBoxContents.filter(content => userCollection!.has(content.id));
  }
  
  // 获取用户收藏的盲盒内容数量
  getCollectionCount(userId: string): number {
    const userCollection = this.userCollections.get(userId);
    return userCollection ? userCollection.size : 0;
  }
}

// 导出单例实例
export default new BlindBoxService();
