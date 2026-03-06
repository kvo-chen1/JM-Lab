import { supabase, supabaseAdmin } from '@/lib/supabase';
import { uploadFile } from './storageServiceNew';

export interface CulturalKnowledge {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  image_url?: string;
  image_prompt?: string;
  image_generation_status?: 'pending' | 'generating' | 'completed' | 'failed';
  image_generated_at?: string;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  prompt?: string;
  error?: string;
}

/**
 * 根据文化知识内容生成图片prompt
 * @param knowledge 文化知识对象
 * @returns 生成的英文prompt
 */
export function generatePrompt(knowledge: CulturalKnowledge): string {
  const { title, category, tags, excerpt } = knowledge;
  
  // 提取关键词
  const keywords = tags?.join(', ') || '';
  const shortTitle = title?.split('：')[0] || title;
  
  // 根据分类生成不同风格的prompt
  const categoryPrompts: Record<string, string> = {
    '非遗传承': 'traditional Chinese intangible cultural heritage, master craftsmanship',
    '民间艺术': 'Chinese folk art, traditional patterns, vibrant colors',
    '传统工艺': 'traditional Chinese craftsmanship, handmade, exquisite details',
    '传统美食': 'traditional Chinese cuisine, appetizing food photography',
    '中药文化': 'traditional Chinese medicine, herbal pharmacy, historical',
    '陶瓷文化': 'Chinese porcelain, ceramic art, elegant craftsmanship',
    '酒文化': 'traditional Chinese liquor brewing, cultural heritage',
    '曲艺文化': 'Chinese traditional performing arts, folk entertainment',
    '服饰文化': 'traditional Chinese clothing, elegant fashion',
    '文房四宝': 'Chinese calligraphy tools, traditional stationery',
    '历史建筑': 'historic Chinese architecture, cultural landmark',
    '城市文化': 'Chinese urban culture, cityscape, local life',
    '民族文化': 'Chinese ethnic minority culture, traditional costume',
    '刺绣': 'Chinese embroidery, intricate needlework, silk thread',
    '剪纸': 'Chinese paper cutting, red paper art, folk patterns',
    '饮食文化': 'Chinese food culture, culinary tradition',
  };
  
  const categoryStyle = categoryPrompts[category] || 'traditional Chinese culture';
  
  // 构建完整prompt
  const prompt = `${shortTitle}, ${categoryStyle}${keywords ? ', ' + keywords : ''}, high quality, detailed, cultural heritage, artistic, professional photography style`.trim();
  
  return prompt;
}

/**
 * 调用 Trae API 生成图片
 * @param prompt 图片描述
 * @param size 图片尺寸
 * @returns 图片URL
 */
export async function generateImageWithTraeAPI(
  prompt: string, 
  size: string = '1024x1024'
): Promise<string | null> {
  try {
    // 使用代理URL
    const proxyUrl = `/api/proxy/trae-api/api/ide/v1/text_to_image`;
    const params = new URLSearchParams({
      prompt: prompt,
      image_size: size
    });
    
    const response = await fetch(`${proxyUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'image/*, */*',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Trae API 请求失败: ${response.status}`);
    }
    
    // Trae API 直接返回图片数据
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('[CulturalKnowledgeImage] 生成图片失败:', error);
    return null;
  }
}

/**
 * 上传图片到存储服务
 * @param blob 图片Blob数据
 * @param knowledgeId 文化知识ID
 * @returns 公开访问URL
 */
