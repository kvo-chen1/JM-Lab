/**
 * 版权授权功能 API 路由
 * 处理品牌方授权需求和创作者申请
 */

import { getDB } from '../database.mjs';
import { verifyToken } from '../jwt.mjs';

// 辅助函数：验证请求token
function verifyRequestToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[verifyRequestToken] No authorization header');
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('[verifyRequestToken] No token in authorization header');
    return null;
  }
  
  try {
    const decoded = verifyToken(token);
    console.log('[verifyRequestToken] Token decoded:', decoded ? 'success' : 'failed');
    if (decoded) {
      console.log('[verifyRequestToken] Decoded token:', { userId: decoded.userId, sub: decoded.sub, id: decoded.id });
      if (!decoded.userId && (decoded.sub || decoded.id)) {
        decoded.userId = decoded.sub || decoded.id;
        console.log('[verifyRequestToken] Set userId from sub/id:', decoded.userId);
      }
    }
    return decoded;
  } catch (error) {
    console.error('[verifyRequestToken] Token verification error:', error.message);
    return null;
  }
}

// 辅助函数：转换数据库字段为驼峰命名
function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = value;
    }
    return result;
  }
  return obj;
}

// 辅助函数：读取请求体
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
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

// 辅助函数：发送JSON响应
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ==================== 品牌方API ====================

// 获取品牌方的授权需求列表
async function getBrandRequests(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const brandId = url.searchParams.get('brandId');
    
    if (!brandId) {
      return sendJson(res, 400, { error: '缺少品牌ID' });
    }

    const db = await getDB();
    const result = await db.query(
      `SELECT * FROM copyright_license_requests 
       WHERE brand_id = $1 
       ORDER BY created_at DESC`,
      [brandId]
    );

    sendJson(res, 200, toCamelCase(result.rows));
  } catch (error) {
    console.error('获取品牌授权需求失败:', error);
    sendJson(res, 500, { error: '获取品牌授权需求失败' });
  }
}

