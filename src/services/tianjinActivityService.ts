import { supabase } from '@/lib/supabaseClient';
import { generateTemplatePrompt } from '@/utils/templatePromptGenerator';

export interface Activity {
  id: string;
  title: string;
  cover: string;
  deadline: string;
  status: 'active' | 'ending_soon' | 'ended';
  description: string;
}

export interface SubmissionParams {
  activityId: string;
  workTitle: string;
  workDesc: string;
  workUrl: string;
  authorName: string;
  authorPhone: string;
}

export interface TianjinTemplate {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  usageCount: number;
  // 新增互动相关字段
  likes?: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  // 新增模板元数据
  style?: string;
  colorScheme?: string[];
  applicableScenes?: string[];
  previewImages?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  isFeatured?: boolean;
  popularity?: number;
}

export interface TianjinOfflineExperience {
  id: number;
  name: string;
  description: string;
  location: string;
  price: string;
  image: string;
  availableSlots: number;
  rating: number;
  reviewCount: number;
}

export interface TianjinTraditionalBrand {
  id: number;
  name: string;
  logo: string;
  description: string;
  establishedYear: string;
  collaborationTools: number;
  popularity: number;
}

export interface TianjinHotspot {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  organizer: string;
  image: string;
  tags: string[];
  culturalElements: string[];
  participantCount: number;
  hasPrize: boolean;
}

export interface HistoricalSceneItem {
  id: string;
  title: string;
  description: string;
  image: string;
  year: number;
  category: string;
}

export interface InspirationItem {
  id: string;
  title: string;
  description: string;
  image: string;
  style: string;
  tags: string[];
}

