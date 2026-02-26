import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '@/pages/create/hooks/useCreateStore';
import postsApi from '@/services/postService';
import { llmService } from '@/services/llmService';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { generatePlaceholderSvg } from '@/utils/imageUrlUtils';
import { X, Hash, Image as ImageIcon, Video, Type, AlignLeft, Sparkles, Loader2, CheckCircle2, Upload, Trash2, ExternalLink, Briefcase, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { brandTaskService, BrandTask, UserInfo } from '@/services/brandTaskService';

interface PublishToSquareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 预设标签
// 预设标签 - 按类别组织
const PRESET_TAGS = [
  // 传统文化
  '国潮', '纹样设计', '传统文化', '青花瓷', '山水画',
  '民俗', '剪纸', '刺绣', '书法', '篆刻',
  '敦煌', '壁画', '唐三彩', '景泰蓝', '漆器',
  '汉服', '旗袍', '茶道', '香道', '花道',
  // 建筑与历史
  '历史建筑', '欧式建筑', '复古风格', '天津', '五大道',
  '洋楼', '古建筑', '城市风光', '街景', '历史',
  // 艺术风格
  'AI创作', '数字艺术', '概念设计', '插画', '海报',
  '油画', '水彩', '素描', '工笔画', '写意',
  // 色彩与氛围
  '暖色调', '冷色调', '色彩丰富', '黑白', '复古色调',
  '明亮', '柔和', '对比强烈', '温馨', '梦幻',
  // 主题内容
  '风景', '人物', '动物', '植物', '花卉',
  '静物', '抽象', '写实', '卡通', '唯美'
];

// 关键词到标签的映射
const KEYWORD_TO_TAGS: Record<string, string[]> = {
  '五大道': ['五大道', '天津', '历史建筑', '欧式建筑'],
  '天津': ['天津', '历史建筑', '城市风光'],
  '欧式': ['欧式建筑', '复古风格', '历史建筑'],
  '复古': ['复古风格', '历史', '欧式建筑'],
  '历史': ['历史', '历史建筑', '传统文化'],
  '建筑': ['历史建筑', '欧式建筑', '城市风光'],
  '洋楼': ['洋楼', '欧式建筑', '历史建筑'],
  '温暖': ['暖色调', '温馨'],
  '色调': ['色彩丰富'],
  '色彩': ['色彩丰富'],
  '风景': ['风景', '山水画'],
  '国潮': ['国潮', '传统文化'],
  '青花': ['青花瓷', '传统文化'],
  '山水': ['山水画', '风景'],
  '剪纸': ['剪纸', '民俗'],
  '刺绣': ['刺绣', '民俗'],
  '书法': ['书法', '传统文化'],
  '敦煌': ['敦煌', '壁画', '传统文化'],
  '汉服': ['汉服', '传统文化'],
  '旗袍': ['旗袍', '传统文化'],
  'AI': ['AI创作', '数字艺术'],
  '数字': ['数字艺术', 'AI创作'],
  '插画': ['插画', '概念设计'],
  '海报': ['海报', '概念设计'],
  '油画': ['油画', '写实'],
  '水彩': ['水彩', '柔和'],
  '素描': ['素描', '黑白'],
  '工笔': ['工笔画', '传统文化'],
  '写意': ['写意', '山水画'],
  '卡通': ['卡通', '插画'],
  '唯美': ['唯美', '梦幻'],
  '梦幻': ['梦幻', '唯美'],
  '花卉': ['花卉', '植物'],
  '花': ['花卉', '植物'],
  '动物': ['动物'],
  '人物': ['人物'],
  '静物': ['静物'],
  '抽象': ['抽象'],
  '写实': ['写实'],
  '黑白': ['黑白', '素描'],
  '明亮': ['明亮', '暖色调'],
  '柔和': ['柔和', '温馨'],
  '温馨': ['温馨', '暖色调'],
  '对比': ['对比强烈'],
  '街景': ['街景', '城市风光'],
  '城市': ['城市风光', '街景']
};

export default function PublishToSquareModal({ isOpen, onClose }: PublishToSquareModalProps) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [videoUrl, setVideoUrl] = useState('');
  const [showPresetTags, setShowPresetTags] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);

  // 品牌任务相关状态
  const [availableTasks, setAvailableTasks] = useState<BrandTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<BrandTask | null>(null);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const selectedResult = useCreateStore((state) => state.selectedResult);
  const generatedResults = useCreateStore((state) => state.generatedResults);
  const prompt = useCreateStore((state) => state.prompt);
  
  const selectedImage = generatedResults.find(r => r.id === selectedResult);
  const rawThumbnail = selectedImage?.thumbnail;
  const aiVideoUrl = selectedImage?.video;

  // 计算最终视频URL（用于渲染）
  const finalVideoUrl = contentType === 'video'
    ? (videoUrl || aiVideoUrl || '')
    : '';

  // 对于视频，如果缩略图是默认图片或为空，使用视频URL作为缩略图（显示第一帧）
  // 对于图片，如果缩略图是 picsum.photos（默认占位图）或内联 SVG，需要生成真实图片
  const isDefaultPlaceholder = rawThumbnail?.includes('picsum.photos') || 
                                rawThumbnail?.includes('placehold.co') ||
                                rawThumbnail?.includes('via.placeholder.com') ||
                                rawThumbnail?.startsWith('data:image/svg+xml');
  
  let thumbnail: string;
  if (contentType === 'video' && finalVideoUrl && (!rawThumbnail || isDefaultPlaceholder)) {
    thumbnail = finalVideoUrl;  // 使用视频URL，浏览器会显示第一帧
  } else if (isDefaultPlaceholder) {
    // 使用默认占位图时，生成内联 SVG（稍后在上传时会替换为真实上传的URL或保持SVG）
    thumbnail = rawThumbnail || '';
  } else {
    thumbnail = rawThumbnail || '';  // 确保 thumbnail 不为 undefined
  }

  // 自动检测内容类型并设置视频URL - 只在模态框打开时执行一次
  useEffect(() => {
    if (isOpen && selectedImage) {
      console.log('[PublishModal] Selected image:', {
        type: selectedImage.type,
        hasVideo: !!selectedImage.video,
        videoUrl: selectedImage.video?.substring(0, 50),
        thumbnail: selectedImage.thumbnail?.substring(0, 50)
      });

      // 如果AI生成的是视频，自动填充视频URL
      if (selectedImage.type === 'video' && selectedImage.video) {
        setContentType('video');
        setVideoUrl(selectedImage.video);
        console.log('[PublishModal] Auto-set video type and URL from AI generation');
      }
      // 如果AI生成的是图片，默认设置为图片类型
      else if (selectedImage.type === 'image') {
        setContentType('image');
        setVideoUrl('');
      }
      // 其他情况（如没有type或video为空），默认设置为图片类型
      else {
        setContentType('image');
        setVideoUrl('');
      }
      
      // 自动填充作品描述（使用全局prompt）
      if (prompt && !description) {
        setDescription(prompt);
        console.log('[PublishModal] Auto-filled description from prompt');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // 只在模态框打开时执行，不依赖 selectedImage

  // 获取可用的品牌任务
  useEffect(() => {
    if (isOpen && user) {
      loadAvailableTasks();
    }
  }, [isOpen, user]);

  const loadAvailableTasks = async () => {
    setIsLoadingTasks(true);
    try {
      // 获取用户已参与并通过审核的任务
      const participations = await brandTaskService.getMyParticipations();
      // 过滤出状态为 approved 或 active 的参与记录
      const approvedParticipations = participations.filter(p =>
        p.status === 'approved' || p.status === 'active'
      );

      // 获取这些参与记录对应的任务详情
      const taskPromises = approvedParticipations.map(async (participation) => {
        const task = await brandTaskService.getTaskById(participation.task_id);
        return task;
      });

      const tasks = (await Promise.all(taskPromises)).filter((task): task is BrandTask =>
        task !== null
      );

      // 过滤出正在进行中的任务（未过期且已发布）
      const now = new Date();
      const activeTasks = tasks.filter(task => {
        const endDate = new Date(task.end_date);
        return endDate > now && task.status === 'published';
      });

      setAvailableTasks(activeTasks);
    } catch (error) {
      console.error('获取品牌任务失败:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // 添加标签
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // AI 生成标题和标签
  const generateMetadata = async () => {
    if (!description.trim()) {
      toast.error('请先填写作品描述');
      return;
    }

    setIsGeneratingMetadata(true);
    try {
      // 调用千问 API 生成标题和标签
      const result = await llmService.generateTitleAndTags(description.trim(), contentType);
      
      if (result.title) {
        setTitle(result.title);
      }
      if (result.tags && Array.isArray(result.tags)) {
        // 过滤掉已存在的标签，最多添加5个
        const newTags = result.tags.filter((tag: string) => !tags.includes(tag)).slice(0, 5 - tags.length);
        setTags([...tags, ...newTags]);
      }
      toast.success('已使用千问AI生成标题和标签');
    } catch (error) {
      console.error('Generate metadata error:', error);
      // 如果 API 失败，使用本地规则生成
      generateMetadataLocally();
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  // 本地规则生成标题和标签（备用方案）
  const generateMetadataLocally = () => {
    const desc = description.trim();

    // 生成标题：提取前20个字，如果没有则使用默认标题
    let generatedTitle = desc.slice(0, 20);
    if (generatedTitle.length < 5) {
      generatedTitle = contentType === 'video' ? '创意视频作品' : '创意设计作品';
    }
    setTitle(generatedTitle);

    // 生成标签：使用关键词映射匹配
    const matchedTags: string[] = [];
    const descLower = desc.toLowerCase();

    // 遍历关键词映射
    Object.entries(KEYWORD_TO_TAGS).forEach(([keyword, keywordTags]) => {
      if (descLower.includes(keyword.toLowerCase())) {
        keywordTags.forEach(tag => {
          if (!matchedTags.includes(tag) && !tags.includes(tag) && matchedTags.length < 5) {
            matchedTags.push(tag);
          }
        });
      }
    });

    // 如果没有匹配到标签，添加一些默认标签
    if (matchedTags.length === 0) {
      if (contentType === 'video') {
        matchedTags.push('AI创作', '数字艺术');
      } else {
        matchedTags.push('AI创作', '概念设计');
      }
    }

    setTags([...tags, ...matchedTags.slice(0, 5 - tags.length)]);
    toast.success('已自动生成标题和标签');
  };

  // 处理标签输入
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === ',' || e.key === '，') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('请先登录后再发布作品');
      return;
    }
    
    if (!title.trim()) {
      toast.error('请输入作品标题');
      return;
    }
    
    // 检查是否有真实图片（不是默认占位图）
    const isPlaceholderImage = !thumbnail || 
                                thumbnail.includes('picsum.photos') || 
                                thumbnail.includes('placehold.co') ||
                                thumbnail.includes('via.placeholder.com') ||
                                thumbnail.startsWith('data:image/svg+xml');
    
    if (isPlaceholderImage && contentType === 'image') {
      toast.error('请先上传或生成真实图片后再发布作品');
      return;
    }

    // 检查视频URL（使用组件级别的 finalVideoUrl）
    if (contentType === 'video' && !finalVideoUrl) {
      toast.error('视频链接为空，请重新生成视频或手动输入视频链接');
      console.error('[PublishModal] Video URL is empty:', {
        contentType,
        videoUrl,
        aiVideoUrl,
        selectedImage
      });
      return;
    }

    // 对于视频类型，如果没有缩略图，使用视频URL作为缩略图（显示第一帧）
    let effectiveThumbnail = thumbnail;
    if (contentType === 'video' && !thumbnail && finalVideoUrl) {
      effectiveThumbnail = finalVideoUrl;
      console.log('[PublishModal] Using video URL as thumbnail:', finalVideoUrl);
    }

    setIsSubmitting(true);
    
    try {
      // 确定最终使用的视频URL（使用组件级别的 finalVideoUrl）
      let submitVideoUrl = finalVideoUrl;
      
      // 如果是视频但URL为空，尝试从selectedImage重新获取
      if (contentType === 'video' && !submitVideoUrl && selectedImage) {
        // 尝试从selectedImage.video获取，或者从其他字段推断
        submitVideoUrl = selectedImage.video || '';
        
        // 如果还是没有，尝试从thumbnail推断（如果thumbnail是视频URL）
        if (!submitVideoUrl && selectedImage.thumbnail && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(selectedImage.thumbnail)) {
          submitVideoUrl = selectedImage.thumbnail;
        }
      }
      
      // 如果还是没有视频URL，提示错误
      if (contentType === 'video' && !submitVideoUrl) {
        toast.error('无法获取视频链接，请重新生成视频');
        setIsSubmitting(false);
        return;
      }
      
      // 处理视频：检查是否有本地临时文件需要上传
      if (contentType === 'video' && submitVideoUrl) {
        // 检查是否是本地临时URL（blob URL）
        if (submitVideoUrl.startsWith('blob:')) {
          // 有本地视频文件，需要上传
          const tempFile = (window as any)._tempVideoFile;
          if (tempFile) {
            try {
              console.log('[PublishModal] Uploading local video file to Supabase...');
              const { uploadVideo } = await import('@/services/imageService');
              const uploadedUrl = await uploadVideo(tempFile);
              if (uploadedUrl) {
                submitVideoUrl = uploadedUrl;
                console.log('[PublishModal] Video uploaded to:', uploadedUrl);
                toast.success('视频已上传到永久存储');
              }
            } catch (uploadError) {
              console.error('[PublishModal] Failed to upload video:', uploadError);
              toast.error('视频上传失败，请重试');
              setIsSubmitting(false);
              return;
            }
          }
        } else if (!submitVideoUrl.includes('supabase.co')) {
          // 外部链接，下载后上传
          try {
            console.log('[PublishModal] Downloading and uploading video to Supabase...');
            const { downloadAndUploadVideo } = await import('@/services/imageService');
            const uploadedUrl = await downloadAndUploadVideo(submitVideoUrl);
            if (uploadedUrl) {
              submitVideoUrl = uploadedUrl;
              console.log('[PublishModal] Video uploaded to:', uploadedUrl);
            }
          } catch (uploadError) {
            console.warn('[PublishModal] Failed to upload video:', uploadError);
            // 上传失败继续使用原URL
          }
        }
      }
      
      // 处理缩略图：检查是否有本地临时文件需要上传
      let finalThumbnail = effectiveThumbnail || '';
      
      // 检查是否是默认占位图服务（这些不需要上传，直接生成内联 SVG）
      const isPlaceholderService = finalThumbnail.includes('picsum.photos') || 
                                    finalThumbnail.includes('placehold.co') ||
                                    finalThumbnail.includes('via.placeholder.com');
      
      if (isPlaceholderService) {
        // 使用默认占位图时，生成内联 SVG
        console.log('[PublishModal] Detected placeholder service, generating inline SVG');
        finalThumbnail = generatePlaceholderSvg(title?.slice(0, 10) || '作品', 600, 400, '#3b82f6', '#ffffff');
      } else if (finalThumbnail) {
        // 检查是否是本地临时URL（blob URL）
        if (finalThumbnail.startsWith('blob:')) {
          // 有本地图片文件，需要上传
          const tempFile = selectedImage?._tempFile;
          if (tempFile) {
            try {
              console.log('[PublishModal] Uploading local image file to Supabase...');
              const { uploadImage } = await import('@/services/imageService');
              const uploadedUrl = await uploadImage(tempFile, user?.id || 'anonymous');
              if (uploadedUrl) {
                finalThumbnail = uploadedUrl;
                console.log('[PublishModal] Thumbnail uploaded to:', uploadedUrl);
              }
            } catch (uploadError) {
              console.error('[PublishModal] Failed to upload thumbnail:', uploadError);
              toast.error('图片上传失败，请重试');
              setIsSubmitting(false);
              return;
            }
          }
        } else if (!finalThumbnail.includes('supabase.co')) {
          // 外部链接，下载后上传
          try {
            console.log('[PublishModal] Downloading and uploading thumbnail to Supabase...');
            const { downloadAndUploadImage } = await import('@/services/imageService');
            const uploadedUrl = await downloadAndUploadImage(finalThumbnail, user?.id || 'anonymous');
            if (uploadedUrl) {
              finalThumbnail = uploadedUrl;
              console.log('[PublishModal] Thumbnail uploaded to:', uploadedUrl);
            } else {
              // 上传失败，使用内联 SVG 占位图
              console.warn('[PublishModal] Upload returned empty, using placeholder');
              const safeTitle = (title?.slice(0, 10) || 'Work').replace(/[^\x00-\x7F]/g, '?');
              finalThumbnail = generatePlaceholderSvg(safeTitle, 600, 400, '#3b82f6', '#ffffff');
            }
          } catch (uploadError) {
            console.warn('[PublishModal] Failed to upload thumbnail:', uploadError);
            // 上传失败，使用内联 SVG 占位图
            const safeTitle2 = (title?.slice(0, 10) || 'Work').replace(/[^\x00-\x7F]/g, '?');
            finalThumbnail = generatePlaceholderSvg(safeTitle2, 600, 400, '#3b82f6', '#ffffff');
          }
        }
      }
      
      // 创建作品
      const postData = {
        title: title.trim(),
        thumbnail: finalThumbnail,
        videoUrl: submitVideoUrl,
        type: contentType,
        category: contentType === 'image' ? 'design' : 'video' as any,
        tags: tags,
        description: description.trim(),
        creativeDirection: '',
        culturalElements: [],
        colorScheme: [],
        toolsUsed: [],
        publishType: 'explore' as const,
        communityId: null,
        visibility: 'public' as const,
        scheduledPublishDate: null
      };
      
      console.log('[PublishModal] Submitting postData:', {
        type: postData.type,
        category: postData.category,
        videoUrl: postData.videoUrl?.substring(0, 50),
        hasVideoUrl: !!postData.videoUrl,
        contentType
      });
      
      const post = await postsApi.addPost(postData, user as import('@/services/postService').User | undefined);

      if (post) {
        // 如果选择了品牌任务，提交作品到任务
        if (selectedTask) {
          try {
            console.log('[PublishModal] Submitting work to brand task:', selectedTask.id);
            await brandTaskService.submitWork({
              task_id: selectedTask.id,
              work_title: title.trim(),
              work_thumbnail: finalThumbnail,
              content: description.trim(),
              tags: tags,
              work_id: post.id
            }, user);
            toast.success(`作品已成功提交到品牌任务「${selectedTask.title}」`);
          } catch (taskError: any) {
            console.error('[PublishModal] Failed to submit to brand task:', taskError);
            const errorMessage = taskError?.message || '未知错误';
            toast.error(`作品已发布，但提交到品牌任务失败: ${errorMessage}`);
          }
        }

        // 如果发布成功且有视频，尝试同步到 Supabase 确保视频在广场能正常显示
        if (contentType === 'video' && submitVideoUrl) {
          try {
            console.log('[PublishModal] Syncing video to Supabase for square display...');
            const { syncWorkToSupabase } = await import('@/services/postService');
            await syncWorkToSupabase({
              ...post,
              video_url: submitVideoUrl,
              type: 'video'
            }, user as any);
          } catch (syncError) {
            console.warn('[PublishModal] Failed to sync to Supabase:', syncError);
            // 同步失败不影响主流程
          }
        }

        // 显示成功提示，带查看按钮
        toast.success(
          <div className="flex items-center justify-between gap-4 min-w-[280px]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-emerald-700">作品发布成功</span>
            </div>
            <button
              onClick={() => navigate('/square')}
              className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-[#C02C38] to-[#D64545] text-white hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center gap-1 font-medium whitespace-nowrap"
            >
              <ExternalLink className="w-3 h-3" />
              去广场查看
            </button>
          </div>,
          {
            duration: 5000,
            className: 'bg-emerald-50 border-emerald-200 !py-2 !px-3'
          }
        );
        onClose();

        // 重置表单
        setTitle('');
        setDescription('');
        setTags([]);
        setTagInput('');
        setVideoUrl('');
        setContentType('image');
        setShowPresetTags(false);
        setSelectedTask(null);
        setShowTaskSelector(false);
      } else {
        toast.error('发布失败，请重试');
      }
    } catch (error) {
      console.error('发布作品失败:', error);
      toast.error('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`max-w-md w-full max-h-[75vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border`}
          >
            {/* 头部 */}
            <div className={`p-6 border-b ${isDark ? 'border-gray-800/50' : 'border-gray-200'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-[#C02C38]/20' : 'bg-[#C02C38]/10'
                }`}>
                  <Sparkles className="w-5 h-5 text-[#C02C38]" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    发布到津脉广场
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    分享你的AI创作作品
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2.5 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            
            {/* 内容 */}
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* 内容类型选择 */}
                <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Sparkles className="w-4 h-4 text-[#C02C38]" />
                    内容类型
                  </h4>
                  <div className="flex gap-3">
                    <motion.button
                      type="button"
                      onClick={() => setContentType('image')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                        contentType === 'image'
                          ? (isDark ? 'bg-gradient-to-r from-[#C02C38] to-[#D04550] text-white shadow-lg shadow-[#C02C38]/25' : 'bg-gradient-to-r from-[#C02C38] to-[#D04550] text-white shadow-lg shadow-[#C02C38]/25')
                          : (isDark ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200')
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="font-medium">图片</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setContentType('video')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                        contentType === 'video'
                          ? (isDark ? 'bg-gradient-to-r from-[#C02C38] to-[#D04550] text-white shadow-lg shadow-[#C02C38]/25' : 'bg-gradient-to-r from-[#C02C38] to-[#D04550] text-white shadow-lg shadow-[#C02C38]/25')
                          : (isDark ? 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200')
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span className="font-medium">视频</span>
                    </motion.button>
                  </div>
                </div>
                
                {/* 预览 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <ImageIcon className="w-4 h-4 text-[#C02C38]" />
                      作品预览
                    </h4>
                    {/* 清除按钮 */}
                    {(thumbnail || videoUrl || finalVideoUrl) && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (contentType === 'image') {
                            // 清除图片
                            const newResults = generatedResults.map(r => 
                              r.id === selectedResult ? { ...r, thumbnail: '', _tempFile: undefined } : r
                            );
                            useCreateStore.setState({ generatedResults: newResults as any });
                          } else {
                            // 清除视频
                            setVideoUrl('');
                            // 同时清除 store 中的视频
                            const newResults = generatedResults.map(r => 
                              r.id === selectedResult ? { ...r, video: '', thumbnail: '', type: 'image' as const, _tempFile: undefined } : r
                            );
                            useCreateStore.setState({ generatedResults: newResults as any });
                            // 清除临时文件引用
                            (window as any)._tempVideoFile = null;
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                          isDark 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-3 h-3" />
                        清除
                      </motion.button>
                    )}
                  </div>
                  <motion.div
                    layout
                    className={`aspect-video rounded-2xl overflow-hidden border-2 ${
                      isDark ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                    } flex items-center justify-center relative group`}
                  >
                    {contentType === 'image' && thumbnail ? (
                      <>
                        <img
                          src={thumbnail}
                          alt="预览"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ImageIcon className="w-3 h-3 inline mr-1" />
                          图片作品
                        </div>
                      </>
                    ) : contentType === 'video' && (videoUrl || finalVideoUrl) ? (
                      <div className="relative w-full h-full bg-black">
                        <video
                          src={finalVideoUrl || videoUrl}
                          className="w-full h-full object-cover"
                          controls
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="auto"
                          poster={thumbnail}
                        />
                        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium pointer-events-none">
                          <Video className="w-3 h-3 inline mr-1" />
                          视频作品
                        </div>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center cursor-pointer w-full h-full ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                        <input
                          type="file"
                          accept={contentType === 'image' ? 'image/*' : 'video/*'}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            // 创建本地临时URL用于预览，发布时再上传到Supabase
                            try {
                              const tempUrl = URL.createObjectURL(file);
                              
                                  // 创建新的结果对象
                              const newResultId = Date.now();
                              const newResult = contentType === 'image' 
                                ? { 
                                    id: newResultId, 
                                    thumbnail: tempUrl, 
                                    _tempFile: file, 
                                    type: 'image' as const 
                                  }
                                : { 
                                    id: newResultId, 
                                    video: tempUrl, 
                                    thumbnail: tempUrl, 
                                    type: 'video' as const, 
                                    _tempFile: file 
                                  };
                              
                              // 添加到 generatedResults 并选中
                              const newResults = [...generatedResults, newResult];
                              useCreateStore.setState({ 
                                generatedResults: newResults as any,
                                selectedResult: newResultId
                              });
                              
                              if (contentType === 'video') {
                                setVideoUrl(tempUrl);
                                (window as any)._tempVideoFile = file;
                              }
                              toast.success('文件已选择，发布时将自动上传');
                            } catch (error) {
                              console.error('文件选择失败:', error);
                              toast.error('文件选择失败，请重试');
                            }
                          }}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-gray-800 group-hover:bg-gray-700' : 'bg-gray-200 group-hover:bg-gray-300'} transition-colors`}>
                          <Upload className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium">{contentType === 'image' ? '点击选择图片' : '点击选择视频'}</span>
                        <span className="text-xs mt-1 opacity-60">发布时将自动上传</span>
                      </label>
                    )}
                  </motion.div>
                </div>
                
                {/* 视频链接输入 */}
                {contentType === 'video' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Video className="w-4 h-4 text-[#C02C38]" />
                      视频链接
                      {aiVideoUrl && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${isDark ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                          <CheckCircle2 className="w-3 h-3" />
                          已自动填充
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder={aiVideoUrl ? "AI生成视频已自动填充" : "输入视频链接（支持 YouTube、Vimeo 等）"}
                        className={`w-full px-4 py-3 pl-11 rounded-xl border-2 transition-all duration-200 ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700 text-white focus:border-[#C02C38]/50 focus:bg-gray-800'
                            : 'bg-white border-gray-200 text-gray-900 focus:border-[#C02C38]/30 focus:bg-white'
                        } ${aiVideoUrl ? 'border-green-500/50' : ''} outline-none`}
                        disabled={isSubmitting}
                      />
                      <Video className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${aiVideoUrl ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    {aiVideoUrl && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-xs mt-2 flex items-center gap-1 ${isDark ? 'text-green-400/80' : 'text-green-600'}`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        视频已上传到永久存储，可直接发布
                      </motion.p>
                    )}
                  </motion.div>
                )}
                
                {/* 标题 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Type className="w-4 h-4 text-[#C02C38]" />
                      作品标题
                      <span className="text-red-500">*</span>
                    </label>
                    {/* AI 生成按钮 */}
                    <button
                      type="button"
                      onClick={generateMetadata}
                      disabled={isGeneratingMetadata || !description.trim()}
                      className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                        isGeneratingMetadata || !description.trim()
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:scale-105'
                      } ${
                        isDark
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      }`}
                    >
                      {isGeneratingMetadata ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          AI 生成标题标签
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="给你的作品起个吸引人的标题"
                      className={`w-full px-4 py-3 pl-11 rounded-xl border-2 transition-all duration-200 ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-[#C02C38]/50 focus:bg-gray-800'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-[#C02C38]/30 focus:bg-white'
                      } outline-none placeholder:text-gray-400`}
                      maxLength={50}
                      disabled={isSubmitting}
                    />
                    <Type className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${title ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      好的标题能让作品获得更多关注
                    </p>
                    <div className="flex items-center gap-1">
                      <div className={`h-1 rounded-full transition-all duration-300 ${
                        title.length === 0 ? 'w-0' :
                        title.length < 20 ? 'w-4 bg-gray-300' :
                        title.length < 40 ? 'w-8 bg-yellow-400' :
                        'w-12 bg-green-500'
                      }`} />
                      <span className={`text-xs font-medium ${
                        title.length >= 40 ? 'text-green-500' :
                        title.length >= 20 ? 'text-yellow-500' :
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {title.length}/50
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 描述 */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <AlignLeft className="w-4 h-4 text-[#C02C38]" />
                    作品描述
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="描述一下你的创作灵感、使用的AI工具或想要表达的文化内涵..."
                      rows={4}
                      className={`w-full px-4 py-3 pl-11 rounded-xl border-2 transition-all duration-200 resize-none ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-[#C02C38]/50 focus:bg-gray-800'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-[#C02C38]/30 focus:bg-white'
                      } outline-none placeholder:text-gray-400`}
                      maxLength={200}
                      disabled={isSubmitting}
                    />
                    <AlignLeft className={`absolute left-3.5 top-3.5 w-4 h-4 ${description ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      详细的描述有助于其他创作者理解你的作品
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            description.length === 0 ? 'w-0' :
                            description.length < 50 ? 'bg-gray-400' :
                            description.length < 100 ? 'bg-blue-400' :
                            description.length < 150 ? 'bg-yellow-400' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((description.length / 200) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        description.length >= 150 ? 'text-green-500' :
                        description.length >= 100 ? 'text-yellow-500' :
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {description.length}/200
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 品牌任务选择 */}
                {availableTasks.length > 0 && (
                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Briefcase className="w-4 h-4 text-[#C02C38]" />
                      关联品牌任务（可选）
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTaskSelector(!showTaskSelector)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                          selectedTask
                            ? isDark
                              ? 'bg-green-900/20 border-green-700/50 text-green-400'
                              : 'bg-green-50 border-green-200 text-green-700'
                            : isDark
                              ? 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase className={`w-5 h-5 ${selectedTask ? 'text-green-500' : 'text-gray-400'}`} />
                          <div className="text-left">
                            <p className="font-medium">
                              {selectedTask ? selectedTask.title : '选择要参与的品牌任务'}
                            </p>
                            {selectedTask && (
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                奖励: ¥{selectedTask.min_reward} - ¥{selectedTask.max_reward} · {selectedTask.brand_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 transition-transform ${showTaskSelector ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showTaskSelector && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`absolute top-full left-0 right-0 mt-2 rounded-xl border-2 shadow-lg z-20 max-h-64 overflow-y-auto ${
                              isDark
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="p-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTask(null);
                                  setShowTaskSelector(false);
                                }}
                                className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                                  !selectedTask
                                    ? isDark
                                      ? 'bg-green-900/20 text-green-400'
                                      : 'bg-green-50 text-green-700'
                                    : isDark
                                      ? 'hover:bg-gray-700 text-gray-300'
                                      : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    !selectedTask
                                      ? 'border-green-500 bg-green-500'
                                      : isDark
                                        ? 'border-gray-600'
                                        : 'border-gray-300'
                                  }`}>
                                    {!selectedTask && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </div>
                                  <span>不参与任何任务</span>
                                </div>
                              </button>

                              <div className={`my-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

                              {availableTasks.map((task) => (
                                <button
                                  key={task.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskSelector(false);
                                    // 自动添加任务要求的标签
                                    if (task.required_tags && task.required_tags.length > 0) {
                                      const newTags = [...tags];
                                      task.required_tags.forEach(tag => {
                                        if (!newTags.includes(tag)) {
                                          newTags.push(tag);
                                        }
                                      });
                                      setTags(newTags);
                                    }
                                  }}
                                  className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                                    selectedTask?.id === task.id
                                      ? isDark
                                        ? 'bg-green-900/20 text-green-400'
                                        : 'bg-green-50 text-green-700'
                                      : isDark
                                        ? 'hover:bg-gray-700 text-gray-300'
                                        : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                      selectedTask?.id === task.id
                                        ? 'border-green-500 bg-green-500'
                                        : isDark
                                          ? 'border-gray-600'
                                          : 'border-gray-300'
                                    }`}>
                                      {selectedTask?.id === task.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{task.title}</p>
                                      <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <span className="text-green-500 font-medium">
                                          ¥{task.min_reward} - ¥{task.max_reward}
                                        </span>
                                        <span>·</span>
                                        <span>{task.brand_name}</span>
                                      </div>
                                      <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <span>截止: {new Date(task.end_date).toLocaleDateString()}</span>
                                        <span>·</span>
                                        <span>需包含标签: {task.required_tags.slice(0, 2).join(', ')}{task.required_tags.length > 2 ? '...' : ''}</span>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {selectedTask && (
                      <div className={`mt-2 p-3 rounded-lg text-xs ${isDark ? 'bg-blue-900/20 text-blue-300 border border-blue-800/50' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                        <p className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          发布后将自动提交到该品牌任务，请确保作品包含要求的标签: <strong>{selectedTask.required_tags.join(', ')}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 标签 */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <label className={`block text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Hash className="w-4 h-4 text-[#C02C38]" />
                      标签
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              i < tags.length
                                ? 'bg-[#C02C38] scale-100'
                                : isDark ? 'bg-gray-700 scale-75' : 'bg-gray-200 scale-75'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${
                        tags.length >= 5 ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {tags.length}/5
                      </span>
                    </div>
                  </div>

                  {/* 已选标签展示 */}
                  <AnimatePresence mode="popLayout">
                    {tags.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mb-3"
                      >
                        {tags.map((tag) => (
                          <motion.span
                            key={tag}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer group ${
                              isDark
                                ? 'bg-gradient-to-r from-[#C02C38]/20 to-[#C02C38]/10 text-[#C02C38] border border-[#C02C38]/30 hover:border-[#C02C38]/50'
                                : 'bg-gradient-to-r from-[#C02C38]/10 to-[#C02C38]/5 text-[#C02C38] border border-[#C02C38]/20 hover:border-[#C02C38]/40'
                            }`}
                            onClick={() => removeTag(tag)}
                            title="点击删除标签"
                          >
                            <Hash className="w-3 h-3 opacity-70" />
                            {tag}
                            <span
                              className={`ml-0.5 rounded-full p-0.5 transition-all group-hover:scale-110 ${
                                isDark ? 'group-hover:bg-[#C02C38]/20' : 'group-hover:bg-[#C02C38]/10'
                              }`}
                            >
                              <X className="w-3 h-3" />
                            </span>
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 标签输入 */}
                  <div className="relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder={tags.length >= 5 ? "已达到最大标签数量" : "输入自定义标签，按回车或逗号添加"}
                      className={`w-full px-4 py-3 pl-11 pr-12 rounded-xl border-2 transition-all duration-200 ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-[#C02C38]/50 focus:bg-gray-800'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-[#C02C38]/30 focus:bg-white'
                      } outline-none placeholder:text-gray-400 disabled:opacity-50`}
                      disabled={isSubmitting || tags.length >= 5}
                    />
                    <Hash className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      tags.length >= 5 ? 'text-[#C02C38]' : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    {tagInput.trim() && tags.length < 5 && (
                      <motion.button
                        type="button"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={() => addTag(tagInput)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          isDark 
                            ? 'bg-[#C02C38]/20 text-[#C02C38] hover:bg-[#C02C38]/30' 
                            : 'bg-[#C02C38]/10 text-[#C02C38] hover:bg-[#C02C38]/20'
                        }`}
                        disabled={isSubmitting}
                      >
                        添加
                      </motion.button>
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    💡 提示：点击已选标签可删除，或点击下方推荐标签快速添加
                  </p>

                  {/* 预设标签 */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowPresetTags(!showPresetTags)}
                      className={`text-xs flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg ${
                        isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <motion.i
                        animate={{ rotate: showPresetTags ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="fas fa-chevron-down"
                      />
                      推荐标签
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {PRESET_TAGS.filter(tag => !tags.includes(tag)).length}
                      </span>
                    </button>

                    <AnimatePresence>
                      {showPresetTags && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-700">
                            {PRESET_TAGS.filter(tag => !tags.includes(tag)).map((tag, index) => (
                              <motion.button
                                key={tag}
                                type="button"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => addTag(tag)}
                                disabled={tags.length >= 5 || isSubmitting}
                                className={`px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105 ${
                                  isDark
                                    ? 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-gray-300 border border-gray-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-gray-200'
                                } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
                              >
                                + {tag}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* 提交按钮 */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-6 py-3.5 rounded-xl border-2 font-medium transition-all ${
                      isDark
                        ? 'bg-gray-800/50 hover:bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-900'
                    }`}
                    disabled={isSubmitting}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className={`flex-1 px-6 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isDark
                        ? 'bg-gradient-to-r from-[#C02C38] to-[#D04550] hover:from-[#A02430] hover:to-[#B83540] text-white shadow-lg shadow-[#C02C38]/25'
                        : 'bg-gradient-to-r from-[#C02C38] to-[#D04550] hover:from-[#A02430] hover:to-[#B83540] text-white shadow-lg shadow-[#C02C38]/25'
                    } disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none`}
                    disabled={isSubmitting || !title.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>发布中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>发布作品</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
