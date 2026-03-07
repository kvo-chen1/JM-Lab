/**
 * 品牌相关 Hooks
 */
import { useState, useEffect, useCallback } from 'react';
import brandService, { Brand, BrandAuthorization } from '@/services/brandService';

// 获取品牌方列表
export function useBrands(options: {
  status?: 'approved' | 'pending' | 'rejected';
  category?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await brandService.getBrands(options);
      if (result.error) {
        setError(result.error);
      } else {
        setBrands(result.data || []);
        setCount(result.count || 0);
      }
    } catch (err: any) {
      setError(err.message || '获取品牌方列表失败');
    } finally {
      setLoading(false);
    }
  }, [options.status, options.category, options.limit, options.offset]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return { brands, count, loading, error, refetch: fetchBrands };
}

// 获取品牌方详情
export function useBrand(brandId: string | null) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) {
      setBrand(null);
      return;
    }

    const fetchBrand = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await brandService.getBrandById(brandId);
        if (result.error) {
          setError(result.error);
        } else {
          setBrand(result.data || null);
        }
      } catch (err: any) {
        setError(err.message || '获取品牌方详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [brandId]);

  return { brand, loading, error };
}

// 获取授权申请列表
export function useAuthorizations(options: {
  applicant_id?: string;
  brand_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const [authorizations, setAuthorizations] = useState<BrandAuthorization[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthorizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await brandService.getAuthorizations(options);
      if (result.error) {
        setError(result.error);
      } else {
        setAuthorizations(result.data || []);
        setCount(result.count || 0);
      }
    } catch (err: any) {
      setError(err.message || '获取授权申请列表失败');
    } finally {
      setLoading(false);
    }
  }, [options.applicant_id, options.brand_id, options.status, options.limit, options.offset]);

  useEffect(() => {
    fetchAuthorizations();
  }, [fetchAuthorizations]);

  return { authorizations, count, loading, error, refetch: fetchAuthorizations };
}

// 获取用户的品牌方信息
export function useUserBrand(userId: string | null) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setBrand(null);
      return;
    }

    const fetchUserBrand = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await brandService.getUserBrand(userId);
        if (result.error) {
          setError(result.error);
        } else {
          setBrand(result.data || null);
        }
      } catch (err: any) {
        setError(err.message || '获取用户品牌方信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchUserBrand();
  }, [userId]);

  return { brand, loading, error };
}

// 检查用户是否有品牌授权
export function useBrandAuthorizationCheck(userId: string | null, brandId: string | null) {
  const [hasAuthorization, setHasAuthorization] = useState(false);
  const [authorization, setAuthorization] = useState<BrandAuthorization | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !brandId) {
      setHasAuthorization(false);
      setAuthorization(null);
      return;
    }

    const checkAuthorization = async () => {
      setLoading(true);
      try {
        const result = await brandService.checkUserBrandAuthorization(userId, brandId);
        setHasAuthorization(result.hasAuthorization);
        setAuthorization(result.authorization || null);
      } catch (err) {
        console.error('检查授权失败:', err);
        setHasAuthorization(false);
        setAuthorization(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [userId, brandId]);

  return { hasAuthorization, authorization, loading };
}

// 创建品牌方入驻申请
export function useCreateBrandApplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createApplication = async (
    brandData: Omit<Brand, 'id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<Brand | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await brandService.createBrandApplication(brandData);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '创建品牌方申请失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createApplication, loading, error };
}

// 提交品牌授权申请
export function useCreateAuthorization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAuthorization = async (
    applicationData: Omit<BrandAuthorization, 'id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<BrandAuthorization | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await brandService.createAuthorizationApplication(applicationData);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '提交授权申请失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createAuthorization, loading, error };
}

// 更新授权申请状态
export function useUpdateAuthorizationStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    id: string,
    status: 'approved' | 'rejected' | 'completed' | 'cancelled',
    brandResponse?: string
  ): Promise<BrandAuthorization | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await brandService.updateAuthorizationStatus(id, status, brandResponse);
      if (result.error) {
        setError(result.error);
        return null;
      }
      return result.data || null;
    } catch (err: any) {
      setError(err.message || '更新授权申请状态失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
}