// 创建新的授权需求
async function createBrandRequest(req, res) {
  try {
    const body = await readBody(req);
    const {
      brandId,
      brandName,
      brandLogo,
      title,
      description,
      requirements,
      licenseType,
      licenseScope,
      licenseFeeMin,
      licenseFeeMax,
      revenueShareRate,
      ipCategories,
      validUntil,
      contactEmail,
      contactPhone
    } = body;

    if (!brandId || !brandName || !title) {
      return sendJson(res, 400, { error: '缺少必要参数' });
    }

    const db = await getDB();
    const result = await db.query(
      `INSERT INTO copyright_license_requests (
        brand_id, brand_name, brand_logo, title, description, requirements,
        license_type, license_scope, license_fee_min, license_fee_max, revenue_share_rate,
        ip_categories, valid_until, contact_email, contact_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        brandId, brandName, brandLogo, title, description, requirements,
        licenseType || 'non_exclusive', JSON.stringify(licenseScope || {}),
        licenseFeeMin, licenseFeeMax, revenueShareRate || 10,
        JSON.stringify(ipCategories || []), validUntil, contactEmail, contactPhone
      ]
    );

    sendJson(res, 201, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('创建授权需求失败:', error);
    sendJson(res, 500, { error: '创建授权需求失败' });
  }
}

// 更新授权需求
async function updateBrandRequest(req, res, id) {
  try {
    const body = await readBody(req);
    const updates = body;

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClause.push(`${snakeKey} = $${paramIndex}`);
        
        // 处理对象和数组类型的值，转换为 JSON 字符串
        if (typeof value === 'object' && value !== null) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return sendJson(res, 400, { error: '没有要更新的字段' });
    }

    values.push(id);

    const db = await getDB();
    const result = await db.query(
      `UPDATE copyright_license_requests 
       SET ${setClause.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '授权需求不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('更新授权需求失败:', error);
    sendJson(res, 500, { error: '更新授权需求失败: ' + error.message });
  }
}

// 删除授权需求
async function deleteBrandRequest(req, res, id) {
  try {
    const db = await getDB();
    await db.query('DELETE FROM copyright_license_requests WHERE id = $1', [id]);
    sendJson(res, 200, { success: true });
  } catch (error) {
    console.error('删除授权需求失败:', error);
    sendJson(res, 500, { error: '删除授权需求失败' });
  }
}

// 获取收到的授权申请
async function getBrandApplications(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const brandId = url.searchParams.get('brandId');
    const status = url.searchParams.get('status');
    const requestId = url.searchParams.get('requestId');
    
    if (!brandId) {
      return sendJson(res, 400, { error: '缺少品牌ID' });
    }

    let query = `
      SELECT a.*, r.title as request_title, r.brand_name 
      FROM copyright_applications a
      JOIN copyright_license_requests r ON a.request_id = r.id
      WHERE r.brand_id = $1
    `;
    const params = [brandId];
    let paramIndex = 2;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (requestId) {
      query += ` AND a.request_id = $${paramIndex}`;
      params.push(requestId);
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC`;

    const db = await getDB();
    const result = await db.query(query, params);
    sendJson(res, 200, toCamelCase(result.rows));
  } catch (error) {
    console.error('获取授权申请失败:', error);
    sendJson(res, 500, { error: '获取授权申请失败' });
  }
}

// 获取申请详情
async function getApplicationById(req, res, id) {
  try {
    const db = await getDB();
    const result = await db.query(
      `SELECT a.*, r.* 
       FROM copyright_applications a
       JOIN copyright_license_requests r ON a.request_id = r.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '申请不存在' });
    }

    const row = result.rows[0];
    const application = {};
    const request = {};
    
    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith('request_')) {
        request[key.replace('request_', '')] = value;
      } else {
        application[key] = value;
      }
    }

    sendJson(res, 200, toCamelCase({ ...application, request: toCamelCase(request) }));
  } catch (error) {
    console.error('获取申请详情失败:', error);
    sendJson(res, 500, { error: '获取申请详情失败' });
  }
}

