/**
 * OAuth 第三方登录服务
 * 支持微信、支付宝、GitHub、Google 等登录方式
 */

import { randomUUID } from 'crypto';
import { generateToken } from './jwt.mjs';
import { userDB } from './database.mjs';
import { supabaseServer } from './supabase-server.mjs';

// 内存中存储 OAuth 状态码 (state -> { provider, expiresAt })
const oauthStates = new Map();

// 清理过期的 OAuth 状态
function cleanupExpiredStates() {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}

// 每 5 分钟清理一次过期状态
setInterval(cleanupExpiredStates, 5 * 60 * 1000);

/**
 * 生成 OAuth 登录 URL
 * @param {string} provider - 提供商名称 (wechat, alipay, github, google)
 * @param {string} redirectUri - 回调地址
 * @returns {Object} { url, state }
 */
export function generateOAuthUrl(provider, redirectUri) {
  const state = randomUUID();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 分钟过期
  
  oauthStates.set(state, { provider, expiresAt });
  
  let url = '';
  
  switch (provider) {
    case 'wechat':
      url = generateWechatOAuthUrl(state, redirectUri);
      break;
    case 'alipay':
      url = generateAlipayOAuthUrl(state, redirectUri);
      break;
    case 'github':
      url = generateGithubOAuthUrl(state, redirectUri);
      break;
    case 'google':
      url = generateGoogleOAuthUrl(state, redirectUri);
      break;
    default:
      throw new Error(`不支持的 OAuth 提供商: ${provider}`);
  }
  
  return { url, state };
}

/**
 * 生成微信 OAuth URL
 */
function generateWechatOAuthUrl(state, redirectUri) {
  const appId = process.env.WECHAT_APPID;
  if (!appId) {
    throw new Error('未配置微信登录: WECHAT_APPID 未设置');
  }
  
  const scope = 'snsapi_login'; // 网页登录使用 snsapi_login
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  return `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
}

/**
 * 生成支付宝 OAuth URL
 */
function generateAlipayOAuthUrl(state, redirectUri) {
  const appId = process.env.ALIPAY_APPID;
  if (!appId) {
    throw new Error('未配置支付宝登录: ALIPAY_APPID 未设置');
  }
  
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  const scope = 'auth_user';
  
  return `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=${appId}&scope=${scope}&redirect_uri=${encodedRedirectUri}&state=${state}`;
}

/**
 * 生成 GitHub OAuth URL
 */
function generateGithubOAuthUrl(state, redirectUri) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new Error('未配置 GitHub 登录: GITHUB_CLIENT_ID 未设置');
  }
  
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=user:email&state=${state}`;
}

/**
 * 生成 Google OAuth URL
 */
function generateGoogleOAuthUrl(state, redirectUri) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('未配置 Google 登录: GOOGLE_CLIENT_ID 未设置');
  }
  
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  const scope = encodeURIComponent('openid email profile');
  
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
}

/**
 * 处理 OAuth 回调
 * @param {string} provider - 提供商名称
 * @param {string} code - 授权码
 * @param {string} state - 状态码
 * @returns {Object} { success, user, token, error }
 */
export async function handleOAuthCallback(provider, code, state) {
  // 验证 state
  const stateData = oauthStates.get(state);
  if (!stateData) {
    return { success: false, error: '无效的 OAuth 状态，请重新登录' };
  }
  
  if (stateData.expiresAt < Date.now()) {
    oauthStates.delete(state);
    return { success: false, error: 'OAuth 状态已过期，请重新登录' };
  }
  
  if (stateData.provider !== provider) {
    return { success: false, error: 'OAuth 提供商不匹配' };
  }
  
  // 使用后立即删除 state
  oauthStates.delete(state);
  
  try {
    let userInfo;
    
    switch (provider) {
      case 'wechat':
        userInfo = await handleWechatCallback(code);
        break;
      case 'alipay':
        userInfo = await handleAlipayCallback(code);
        break;
      case 'github':
        userInfo = await handleGithubCallback(code);
        break;
      case 'google':
        userInfo = await handleGoogleCallback(code);
        break;
      default:
        return { success: false, error: `不支持的 OAuth 提供商: ${provider}` };
    }
    
    if (!userInfo.success) {
      return userInfo;
    }
    
    // 查找或创建用户
    const userResult = await findOrCreateUser(provider, userInfo);
    
    if (!userResult.success) {
      return userResult;
    }
    
    // 生成 JWT Token
    const token = generateToken({
      userId: userResult.user.id,
      email: userResult.user.email,
      username: userResult.user.username
    });
    
    return {
      success: true,
      user: userResult.user,
      token,
      isNewUser: userResult.isNewUser
    };
    
  } catch (error) {
    console.error(`[OAuth] ${provider} 登录处理失败:`, error);
    return { success: false, error: '登录处理失败，请稍后重试' };
  }
}

