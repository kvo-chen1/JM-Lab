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
      const response = await fetch('/api/tianjin/activities');
      if (!response.ok) return [];
      const result = await response.json();
      return result.ok ? result.data : [];
    } catch (e) {
      console.error('Failed to fetch activities:', e);
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
        return [];
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
      return [];
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
        return [];
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
      return [];
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
        return [];
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
      return [];
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
        return [];
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
      return [];
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