// 同意授权申请
async function approveApplication(req, res, id) {
  try {
    const body = await readBody(req);
    console.log('[approveApplication] 收到请求:', { id, body });

    const { actualLicenseFee, revenueShareRate, licenseStartDate, licenseEndDate, brandResponse } = body;

    // 验证必要参数（允许 0 作为有效值，但不能是 undefined 或 null）
    if (actualLicenseFee === undefined || actualLicenseFee === null ||
        revenueShareRate === undefined || revenueShareRate === null) {
      return sendJson(res, 400, { error: '缺少必要参数: actualLicenseFee 或 revenueShareRate' });
    }

    // 将日期字符串转换为 PostgreSQL timestamp 格式
    // 前端传入的是 YYYY-MM-DD 格式，需要转换为带时区的完整时间戳
    const formatDateForPostgres = (dateStr) => {
      if (!dateStr) return null;
      // 如果已经是完整的时间戳格式，直接返回
      if (dateStr.includes('T') || dateStr.includes(' ')) {
        return dateStr;
      }
      // 将 YYYY-MM-DD 转换为 YYYY-MM-DD 00:00:00+00
      return `${dateStr} 00:00:00+00`;
    };

    const formattedStartDate = formatDateForPostgres(licenseStartDate);
    const formattedEndDate = formatDateForPostgres(licenseEndDate);

    const db = await getDB();
    console.log('[approveApplication] 执行更新，参数:', [actualLicenseFee, revenueShareRate, formattedStartDate, formattedEndDate, brandResponse, id]);

    const result = await db.query(
      `UPDATE copyright_applications
       SET status = 'approved',
           actual_license_fee = $1,
           revenue_share_rate = $2,
           license_start_date = $3,
           license_end_date = $4,
           brand_response = $5,
           reviewed_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [actualLicenseFee, revenueShareRate, formattedStartDate, formattedEndDate, brandResponse, id]
    );

    console.log('[approveApplication] 更新结果:', result.rows.length > 0 ? '成功' : '未找到记录');

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '申请不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('[approveApplication] 同意授权申请失败:', error);
    console.error('[approveApplication] 错误详情:', error.message);
    sendJson(res, 500, { error: '同意授权申请失败: ' + error.message });
  }
}

// 拒绝授权申请
async function rejectApplication(req, res, id) {
  try {
    const body = await readBody(req);
    const { reason } = body;

    const db = await getDB();
    const result = await db.query(
      `UPDATE copyright_applications 
       SET status = 'rejected',
           brand_response = $1,
           reviewed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason, id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '申请不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('拒绝授权申请失败:', error);
    sendJson(res, 500, { error: '拒绝授权申请失败' });
  }
}

// 分享联系方式
async function shareContact(req, res, id) {
  try {
    const body = await readBody(req);
    const { email, phone, wechat } = body;

    const db = await getDB();
    const result = await db.query(
      `UPDATE copyright_applications 
       SET contact_shared = true,
           brand_contact_email = $1,
           brand_contact_phone = $2,
           brand_contact_wechat = $3
       WHERE id = $4
       RETURNING *`,
      [email, phone, wechat, id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '申请不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('分享联系方式失败:', error);
    sendJson(res, 500, { error: '分享联系方式失败' });
  }
}

// 获取品牌方统计
async function getBrandStats(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const brandId = url.searchParams.get('brandId');
    
    if (!brandId) {
      return sendJson(res, 400, { error: '缺少品牌ID' });
    }

    const db = await getDB();

    // 获取需求统计
    const requestsResult = await db.query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'open') as open_requests
       FROM copyright_license_requests
       WHERE brand_id = $1`,
      [brandId]
    );

    // 获取申请统计
    const applicationsResult = await db.query(
      `SELECT 
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE a.status = 'pending') as pending_applications,
        COUNT(*) FILTER (WHERE a.status = 'approved') as approved_applications
       FROM copyright_applications a
       JOIN copyright_license_requests r ON a.request_id = r.id
       WHERE r.brand_id = $1`,
      [brandId]
    );

    // 获取产品统计
    const productsResult = await db.query(
      `SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE status = 'on_sale') as on_sale_products,
        COALESCE(SUM(revenue), 0) as total_revenue,
        COALESCE(SUM(brand_share), 0) as total_brand_share
       FROM licensed_ip_products
       WHERE brand_id = $1`,
      [brandId]
    );

    const rawStats = {
      ...requestsResult.rows[0],
      ...applicationsResult.rows[0],
      ...productsResult.rows[0]
    };

    // 映射字段名以匹配前端期望
    const stats = {
      totalRequests: parseInt(rawStats.total_requests) || 0,
      activeRequests: parseInt(rawStats.open_requests) || 0,
      totalApplications: parseInt(rawStats.total_applications) || 0,
      pendingApplications: parseInt(rawStats.pending_applications) || 0,
      approvedApplications: parseInt(rawStats.approved_applications) || 0,
      totalProducts: parseInt(rawStats.total_products) || 0,
      onSaleProducts: parseInt(rawStats.on_sale_products) || 0,
      totalRevenue: parseFloat(rawStats.total_revenue) || 0,
      totalLicenseFees: parseFloat(rawStats.total_brand_share) || 0
    };

    sendJson(res, 200, stats);
  } catch (error) {
    console.error('获取品牌统计失败:', error);
    sendJson(res, 500, { error: '获取品牌统计失败' });
  }
}

// ==================== 创作者API ====================

// 获取所有可申请的授权需求
async function getAvailableRequests(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const categories = url.searchParams.getAll('categories');
    const licenseType = url.searchParams.get('licenseType');
    const minFee = url.searchParams.get('minFee');
    const maxFee = url.searchParams.get('maxFee');
    const sortBy = url.searchParams.get('sortBy');

    let query = `SELECT * FROM copyright_license_requests WHERE status = 'open'`;
    const params = [];
    let paramIndex = 1;

    if (categories.length > 0) {
      query += ` AND ip_categories && $${paramIndex}::jsonb`;
      params.push(JSON.stringify(categories));
      paramIndex++;
    }

    if (licenseType) {
      query += ` AND license_type = $${paramIndex}`;
      params.push(licenseType);
      paramIndex++;
    }

    if (minFee) {
      query += ` AND license_fee_min >= $${paramIndex}`;
      params.push(parseInt(minFee));
      paramIndex++;
    }

    if (maxFee) {
      query += ` AND license_fee_max <= $${paramIndex}`;
      params.push(parseInt(maxFee));
      paramIndex++;
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        query += ` ORDER BY application_count DESC`;
        break;
      case 'fee_asc':
        query += ` ORDER BY license_fee_min ASC`;
        break;
      case 'fee_desc':
        query += ` ORDER BY license_fee_max DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY created_at DESC`;
    }

    const db = await getDB();
    const result = await db.query(query, params);
    sendJson(res, 200, toCamelCase(result.rows));
  } catch (error) {
    console.error('获取授权需求失败:', error);
    sendJson(res, 500, { error: '获取授权需求失败' });
  }
}

// 获取授权需求详情
async function getRequestById(req, res, id) {
  try {
    const db = await getDB();
    const result = await db.query(
      'SELECT * FROM copyright_license_requests WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '授权需求不存在' });
    }

    // 增加浏览次数
    await db.query(
      'UPDATE copyright_license_requests SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('获取授权需求详情失败:', error);
    sendJson(res, 500, { error: '获取授权需求详情失败' });
  }
}

// 提交授权申请
async function submitApplication(req, res) {
  try {
    // 验证用户身份
    const decoded = verifyRequestToken(req);
    if (!decoded) {
      return sendJson(res, 401, { error: '未授权访问', message: '请先登录' });
    }
    
    const userId = decoded.userId || decoded.sub || decoded.id;
    if (!userId) {
      return sendJson(res, 401, { error: '未授权访问', message: '无法获取用户信息' });
    }

    const body = await readBody(req);
    const {
      requestId,
      ipAssetId,
      ipAssetName,
      message,
      proposedUsage,
      expectedProducts,
      applicantName
    } = body;

    if (!requestId) {
      return sendJson(res, 400, { error: '缺少需求ID' });
    }

    // 获取用户信息
    const db = await getDB();
    const userResult = await db.query(
      'SELECT username, display_name FROM users WHERE id = $1',
      [userId]
    );

    const userName = applicantName ||
                     (userResult.rows[0]?.display_name) ||
                     (userResult.rows[0]?.username) ||
                     '未知用户';

    console.log('[submitApplication] 提交申请:', { 
      userId, 
      userName, 
      requestId, 
      ipAssetId, 
      ipAssetName 
    });

    const result = await db.query(
      `INSERT INTO copyright_applications (
        request_id, applicant_id, applicant_name, ip_asset_id, ip_asset_name,
        message, proposed_usage, expected_products
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [requestId, userId, userName, ipAssetId || null, ipAssetName || null, 
       message || null, proposedUsage || null, 
       JSON.stringify(expectedProducts || [])]
    );

    // 更新需求的申请计数
    await db.query(
      'UPDATE copyright_license_requests SET application_count = application_count + 1 WHERE id = $1',
      [requestId]
    );

    console.log('[submitApplication] 申请提交成功:', result.rows[0].id);
    sendJson(res, 201, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('提交申请失败:', error);
    sendJson(res, 500, { error: '提交申请失败', message: error.message });
  }
}