export const tianjinActivityService = {
  /**
   * 获取模板并生成对应的AI提示词
   */
  async getTemplatesWithPrompts(): Promise<(TianjinTemplate & { prompt: string })[]> {
    const templates = await this.getTemplates();
    return templates.map(template => ({
      ...template,
      prompt: generateTemplatePrompt(template)
    }));
  },

  /**
   * 根据模板生成AI提示词
   */
  generatePromptForTemplate(template: TianjinTemplate): string {
    return generateTemplatePrompt(template);
  },

  // Original methods
  async getActivities(): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching activities:', error);
        return [];
      }

      return data?.map(item => {
        const now = new Date();
        const endTime = new Date(item.end_time);
        const startTime = new Date(item.start_time);
        
        let status: 'active' | 'ending_soon' | 'ended';
        if (endTime < now) {
          status = 'ended';
        } else if (startTime > now) {
          status = 'ending_soon';
        } else {
          status = 'active';
        }

        return {
          id: item.id,
          title: item.title,
          cover: item.thumbnail_url,
          deadline: item.end_time,
          status,
          description: item.description
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  },

  async submitWork(params: SubmissionParams): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch('/api/tianjin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const result = await response.json();
      return { ok: result.ok, message: result.message || (result.ok ? '提交成功' : '提交失败') };
    } catch (e) {
      console.error('Failed to submit work:', e);
      return { ok: false, message: '提交失败，请稍后重试' };
    }
  },

  // New methods for Tianjin Page
  async getTemplates(): Promise<TianjinTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('tianjin_templates')
        .select('*')
        .order('usage_count', { ascending: false });
        
      if (error) {
        console.error('Supabase error fetching templates:', error);
        // 返回增强版 mock 数据
        return getEnhancedMockTemplates();
      }
      
      if (!data || data.length === 0) {
        console.log('No templates found in database, using mock data');
        return getEnhancedMockTemplates();
      }
      
      // 获取所有模板的点赞数
      const templateIds = data.map(item => item.id);
      const { data: likesData, error: likesError } = await supabase
        .from('template_likes')
        .select('template_id')
        .in('template_id', templateIds);
      
      // 统计每个模板的点赞数
      const likesCountMap = new Map<number, number>();
      if (!likesError && likesData) {
        likesData.forEach(like => {
          const count = likesCountMap.get(like.template_id) || 0;
          likesCountMap.set(like.template_id, count + 1);
        });
      }
      
      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        thumbnail: item.thumbnail,
        category: item.category,
        usageCount: item.usage_count,
        likes: likesCountMap.get(item.id) || 0,
        style: item.style,
        colorScheme: item.color_scheme,
        applicableScenes: item.applicable_scenes,
        difficulty: item.difficulty,
        estimatedTime: item.estimated_time,
        author: item.author,
        tags: item.tags,
        isFeatured: item.is_featured,
        popularity: item.popularity,
      })) || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      // 返回增强版 mock 数据
      return getEnhancedMockTemplates();
    }
  },

  // 增加模板使用次数
  async incrementTemplateUsage(templateId: number): Promise<void> {
    try {
      // 先获取当前使用次数
      const { data, error: fetchError } = await supabase
        .from('tianjin_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();
      
      if (fetchError) {
        console.error('Failed to fetch current usage count:', fetchError);
        return;
      }
      
      // 更新使用次数
      const newCount = (data?.usage_count || 0) + 1;
      const { error: updateError } = await supabase
        .from('tianjin_templates')
        .update({ usage_count: newCount })
        .eq('id', templateId);
      
      if (updateError) {
        console.error('Failed to increment usage count:', updateError);
      }
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  },

  async getOfflineExperiences(): Promise<TianjinOfflineExperience[]> {
    try {
      const { data, error } = await supabase
        .from('tianjin_offline_experiences')
        .select('*')
        .order('rating', { ascending: false });
        
      if (error) {
        console.error('Supabase error fetching experiences:', error);
        // 返回 mock 数据
        return [
          {
            id: 1,
            name: '杨柳青年画体验工坊',
            description: '亲手制作杨柳青年画，感受传统民间艺术的魅力。',
            location: '杨柳青古镇',
            price: '¥88/人',
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20traditional%20Chinese%20New%20Year%20painting%20workshop%2C%20traditional%20art%20experience%2C%20colorful%20paintings&image_size=landscape_16_9',
            availableSlots: 15,
            rating: 4.9,
            reviewCount: 128
          },
          {
            id: 2,
            name: '泥人张彩塑制作',
            description: '跟随大师学习泥人张彩塑技艺，制作专属泥塑作品。',
            location: '古文化街',
            price: '¥128/人',
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Nirenzhang%20clay%20sculpture%20workshop%2C%20traditional%20Chinese%20craft%2C%20master%20teaching%20students&image_size=landscape_16_9',
            availableSlots: 10,
            rating: 4.8,
            reviewCount: 95
          }
        ];
      }
      
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        location: item.location,
        price: item.price,
        image: item.image,
        availableSlots: item.available_slots,
        rating: Number(item.rating),
        reviewCount: item.review_count
      })) || [];
    } catch (error) {
      console.error('Error fetching offline experiences:', error);
      // 返回 mock 数据
      return [
        {
          id: 1,
          name: '杨柳青年画体验工坊',
          description: '亲手制作杨柳青年画，感受传统民间艺术的魅力。',
          location: '杨柳青古镇',
          price: '¥88/人',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20traditional%20Chinese%20New%20Year%20painting%20workshop%2C%20traditional%20art%20experience%2C%20colorful%20paintings&image_size=landscape_16_9',
          availableSlots: 15,
          rating: 4.9,
          reviewCount: 128
        },
        {
          id: 2,
          name: '泥人张彩塑制作',
          description: '跟随大师学习泥人张彩塑技艺，制作专属泥塑作品。',
          location: '古文化街',
          price: '¥128/人',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Nirenzhang%20clay%20sculpture%20workshop%2C%20traditional%20Chinese%20craft%2C%20master%20teaching%20students&image_size=landscape_16_9',
          availableSlots: 10,
          rating: 4.8,
          reviewCount: 95
        }
      ];
    }
  },

  async getTraditionalBrands(): Promise<TianjinTraditionalBrand[]> {
    try {
      const { data, error } = await supabase
        .from('tianjin_traditional_brands')
        .select('*')
        .order('popularity', { ascending: false });
        
      if (error) {
        console.error('Supabase error fetching brands:', error);
        // 返回 mock 数据
        return [
          {
            id: 1,
            name: '狗不理包子',
            logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Goubuli%20steamed%20buns%20logo%2C%20traditional%20Chinese%20brand%2C%20red%20color%2C%20elegant%20design&image_size=square',
            description: '天津著名老字号，以制作精美包子闻名，始创于1858年。',
            establishedYear: '1858',
            collaborationTools: 5,
            popularity: 98
          },
          {
            id: 2,
            name: '十八街麻花',
            logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Shibajie%20twisted%20dough%20sticks%20logo%2C%20traditional%20Chinese%20snack%2C%20golden%20color%2C%20appetizing%20design&image_size=square',
            description: '天津传统特色小吃，以酥脆香甜著称，历史悠久。',
            establishedYear: '1927',
            collaborationTools: 4,
            popularity: 92
          }
        ];
      }
      
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        logo: item.logo,
        description: item.description,
        establishedYear: item.established_year,
        collaborationTools: item.collaboration_tools,
        popularity: item.popularity
      })) || [];
    } catch (error) {
      console.error('Error fetching traditional brands:', error);
      // 返回 mock 数据
      return [
        {
          id: 1,
          name: '狗不理包子',
          logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Goubuli%20steamed%20buns%20logo%2C%20traditional%20Chinese%20brand%2C%20red%20color%2C%20elegant%20design&image_size=square',
          description: '天津著名老字号，以制作精美包子闻名，始创于1858年。',
          establishedYear: '1858',
          collaborationTools: 5,
          popularity: 98
        },
        {
          id: 2,
          name: '十八街麻花',
          logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Shibajie%20twisted%20dough%20sticks%20logo%2C%20traditional%20Chinese%20snack%2C%20golden%20color%2C%20appetizing%20design&image_size=square',
          description: '天津传统特色小吃，以酥脆香甜著称，历史悠久。',
          establishedYear: '1927',
          collaborationTools: 4,
          popularity: 92
        }
      ];
    }
  },
  
  async getHotspots(): Promise<TianjinHotspot[]> {
    try {
      const { data, error } = await supabase
        .from('tianjin_hotspots')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Supabase error fetching hotspots:', error);
        // 返回 mock 数据
        return [
          {
            id: '1',
            title: '天津文化艺术节',
            description: '为期一周的文化艺术盛宴，展示天津传统文化与现代艺术的融合。',
            type: '文化活动',
            status: 'active',
            startDate: '2026-05-01',
            endDate: '2026-05-07',
            organizer: '天津市文化和旅游局',
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tianjin%20cultural%20art%20festival%2C%20colorful%20performances%2C%20traditional%20and%20modern%20art%2C%20festive%20atmosphere&image_size=landscape_16_9',
            tags: ['文化', '艺术', '节日'],
            culturalElements: ['杨柳青年画', '泥人张彩塑'],
            participantCount: 5000,
            hasPrize: true
          }
        ];
      }
      
      return data?.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        startDate: item.start_date,
        endDate: item.end_date,
        organizer: item.organizer,
        image: item.image,
        tags: item.tags || [],
        culturalElements: item.cultural_elements || [],
        participantCount: item.participant_count,
        hasPrize: item.has_prize
      })) || [];
    } catch (error) {
      console.error('Error fetching hotspots:', error);
      // 返回 mock 数据
      return [
        {
          id: '1',
          title: '天津文化艺术节',
          description: '为期一周的文化艺术盛宴，展示天津传统文化与现代艺术的融合。',
          type: '文化活动',
          status: 'active',
          startDate: '2026-05-01',
          endDate: '2026-05-07',
          organizer: '天津市文化和旅游局',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tianjin%20cultural%20art%20festival%2C%20colorful%20performances%2C%20traditional%20and%20modern%20art%2C%20festive%20atmosphere&image_size=landscape_16_9',
          tags: ['文化', '艺术', '节日'],
          culturalElements: ['杨柳青年画', '泥人张彩塑'],
          participantCount: 5000,
          hasPrize: true
        }
      ];
    }
  },

  // Historical Scenes Data (Mocked for now, but ready for DB)
  async getHistoricalScenes(): Promise<HistoricalSceneItem[]> {
    // 模拟异步获取
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'scene-001',
            title: '天津卫设立',
            description: '明成祖朱棣下令设立天津卫，意为"天子经过的渡口"，天津正式建城。',
            image: 'https://picsum.photos/seed/tianjin-history-001/800/600',
            year: 1404,
            category: '城市起源'
          },
          {
            id: 'scene-002',
            title: '天津开埠',
            description: '天津成为中国北方最早开放的通商口岸之一，设立了英、法、美等九国租界。',
            image: 'https://picsum.photos/seed/tianjin-history-002/800/600',
            year: 1860,
            category: '近代开埠'
          },
          {
            id: 'scene-003',
            title: '杨柳青年画兴起',
            description: '杨柳青年画在天津杨柳青镇兴起，成为中国著名的民间木版年画之一。',
            image: 'https://picsum.photos/seed/tianjin-history-003/800/600',
            year: 1726,
            category: '民间艺术'
          },
          {
            id: 'scene-004',
            title: '泥人张彩塑诞生',
            description: '天津泥人张彩塑艺术由张明山创立，成为中国著名的民间泥塑艺术。',
            image: 'https://picsum.photos/seed/tianjin-history-004/800/600',
            year: 1844,
            category: '民间艺术'
          },
          {
            id: 'scene-005',
            title: '天津大学成立',
            description: '天津大学前身北洋大学成立，是中国第一所现代大学。',
            image: 'https://picsum.photos/seed/tianjin-history-005/800/600',
            year: 1895,
            category: '教育发展'
          },
          {
            id: 'scene-006',
            title: '海河航运繁荣',
            description: '海河成为天津的黄金水道，航运繁忙，促进了城市的经济发展。',
            image: 'https://picsum.photos/seed/tianjin-history-006/800/600',
            year: 1900,
            category: '经济发展'
          }
        ]);
      }, 300);
    });
  },

  async getInspirationItems(): Promise<InspirationItem[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'inspiration-001',
            title: '津门故里',
            description: '融合天津传统建筑元素与现代设计风格，展现天津卫的历史底蕴。',
            image: 'https://picsum.photos/seed/tianjin-inspiration-001/800/600',
            style: '传统与现代融合',
            tags: ['建筑', '传统', '现代']
          },
          {
            id: 'inspiration-002',
            title: '杨柳青韵',
            description: '基于杨柳青年画的色彩与图案，创造现代艺术设计。',
            image: 'https://picsum.photos/seed/tianjin-inspiration-002/800/600',
            style: '传统年画现代演绎',
            tags: ['艺术', '年画', '色彩']
          },
          {
            id: 'inspiration-003',
            title: '海河之滨',
            description: '以海河为灵感，创作体现天津水乡特色的设计作品。',
            image: 'https://picsum.photos/seed/tianjin-inspiration-003/800/600',
            style: '水乡特色设计',
            tags: ['建筑', '水景', '现代']
          },
          {
            id: 'inspiration-004',
            title: '泥人张彩',
            description: '从泥人张彩塑艺术中汲取灵感，创造立体艺术设计。',
            image: 'https://picsum.photos/seed/tianjin-inspiration-004/800/600',
            style: '立体艺术设计',
            tags: ['雕塑', '立体', '传统']
          }
        ]);
      }, 300);
    });
  }
};

