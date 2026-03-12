import fetch from 'node-fetch';

// 默认配置
const MODEL_ID = process.env.MODEL_ID || 'doubao-seedance-1-0-pro-250528';
const API_KEY = process.env.DOUBAO_API_KEY || '';
const API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';

/**
 * 创建视频生成任务
 * @param {Object} options - 任务选项
 * @param {string} options.model - 模型ID
 * @param {Array} options.content - 内容数组
 * @returns {Promise<Object>} 任务创建结果
 */
export async function createVideoTask(options) {
  const { model = MODEL_ID, content } = options;
  console.log('Creating video task with model:', model);
  
  // 确保content是数组格式
  const requestBody = {
    model,
    content: Array.isArray(content) ? content : [content]
  };
  
  try {
    if (!process.env.DOUBAO_API_KEY && !API_KEY) {
      throw new Error('CONFIG_MISSING: Missing DOUBAO_API_KEY environment variable');
    }
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY || API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `API request failed with status ${response.status}`);
    }
    
    console.log('Video task created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating video task:', error);
    throw error;
  }
}

/**
 * 创建图生视频任务
 * @param {Object} options - 任务选项
 * @param {string} options.model - 模型ID
 * @param {Array} options.content - 内容数组（包含text和image_url）
 * @returns {Promise<Object>} 任务创建结果
 */
export async function createImageToVideoTask(options) {
  const { model = 'doubao-seedance-1-0-pro-fast-251015', content } = options;
  console.log('Creating image-to-video task with model:', model);
  
  // 确保content是数组格式
  const requestBody = {
    model,
    content: Array.isArray(content) ? content : [content]
  };
  
  try {
    if (!process.env.DOUBAO_API_KEY && !API_KEY) {
      throw new Error('CONFIG_MISSING: Missing DOUBAO_API_KEY environment variable');
    }
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY || API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `API request failed with status ${response.status}`);
    }
    
    console.log('Image-to-video task created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating image-to-video task:', error);
    throw error;
  }
}

/**
 * 获取视频任务结果
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object>} 任务结果
 */
export async function getVideoTaskResult(taskId) {
  console.log('Getting video task result for ID:', taskId);
  
  try {
    if (!process.env.DOUBAO_API_KEY && !API_KEY) {
      throw new Error('CONFIG_MISSING: Missing DOUBAO_API_KEY environment variable');
    }
    const response = await fetch(`${API_ENDPOINT}/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY || API_KEY}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `API request failed with status ${response.status}`);
    }
    
    console.log('Video task result retrieved successfully');
    return data;
  } catch (error) {
    console.error('Error getting video task result:', error);
    throw error;
  }
}

// 导出配置常量
export { MODEL_ID, API_KEY, API_ENDPOINT };
