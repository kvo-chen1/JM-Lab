import apiClient from '../lib/apiClient';

class NeonDataApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.NEON_DATA_API_URL || '';
  }

  /**
   * 设置基础URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * 通用GET请求
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await apiClient.get<T>(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    return response.data as T;
  }

  /**
   * 通用POST请求
   */
  async post<T, B>(endpoint: string, body?: B): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await apiClient.post<T, B>(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    return response.data as T;
  }

  /**
   * 通用PUT请求
   */
  async put<T, B>(endpoint: string, body?: B): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await apiClient.put<T, B>(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    return response.data as T;
  }

  /**
   * 通用DELETE请求
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    const response = await apiClient.delete<T>(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(response.error || '请求失败');
    }
    return response.data as T;
  }

  /**
   * 构建完整URL
   */
  private buildUrl(endpoint: string): string {
    if (!this.baseUrl) {
      throw new Error('Neon Data API URL not configured');
    }
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * 获取表数据
   */
  async getTableData<T>(table: string, params?: {
    select?: string;
    limit?: number;
    offset?: number;
    order?: string;
    filter?: Record<string, any>;
  }): Promise<T[]> {
    let endpoint = `/${table}`;
    const queryParams = new URLSearchParams();

    if (params?.select) {
      queryParams.append('select', params.select);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }
    if (params?.order) {
      queryParams.append('order', params.order);
    }
    if (params?.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return this.get<T[]>(endpoint);
  }

  /**
   * 插入数据
   */
  async insertData<T>(table: string, data: any): Promise<T> {
    return this.post<T, any>(`/${table}`, data);
  }

  /**
   * 更新数据
   */
  async updateData<T>(table: string, id: string | number, data: any): Promise<T> {
    return this.put<T, any>(`/${table}?id=eq.${id}`, data);
  }

  /**
   * 删除数据
   */
  async deleteData<T>(table: string, id: string | number): Promise<T> {
    return this.delete<T>(`/${table}?id=eq.${id}`);
  }

  /**
   * 执行RPC函数
   */
  async executeRpc<T>(functionName: string, params?: any): Promise<T> {
    return this.post<T, any>(`/rpc/${functionName}`, params);
  }
}

// 导出单例实例
export const neonDataApiService = new NeonDataApiService();

// 导出服务类型
export type { NeonDataApiService };