/**
 * 处理微信回调
 */
async function handleWechatCallback(code) {
  const appId = process.env.WECHAT_APPID;
  const appSecret = process.env.WECHAT_APPSECRET;
  
  if (!appId || !appSecret) {
    return { success: false, error: '微信登录未配置' };
  }
  
  try {
    // 1. 获取 access_token
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    );
    const tokenData = await tokenRes.json();
    
    if (tokenData.errcode) {
      console.error('[WeChat] 获取 access_token 失败:', tokenData);
      return { success: false, error: '微信授权失败' };
    }
    
    const { access_token, openid, unionid } = tokenData;
    
    // 2. 获取用户信息
    const userRes = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`
    );
    const userData = await userRes.json();
    
    if (userData.errcode) {
      console.error('[WeChat] 获取用户信息失败:', userData);
      return { success: false, error: '获取微信用户信息失败' };
    }
    
    return {
      success: true,
      provider: 'wechat',
      providerId: unionid || openid,
      nickname: userData.nickname,
      avatar: userData.headimgurl,
      email: null, // 微信不提供邮箱
      raw: userData
    };
    
  } catch (error) {
    console.error('[WeChat] OAuth 回调处理错误:', error);
    return { success: false, error: '微信登录处理失败' };
  }
}

/**
 * 处理支付宝回调
 */
async function handleAlipayCallback(code) {
  const appId = process.env.ALIPAY_APPID;
  const privateKey = process.env.ALIPAY_PRIVATE_KEY;
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;
  
  if (!appId || !privateKey) {
    return { success: false, error: '支付宝登录未配置' };
  }
  
  try {
    // 支付宝需要使用 SDK 或手动签名
    // 这里使用简化版实现，生产环境建议使用官方 SDK
    
    // 1. 获取 access_token
    const timestamp = new Date().toISOString().replace(/\..*/, '') + 'Z';
    const bizContent = JSON.stringify({
      grant_type: 'authorization_code',
      code: code
    });
    
    const params = {
      app_id: appId,
      method: 'alipay.system.oauth.token',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: timestamp,
      version: '1.0',
      biz_content: bizContent
    };
    
    // 注意：这里需要实现 RSA2 签名
    // 为简化演示，返回模拟数据
    // 实际生产环境需要完整实现支付宝 OAuth 流程
    
    console.warn('[Alipay] 支付宝登录需要完整实现 RSA2 签名');
    return { success: false, error: '支付宝登录功能开发中' };
    
  } catch (error) {
    console.error('[Alipay] OAuth 回调处理错误:', error);
    return { success: false, error: '支付宝登录处理失败' };
  }
}

/**
 * 处理 GitHub 回调
 */
async function handleGithubCallback(code) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return { success: false, error: 'GitHub 登录未配置' };
  }
  
  try {
    // 1. 获取 access_token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      console.error('[GitHub] 获取 access_token 失败:', tokenData);
      return { success: false, error: 'GitHub 授权失败' };
    }
    
    const accessToken = tokenData.access_token;
    
    // 2. 获取用户信息
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    const userData = await userRes.json();
    
    if (userData.message) {
      console.error('[GitHub] 获取用户信息失败:', userData);
      return { success: false, error: '获取 GitHub 用户信息失败' };
    }
    
    // 3. 获取用户邮箱
    let email = userData.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      const emails = await emailRes.json();
      if (Array.isArray(emails) && emails.length > 0) {
        const primaryEmail = emails.find(e => e.primary) || emails[0];
        email = primaryEmail.email;
      }
    }
    
    return {
      success: true,
      provider: 'github',
      providerId: userData.id.toString(),
      nickname: userData.name || userData.login,
      avatar: userData.avatar_url,
      email: email,
      raw: userData
    };
    
  } catch (error) {
    console.error('[GitHub] OAuth 回调处理错误:', error);
    return { success: false, error: 'GitHub 登录处理失败' };
  }
}

/**
 * 处理 Google 回调
 */
async function handleGoogleCallback(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.VITE_APP_URL}/oauth/callback/google`;
  
  if (!clientId || !clientSecret) {
    return { success: false, error: 'Google 登录未配置' };
  }
  
  try {
    // 1. 获取 access_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      console.error('[Google] 获取 access_token 失败:', tokenData);
      return { success: false, error: 'Google 授权失败' };
    }
    
    // 2. 获取用户信息 (使用 ID Token)
    const idToken = tokenData.id_token;
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
    
    return {
      success: true,
      provider: 'google',
      providerId: payload.sub,
      nickname: payload.name,
      avatar: payload.picture,
      email: payload.email,
      raw: payload
    };
    
  } catch (error) {
    console.error('[Google] OAuth 回调处理错误:', error);
    return { success: false, error: 'Google 登录处理失败' };
  }
}