// 获取我的申请列表
async function getMyApplications(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return sendJson(res, 400, { error: '缺少用户ID' });
    }

    const db = await getDB();
    const result = await db.query(
      `SELECT a.*, r.title as request_title, r.brand_name, r.brand_logo
       FROM copyright_applications a
       JOIN copyright_license_requests r ON a.request_id = r.id
       WHERE a.applicant_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );

    sendJson(res, 200, toCamelCase(result.rows));
  } catch (error) {
    console.error('获取我的申请失败:', error);
    sendJson(res, 500, { error: '获取我的申请失败' });
  }
}

// 取消申请
async function cancelApplication(req, res, id) {
  try {
    const db = await getDB();
    const result = await db.query(
      `UPDATE copyright_applications 
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '申请不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('取消申请失败:', error);
    sendJson(res, 500, { error: '取消申请失败' });
  }
}

// 获取已获得的授权列表
async function getMyLicenses(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return sendJson(res, 400, { error: '缺少用户ID' });
    }

    const db = await getDB();
    const result = await db.query(
      `SELECT a.*, r.title as request_title, r.brand_name, r.brand_logo
       FROM copyright_applications a
       JOIN copyright_license_requests r ON a.request_id = r.id
       WHERE a.applicant_id = $1 AND a.status IN ('approved', 'completed')
       ORDER BY a.created_at DESC`,
      [userId]
    );

    sendJson(res, 200, toCamelCase(result.rows));
  } catch (error) {
    console.error('获取我的授权失败:', error);
    sendJson(res, 500, { error: '获取我的授权失败' });
  }
}

