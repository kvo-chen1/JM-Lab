import { supabase } from '@/lib/supabaseClient';
import { generateTemplatePrompt } from '@/utils/templatePromptGenerator';
import { getTemplateImageUrl, getTemplatePreviewImages } from '@/utils/templateImageGenerator';


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
  viewCount?: number; // 浏览次数
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
    // 直接返回 mock 数据
    return getEnhancedMockTemplates();
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

  // 增加模板浏览次数
  async incrementTemplateView(templateId: number): Promise<void> {
    try {
      // 先获取当前浏览次数
      const { data, error: fetchError } = await supabase
        .from('tianjin_templates')
        .select('view_count')
        .eq('id', templateId)
        .single();
      
      if (fetchError) {
        console.error('Failed to fetch view count:', fetchError);
        return;
      }
      
      // 更新浏览次数
      const newCount = (data?.view_count || 0) + 1;
      const { error: updateError } = await supabase
        .from('tianjin_templates')
        .update({ view_count: newCount })
        .eq('id', templateId);
      
      if (updateError) {
        console.error('Failed to increment view count:', updateError);
      }
    } catch (error) {
      console.error('Error incrementing template view:', error);
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
 * 使用AI生成的与模板主题匹配的图片
 */
function getEnhancedMockTemplates(): TianjinTemplate[] {
  return [
    // ========== 原有12个模板（更新图片URL）==========
    {
      id: 1,
      name: '津沽文化节主题模板',
      description: '融合天津传统文化元素，适用于各类文化节活动宣传设计。包含传统纹样、民俗元素和现代排版风格。',
      thumbnail: getTemplateImageUrl('津沽文化节主题模板'),
      category: '节日主题',
      usageCount: 235,
      viewCount: 450,
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
      previewImages: getTemplatePreviewImages('津沽文化节主题模板', 2),
    },
    {
      id: 2,
      name: '五大道历史风情模板',
      description: '以五大道近代建筑群为视觉元素，突出天津的历史人文风貌。适合文化旅游、历史主题宣传。',
      thumbnail: getTemplateImageUrl('五大道历史风情模板'),
      category: '历史风情',
      usageCount: 142,
      viewCount: 320,
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
      previewImages: getTemplatePreviewImages('五大道历史风情模板', 2),
    },
    {
      id: 3,
      name: '静海葡萄节活动模板',
      description: '围绕静海葡萄节打造节庆主视觉，适配导视与物料延展。色彩鲜艳，充满丰收喜悦。',
      thumbnail: getTemplateImageUrl('静海葡萄节活动模板'),
      category: '节日主题',
      usageCount: 109,
      viewCount: 280,
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
      previewImages: getTemplatePreviewImages('静海葡萄节活动模板', 2),
    },
    {
      id: 4,
      name: '海河风光模板',
      description: '以海河风光为背景，适合城市宣传和旅游相关设计。展现天津现代化都市与历史文化的交融。',
      thumbnail: getTemplateImageUrl('海河风光模板'),
      category: '城市风光',
      usageCount: 189,
      viewCount: 520,
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
      previewImages: getTemplatePreviewImages('海河风光模板', 2),
    },
    {
      id: 5,
      name: '老字号联名模板',
      description: '面向老字号品牌的联名海报与包装视觉模板。融合传统元素与现代设计语言。',
      thumbnail: getTemplateImageUrl('老字号联名模板'),
      category: '品牌联名',
      usageCount: 135,
      viewCount: 380,
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
      previewImages: getTemplatePreviewImages('老字号联名模板', 2),
    },
    {
      id: 6,
      name: '夜游光影视觉模板',
      description: '以海河夜景的光影氛围为主视觉，适配品牌活动海报。充满现代都市的时尚感和艺术气息。',
      thumbnail: getTemplateImageUrl('夜游光影视觉模板'),
      category: '夜游光影',
      usageCount: 98,
      viewCount: 260,
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
      previewImages: getTemplatePreviewImages('夜游光影视觉模板', 2),
    },
    {
      id: 7,
      name: '海河滨水休闲模板',
      description: '展现海河滨水休闲空间的设计模板，适合城市休闲宣传。轻松愉悦的氛围，适合生活方式类内容。',
      thumbnail: getTemplateImageUrl('海河滨水休闲模板'),
      category: '城市休闲',
      usageCount: 156,
      viewCount: 340,
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
      previewImages: getTemplatePreviewImages('海河滨水休闲模板', 2),
    },
    {
      id: 8,
      name: '北塘海鲜美食模板',
      description: '以北塘渔港与海鲜元素为主，适合餐饮美食类宣传设计。色彩丰富，充满食欲感。',
      thumbnail: getTemplateImageUrl('北塘海鲜美食模板'),
      category: '美食宣传',
      usageCount: 178,
      viewCount: 480,
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
      previewImages: getTemplatePreviewImages('北塘海鲜美食模板', 2),
    },
    {
      id: 9,
      name: '文博展陈主题模板',
      description: '适合博物馆、文化馆展览陈列的主题视觉模板。庄重典雅，突出文化底蕴。',
      thumbnail: getTemplateImageUrl('文博展陈主题模板'),
      category: '文博展陈',
      usageCount: 112,
      viewCount: 290,
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
      previewImages: getTemplatePreviewImages('文博展陈主题模板', 2),
    },
    {
      id: 10,
      name: '蓟州长城风光模板',
      description: '以蓟州长城与山野风光为主视觉，适合文旅宣传类设计。展现天津的自然与历史之美。',
      thumbnail: getTemplateImageUrl('蓟州长城风光模板'),
      category: '历史风情',
      usageCount: 167,
      viewCount: 410,
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
      previewImages: getTemplatePreviewImages('蓟州长城风光模板', 2),
    },
    {
      id: 11,
      name: '天津小吃宣传模板',
      description: '为天津特色小吃设计的宣传模板，突出地方美食特色。狗不理、耳朵眼炸糕、十八街麻花等元素。',
      thumbnail: getTemplateImageUrl('天津小吃宣传模板'),
      category: '美食宣传',
      usageCount: 198,
      viewCount: 560,
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
      previewImages: getTemplatePreviewImages('天津小吃宣传模板', 2),
    },
    {
      id: 12,
      name: '杨柳青年画主题模板',
      description: '基于杨柳青年画艺术风格设计的创意模板，融合传统民俗与现代设计。',
      thumbnail: getTemplateImageUrl('杨柳青年画主题模板'),
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
      previewImages: getTemplatePreviewImages('杨柳青年画主题模板', 2),
    },

    // ========== 新增20个高质量模板 ==========
    {
      id: 13,
      name: '天津之眼摩天轮模板',
      description: '以天津之眼摩天轮为主题的视觉模板，展现天津地标建筑的浪漫与壮观。适合夜景主题和城市宣传。',
      thumbnail: getTemplateImageUrl('天津之眼摩天轮模板'),
      category: '城市风光',
      usageCount: 312,
      likes: 245,
      style: '地标建筑',
      colorScheme: ['#191970', '#FFD700', '#FF69B4'],
      applicableScenes: ['城市宣传', '旅游推广', '浪漫主题'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['天津之眼', '摩天轮', '地标', '夜景'],
      isFeatured: true,
      popularity: 99,
      previewImages: getTemplatePreviewImages('天津之眼摩天轮模板', 2),
    },
    {
      id: 14,
      name: '意式风情区模板',
      description: '展现天津意式风情区的欧式建筑与浪漫氛围，适合文化旅游和婚纱摄影类设计。',
      thumbnail: getTemplateImageUrl('意式风情区模板'),
      category: '历史风情',
      usageCount: 198,
      likes: 167,
      style: '欧式浪漫',
      colorScheme: ['#8B4513', '#F5DEB3', '#228B22'],
      applicableScenes: ['旅游宣传', '婚纱摄影', '文化推广'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['意式风情区', '欧式', '浪漫', '建筑'],
      isFeatured: true,
      popularity: 94,
      previewImages: getTemplatePreviewImages('意式风情区模板', 2),
    },
    {
      id: 15,
      name: '古文化街民俗模板',
      description: '以天津古文化街为背景，展现传统民俗文化和老字号商铺的热闹氛围。',
      thumbnail: getTemplateImageUrl('古文化街民俗模板'),
      category: '节日主题',
      usageCount: 156,
      likes: 134,
      style: '民俗文化',
      colorScheme: ['#DC143C', '#FFD700', '#8B4513'],
      applicableScenes: ['文化宣传', '旅游推广', '节日活动'],
      difficulty: 'easy',
      estimatedTime: '12分钟',
      author: '津脉设计团队',
      tags: ['古文化街', '民俗', '传统文化', '老字号'],
      isFeatured: true,
      popularity: 89,
      previewImages: getTemplatePreviewImages('古文化街民俗模板', 2),
    },
    {
      id: 16,
      name: '瓷房子艺术模板',
      description: '以天津瓷房子独特的陶瓷艺术为灵感，展现创意建筑与艺术融合的视觉风格。',
      thumbnail: getTemplateImageUrl('瓷房子艺术模板'),
      category: '文博展陈',
      usageCount: 134,
      likes: 112,
      style: '艺术创意',
      colorScheme: ['#4682B4', '#FFFFFF', '#DAA520'],
      applicableScenes: ['艺术展览', '文化推广', '创意设计'],
      difficulty: 'medium',
      estimatedTime: '25分钟',
      author: '津脉设计团队',
      tags: ['瓷房子', '艺术', '建筑', '创意'],
      isFeatured: true,
      popularity: 87,
      previewImages: getTemplatePreviewImages('瓷房子艺术模板', 2),
    },
    {
      id: 17,
      name: '天津港工业风模板',
      description: '展现天津港的工业力量与现代物流风貌，适合工业主题和商业宣传设计。',
      thumbnail: getTemplateImageUrl('天津港工业风模板'),
      category: '城市风光',
      usageCount: 98,
      likes: 76,
      style: '工业现代',
      colorScheme: ['#2F4F4F', '#FFA500', '#87CEEB'],
      applicableScenes: ['工业宣传', '商业推广', '现代物流'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['天津港', '工业', '现代', '物流'],
      isFeatured: false,
      popularity: 78,
      previewImages: getTemplatePreviewImages('天津港工业风模板', 2),
    },
    {
      id: 18,
      name: '盘山风景区模板',
      description: '以蓟州盘山自然风景区为主题，展现天津山水之美和户外休闲氛围。',
      thumbnail: getTemplateImageUrl('盘山风景区模板'),
      category: '城市休闲',
      usageCount: 145,
      likes: 123,
      style: '自然风光',
      colorScheme: ['#228B22', '#87CEEB', '#8B4513'],
      applicableScenes: ['旅游宣传', '户外活动', '自然风光'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['盘山', '自然', '风景', '户外'],
      isFeatured: true,
      popularity: 88,
      previewImages: getTemplatePreviewImages('盘山风景区模板', 2),
    },
    {
      id: 19,
      name: '独乐寺古建筑模板',
      description: '以蓟州独乐寺千年古建筑为主题，展现中国传统建筑之美和佛教文化。',
      thumbnail: getTemplateImageUrl('独乐寺古建筑模板'),
      category: '历史风情',
      usageCount: 112,
      likes: 98,
      style: '古建文化',
      colorScheme: ['#8B4513', '#DAA520', '#DC143C'],
      applicableScenes: ['文化宣传', '古建保护', '旅游推广'],
      difficulty: 'medium',
      estimatedTime: '22分钟',
      author: '津脉设计团队',
      tags: ['独乐寺', '古建筑', '佛教', '文化'],
      isFeatured: true,
      popularity: 85,
      previewImages: getTemplatePreviewImages('独乐寺古建筑模板', 2),
    },
    {
      id: 20,
      name: '泥人张彩塑模板',
      description: '以天津泥人张彩塑艺术为主题，展现民间传统工艺的独特魅力。',
      thumbnail: getTemplateImageUrl('泥人张彩塑模板'),
      category: '文博展陈',
      usageCount: 178,
      likes: 156,
      style: '民间工艺',
      colorScheme: ['#FF6347', '#FFD700', '#4682B4'],
      applicableScenes: ['文化展览', '非遗宣传', '艺术推广'],
      difficulty: 'medium',
      estimatedTime: '25分钟',
      author: '津脉设计团队',
      tags: ['泥人张', '彩塑', '非遗', '民间艺术'],
      isFeatured: true,
      popularity: 93,
      previewImages: getTemplatePreviewImages('泥人张彩塑模板', 2),
    },
    {
      id: 21,
      name: '风筝魏风筝模板',
      description: '以天津风筝魏传统风筝技艺为主题，展现风筝在蓝天中翱翔的美感。',
      thumbnail: getTemplateImageUrl('风筝魏风筝模板'),
      category: '城市休闲',
      usageCount: 134,
      likes: 112,
      style: '传统工艺',
      colorScheme: ['#87CEEB', '#FF6347', '#FFD700'],
      applicableScenes: ['文化活动', '非遗宣传', '户外休闲'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['风筝魏', '风筝', '非遗', '传统'],
      isFeatured: true,
      popularity: 86,
      previewImages: getTemplatePreviewImages('风筝魏风筝模板', 2),
    },
    {
      id: 22,
      name: '狗不理包子制作模板',
      description: '展现狗不理包子制作过程的美食文化，突出天津传统小吃的匠心工艺。',
      thumbnail: getTemplateImageUrl('狗不理包子制作模板'),
      category: '美食宣传',
      usageCount: 267,
      likes: 234,
      style: '美食工艺',
      colorScheme: ['#F5F5DC', '#8B4513', '#FFFAF0'],
      applicableScenes: ['美食推广', '文化宣传', '餐饮展示'],
      difficulty: 'easy',
      estimatedTime: '12分钟',
      author: '津脉设计团队',
      tags: ['狗不理', '包子', '美食', '工艺'],
      isFeatured: true,
      popularity: 98,
      previewImages: getTemplatePreviewImages('狗不理包子制作模板', 2),
    },
    {
      id: 23,
      name: '天津相声文化模板',
      description: '以天津相声艺术为主题，展现曲艺表演的魅力和传统文化氛围。',
      thumbnail: getTemplateImageUrl('天津相声文化模板'),
      category: '节日主题',
      usageCount: 189,
      likes: 167,
      style: '曲艺文化',
      colorScheme: ['#8B4513', '#DC143C', '#FFD700'],
      applicableScenes: ['文化演出', '曲艺宣传', '传统艺术'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['相声', '曲艺', '表演', '文化'],
      isFeatured: true,
      popularity: 91,
      previewImages: getTemplatePreviewImages('天津相声文化模板', 2),
    },
    {
      id: 24,
      name: '天津大学校园模板',
      description: '展现天津大学百年名校的校园风光和学术氛围，适合教育主题设计。',
      thumbnail: getTemplateImageUrl('天津大学校园模板'),
      category: '城市风光',
      usageCount: 156,
      likes: 134,
      style: '校园风光',
      colorScheme: ['#4169E1', '#FFFFFF', '#228B22'],
      applicableScenes: ['教育宣传', '校园活动', '招生推广'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['天津大学', '校园', '教育', '学术'],
      isFeatured: true,
      popularity: 88,
      previewImages: getTemplatePreviewImages('天津大学校园模板', 2),
    },
    {
      id: 25,
      name: '南开大学风光模板',
      description: '以南开大学为主题，展现百年学府的历史底蕴和优美校园环境。',
      thumbnail: getTemplateImageUrl('南开大学风光模板'),
      category: '城市风光',
      usageCount: 145,
      likes: 123,
      style: '学府风光',
      colorScheme: ['#800080', '#FFD700', '#228B22'],
      applicableScenes: ['教育宣传', '校园活动', '文化推广'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['南开大学', '校园', '教育', '历史'],
      isFeatured: true,
      popularity: 87,
      previewImages: getTemplatePreviewImages('南开大学风光模板', 2),
    },
    {
      id: 26,
      name: '滨海新区现代建筑模板',
      description: '展现天津滨海新区的现代化建筑风貌和城市发展成就。',
      thumbnail: getTemplateImageUrl('滨海新区现代建筑模板'),
      category: '城市风光',
      usageCount: 123,
      likes: 98,
      style: '现代建筑',
      colorScheme: ['#4682B4', '#C0C0C0', '#FFFFFF'],
      applicableScenes: ['城市宣传', '商务推广', '现代建筑'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['滨海新区', '现代', '建筑', '发展'],
      isFeatured: false,
      popularity: 82,
      previewImages: getTemplatePreviewImages('滨海新区现代建筑模板', 2),
    },
    {
      id: 27,
      name: '天津博物馆文化模板',
      description: '以天津博物馆为主题，展现城市历史文化和艺术珍藏的庄重氛围。',
      thumbnail: getTemplateImageUrl('天津博物馆文化模板'),
      category: '文博展陈',
      usageCount: 134,
      likes: 112,
      style: '博物馆风',
      colorScheme: ['#4A4A4A', '#D4AF37', '#8B4513'],
      applicableScenes: ['文化展览', '博物馆宣传', '历史教育'],
      difficulty: 'medium',
      estimatedTime: '22分钟',
      author: '津脉设计团队',
      tags: ['博物馆', '文化', '历史', '艺术'],
      isFeatured: true,
      popularity: 86,
      previewImages: getTemplatePreviewImages('天津博物馆文化模板', 2),
    },
    {
      id: 28,
      name: '天津大剧院艺术模板',
      description: '展现天津大剧院的现代建筑美学和高端艺术演出氛围。',
      thumbnail: getTemplateImageUrl('天津大剧院艺术模板'),
      category: '文博展陈',
      usageCount: 112,
      likes: 98,
      style: '艺术殿堂',
      colorScheme: ['#191970', '#FFD700', '#C0C0C0'],
      applicableScenes: ['艺术演出', '文化宣传', '建筑展示'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['大剧院', '艺术', '建筑', '演出'],
      isFeatured: true,
      popularity: 85,
      previewImages: getTemplatePreviewImages('天津大剧院艺术模板', 2),
    },
    {
      id: 29,
      name: '天津鼓楼模板',
      description: '以天津鼓楼历史建筑为主题，展现老城厢的历史文化风貌。',
      thumbnail: getTemplateImageUrl('天津鼓楼模板'),
      category: '历史风情',
      usageCount: 145,
      likes: 123,
      style: '历史建筑',
      colorScheme: ['#8B4513', '#DC143C', '#FFD700'],
      applicableScenes: ['历史宣传', '文化旅游', '古建筑'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['鼓楼', '历史', '建筑', '文化'],
      isFeatured: true,
      popularity: 88,
      previewImages: getTemplatePreviewImages('天津鼓楼模板', 2),
    },
    {
      id: 30,
      name: '天津解放桥模板',
      description: '以天津解放桥为主题，展现这座百年铁桥的历史价值和工业美学。',
      thumbnail: getTemplateImageUrl('天津解放桥模板'),
      category: '历史风情',
      usageCount: 178,
      likes: 156,
      style: '工业遗产',
      colorScheme: ['#2F4F4F', '#87CEEB', '#C0C0C0'],
      applicableScenes: ['历史宣传', '工业遗产', '城市地标'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['解放桥', '桥梁', '历史', '地标'],
      isFeatured: true,
      popularity: 92,
      previewImages: getTemplatePreviewImages('天津解放桥模板', 2),
    },
    {
      id: 31,
      name: '天津利顺德大饭店模板',
      description: '以天津利顺德大饭店为主题，展现百年历史酒店的欧式典雅和名人文化。',
      thumbnail: getTemplateImageUrl('天津利顺德大饭店模板'),
      category: '历史风情',
      usageCount: 123,
      likes: 112,
      style: '复古奢华',
      colorScheme: ['#8B4513', '#DAA520', '#800080'],
      applicableScenes: ['酒店宣传', '历史建筑', '文化旅游'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['利顺德', '酒店', '历史', '欧式'],
      isFeatured: true,
      popularity: 87,
      previewImages: getTemplatePreviewImages('天津利顺德大饭店模板', 2),
    },
    {
      id: 32,
      name: '滨海新区夜景模板',
      description: '展现天津滨海新区璀璨夜景和现代化都市的繁华氛围。',
      thumbnail: getTemplateImageUrl('天津滨海新区夜景模板'),
      category: '夜游光影',
      usageCount: 189,
      likes: 167,
      style: '都市夜景',
      colorScheme: ['#191970', '#FF69B4', '#00CED1'],
      applicableScenes: ['城市宣传', '夜景展示', '现代都市'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['滨海新区', '夜景', '现代', '繁华'],
      isFeatured: true,
      popularity: 93,
      previewImages: getTemplatePreviewImages('天津滨海新区夜景模板', 2),
    },

    // ========== 津门老字号系列模板（18个）==========
    {
      id: 33,
      name: '狗不理包子老字号模板',
      description: '展现狗不理包子这一百年老字号的历史传承与匠心工艺，适合美食文化宣传。',
      thumbnail: getTemplateImageUrl('狗不理包子老字号模板'),
      category: '津门老字号',
      usageCount: 456,
      likes: 389,
      style: '传统美食',
      colorScheme: ['#F5F5DC', '#8B4513', '#FFD700'],
      applicableScenes: ['美食宣传', '老字号推广', '文化传承'],
      difficulty: 'easy',
      estimatedTime: '12分钟',
      author: '津脉设计团队',
      tags: ['狗不理', '包子', '老字号', '美食'],
      isFeatured: true,
      popularity: 99,
      previewImages: getTemplatePreviewImages('狗不理包子老字号模板', 2),
    },
    {
      id: 34,
      name: '耳朵眼炸糕老字号模板',
      description: '以耳朵眼炸糕为主题，展现天津传统油炸糕点的金黄酥脆与独特风味。',
      thumbnail: getTemplateImageUrl('耳朵眼炸糕老字号模板'),
      category: '津门老字号',
      usageCount: 298,
      likes: 245,
      style: '传统小吃',
      colorScheme: ['#FFD700', '#FF6347', '#FFF8DC'],
      applicableScenes: ['小吃推广', '美食文化', '旅游宣传'],
      difficulty: 'easy',
      estimatedTime: '10分钟',
      author: '津脉设计团队',
      tags: ['耳朵眼', '炸糕', '老字号', '小吃'],
      isFeatured: true,
      popularity: 95,
      previewImages: getTemplatePreviewImages('耳朵眼炸糕老字号模板', 2),
    },
    {
      id: 35,
      name: '十八街麻花老字号模板',
      description: '展现桂发祥十八街麻花的传统工艺与香酥口感，天津最具代表性的传统小吃。',
      thumbnail: getTemplateImageUrl('十八街麻花老字号模板'),
      category: '津门老字号',
      usageCount: 378,
      likes: 312,
      style: '传统糕点',
      colorScheme: ['#DAA520', '#8B4513', '#FFE4B5'],
      applicableScenes: ['特产推广', '美食文化', '伴手礼'],
      difficulty: 'easy',
      estimatedTime: '10分钟',
      author: '津脉设计团队',
      tags: ['十八街', '麻花', '桂发祥', '老字号'],
      isFeatured: true,
      popularity: 97,
      previewImages: getTemplatePreviewImages('十八街麻花老字号模板', 2),
    },
    {
      id: 36,
      name: '崩豆张老字号模板',
      description: '以崩豆张炒货为主题，展现天津传统炒货工艺的香脆可口。',
      thumbnail: getTemplateImageUrl('崩豆张老字号模板'),
      category: '津门老字号',
      usageCount: 189,
      likes: 156,
      style: '传统炒货',
      colorScheme: ['#8B4513', '#D2691E', '#F4A460'],
      applicableScenes: ['零食推广', '传统食品', '休闲食品'],
      difficulty: 'easy',
      estimatedTime: '8分钟',
      author: '津脉设计团队',
      tags: ['崩豆张', '炒货', '老字号', '零食'],
      isFeatured: false,
      popularity: 84,
      previewImages: getTemplatePreviewImages('崩豆张老字号模板', 2),
    },
    {
      id: 37,
      name: '皮糖张老字号模板',
      description: '展现皮糖张花生糖的甜蜜传统与手工制作工艺。',
      thumbnail: getTemplateImageUrl('皮糖张老字号模板'),
      category: '津门老字号',
      usageCount: 167,
      likes: 145,
      style: '传统糖果',
      colorScheme: ['#FFE4B5', '#DEB887', '#8B4513'],
      applicableScenes: ['糖果推广', '传统食品', '伴手礼'],
      difficulty: 'easy',
      estimatedTime: '8分钟',
      author: '津脉设计团队',
      tags: ['皮糖张', '花生糖', '老字号', '糖果'],
      isFeatured: false,
      popularity: 82,
      previewImages: getTemplatePreviewImages('皮糖张老字号模板', 2),
    },
    {
      id: 38,
      name: '果仁张老字号模板',
      description: '以果仁张为主题，展现天津传统果仁炒货的丰富口味与精湛工艺。',
      thumbnail: getTemplateImageUrl('果仁张老字号模板'),
      category: '津门老字号',
      usageCount: 198,
      likes: 167,
      style: '传统炒货',
      colorScheme: ['#D2691E', '#8B4513', '#F5DEB3'],
      applicableScenes: ['坚果推广', '传统食品', '休闲零食'],
      difficulty: 'easy',
      estimatedTime: '8分钟',
      author: '津脉设计团队',
      tags: ['果仁张', '坚果', '老字号', '炒货'],
      isFeatured: false,
      popularity: 86,
      previewImages: getTemplatePreviewImages('果仁张老字号模板', 2),
    },
    {
      id: 39,
      name: '泥人张老字号模板',
      description: '展现泥人张彩塑艺术的精湛技艺与民间传统文化的魅力。',
      thumbnail: getTemplateImageUrl('泥人张老字号模板'),
      category: '津门老字号',
      usageCount: 234,
      likes: 198,
      style: '民间工艺',
      colorScheme: ['#FF6347', '#FFD700', '#4682B4'],
      applicableScenes: ['非遗宣传', '文化推广', '艺术展示'],
      difficulty: 'medium',
      estimatedTime: '20分钟',
      author: '津脉设计团队',
      tags: ['泥人张', '彩塑', '非遗', '老字号'],
      isFeatured: true,
      popularity: 94,
      previewImages: getTemplatePreviewImages('泥人张老字号模板', 2),
    },
    {
      id: 40,
      name: '风筝魏老字号模板',
      description: '以风筝魏传统风筝技艺为主题，展现天津民间艺术的独特魅力。',
      thumbnail: getTemplateImageUrl('风筝魏老字号模板'),
      category: '津门老字号',
      usageCount: 189,
      likes: 156,
      style: '传统工艺',
      colorScheme: ['#87CEEB', '#FF6347', '#FFD700'],
      applicableScenes: ['非遗宣传', '文化推广', '民间艺术'],
      difficulty: 'medium',
      estimatedTime: '18分钟',
      author: '津脉设计团队',
      tags: ['风筝魏', '风筝', '非遗', '老字号'],
      isFeatured: true,
      popularity: 90,
      previewImages: getTemplatePreviewImages('风筝魏老字号模板', 2),
    },
    {
      id: 41,
      name: '杨柳青年画老字号模板',
      description: '展现杨柳青年画这一国家级非遗的传统工艺与民俗艺术之美。',
      thumbnail: getTemplateImageUrl('杨柳青年画老字号模板'),
      category: '津门老字号',
      usageCount: 267,
      likes: 223,
      style: '传统年画',
      colorScheme: ['#DC143C', '#FFD700', '#228B22'],
      applicableScenes: ['非遗宣传', '年画推广', '文化展示'],
      difficulty: 'medium',
      estimatedTime: '22分钟',
      author: '津脉设计团队',
      tags: ['杨柳青', '年画', '非遗', '老字号'],
      isFeatured: true,
      popularity: 96,
      previewImages: getTemplatePreviewImages('杨柳青年画老字号模板', 2),
    },
    {
      id: 42,
      name: '老美华鞋店老字号模板',
      description: '以老美华传统布鞋为主题，展现天津传统鞋履工艺的舒适与典雅。',
      thumbnail: getTemplateImageUrl('老美华鞋店老字号模板'),
      category: '津门老字号',
      usageCount: 145,
      likes: 123,
      style: '传统鞋履',
      colorScheme: ['#8B4513', '#D2691E', '#F5DEB3'],
      applicableScenes: ['传统服饰', '老字号推广', '文化宣传'],
      difficulty: 'easy',
      estimatedTime: '12分钟',
      author: '津脉设计团队',
      tags: ['老美华', '布鞋', '老字号', '传统'],
      isFeatured: false,
      popularity: 85,
      previewImages: getTemplatePreviewImages('老美华鞋店老字号模板', 2),
    },
    {
      id: 43,
      name: '盛锡福帽子老字号模板',
      description: '展现盛锡福传统帽饰的精湛工艺与百年品牌历史。',
      thumbnail: getTemplateImageUrl('盛锡福帽子老字号模板'),
      category: '津门老字号',
      usageCount: 134,
      likes: 112,
      style: '传统帽饰',
      colorScheme: ['#4A4A4A', '#8B4513', '#DAA520'],
      applicableScenes: ['传统服饰', '老字号推广', '帽饰文化'],
      difficulty: 'easy',
      estimatedTime: '12分钟',
      author: '津脉设计团队',
      tags: ['盛锡福', '帽子', '老字号', '传统'],
      isFeatured: false,
      popularity: 83,
      previewImages: getTemplatePreviewImages('盛锡福帽子老字号模板', 2),
    },
    {
      id: 44,
      name: '正兴德茶叶老字号模板',
      description: '以正兴德茶庄为主题，展现天津传统茶文化的悠久历史与品茗之道。',
      thumbnail: getTemplateImageUrl('正兴德茶叶老字号模板'),
      category: '津门老字号',
      usageCount: 178,
      likes: 156,
      style: '传统茶艺',
      colorScheme: ['#228B22', '#8B4513', '#F5F5DC'],
      applicableScenes: ['茶文化', '老字号推广', '传统食品'],
      difficulty: 'medium',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['正兴德', '茶叶', '老字号', '茶文化'],
      isFeatured: true,
      popularity: 89,
      previewImages: getTemplatePreviewImages('正兴德茶叶老字号模板', 2),
    },
    {
      id: 45,
      name: '达仁堂药店老字号模板',
      description: '展现达仁堂中药文化的博大精深与传统医药的匠心传承。',
      thumbnail: getTemplateImageUrl('达仁堂药店老字号模板'),
      category: '津门老字号',
      usageCount: 198,
      likes: 167,
      style: '传统医药',
      colorScheme: ['#8B4513', '#228B22', '#F5F5DC'],
      applicableScenes: ['中医药文化', '老字号推广', '健康养生'],
      difficulty: 'medium',
      estimatedTime: '18分钟',
      author: '津脉设计团队',
      tags: ['达仁堂', '中药', '老字号', '医药'],
      isFeatured: true,
      popularity: 91,
      previewImages: getTemplatePreviewImages('达仁堂药店老字号模板', 2),
    },
    {
      id: 46,
      name: '隆顺榕药店老字号模板',
      description: '以隆顺榕药庄为主题，展现天津传统中药文化的历史底蕴。',
      thumbnail: getTemplateImageUrl('隆顺榕药店老字号模板'),
      category: '津门老字号',
      usageCount: 156,
      likes: 134,
      style: '传统医药',
      colorScheme: ['#228B22', '#8B4513', '#DEB887'],
      applicableScenes: ['中医药文化', '老字号推广', '健康养生'],
      difficulty: 'medium',
      estimatedTime: '18分钟',
      author: '津脉设计团队',
      tags: ['隆顺榕', '中药', '老字号', '医药'],
      isFeatured: false,
      popularity: 87,
      previewImages: getTemplatePreviewImages('隆顺榕药店老字号模板', 2),
    },
    {
      id: 47,
      name: '劝业场商场老字号模板',
      description: '展现劝业场这一天津商业地标的历史风貌与繁华景象。',
      thumbnail: getTemplateImageUrl('劝业场商场老字号模板'),
      category: '津门老字号',
      usageCount: 289,
      likes: 234,
      style: '商业历史',
      colorScheme: ['#8B4513', '#DAA520', '#DC143C'],
      applicableScenes: ['商业宣传', '历史文化', '地标推广'],
      difficulty: 'easy',
      estimatedTime: '15分钟',
      author: '津脉设计团队',
      tags: ['劝业场', '商场', '老字号', '地标'],
      isFeatured: true,
      popularity: 93,
      previewImages: getTemplatePreviewImages('劝业场商场老字号模板', 2),
    },
    {
      id: 48,
      name: '亨得利钟表老字号模板',
      description: '以亨得利钟表店为主题，展现天津传统钟表工艺的精准与典雅。',
      thumbnail: getTemplateImageUrl('亨得利钟表老字号模板'),
      category: '津门老字号',
      usageCount: 134,
      likes: 112,
      style: '传统钟表',
      colorScheme: ['#C0C0C0', '#FFD700', '#4A4A4A'],
      applicableScenes: ['钟表文化', '老字号推广', '精品展示'],
      difficulty: 'medium',
      estimatedTime: '16分钟',
      author: '津脉设计团队',
      tags: ['亨得利', '钟表', '老字号', '精品'],
      isFeatured: false,
      popularity: 84,
      previewImages: getTemplatePreviewImages('亨得利钟表老字号模板', 2),
    },
    {
      id: 49,
      name: '海鸥手表老字号模板',
      description: '展现海鸥手表这一中国民族品牌的精湛制表工艺与品牌历史。',
      thumbnail: getTemplateImageUrl('海鸥手表老字号模板'),
      category: '津门老字号',
      usageCount: 223,
      likes: 189,
      style: '民族品牌',
      colorScheme: ['#4682B4', '#C0C0C0', '#FFFFFF'],
      applicableScenes: ['品牌宣传', '国货推广', '精品展示'],
      difficulty: 'medium',
      estimatedTime: '16分钟',
      author: '津脉设计团队',
      tags: ['海鸥', '手表', '老字号', '国货'],
      isFeatured: true,
      popularity: 92,
      previewImages: getTemplatePreviewImages('海鸥手表老字号模板', 2),
    },
    {
      id: 50,
      name: '桂发祥麻花老字号模板',
      description: '以桂发祥品牌为主题，展现天津麻花文化的传承与创新。',
      thumbnail: getTemplateImageUrl('桂发祥麻花老字号模板'),
      category: '津门老字号',
      usageCount: 312,
      likes: 267,
      style: '传统糕点',
      colorScheme: ['#DAA520', '#8B4513', '#FFE4B5'],
      applicableScenes: ['特产推广', '美食文化', '伴手礼'],
      difficulty: 'easy',
      estimatedTime: '10分钟',
      author: '津脉设计团队',
      tags: ['桂发祥', '麻花', '老字号', '特产'],
      isFeatured: true,
      popularity: 98,
      previewImages: getTemplatePreviewImages('桂发祥麻花老字号模板', 2),
    },
  ];
}