export async function uploadImageToStorage(
  blob: Blob, 
  knowledgeId: number
): Promise<string | null> {
  try {
    // 创建 File 对象
    const fileName = `${knowledgeId}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    
    // 使用新的存储服务上传
    const folder = 'knowledge';
    const publicUrl = await uploadFile(file, folder);
    
    return publicUrl;
  } catch (error) {
    console.error('[CulturalKnowledgeImage] 上传图片失败:', error);
    return null;
  }
}

/**
 * 为单条文化知识生成图片
 * @param knowledge 文化知识对象
 * @returns 生成结果
 */
export async function generateImageForKnowledge(
  knowledge: CulturalKnowledge
): Promise<GenerateImageResult> {
  try {
    // 1. 更新状态为生成中
    await updateImageStatus(knowledge.id, 'generating');
    
    // 2. 生成prompt
    const prompt = generatePrompt(knowledge);
    console.log(`[CulturalKnowledgeImage] 生成prompt: ${prompt}`);
    
    // 3. 调用API生成图片
    const imageBlob = await generateImageWithTraeAPI(prompt);
    if (!imageBlob) {
      await updateImageStatus(knowledge.id, 'failed');
      return { success: false, error: '图片生成失败' };
    }
    
    // 4. 上传到Storage
    const imageUrl = await uploadImageToStorage(imageBlob, knowledge.id);
    if (!imageUrl) {
      await updateImageStatus(knowledge.id, 'failed');
      return { success: false, error: '图片上传失败' };
    }
    
    // 5. 更新数据库
    await updateImageStatus(knowledge.id, 'completed', imageUrl, prompt);
    
    return {
      success: true,
      imageUrl,
      prompt
    };
  } catch (error) {
    console.error('[CulturalKnowledgeImage] 生成图片失败:', error);
    await updateImageStatus(knowledge.id, 'failed');
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 更新图片生成状态
 * @param id 文化知识ID
 * @param status 状态
 * @param imageUrl 图片URL
 * @param prompt 使用的prompt
 */
async function updateImageStatus(
  id: number,
  status: 'pending' | 'generating' | 'completed' | 'failed',
  imageUrl?: string,
  prompt?: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_cultural_knowledge_image_status', {
      p_id: id,
      p_status: status,
      p_image_url: imageUrl || null,
      p_prompt: prompt || null
    });
    
    if (error) {
      // 如果RPC调用失败，使用直接更新
      const updateData: Record<string, any> = {
        image_generation_status: status,
        updated_at: new Date().toISOString()
      };
      
      if (imageUrl) updateData.image_url = imageUrl;
      if (prompt) updateData.image_prompt = prompt;
      if (status === 'completed') updateData.image_generated_at = new Date().toISOString();
      
      await supabase
        .from('cultural_knowledge')
        .update(updateData)
        .eq('id', id);
    }
  } catch (error) {
    console.error('[CulturalKnowledgeImage] 更新状态失败:', error);
  }
}

/**
 * 获取需要生成图片的文化知识列表
 * @param limit 数量限制
 * @returns 文化知识列表
 */
export async function getPendingKnowledgeList(
  limit: number = 10
): Promise<CulturalKnowledge[]> {
  try {
    const { data, error } = await supabase.rpc('get_pending_cultural_knowledge_images', {
      p_limit: limit
    });
    
    if (error) {
      // 如果RPC调用失败，使用直接查询
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('cultural_knowledge')
        .select('*')
        .in('image_generation_status', ['pending', 'failed'])
        .order('created_at', { ascending: true })
        .limit(limit);
      
      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[CulturalKnowledgeImage] 获取待处理列表失败:', error);
    return [];
  }
}

/**
 * 批量生成图片
 * @param batchSize 批次大小
 * @returns 生成结果统计
 */
export async function batchGenerateImages(
  batchSize: number = 5
): Promise<{
  total: number;
  success: number;
  failed: number;
  results: GenerateImageResult[];
}> {
  const pendingList = await getPendingKnowledgeList(batchSize);
  
  const results: GenerateImageResult[] = [];
  let success = 0;
  let failed = 0;
  
  for (const knowledge of pendingList) {
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = await generateImageForKnowledge(knowledge);
    results.push(result);
    
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }
  
  return {
    total: pendingList.length,
    success,
    failed,
    results
  };
}

/**
 * 重新生成单条文化知识的图片
 * @param id 文化知识ID
 * @returns 生成结果
 */
export async function regenerateImage(id: number): Promise<GenerateImageResult> {
  try {
    // 获取文化知识详情
    const { data, error } = await supabase
      .from('cultural_knowledge')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return { success: false, error: '未找到文化知识' };
    }
    
    // 重置状态为pending
    await updateImageStatus(id, 'pending');
    
    // 生成新图片
    return await generateImageForKnowledge(data);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 获取文化知识图片URL
 * 优先返回预生成的图片，如果没有则返回动态生成的URL
 * @param knowledge 文化知识对象
 * @returns 图片URL
 */
export function getKnowledgeImageUrl(knowledge: any): string {
  // 优先使用本地数据中的 image 字段
  if (knowledge.image && typeof knowledge.image === 'string') {
    return knowledge.image;
  }
  
  // 如果没有，返回默认图片
  return '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20cultural%20heritage';
}

export default {
  generatePrompt,
  generateImageWithTraeAPI,
  uploadImageToStorage,
  generateImageForKnowledge,
  getPendingKnowledgeList,
  batchGenerateImages,
  regenerateImage,
  getKnowledgeImageUrl
};
