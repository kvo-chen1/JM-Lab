/**
 * IP孵化中心 API 路由
 * 处理 IP资产、商业机会、版权资产等相关请求
 * 兼容 local-api.mjs 的路由处理方式
 */

import { getDB } from '../database.mjs';
import { verifyToken } from '../jwt.mjs';

// 辅助函数：发送JSON响应
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// 辅助函数：读取请求体
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// 验证用户身份
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
    console.error('[IP API] Token verification failed:', error.message);
    return null;
  }
}

// 获取当前用户ID（从请求中提取）
async function getUserId(req) {
  // 从 JWT token 获取用户ID
  const user = await authenticateUser(req);
  if (user) {
    return user.userId;
  }
  
  // 从请求头或查询参数获取（开发/测试用）
  return req.headers['x-user-id'] || null;
}

// ============================================
// IP 资产相关方法
// ============================================

// 获取用户的所有IP资产
async function getAllIPAssets(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }

    const pool = await getDB();
    
    // 查询IP资产及其阶段信息
    const query = `
      SELECT 
        a.id,
        a.user_id,
        a.name,
        a.description,
        a.type,
        a.original_work_id,
        a.commercial_value,
        a.thumbnail,
        a.status,
        a.created_at,
        a.updated_at,
        COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', s.id,
              'name', s.name,
              'description', s.description,
              'orderIndex', s.order_index,
              'completed', s.completed,
              'completedAt', s.completed_at,
              'createdAt', s.created_at,
              'updatedAt', s.updated_at
            ) ORDER BY s.order_index
          )
          FROM ip_stages s
          WHERE s.ip_asset_id = a.id
          ), '[]'::jsonb
        ) as stages
      FROM ip_assets a
      WHERE a.user_id = $1 
        AND a.status = 'active'
      ORDER BY a.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    // 转换数据格式
    const assets = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      type: row.type,
      originalWorkId: row.original_work_id,
      commercialValue: row.commercial_value,
      thumbnail: row.thumbnail,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      stages: row.stages || []
    }));
    
    sendJson(res, 200, { ok: true, data: assets });
  } catch (error) {
    console.error('[IP API] 获取IP资产失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 获取单个IP资产详情
async function getIPAssetById(req, res, id) {
  try {
    const userId = await getUserId(req);
    
    const pool = await getDB();
    
    const query = `
      SELECT 
        a.*,
        COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', s.id,
              'name', s.name,
              'description', s.description,
              'orderIndex', s.order_index,
              'completed', s.completed,
              'completedAt', s.completed_at,
              'createdAt', s.created_at,
              'updatedAt', s.updated_at
            ) ORDER BY s.order_index
          )
          FROM ip_stages s
          WHERE s.ip_asset_id = a.id
          ), '[]'::jsonb
        ) as stages
      FROM ip_assets a
      WHERE a.id = $1 AND (a.user_id = $2 OR $2 IS NULL)
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: 'IP资产不存在' });
    }
    
    const row = result.rows[0];
    const asset = {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      type: row.type,
      originalWorkId: row.original_work_id,
      commercialValue: row.commercial_value,
      thumbnail: row.thumbnail,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      stages: row.stages || []
    };
    
    sendJson(res, 200, { ok: true, data: asset });
  } catch (error) {
    console.error('[IP API] 获取IP资产详情失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 创建新的IP资产
async function createIPAsset(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const body = await readBody(req);
    const { name, description, type, originalWorkId, commercialValue, thumbnail, status } = body;
    
    const pool = await getDB();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 创建IP资产
      const assetQuery = `
        INSERT INTO ip_assets (user_id, name, description, type, original_work_id, commercial_value, thumbnail, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const assetResult = await client.query(assetQuery, [
        userId, name, description, type, originalWorkId, commercialValue || 0, thumbnail, status || 'pending_review'
      ]);
      
      const assetId = assetResult.rows[0].id;
      
      // 创建默认的5个阶段
      const stages = [
        { name: '创意设计', description: '完成原创设计作品', order_index: 1 },
        { name: '版权存证', description: '进行版权登记存证', order_index: 2 },
        { name: 'IP孵化', description: '转化为可商业化IP', order_index: 3 },
        { name: '商业合作', description: '对接品牌方合作', order_index: 4 },
        { name: '收益分成', description: '获得持续收益', order_index: 5 }
      ];
      
      for (const stage of stages) {
        await client.query(
          'INSERT INTO ip_stages (ip_asset_id, name, description, order_index) VALUES ($1, $2, $3, $4)',
          [assetId, stage.name, stage.description, stage.order_index]
        );
      }
      
      await client.query('COMMIT');
      
      // 返回创建的资产（包含阶段）
      const newAsset = await client.query(`
        SELECT 
          a.*,
          COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'description', s.description,
                'orderIndex', s.order_index,
                'completed', s.completed,
                'completedAt', s.completed_at,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at
              ) ORDER BY s.order_index
            )
            FROM ip_stages s
            WHERE s.ip_asset_id = a.id
            ), '[]'::jsonb
          ) as stages
        FROM ip_assets a
        WHERE a.id = $1
      `, [assetId]);
      
      const row = newAsset.rows[0];
      sendJson(res, 200, {
        ok: true,
        data: {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description,
          type: row.type,
          originalWorkId: row.original_work_id,
          commercialValue: row.commercial_value,
          thumbnail: row.thumbnail,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          stages: row.stages || []
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[IP API] 创建IP资产失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 更新IP资产
async function updateIPAsset(req, res, id) {
  try {
    const userId = await getUserId(req);
    const body = await readBody(req);
    
    const pool = await getDB();
    
    const allowedFields = ['name', 'description', 'type', 'commercial_value', 'thumbnail', 'status'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (setClause.length === 0) {
      return sendJson(res, 400, { error: '没有可更新的字段' });
    }
    
    values.push(id, userId);
    
    const query = `
      UPDATE ip_assets 
      SET ${setClause.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: 'IP资产不存在或无权限' });
    }
    
    sendJson(res, 200, { ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('[IP API] 更新IP资产失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 删除IP资产（软删除）
async function deleteIPAsset(req, res, id) {
  try {
    const userId = await getUserId(req);
    
    const pool = await getDB();
    
    const query = `
      UPDATE ip_assets 
      SET status = 'deleted', updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: 'IP资产不存在或无权限' });
    }
    
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[IP API] 删除IP资产失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 更新IP阶段状态
async function updateIPStage(req, res, ipId, stageId) {
  try {
    const body = await readBody(req);
    const { completed } = body;
    const userId = await getUserId(req);
    
    const pool = await getDB();
    
    // 验证IP资产属于当前用户
    const assetCheck = await pool.query(
      'SELECT id FROM ip_assets WHERE id = $1 AND user_id = $2',
      [ipId, userId]
    );
    
    if (assetCheck.rows.length === 0) {
      return sendJson(res, 403, { error: '无权限修改此IP资产' });
    }
    
    const query = `
      UPDATE ip_stages 
      SET completed = $1, 
          completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
          updated_at = NOW()
      WHERE id = $2 AND ip_asset_id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [completed, stageId, ipId]);
    
    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '阶段不存在' });
    }
    
    sendJson(res, 200, { ok: true, data: result.rows[0] });
  } catch (error) {
    console.error('[IP API] 更新阶段状态失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// ============================================
// 统计数据方法
// ============================================

// 获取IP统计
async function getIPStats(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const pool = await getDB();
    
    const query = `
      SELECT 
        COUNT(*) as total_assets,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assets,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as in_progress_assets,
        COALESCE(SUM(commercial_value), 0) as total_estimated_value
      FROM ip_assets
      WHERE user_id = $1 AND status IN ('active', 'completed')
    `;
    
    const result = await pool.query(query, [userId]);
    const stats = result.rows[0];
    
    // 获取合作统计
    const partnershipQuery = `
      SELECT 
        COUNT(*) as total_partnerships,
        COUNT(CASE WHEN status IN ('pending', 'negotiating') THEN 1 END) as active_partnerships
      FROM ip_partnerships
      WHERE user_id = $1
    `;
    
    const partnershipResult = await pool.query(partnershipQuery, [userId]);
    const partnershipStats = partnershipResult.rows[0];
    
    sendJson(res, 200, {
      ok: true,
      data: {
        totalAssets: parseInt(stats.total_assets) || 0,
        completedAssets: parseInt(stats.completed_assets) || 0,
        inProgressAssets: parseInt(stats.in_progress_assets) || 0,
        totalPartnerships: parseInt(partnershipStats.total_partnerships) || 0,
        activePartnerships: parseInt(partnershipStats.active_partnerships) || 0,
        totalEstimatedValue: parseInt(stats.total_estimated_value) || 0
      }
    });
  } catch (error) {
    console.error('[IP API] 获取统计失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 获取IP价值趋势
async function getIPValueTrend(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const pool = await getDB();
    
    const query = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(commercial_value) as value
      FROM ip_assets
      WHERE user_id = $1 
        AND status IN ('active', 'completed')
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;
    
    const result = await pool.query(query, [userId]);
    
    const trend = result.rows.map(row => ({
      timestamp: row.month.toISOString().slice(0, 7),
      value: parseInt(row.value) || 0
    }));
    
    sendJson(res, 200, { ok: true, data: trend });
  } catch (error) {
    console.error('[IP API] 获取价值趋势失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 获取IP类型分布
async function getIPTypeDistribution(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const pool = await getDB();
    
    const query = `
      SELECT 
        type,
        COUNT(*) as count
      FROM ip_assets
      WHERE user_id = $1 
        AND status IN ('active', 'completed')
      GROUP BY type
    `;
    
    const result = await pool.query(query, [userId]);
    
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    const distribution = result.rows.map(row => ({
      type: row.type,
      count: parseInt(row.count),
      percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0
    }));
    
    sendJson(res, 200, { ok: true, data: distribution });
  } catch (error) {
    console.error('[IP API] 获取类型分布失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// ============================================
// 商业机会方法
// ============================================

// 获取所有商业机会
async function getAllOpportunities(req, res) {
  try {
    const pool = await getDB();
    
    const query = `
      SELECT 
        id,
        brand_name,
        brand_logo,
        name,
        description,
        reward,
        requirements,
        deadline,
        status,
        match_criteria,
        view_count,
        created_at,
        updated_at
      FROM commercial_opportunities
      WHERE status = 'open'
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    const opportunities = result.rows.map(row => ({
      id: row.id,
      brandName: row.brand_name,
      brandLogo: row.brand_logo,
      name: row.name,
      description: row.description,
      reward: row.reward,
      requirements: row.requirements,
      deadline: row.deadline,
      status: row.status,
      matchCriteria: row.match_criteria,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    sendJson(res, 200, { ok: true, data: opportunities });
  } catch (error) {
    console.error('[IP API] 获取商业机会失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 申请商业机会
async function applyOpportunity(req, res, id) {
  try {
    const body = await readBody(req);
    const { ipAssetId } = body;
    const userId = await getUserId(req);
    
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const pool = await getDB();
    
    // 获取机会详情
    const opportunityResult = await pool.query(
      'SELECT * FROM commercial_opportunities WHERE id = $1',
      [id]
    );
    
    if (opportunityResult.rows.length === 0) {
      return sendJson(res, 404, { error: '商业机会不存在' });
    }
    
    const opportunity = opportunityResult.rows[0];
    
    // 创建合作申请
    const insertQuery = `
      INSERT INTO ip_partnerships 
        (ip_asset_id, opportunity_id, user_id, brand_name, description, reward, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `;
    
    await pool.query(insertQuery, [
      ipAssetId,
      id,
      userId,
      opportunity.brand_name,
      opportunity.description,
      opportunity.reward
    ]);
    
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[IP API] 申请商业机会失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 获取主办方的商业机会（只返回自己发布的）
async function getOrganizerOpportunities(req, res) {
  try {
    const userId = await getUserId(req);
    
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const pool = await getDB();
    
    const query = `
      SELECT 
        id,
        brand_name,
        brand_logo,
        name,
        description,
        reward,
        requirements,
        deadline,
        status,
        match_criteria,
        view_count,
        created_at,
        updated_at
      FROM commercial_opportunities
      WHERE brand_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    const opportunities = result.rows.map(row => ({
      id: row.id,
      brandName: row.brand_name,
      brandLogo: row.brand_logo,
      name: row.name,
      description: row.description,
      reward: row.reward,
      requirements: row.requirements,
      deadline: row.deadline,
      status: row.status,
      matchCriteria: row.match_criteria,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    sendJson(res, 200, { ok: true, data: opportunities });
  } catch (error) {
    console.error('[IP API] 获取主办方商业机会失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 创建商业机会
async function createOpportunity(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const body = await readBody(req);
    const {
      name,
      brandName,
      description,
      type,
      rewardMin,
      rewardMax,
      matchCriteria,
      deadline,
      contactInfo,
      status
    } = body;
    
    const pool = await getDB();
    
    // 构建奖励字符串
    const reward = rewardMin && rewardMax 
      ? `¥${rewardMin} - ¥${rewardMax}`
      : rewardMin 
        ? `¥${rewardMin}起`
        : rewardMax 
          ? `¥${rewardMax}以内`
          : '面议';
    
    const insertQuery = `
      INSERT INTO commercial_opportunities 
        (brand_id, brand_name, name, description, reward, deadline, status, match_criteria, requirements)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      userId,
      brandName,
      name,
      description,
      reward,
      deadline || null,
      status || 'draft',
      matchCriteria ? JSON.stringify(matchCriteria) : null,
      contactInfo
    ]);
    
    const row = result.rows[0];
    const opportunity = {
      id: row.id,
      brandName: row.brand_name,
      name: row.name,
      description: row.description,
      reward: row.reward,
      deadline: row.deadline,
      status: row.status,
      matchCriteria: row.match_criteria,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    sendJson(res, 200, { ok: true, data: opportunity });
  } catch (error) {
    console.error('[IP API] 创建商业机会失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 更新商业机会
async function updateOpportunity(req, res, id) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const body = await readBody(req);
    const {
      name,
      brandName,
      description,
      rewardMin,
      rewardMax,
      matchCriteria,
      deadline,
      contactInfo,
      status
    } = body;
    
    const pool = await getDB();
    
    // 检查是否是该用户发布的机会
    const checkResult = await pool.query(
      'SELECT brand_id FROM commercial_opportunities WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return sendJson(res, 404, { error: '商业机会不存在' });
    }
    
    if (checkResult.rows[0].brand_id !== userId) {
      return sendJson(res, 403, { error: '无权修改此商业机会' });
    }
    
    // 构建奖励字符串
    const reward = rewardMin && rewardMax 
      ? `¥${rewardMin} - ¥${rewardMax}`
      : rewardMin 
        ? `¥${rewardMin}起`
        : rewardMax 
          ? `¥${rewardMax}以内`
          : '面议';
    
    const updateQuery = `
      UPDATE commercial_opportunities 
      SET brand_name = $1, name = $2, description = $3, reward = $4, 
          deadline = $5, status = $6, match_criteria = $7, requirements = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      brandName,
      name,
      description,
      reward,
      deadline || null,
      status,
      matchCriteria ? JSON.stringify(matchCriteria) : null,
      contactInfo,
      id
    ]);
    
    const row = result.rows[0];
    const opportunity = {
      id: row.id,
      brandName: row.brand_name,
      name: row.name,
      description: row.description,
      reward: row.reward,
      deadline: row.deadline,
      status: row.status,
      matchCriteria: row.match_criteria,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    sendJson(res, 200, { ok: true, data: opportunity });
  } catch (error) {
    console.error('[IP API] 更新商业机会失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// ============================================
// 商业合作方法
// ============================================

// 获取用户的商业合作
async function getAllPartnerships(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const pool = await getDB();
    
    // 先检查表结构，动态构建查询
    const columnCheckQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ip_partnerships'
    `;
    const columnResult = await pool.query(columnCheckQuery);
    const columns = columnResult.rows.map(r => r.column_name);
    
    // 构建查询字段
    const selectFields = ['id', 'ip_asset_id', 'brand_name', 'description', 'reward', 'status', 'created_at', 'updated_at'];
    if (columns.includes('brand_logo')) {
      selectFields.push('brand_logo');
    }
    if (columns.includes('opportunity_id')) {
      selectFields.push('opportunity_id');
    }
    
    const query = `
      SELECT ${selectFields.join(', ')}
      FROM ip_partnerships
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    const partnerships = result.rows.map(row => ({
      id: row.id,
      ipAssetId: row.ip_asset_id,
      opportunityId: row.opportunity_id,
      brandName: row.brand_name,
      brandLogo: row.brand_logo || null,
      description: row.description,
      reward: row.reward,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    sendJson(res, 200, { ok: true, data: partnerships });
  } catch (error) {
    console.error('[IP API] 获取商业合作失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// ============================================
// 版权资产方法
// ============================================

// 获取用户的版权资产
async function getCopyrightAssets(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const pool = await getDB();
    
    const query = `
      SELECT 
        id,
        name,
        thumbnail,
        type,
        status,
        can_license,
        license_price,
        certificate_url,
        registered_at,
        expires_at,
        created_at,
        updated_at
      FROM copyright_assets
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    const assets = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      thumbnail: row.thumbnail,
      type: row.type,
      status: row.status,
      canLicense: row.can_license,
      licensePrice: row.license_price,
      certificateUrl: row.certificate_url,
      registeredAt: row.registered_at,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    sendJson(res, 200, { ok: true, data: assets });
  } catch (error) {
    console.error('[IP API] 获取版权资产失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 更新版权授权状态
async function updateCopyrightLicense(req, res, id) {
  try {
    const body = await readBody(req);
    const { canLicense } = body;
    const userId = await getUserId(req);
    
    const pool = await getDB();
    
    const query = `
      UPDATE copyright_assets 
      SET can_license = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING id
    `;
    
    const result = await pool.query(query, [canLicense, id, userId]);
    
    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '版权资产不存在或无权限' });
    }
    
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[IP API] 更新版权授权状态失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// ============================================
// IP 活动方法
// ============================================

// 获取用户的IP活动
async function getIPActivities(req, res) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return sendJson(res, 401, { error: '未登录' });
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    const pool = await getDB();
    
    const query = `
      SELECT 
        id,
        type,
        title,
        description,
        ip_asset_id,
        is_read,
        created_at
      FROM ip_activities
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    
    const activities = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      ipAssetId: row.ip_asset_id,
      isRead: row.is_read,
      createdAt: row.created_at
    }));
    
    sendJson(res, 200, { ok: true, data: activities });
  } catch (error) {
    console.error('[IP API] 获取IP活动失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 标记活动为已读
async function markActivityAsRead(req, res, id) {
  try {
    const userId = await getUserId(req);
    
    const pool = await getDB();
    
    const query = `
      UPDATE ip_activities 
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '活动不存在或无权限' });
    }
    
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[IP API] 标记活动已读失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// 标记所有活动为已读
async function markAllActivitiesAsRead(req, res) {
  try {
    const userId = await getUserId(req);
    
    const pool = await getDB();
    
    await pool.query(
      'UPDATE ip_activities SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[IP API] 标记所有活动已读失败:', error);
    sendJson(res, 500, { error: error.message });
  }
}

// ============================================
// 主路由处理函数
// ============================================

export default async function ipRoutes(req, res) {
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

  console.log('[IP Routes] Processing:', method, pathname);

  // IP 资产路由
  if (pathname === '/api/ip/assets' && method === 'GET') {
    await getAllIPAssets(req, res);
    return;
  }

  if (pathname === '/api/ip/assets' && method === 'POST') {
    await createIPAsset(req, res);
    return;
  }

  // 匹配 /api/ip/assets/:id
  const assetDetailMatch = pathname.match(/^\/api\/ip\/assets\/([^\/]+)$/);
  if (assetDetailMatch) {
    const id = assetDetailMatch[1];
    if (method === 'GET') {
      await getIPAssetById(req, res, id);
      return;
    }
    if (method === 'PUT') {
      await updateIPAsset(req, res, id);
      return;
    }
    if (method === 'DELETE') {
      await deleteIPAsset(req, res, id);
      return;
    }
  }

  // 匹配 /api/ip/assets/:ipId/stages/:stageId
  const stageMatch = pathname.match(/^\/api\/ip\/assets\/([^\/]+)\/stages\/([^\/]+)$/);
  if (stageMatch && method === 'PUT') {
    const ipId = stageMatch[1];
    const stageId = stageMatch[2];
    await updateIPStage(req, res, ipId, stageId);
    return;
  }

  // 统计数据路由
  if (pathname === '/api/ip/stats' && method === 'GET') {
    await getIPStats(req, res);
    return;
  }

  if (pathname === '/api/ip/stats/value-trend' && method === 'GET') {
    await getIPValueTrend(req, res);
    return;
  }

  if (pathname === '/api/ip/stats/type-distribution' && method === 'GET') {
    await getIPTypeDistribution(req, res);
    return;
  }

  // 主办方自己的商业机会路由（必须在 /api/ip/opportunities 之前）
  if (pathname === '/api/ip/opportunities/organizer' && method === 'GET') {
    await getOrganizerOpportunities(req, res);
    return;
  }

  // 商业机会路由
  if (pathname === '/api/ip/opportunities' && method === 'GET') {
    await getAllOpportunities(req, res);
    return;
  }

  // 创建商业机会
  if (pathname === '/api/ip/opportunities' && method === 'POST') {
    await createOpportunity(req, res);
    return;
  }

  // 更新商业机会
  const opportunityUpdateMatch = pathname.match(/^\/api\/ip\/opportunities\/([^\/]+)$/);
  if (opportunityUpdateMatch && method === 'PUT') {
    const id = opportunityUpdateMatch[1];
    await updateOpportunity(req, res, id);
    return;
  }

  // 匹配 /api/ip/opportunities/:id/apply
  const opportunityApplyMatch = pathname.match(/^\/api\/ip\/opportunities\/([^\/]+)\/apply$/);
  if (opportunityApplyMatch && method === 'POST') {
    const id = opportunityApplyMatch[1];
    await applyOpportunity(req, res, id);
    return;
  }

  // 商业合作路由
  if (pathname === '/api/ip/partnerships' && method === 'GET') {
    await getAllPartnerships(req, res);
    return;
  }

  // 版权资产路由
  if (pathname === '/api/ip/copyright' && method === 'GET') {
    await getCopyrightAssets(req, res);
    return;
  }

  // 匹配 /api/ip/copyright/:id/license
  const copyrightLicenseMatch = pathname.match(/^\/api\/ip\/copyright\/([^\/]+)\/license$/);
  if (copyrightLicenseMatch && method === 'PUT') {
    const id = copyrightLicenseMatch[1];
    await updateCopyrightLicense(req, res, id);
    return;
  }

  // IP 活动路由
  if (pathname === '/api/ip/activities' && method === 'GET') {
    await getIPActivities(req, res);
    return;
  }

  // 匹配 /api/ip/activities/:id/read
  const activityReadMatch = pathname.match(/^\/api\/ip\/activities\/([^\/]+)\/read$/);
  if (activityReadMatch && method === 'PUT') {
    const id = activityReadMatch[1];
    await markActivityAsRead(req, res, id);
    return;
  }

  if (pathname === '/api/ip/activities/read-all' && method === 'PUT') {
    await markAllActivitiesAsRead(req, res);
    return;
  }

  // 404
  console.log('[IP Routes] No matching route for:', pathname);
  sendJson(res, 404, { error: '接口不存在' });
}