/**
 * 获取增强版模板 Mock 数据
 * 包含丰富的模板元数据和互动信息
 */
function getEnhancedMockTemplates(): TianjinTemplate[] {
  return [
    {
      id: 1,
      name: '津沽文化节主题模板',
      description: '融合天津传统文化元素，适用于各类文化节活动宣传设计。包含传统纹样、民俗元素和现代排版风格。',
      thumbnail: 'https://picsum.photos/seed/tianjin-culture-festival/800/600',
      category: '节日主题',
      usageCount: 235,
      likes: 128,
      style: '传统国潮',
      colorScheme: ['#C41E3A', '#FFD700', '#1a1a1a'],
      applicableScenes: ['文化节海报', '活动宣传', '社交媒体'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['传统文化', '节日', '红色', '国潮'],
      isFeatured: true,
      popularity: 98,
      previewImages: [
        'https://picsum.photos/seed/tianjin-culture-1/800/600',
        'https://picsum.photos/seed/tianjin-culture-2/800/600',
      ],
    },
    {
      id: 2,
      name: '五大道历史风情模板',
      description: '以五大道近代建筑群为视觉元素，突出天津的历史人文风貌。适合文化旅游、历史主题宣传。',
      thumbnail: 'https://picsum.photos/seed/tianjin-wudadao/800/600',
      category: '历史风情',
      usageCount: 142,
      likes: 89,
      style: '复古欧式',
      colorScheme: ['#8B7355', '#F5F5DC', '#2F4F4F'],
      applicableScenes: ['旅游宣传', '文化推广', '历史展览'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['五大道', '历史建筑', '欧式', '复古'],
      isFeatured: true,
      popularity: 85,
      previewImages: [
        'https://picsum.photos/seed/tianjin-history-1/800/600',
        'https://picsum.photos/seed/tianjin-history-2/800/600',
      ],
    },
    {
      id: 3,
      name: '静海葡萄节活动模板',
      description: '围绕静海葡萄节打造节庆主视觉，适配导视与物料延展。色彩鲜艳，充满丰收喜悦。',
      thumbnail: 'https://picsum.photos/seed/tianjin-grape-festival/800/600',
      category: '节日主题',
      usageCount: 109,
      likes: 67,
      style: '清新自然',
      colorScheme: ['#9ACD32', '#8B008B', '#FFF8DC'],
      applicableScenes: ['农产品推广', '节庆活动', '乡村旅游'],
      difficulty: 'easy',
      estimatedTime: '10分钟',
      author: '津脉设计团队',
      tags: ['葡萄', '农业', '绿色', '自然'],
      isFeatured: false,
      popularity: 72,
      previewImages: [
        'https://picsum.photos/seed/tianjin-grape/800/600',
      ],
    },
    {
      id: 4,
      name: '海河风光模板',
      description: '以海河风光为背景，适合城市宣传和旅游相关设计。展现天津现代化都市与历史文化的交融。',
      thumbnail: 'https://picsum.photos/seed/tianjin-haihe/800/600',
      category: '城市风光',
      usageCount: 189,
      likes: 156,
      style: '现代都市',
      colorScheme: ['#1E90FF', '#FFD700', '#FFFFFF'],
      applicableScenes: ['城市宣传', '旅游推广', '商务展示'],
      difficulty: 'medium',
      estimatedTime: '25分钟',
      author: '津脉设计团队',
      tags: ['海河', '城市', '夜景', '现代'],
      isFeatured: true,
      popularity: 95,
      previewImages: [
        'https://picsum.photos/seed/tianjin-city-1/800/600',
        'https://picsum.photos/seed/tianjin-city-2/800/600',
      ],
    },
    {
      id: 5,
      name: '老字号联名模板',
      description: '面向老字号品牌的联名海报与包装视觉模板。融合传统元素与现代设计语言。',
      thumbnail: 'https://picsum.photos/seed/tianjin-brand/800/600',
      category: '品牌联名',
      usageCount: 135,
      likes: 98,
      style: '新中式',
      colorScheme: ['#8B0000', '#DAA520', '#F5F5DC'],
      applicableScenes: ['品牌联名', '产品包装', '商业推广'],
      difficulty: 'hard',
      estimatedTime: '30分钟',
      author: '津脉设计团队',
      tags: ['老字号', '品牌', '中式', '商业'],
      isFeatured: true,
      popularity: 88,
      previewImages: [
        'https://picsum.photos/seed/tianjin-brand-preview/800/600',
      ],
    },
    {
      id: 6,
      name: '夜游光影视觉模板',
      description: '以海河夜景的光影氛围为主视觉，适配品牌活动海报。充满现代都市的时尚感和艺术气息。',
      thumbnail: 'https://picsum.photos/seed/tianjin-night/800/600',
      category: '夜游光影',
      usageCount: 98,
      likes: 76,
      style: '光影艺术',
      colorScheme: ['#191970', '#FFD700', '#FF6347'],
      applicableScenes: ['夜间活动', '艺术展览', '时尚品牌'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['夜景', '光影', '艺术', '时尚'],
      isFeatured: false,
      popularity: 78,
      previewImages: [
        'https://picsum.photos/seed/tianjin-night-preview/800/600',
      ],
    },
    {
      id: 7,
      name: '海河滨水休闲模板',
      description: '展现海河滨水休闲空间的设计模板，适合城市休闲宣传。轻松愉悦的氛围，适合生活方式类内容。',
      thumbnail: 'https://picsum.photos/seed/tianjin-leisure/800/600',
      category: '城市休闲',
      usageCount: 156,
      likes: 112,
      style: '休闲生活',
      colorScheme: ['#87CEEB', '#90EE90', '#FFFFFF'],
      applicableScenes: ['生活方式', '休闲活动', '城市推广'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['休闲', '滨水', '生活', '自然'],
      isFeatured: false,
      popularity: 82,
      previewImages: [
        'https://picsum.photos/seed/tianjin-leisure-preview/800/600',
      ],
    },
    {
      id: 8,
      name: '北塘海鲜美食模板',
      description: '以北塘渔港与海鲜元素为主，适合餐饮美食类宣传设计。色彩丰富，充满食欲感。',
      thumbnail: 'https://picsum.photos/seed/tianjin-seafood/800/600',
      category: '美食宣传',
      usageCount: 178,
      likes: 145,
      style: '美食摄影',
      colorScheme: ['#FF6347', '#FFA500', '#FFFFFF'],
      applicableScenes: ['餐饮推广', '美食节', '海鲜餐厅'],
      difficulty: 'easy',
      estimatedTime: '10分钟',
      author: '津脉设计团队',
      tags: ['海鲜', '美食', '餐饮', '北塘'],
      isFeatured: true,
      popularity: 92,
      previewImages: [
        'https://picsum.photos/seed/tianjin-seafood-preview/800/600',
      ],
    },
    {
      id: 9,
      name: '文博展陈主题模板',
      description: '适合博物馆、文化馆展览陈列的主题视觉模板。庄重典雅，突出文化底蕴。',
      thumbnail: 'https://picsum.photos/seed/tianjin-museum/800/600',
      category: '文博展陈',
      usageCount: 112,
      likes: 84,
      style: '文化展览',
      colorScheme: ['#4A4A4A', '#D4AF37', '#F5F5DC'],
      applicableScenes: ['博物馆', '文化展览', '艺术展'],
      difficulty: 'medium',
      estimatedTime: '25分钟',
      author: '津脉设计团队',
      tags: ['博物馆', '文化', '展览', '艺术'],
      isFeatured: false,
      popularity: 80,
      previewImages: [
        'https://picsum.photos/seed/tianjin-museum-preview/800/600',
      ],
    },
    {
      id: 10,
      name: '蓟州长城风光模板',
      description: '以蓟州长城与山野风光为主视觉，适合文旅宣传类设计。展现天津的自然与历史之美。',
      thumbnail: 'https://picsum.photos/seed/tianjin-greatwall/800/600',
      category: '历史风情',
      usageCount: 167,
      likes: 134,
      style: '自然风光',
      colorScheme: ['#228B22', '#8B4513', '#87CEEB'],
      applicableScenes: ['旅游宣传', '自然风光', '户外活动'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['长城', '蓟州', '自然', '风光'],
      isFeatured: true,
      popularity: 90,
      previewImages: [
        'https://picsum.photos/seed/tianjin-greatwall-preview/800/600',
      ],
    },
    {
      id: 11,
      name: '天津小吃宣传模板',
      description: '为天津特色小吃设计的宣传模板，突出地方美食特色。狗不理、耳朵眼炸糕、十八街麻花等元素。',
      thumbnail: 'https://picsum.photos/seed/tianjin-snacks/800/600',
      category: '美食宣传',
      usageCount: 198,
      likes: 167,
      style: '美食插画',
      colorScheme: ['#FF6B6B', '#FFE66D', '#4ECDC4'],
      applicableScenes: ['美食推广', '小吃店', '旅游宣传'],
      difficulty: 'easy',
      estimatedTime: '12分钟',
      author: '津脉设计团队',
      tags: ['小吃', '美食', '天津特色', '插画'],
      isFeatured: true,
      popularity: 96,
      previewImages: [
        'https://picsum.photos/seed/tianjin-snacks-preview/800/600',
      ],
    },
    {
      id: 12,
      name: '杨柳青年画主题模板',
      description: '基于杨柳青年画艺术风格设计的创意模板，融合传统民俗与现代设计。',
      thumbnail: 'https://picsum.photos/seed/tianjin-yangliuqing/800/600',
      category: '节日主题',
      usageCount: 145,
      likes: 123,
      style: '传统年画',
      colorScheme: ['#DC143C', '#FFD700', '#228B22'],
      applicableScenes: ['春节', '传统节日', '民俗活动'],
      difficulty: 'medium',
      estimatedTime: '25分钟',
      author: '津脉设计团队',
      tags: ['年画', '杨柳青', '传统', '民俗'],
      isFeatured: true,
      popularity: 91,
      previewImages: [
        'https://picsum.photos/seed/tianjin-yangliuqing-preview/800/600',
      ],
    },
  ];
}