// ==================== 文创产品API ====================

// 创建授权IP产品
async function createLicensedProduct(req, res) {
  try {
    const body = await readBody(req);
    const {
      applicationId,
      productName,
      productDescription,
      productImages,
      productCategory,
      price,
      stock
    } = body;

    const db = await getDB();

    // 获取申请信息
    const appResult = await db.query(
      `SELECT a.*, r.brand_id, r.creator_id 
       FROM copyright_applications a
       JOIN copyright_license_requests r ON a.request_id = r.id
       WHERE a.id = $1`,
      [applicationId]
    );

    if (appResult.rows.length === 0) {
      return sendJson(res, 404, { error: '授权申请不存在' });
    }

    const application = appResult.rows[0];

    const result = await db.query(
      `INSERT INTO licensed_ip_products (
        application_id, brand_id, creator_id, product_name, product_description,
        product_images, product_category, price, stock
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        applicationId, application.brand_id, application.applicant_id,
        productName, productDescription, JSON.stringify(productImages || []),
        productCategory, price, stock
      ]
    );

    sendJson(res, 201, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('创建授权产品失败:', error);
    sendJson(res, 500, { error: '创建授权产品失败' });
  }
}

// 获取授权IP产品列表
async function getLicensedProducts(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const status = url.searchParams.get('status');
    const brandId = url.searchParams.get('brandId');
    const creatorId = url.searchParams.get('creatorId');
    const category = url.searchParams.get('category');
    const sortBy = url.searchParams.get('sortBy');
    const limit = url.searchParams.get('limit');
    const searchQuery = url.searchParams.get('searchQuery');

    let query = `SELECT p.*, r.brand_name, r.brand_logo 
                 FROM licensed_ip_products p
                 JOIN copyright_license_requests r ON p.brand_id = r.brand_id
                 WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (brandId) {
      query += ` AND p.brand_id = $${paramIndex}`;
      params.push(brandId);
      paramIndex++;
    }

    if (creatorId) {
      query += ` AND p.creator_id = $${paramIndex}`;
      params.push(creatorId);
      paramIndex++;
    }

    if (category) {
      query += ` AND p.product_category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (searchQuery) {
      query += ` AND (p.product_name ILIKE $${paramIndex} OR p.product_description ILIKE $${paramIndex})`;
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    // 排序
    switch (sortBy) {
      case 'sales':
        query += ` ORDER BY p.sales_count DESC`;
        break;
      case 'price_asc':
        query += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY p.price DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY p.created_at DESC`;
    }

    // 限制数量
    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
      paramIndex++;
    }

    const db = await getDB();
    const result = await db.query(query, params);
    sendJson(res, 200, toCamelCase(result.rows));
  } catch (error) {
    console.error('获取授权产品失败:', error);
    sendJson(res, 500, { error: '获取授权产品失败' });
  }
}

