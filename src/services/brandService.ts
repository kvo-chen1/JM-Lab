import { supabase } from '@/lib/supabase';

export interface BrandHistory {
  id: string;
  brandId: string;
  brandName: string;
  brandImage: string;
  usageCount: number;
  lastUsedAt: string;
  createdAt: string;
}

export interface BrandFavorite {
  id: string;
  brandId: string;
  brandName: string;
  brandImage: string;
  notes?: string;
  createdAt: string;
}

export interface BrandRating {
  id: string;
  brandId: string;
  brandName: string;
  rating: number;
  review?: string;
  createdAt: string;
}

export interface UserBrandStats {
  totalUsed: number;
  favoritesCount: number;
  ratingsCount: number;
  mostUsedBrand?: BrandHistory;
  recentlyUsed: BrandHistory[];
}

export const brandService = {
  // Record brand usage
  async recordBrandUsage(brandId: string, brandName: string, brandImage: string): Promise<void> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const userId = session.session.user.id;

    // Check if record exists
    const { data: existing } = await supabase
      .from('user_brand_history')
      .select('*')
      .eq('user_id', userId)
      .eq('brand_id', brandId)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('user_brand_history')
        .update({
          usage_count: existing.usage_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabase
        .from('user_brand_history')
        .insert({
          user_id: userId,
          brand_id: brandId,
          brand_name: brandName,
          brand_image: brandImage,
          usage_count: 1,
          last_used_at: new Date().toISOString()
        });
    }
  },

  // Get user's brand history
  async getBrandHistory(): Promise<BrandHistory[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
      .from('user_brand_history')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Failed to get brand history:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      brandId: item.brand_id,
      brandName: item.brand_name,
      brandImage: item.brand_image,
      usageCount: item.usage_count,
      lastUsedAt: item.last_used_at,
      createdAt: item.created_at
    }));
  },

  // Add brand to favorites
  async addToFavorites(brandId: string, brandName: string, brandImage: string, notes?: string): Promise<void> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: session.session.user.id,
        brand_id: brandId,
        brand_name: brandName,
        brand_image: brandImage,
        notes
      });

    if (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  },

  // Remove from favorites
  async removeFromFavorites(brandId: string): Promise<void> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', session.session.user.id)
      .eq('brand_id', brandId);
  },

  // Get user's favorites
  async getFavorites(): Promise<BrandFavorite[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return [];

    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get favorites:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      brandId: item.brand_id,
      brandName: item.brand_name,
      brandImage: item.brand_image,
      notes: item.notes,
      createdAt: item.created_at
    }));
  },

  // Check if brand is favorited
  async isFavorited(brandId: string): Promise<boolean> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return false;

    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', session.session.user.id)
      .eq('brand_id', brandId)
      .single();

    return !!data;
  },

  // Rate a brand
  async rateBrand(brandId: string, brandName: string, rating: number, review?: string): Promise<void> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) return;

    const { error } = await supabase
      .from('brand_ratings')
      .upsert({
        user_id: session.session.user.id,
        brand_id: brandId,
        brand_name: brandName,
        rating,
        review,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,brand_id'
      });

    if (error) {
      console.error('Failed to rate brand:', error);
      throw error;
    }
  },

  // Get brand ratings
  async getBrandRatings(brandId?: string): Promise<BrandRating[]> {
    let query = supabase
      .from('brand_ratings')
      .select('*');

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get ratings:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      brandId: item.brand_id,
      brandName: item.brand_name,
      rating: item.rating,
      review: item.review,
      createdAt: item.created_at
    }));
  },

  // Get average rating for a brand
  async getAverageRating(brandId: string): Promise<{ average: number; count: number }> {
    const { data, error } = await supabase
      .from('brand_ratings')
      .select('rating')
      .eq('brand_id', brandId);

    if (error || !data || data.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = data.reduce((acc, item) => acc + item.rating, 0);
    return {
      average: Math.round((sum / data.length) * 10) / 10,
      count: data.length
    };
  },

  // Get user's brand stats
  async getUserBrandStats(): Promise<UserBrandStats> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      return {
        totalUsed: 0,
        favoritesCount: 0,
        ratingsCount: 0,
        recentlyUsed: []
      };
    }

    const userId = session.session.user.id;

    // Get history
    const { data: history } = await supabase
      .from('user_brand_history')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false });

    // Get favorites count
    const { count: favoritesCount } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get ratings count
    const { count: ratingsCount } = await supabase
      .from('brand_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const historyItems = (history || []).map(item => ({
      id: item.id,
      brandId: item.brand_id,
      brandName: item.brand_name,
      brandImage: item.brand_image,
      usageCount: item.usage_count,
      lastUsedAt: item.last_used_at,
      createdAt: item.created_at
    }));

    return {
      totalUsed: historyItems.length,
      favoritesCount: favoritesCount || 0,
      ratingsCount: ratingsCount || 0,
      mostUsedBrand: historyItems.reduce((max, item) => 
        item.usageCount > (max?.usageCount || 0) ? item : max, historyItems[0]),
      recentlyUsed: historyItems.slice(0, 5)
    };
  },

  // Get popular brands (most used across all users)
  async getPopularBrands(limit: number = 10): Promise<{ brandId: string; brandName: string; brandImage: string; totalUsage: number }[]> {
    const { data, error } = await supabase
      .from('user_brand_history')
      .select('brand_id, brand_name, brand_image, usage_count')
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get popular brands:', error);
      return [];
    }

    // Aggregate by brand
    const brandMap = new Map();
    data.forEach(item => {
      if (brandMap.has(item.brand_id)) {
        brandMap.get(item.brand_id).totalUsage += item.usage_count;
      } else {
        brandMap.set(item.brand_id, {
          brandId: item.brand_id,
          brandName: item.brand_name,
          brandImage: item.brand_image,
          totalUsage: item.usage_count
        });
      }
    });

    return Array.from(brandMap.values())
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, limit);
  }
};
