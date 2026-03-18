/**
 * 搜索功能 API 路由
 * 处理搜索历史、热门搜索、搜索建议等相关接口
 */

import { verifyToken } from '../jwt.mjs';
import { getDB } from '../database.mjs';
import { supabaseServer } from '../supabase-server.mjs';

/**
 * 验证用户身份
 */
async function authenticateUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    console.error('[Search] Token verification failed:', error.message);
    return null;
  }
}

/**
 * 获取用户搜索历史
 * GET /api/search/history
 */
export async function getSearchHistory(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const keyword = url.searchParams.get('keyword') || '';

    let query = supabaseServer
      .from('user_search_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (keyword) {
      query = query.ilike('query', `%${keyword}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[Search] Get history error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '获取搜索历史失败'
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        history: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    }));
  } catch (error) {
    console.error('[Search] Get history error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '获取搜索历史失败'
    }));
  }
}

/**
 * 保存搜索记录
 * POST /api/search/history
 */
export async function saveSearchHistory(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { query, searchType, resultCount, filters } = JSON.parse(body);

        if (!query || query.trim() === '') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '搜索关键词不能为空'
          }));
          return;
        }

        // 直接插入搜索历史记录
        const { data, error } = await supabaseServer
          .from('user_search_history')
          .insert({
            user_id: user.userId,
            query: query.trim(),
            search_type: searchType || 'general',
            result_count: resultCount || 0,
            search_filters: filters || {},
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('[Search] Save history error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '保存搜索记录失败'
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: { historyId: data?.id }
        }));
      } catch (error) {
        console.error('[Search] Save history error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '保存搜索记录失败'
        }));
      }
    });
  } catch (error) {
    console.error('[Search] Save history error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '保存搜索记录失败'
    }));
  }
}

/**
 * 删除单条搜索记录
 * DELETE /api/search/history/:id
 */
export async function deleteSearchHistory(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const historyId = pathParts[pathParts.length - 1];

    if (!historyId || historyId === 'history') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '记录ID不能为空'
      }));
      return;
    }

    const { error } = await supabaseServer
      .from('user_search_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', user.userId);

    if (error) {
      console.error('[Search] Delete history error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '删除搜索记录失败'
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: '删除成功'
    }));
  } catch (error) {
    console.error('[Search] Delete history error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '删除搜索记录失败'
    }));
  }
}

/**
 * 清空搜索历史
 * DELETE /api/search/history
 */
export async function clearSearchHistory(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    const { error } = await supabaseServer
      .from('user_search_history')
      .delete()
      .eq('user_id', user.userId);

    if (error) {
      console.error('[Search] Clear history error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '清空搜索历史失败'
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: '清空成功'
    }));
  } catch (error) {
    console.error('[Search] Clear history error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '清空搜索历史失败'
    }));
  }
}

/**
 * 获取热门搜索
 * GET /api/search/hot
 */
export async function getHotSearches(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const category = url.searchParams.get('category') || '';
    const timeRange = url.searchParams.get('timeRange') || '7d'; // 1d, 7d, 30d

    let data = [];
    let error = null;

    try {
      let query = supabaseServer
        .from('hot_searches')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      // 根据时间范围筛选
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case '1d':
          startDate = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      }

      query = query.gte('last_searched_at', startDate.toISOString());

      const result = await query
        .order('trend_score', { ascending: false })
        .limit(limit);

      data = result.data;
      error = result.error;
    } catch (dbError) {
      console.log('[Search] Database query failed, using mock data:', dbError.message);
      error = dbError;
    }

    // 如果数据库查询失败或没有数据，返回模拟数据
    if (error || !data || data.length === 0) {
      console.log('[Search] Using mock hot searches data');
      data = getMockHotSearches();
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: data
    }));
  } catch (error) {
    console.error('[Search] Get hot searches error:', error);
    // 即使出错也返回模拟数据，确保功能可用
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: getMockHotSearches()
    }));
  }
}

/**
 * 获取模拟热门搜索数据
 */
function getMockHotSearches() {
  return [
    { id: '1', query: '国潮设计', search_count: 1250, trend_score: 95.5, category: 'design' },
    { id: '2', query: '纹样设计', search_count: 980, trend_score: 88.2, category: 'design' },
    { id: '3', query: '品牌设计', search_count: 856, trend_score: 82.1, category: 'design' },
    { id: '4', query: '非遗传承', search_count: 743, trend_score: 76.8, category: 'culture' },
    { id: '5', query: '插画设计', search_count: 692, trend_score: 72.3, category: 'design' },
    { id: '6', query: '文创产品', search_count: 621, trend_score: 68.5, category: 'product' },
    { id: '7', query: '天津文化', search_count: 580, trend_score: 65.2, category: 'culture' },
    { id: '8', query: 'IP设计', search_count: 534, trend_score: 61.8, category: 'design' }
  ];
}

/**
 * 获取搜索建议
 * GET /api/search/suggestions
 */
export async function getSearchSuggestions(req, res) {
  try {
    const user = await authenticateUser(req);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const category = url.searchParams.get('category') || '';

    let suggestions = [];

    try {
      if (!query || query.trim() === '') {
        // 如果没有查询词，返回推荐搜索
        let suggestionsQuery = supabaseServer
          .from('search_suggestions')
          .select('*')
          .eq('is_active', true)
          .eq('is_recommended', true)
          .order('weight', { ascending: false })
          .limit(limit);

        if (category) {
          suggestionsQuery = suggestionsQuery.eq('category', category);
        }

        const { data, error } = await suggestionsQuery;

        if (error) {
          console.log('[Search] Get suggestions from DB failed:', error.message);
          suggestions = getMockSuggestions();
        } else {
          suggestions = data || getMockSuggestions();
        }
      } else {
        // 如果有查询词，返回匹配的建议
        if (user) {
          // 使用个性化推荐函数
          try {
            const { data, error } = await supabaseServer.rpc('get_personalized_suggestions', {
              p_user_id: user.userId,
              p_query: query.trim(),
              p_limit: limit
            });

            if (error) {
              console.log('[Search] Get personalized suggestions failed:', error.message);
              suggestions = getFilteredMockSuggestions(query, limit);
            } else {
              suggestions = data || getFilteredMockSuggestions(query, limit);
            }
          } catch (rpcError) {
            console.log('[Search] RPC call failed:', rpcError.message);
            suggestions = getFilteredMockSuggestions(query, limit);
          }
        } else {
          // 未登录用户使用默认推荐
          suggestions = await getDefaultSuggestions(query, limit, category);
        }
      }
    } catch (dbError) {
      console.log('[Search] Database query failed, using mock data:', dbError.message);
      suggestions = query.trim() ? getFilteredMockSuggestions(query, limit) : getMockSuggestions();
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: suggestions
    }));
  } catch (error) {
    console.error('[Search] Get suggestions error:', error);
    // 即使出错也返回模拟数据
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: query.trim() ? getFilteredMockSuggestions(query, limit) : getMockSuggestions()
    }));
  }
}

/**
 * 获取过滤后的模拟搜索建议
 */
function getFilteredMockSuggestions(query, limit) {
  const allSuggestions = getMockSuggestions();
  const filtered = allSuggestions.filter(s =>
    s.keyword.toLowerCase().includes(query.toLowerCase())
  );
  return filtered.slice(0, limit);
}

/**
 * 获取默认搜索建议
 */
async function getDefaultSuggestions(query, limit, category) {
  try {
    let dbQuery = supabaseServer
      .from('search_suggestions')
      .select('*')
      .eq('is_active', true)
      .ilike('keyword', `%${query}%`)
      .order('weight', { ascending: false })
      .limit(limit);

    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    const { data, error } = await dbQuery;

    if (error || !data || data.length === 0) {
      // 返回模拟数据
      return getFilteredMockSuggestions(query, limit);
    }

    return data;
  } catch (err) {
    console.log('[Search] getDefaultSuggestions failed:', err.message);
    return getFilteredMockSuggestions(query, limit);
  }
}

/**
 * 获取模拟搜索建议数据
 */
function getMockSuggestions() {
  return [
    { id: '1', keyword: '国潮设计', category: 'design', weight: 100, is_hot: true },
    { id: '2', keyword: '纹样设计', category: 'design', weight: 95, is_hot: true },
    { id: '3', keyword: '品牌设计', category: 'design', weight: 90, is_hot: true },
    { id: '4', keyword: '非遗传承', category: 'culture', weight: 85, is_hot: true },
    { id: '5', keyword: '插画设计', category: 'design', weight: 80, is_hot: true },
    { id: '6', keyword: '文创产品', category: 'product', weight: 85, is_hot: true },
    { id: '7', keyword: '天津文化', category: 'culture', weight: 80, is_hot: true },
    { id: '8', keyword: 'IP设计', category: 'design', weight: 65, is_hot: true }
  ];
}

/**
 * 获取用户搜索偏好
 * GET /api/search/preferences
 */
export async function getSearchPreferences(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    const { data, error } = await supabaseServer
      .from('user_search_preferences')
      .select('*')
      .eq('user_id', user.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Search] Get preferences error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '获取搜索偏好失败'
      }));
      return;
    }

    // 如果没有记录，返回默认偏好
    const preferences = data || getDefaultPreferences();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: preferences
    }));
  } catch (error) {
    console.error('[Search] Get preferences error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '获取搜索偏好失败'
    }));
  }
}

/**
 * 获取默认搜索偏好
 */
function getDefaultPreferences() {
  return {
    preferred_categories: [],
    preferred_tags: [],
    preferred_authors: [],
    search_history_enabled: true,
    personalized_recommendations_enabled: true,
    auto_suggest_enabled: true,
    safe_search_enabled: false,
    results_per_page: 20,
    default_sort_by: 'relevance',
    ui_preferences: {}
  };
}

/**
 * 更新用户搜索偏好
 * PUT /api/search/preferences
 */
export async function updateSearchPreferences(req, res) {
  try {
    const user = await authenticateUser(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未登录'
      }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const preferences = JSON.parse(body);

        const { data, error } = await supabaseServer
          .from('user_search_preferences')
          .upsert({
            user_id: user.userId,
            ...preferences,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single();

        if (error) {
          console.error('[Search] Update preferences error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '更新搜索偏好失败'
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data
        }));
      } catch (error) {
        console.error('[Search] Update preferences error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '更新搜索偏好失败'
        }));
      }
    });
  } catch (error) {
    console.error('[Search] Update preferences error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '更新搜索偏好失败'
    }));
  }
}

/**
 * 跟踪搜索行为
 * POST /api/search/track
 */
export async function trackSearchBehavior(req, res) {
  try {
    const user = await authenticateUser(req);

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const {
          searchQuery,
          resultClicked,
          clickedResultId,
          clickedResultType,
          clickPosition,
          searchContext,
          deviceType
        } = JSON.parse(body);

        const trackingData = {
          user_id: user?.userId || null,
          search_query: searchQuery,
          result_clicked: resultClicked || false,
          clicked_result_id: clickedResultId || null,
          clicked_result_type: clickedResultType || null,
          click_position: clickPosition || null,
          search_context: searchContext || {},
          device_type: deviceType || 'desktop',
          created_at: new Date().toISOString()
        };

        const { error } = await supabaseServer
          .from('search_behavior_tracking')
          .insert([trackingData]);

        if (error) {
          console.error('[Search] Track behavior error:', error);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true
        }));
      } catch (error) {
        console.error('[Search] Track behavior error:', error);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true
        }));
      }
    });
  } catch (error) {
    console.error('[Search] Track behavior error:', error);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true
    }));
  }
}

/**
 * 搜索路由处理器
 */
export default async function searchRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 路由匹配
  if (pathname === '/api/search/history' && method === 'GET') {
    await getSearchHistory(req, res);
    return;
  }

  if (pathname === '/api/search/history' && method === 'POST') {
    await saveSearchHistory(req, res);
    return;
  }

  if (pathname.startsWith('/api/search/history/') && method === 'DELETE') {
    await deleteSearchHistory(req, res);
    return;
  }

  if (pathname === '/api/search/history' && method === 'DELETE') {
    await clearSearchHistory(req, res);
    return;
  }

  if (pathname === '/api/search/hot' && method === 'GET') {
    await getHotSearches(req, res);
    return;
  }

  if (pathname === '/api/search/suggestions' && method === 'GET') {
    await getSearchSuggestions(req, res);
    return;
  }

  if (pathname === '/api/search/preferences' && method === 'GET') {
    await getSearchPreferences(req, res);
    return;
  }

  if (pathname === '/api/search/preferences' && method === 'PUT') {
    await updateSearchPreferences(req, res);
    return;
  }

  if (pathname === '/api/search/track' && method === 'POST') {
    await trackSearchBehavior(req, res);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: '接口不存在'
  }));
}