/**
 * 查找或创建用户
 */
async function findOrCreateUser(provider, userInfo) {
  try {
    // 1. 先通过 provider_id 查找
    let user = await userDB.findByProviderId(provider, userInfo.providerId);
    
    if (user) {
      // 更新用户信息
      await userDB.updateUser(user.id, {
        avatar: userInfo.avatar || user.avatar,
        username: userInfo.nickname || user.username,
        updated_at: new Date().toISOString()
      });
      
      // 获取更新后的用户信息
      user = await userDB.getUserById(user.id);
      return { success: true, user, isNewUser: false };
    }
    
    // 2. 如果提供了邮箱，尝试通过邮箱查找
    if (userInfo.email) {
      user = await userDB.getUserByEmail(userInfo.email);
      if (user) {
        // 关联第三方账号
        await userDB.linkProvider(user.id, provider, userInfo.providerId);
        return { success: true, user, isNewUser: false };
      }
    }
    
    // 3. 创建新用户
    const newUser = await userDB.createUser({
      username: userInfo.nickname || `${provider}_${userInfo.providerId.slice(-8)}`,
      email: userInfo.email || `${provider}_${userInfo.providerId}@oauth.local`,
      avatar: userInfo.avatar,
      provider: provider,
      provider_id: userInfo.providerId,
      is_verified: true,
      isNewUser: true
    });
    
    // 4. 同步到 Supabase Auth
    try {
      const { data: authUser, error: authError } = await supabaseServer.auth.admin.createUser({
        email: newUser.email,
        email_confirm: true,
        user_metadata: {
          username: newUser.username,
          provider: provider,
          provider_id: userInfo.providerId
        }
      });
      
      if (!authError && authUser?.user) {
        // 更新本地用户的 supabase_uid
        await userDB.updateUser(newUser.id, {
          supabase_uid: authUser.user.id
        });
        newUser.supabase_uid = authUser.user.id;
      }
    } catch (supabaseError) {
      console.warn('[OAuth] Supabase 用户同步失败:', supabaseError);
      // 不影响主流程
    }
    
    return { success: true, user: newUser, isNewUser: true };
    
  } catch (error) {
    console.error('[OAuth] 查找或创建用户失败:', error);
    return { success: false, error: '用户处理失败' };
  }
}

/**
 * 检查 OAuth 提供商是否已配置
 * @param {string} provider - 提供商名称
 * @returns {boolean}
 */
export function isOAuthConfigured(provider) {
  switch (provider) {
    case 'wechat':
      return !!(process.env.WECHAT_APPID && process.env.WECHAT_APPSECRET);
    case 'alipay':
      return !!(process.env.ALIPAY_APPID && process.env.ALIPAY_PRIVATE_KEY);
    case 'github':
      return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    case 'google':
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    default:
      return false;
  }
}

/**
 * 获取已配置的 OAuth 提供商列表
 * @returns {Array<{name: string, configured: boolean}>}
 */
export function getConfiguredProviders() {
  return [
    { name: 'wechat', label: '微信', configured: isOAuthConfigured('wechat') },
    { name: 'alipay', label: '支付宝', configured: isOAuthConfigured('alipay') },
    { name: 'github', label: 'GitHub', configured: isOAuthConfigured('github') },
    { name: 'google', label: 'Google', configured: isOAuthConfigured('google') }
  ];
}

export default {
  generateOAuthUrl,
  handleOAuthCallback,
  isOAuthConfigured,
  getConfiguredProviders
};