// 获取产品分类统计
async function getProductCategories(req, res) {
  try {
    const db = await getDB();
    const result = await db.query(
      `SELECT product_category as name, COUNT(*) as count
       FROM licensed_ip_products
       WHERE status = 'on_sale'
       GROUP BY product_category
       ORDER BY count DESC`
    );
    
    const categories = result.rows.map((row, index) => ({
      id: `cat-${index}`,
      name: row.name,
      count: parseInt(row.count)
    }));
    
    sendJson(res, 200, toCamelCase(categories));
  } catch (error) {
    console.error('获取产品分类失败:', error);
    sendJson(res, 500, { error: '获取产品分类失败' });
  }
}

// 获取产品详情
async function getProductById(req, res, id) {
  try {
    const db = await getDB();
    const result = await db.query(
      `SELECT p.*, r.brand_name, r.brand_logo, a.request_id
       FROM licensed_ip_products p
       JOIN copyright_applications a ON p.application_id = a.id
       JOIN copyright_license_requests r ON a.request_id = r.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '产品不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('获取产品详情失败:', error);
    sendJson(res, 500, { error: '获取产品详情失败' });
  }
}

// 更新产品信息
async function updateLicensedProduct(req, res, id) {
  try {
    const body = await readBody(req);
    const updates = body;

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClause.push(`${snakeKey} = $${paramIndex}`);
        
        // 处理对象和数组类型的值，转换为 JSON 字符串
        if (typeof value === 'object' && value !== null) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return sendJson(res, 400, { error: '没有要更新的字段' });
    }

    values.push(id);

    const db = await getDB();
    const result = await db.query(
      `UPDATE licensed_ip_products 
       SET ${setClause.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '产品不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('更新产品失败:', error);
    sendJson(res, 500, { error: '更新产品失败: ' + error.message });
  }
}

// 提交审核
async function submitProductForReview(req, res, id) {
  try {
    const db = await getDB();
    const result = await db.query(
      `UPDATE licensed_ip_products 
       SET status = 'pending_review'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '产品不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('提交审核失败:', error);
    sendJson(res, 500, { error: '提交审核失败' });
  }
}

// 上架产品
async function publishProduct(req, res, id) {
  try {
    const db = await getDB();
    const result = await db.query(
      `UPDATE licensed_ip_products 
       SET status = 'on_sale'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '产品不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('上架产品失败:', error);
    sendJson(res, 500, { error: '上架产品失败' });
  }
}

// 下架产品
async function unpublishProduct(req, res, id) {
  try {
    const db = await getDB();
    const result = await db.query(
      `UPDATE licensed_ip_products 
       SET status = 'discontinued'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendJson(res, 404, { error: '产品不存在' });
    }

    sendJson(res, 200, toCamelCase(result.rows[0]));
  } catch (error) {
    console.error('下架产品失败:', error);
    sendJson(res, 500, { error: '下架产品失败' });
  }
}

// ============================================
// 主路由处理函数
// ============================================

export default async function copyrightLicenseRoutes(req, res) {
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

  console.log('[Copyright License Routes] Processing:', method, pathname);
  console.log('[Copyright License Routes] req.url:', req.url);
  console.log('[Copyright License Routes] req.headers.host:', req.headers.host);

  // 品牌方API
  if (pathname === '/api/copyright/brand/requests' && method === 'GET') {
    await getBrandRequests(req, res);
    return;
  }

  if (pathname === '/api/copyright/brand/requests' && method === 'POST') {
    await createBrandRequest(req, res);
    return;
  }

  const brandRequestMatch = pathname.match(/^\/api\/copyright\/brand\/requests\/([^\/]+)$/);
  if (brandRequestMatch) {
    const id = brandRequestMatch[1];
    if (method === 'PUT') {
      await updateBrandRequest(req, res, id);
      return;
    }
    if (method === 'DELETE') {
      await deleteBrandRequest(req, res, id);
      return;
    }
  }

  if (pathname === '/api/copyright/brand/applications' && method === 'GET') {
    await getBrandApplications(req, res);
    return;
  }

  if (pathname === '/api/copyright/brand/stats' && method === 'GET') {
    await getBrandStats(req, res);
    return;
  }

  // 申请管理API
  const applicationMatch = pathname.match(/^\/api\/copyright\/applications\/([^\/]+)$/);
  if (applicationMatch) {
    const id = applicationMatch[1];
    if (method === 'GET') {
      await getApplicationById(req, res, id);
      return;
    }
  }

  const approveMatch = pathname.match(/^\/api\/copyright\/brand\/applications\/([^\/]+)\/approve$/);
  if (approveMatch && method === 'PUT') {
    await approveApplication(req, res, approveMatch[1]);
    return;
  }

  const rejectMatch = pathname.match(/^\/api\/copyright\/brand\/applications\/([^\/]+)\/reject$/);
  if (rejectMatch && method === 'PUT') {
    await rejectApplication(req, res, rejectMatch[1]);
    return;
  }

  const contactMatch = pathname.match(/^\/api\/copyright\/brand\/applications\/([^\/]+)\/contact$/);
  if (contactMatch && method === 'PUT') {
    await shareContact(req, res, contactMatch[1]);
    return;
  }

  const cancelMatch = pathname.match(/^\/api\/copyright\/applications\/([^\/]+)\/cancel$/);
  if (cancelMatch && method === 'PUT') {
    await cancelApplication(req, res, cancelMatch[1]);
    return;
  }

  // 创作者API
  if (pathname === '/api/copyright/requests' && method === 'GET') {
    await getAvailableRequests(req, res);
    return;
  }

  const requestMatch = pathname.match(/^\/api\/copyright\/requests\/([^\/]+)$/);
  if (requestMatch && method === 'GET') {
    await getRequestById(req, res, requestMatch[1]);
    return;
  }

  if (pathname === '/api/copyright/applications' && method === 'POST') {
    await submitApplication(req, res);
    return;
  }

  if (pathname === '/api/copyright/my-applications' && method === 'GET') {
    await getMyApplications(req, res);
    return;
  }

  if (pathname === '/api/copyright/my-licenses' && method === 'GET') {
    await getMyLicenses(req, res);
    return;
  }

  // 文创产品API
  if (pathname === '/api/copyright/products' && method === 'GET') {
    await getLicensedProducts(req, res);
    return;
  }

  if (pathname === '/api/copyright/products' && method === 'POST') {
    await createLicensedProduct(req, res);
    return;
  }

  if (pathname === '/api/copyright/products/categories' && method === 'GET') {
    await getProductCategories(req, res);
    return;
  }

  const productMatch = pathname.match(/^\/api\/copyright\/products\/([^\/]+)$/);
  if (productMatch) {
    const id = productMatch[1];
    if (method === 'GET') {
      await getProductById(req, res, id);
      return;
    }
    if (method === 'PUT') {
      await updateLicensedProduct(req, res, id);
      return;
    }
  }

  const submitMatch = pathname.match(/^\/api\/copyright\/products\/([^\/]+)\/submit$/);
  if (submitMatch && method === 'PUT') {
    await submitProductForReview(req, res, submitMatch[1]);
    return;
  }

  const publishMatch = pathname.match(/^\/api\/copyright\/products\/([^\/]+)\/publish$/);
  if (publishMatch && method === 'PUT') {
    await publishProduct(req, res, publishMatch[1]);
    return;
  }

  const unpublishMatch = pathname.match(/^\/api\/copyright\/products\/([^\/]+)\/unpublish$/);
  if (unpublishMatch && method === 'PUT') {
    await unpublishProduct(req, res, unpublishMatch[1]);
    return;
  }

  // 未匹配到路由
  console.log('[Copyright License Routes] No route matched for:', pathname);
  sendJson(res, 404, { error: 'API端点不存在' });
}
