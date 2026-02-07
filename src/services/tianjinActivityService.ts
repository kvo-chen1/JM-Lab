import { supabase } from '@/lib/supabaseClient';

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
        // 返回 mock 数据
        return [
          {
            id: 1,
            name: '津沽文化节主题模板',
            description: '融合天津传统文化元素，适用于各类文化节活动宣传设计。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '节日主题',
            usageCount: 235
          },
          {
            id: 2,
            name: '五大道历史风情模板',
            description: '以五大道近代建筑群为视觉元素，突出天津的历史人文风貌。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '历史风情',
            usageCount: 142
          },
          {
            id: 3,
            name: '静海葡萄节活动模板',
            description: '围绕静海葡萄节打造节庆主视觉，适配导视与物料延展。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '节日主题',
            usageCount: 109
          },
          {
            id: 4,
            name: '海河风光模板',
            description: '以海河风光为背景，适合城市宣传和旅游相关设计。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '城市风光',
            usageCount: 189
          },
          {
            id: 5,
            name: '老字号联名模板',
            description: '面向老字号品牌的联名海报与包装视觉模板。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '品牌联名',
            usageCount: 135
          },
          {
            id: 6,
            name: '夜游光影视觉模板',
            description: '以海河夜景的光影氛围为主视觉，适配品牌活动海报。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '夜游光影',
            usageCount: 98
          },
          {
            id: 7,
            name: '海河滨水休闲模板',
            description: '展现海河滨水休闲空间的设计模板，适合城市休闲宣传。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '城市休闲',
            usageCount: 156
          },
          {
            id: 8,
            name: '北塘海鲜美食模板',
            description: '以北塘渔港与海鲜元素为主，适合餐饮美食类宣传设计。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '美食宣传',
            usageCount: 178
          },
          {
            id: 9,
            name: '文博展陈主题模板',
            description: '适合博物馆、文化馆展览陈列的主题视觉模板。',
            thumbnail: '/images/placeholder-image.jpg',
            category: '文博展陈',
            usageCount: 112
          }
        ];
      }
      
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        thumbnail: item.thumbnail,
        category: item.category,
        usageCount: item.usage_count
      })) || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      // 返回 mock 数据
      return [
        {
          id: 1,
          name: '津沽文化节主题模板',
          description: '融合天津传统文化元素，适用于各类文化节活动宣传设计。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '节日主题',
          usageCount: 235
        },
        {
          id: 2,
          name: '五大道历史风情模板',
          description: '以五大道近代建筑群为视觉元素，突出天津的历史人文风貌。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '历史风情',
          usageCount: 142
        },
        {
          id: 3,
          name: '静海葡萄节活动模板',
          description: '围绕静海葡萄节打造节庆主视觉，适配导视与物料延展。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '节日主题',
          usageCount: 109
        },
        {
          id: 4,
          name: '海河风光模板',
          description: '以海河风光为背景，适合城市宣传和旅游相关设计。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '城市风光',
          usageCount: 189
        },
        {
          id: 5,
          name: '老字号联名模板',
          description: '面向老字号品牌的联名海报与包装视觉模板。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '品牌联名',
          usageCount: 135
        },
        {
          id: 6,
          name: '夜游光影视觉模板',
          description: '以海河夜景的光影氛围为主视觉，适配品牌活动海报。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '夜游光影',
          usageCount: 98
        },
        {
          id: 7,
          name: '海河滨水休闲模板',
          description: '展现海河滨水休闲空间的设计模板，适合城市休闲宣传。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '城市休闲',
          usageCount: 156
        },
        {
          id: 8,
          name: '北塘海鲜美食模板',
          description: '以北塘渔港与海鲜元素为主，适合餐饮美食类宣传设计。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '美食宣传',
          usageCount: 178
        },
        {
          id: 9,
          name: '文博展陈主题模板',
          description: '适合博物馆、文化馆展览陈列的主题视觉模板。',
          thumbnail: '/images/placeholder-image.jpg',
          category: '文博展陈',
          usageCount: 112
        }
      ];
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
            image: 'https://images.pexels.com/photos/2440021/pexels-photo-2440021.jpeg?auto=compress&cs=tinysrgb&w=800', // 替换为真实图片或保持API
            year: 1404,
            category: '城市起源'
          },
          {
            id: 'scene-002',
            title: '天津开埠',
            description: '天津成为中国北方最早开放的通商口岸之一，设立了英、法、美等九国租界。',
            image: 'https://images.pexels.com/photos/3016353/pexels-photo-3016353.jpeg?auto=compress&cs=tinysrgb&w=800',
            year: 1860,
            category: '近代开埠'
          },
          {
            id: 'scene-003',
            title: '杨柳青年画兴起',
            description: '杨柳青年画在天津杨柳青镇兴起，成为中国著名的民间木版年画之一。',
            image: 'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=800',
            year: 1726,
            category: '民间艺术'
          },
          {
            id: 'scene-004',
            title: '泥人张彩塑诞生',
            description: '天津泥人张彩塑艺术由张明山创立，成为中国著名的民间泥塑艺术。',
            image: 'https://images.pexels.com/photos/4553365/pexels-photo-4553365.jpeg?auto=compress&cs=tinysrgb&w=800',
            year: 1844,
            category: '民间艺术'
          },
          {
            id: 'scene-005',
            title: '天津大学成立',
            description: '天津大学前身北洋大学成立，是中国第一所现代大学。',
            image: 'https://images.pexels.com/photos/256455/pexels-photo-256455.jpeg?auto=compress&cs=tinysrgb&w=800',
            year: 1895,
            category: '教育发展'
          },
          {
            id: 'scene-006',
            title: '海河航运繁荣',
            description: '海河成为天津的黄金水道，航运繁忙，促进了城市的经济发展。',
            image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
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
            image: 'https://images.pexels.com/photos/161853/architecture-building-china-city-161853.jpeg?auto=compress&cs=tinysrgb&w=800',
            style: '传统与现代融合',
            tags: ['建筑', '传统', '现代']
          },
          {
            id: 'inspiration-002',
            title: '杨柳青韵',
            description: '基于杨柳青年画的色彩与图案，创造现代艺术设计。',
            image: 'https://images.pexels.com/photos/1674049/pexels-photo-1674049.jpeg?auto=compress&cs=tinysrgb&w=800',
            style: '传统年画现代演绎',
            tags: ['艺术', '年画', '色彩']
          },
          {
            id: 'inspiration-003',
            title: '海河之滨',
            description: '以海河为灵感，创作体现天津水乡特色的设计作品。',
            image: 'https://images.pexels.com/photos/2837909/pexels-photo-2837909.jpeg?auto=compress&cs=tinysrgb&w=800',
            style: '水乡特色设计',
            tags: ['建筑', '水景', '现代']
          },
          {
            id: 'inspiration-004',
            title: '泥人张彩',
            description: '从泥人张彩塑艺术中汲取灵感，创造立体艺术设计。',
            image: 'https://images.pexels.com/photos/3856635/pexels-photo-3856635.jpeg?auto=compress&cs=tinysrgb&w=800',
            style: '立体艺术设计',
            tags: ['雕塑', '立体', '传统']
          }
        ]);
      }, 300);
    });
  }
};
