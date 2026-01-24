import { useState, useEffect, useContext, useRef, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

import { toast } from 'sonner';
import { TianjinImage, TianjinButton } from './TianjinStyleComponents';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BRANDS } from '@/lib/brands';

// 模板类型定义
interface Template {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  usageCount: number;
}

// 线下体验类型定义
interface OfflineExperience {
  id: number;
  name: string;
  description: string;
  location: string;
  price: string;
  image: string;
  availableSlots: number;
  rating: number;
  reviewCount: number;
}

// 老字号品牌类型定义
interface TraditionalBrand {
  id: number;
  name: string;
  logo: string;
  description: string;
  establishedYear: string;
  collaborationTools: number;
  popularity: number;
}

interface TianjinCreativeActivitiesProps {
  search?: string;
  activeTab?: 'templates' | 'offline' | 'brands';
}

export default memo(function TianjinCreativeActivities({ search: propSearch = '', activeTab: propActiveTab }: TianjinCreativeActivitiesProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  // 直接使用传入的 propActiveTab 作为当前活动标签
  const activeTab = propActiveTab || 'offline';
  const isLoading = false; // 直接设置为false，移除模拟加载
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [search, setSearch] = useState(propSearch);
  // 中文注释：地域模板详情弹层状态
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const openTemplateDetail = useCallback((t: Template) => setSelectedTemplate(t), []);
  const closeTemplateDetail = useCallback(() => setSelectedTemplate(null), []);
  // 中文注释：线下体验详情弹层状态
  const [selectedExperience, setSelectedExperience] = useState<OfflineExperience | null>(null);
  const openExperienceDetail = useCallback((e: OfflineExperience) => setSelectedExperience(e), []);
  const closeExperienceDetail = useCallback(() => setSelectedExperience(null), []);
  // 中文注释：老字号品牌详情弹层状态
  const [selectedBrand, setSelectedBrand] = useState<TraditionalBrand | null>(null);
  const openBrandDetail = useCallback((b: TraditionalBrand) => setSelectedBrand(b), []);
  const closeBrandDetail = useCallback(() => setSelectedBrand(null), []);
  
  // 当外部搜索属性变化时，更新内部搜索状态
  useEffect(() => {
    setSearch(propSearch);
  }, [propSearch]);

  useEffect(() => {
    const updateTabScrollState = () => {
      const el = tabListRef.current;
      if (!el) return;
      setAtStart(el.scrollLeft <= 0);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
      setHasOverflow(el.scrollWidth > el.clientWidth + 1);
    };

    const el = tabListRef.current;
    if (el) {
      updateTabScrollState();
      el.addEventListener('scroll', updateTabScrollState);
    }
    const onResize = () => updateTabScrollState();
    window.addEventListener('resize', onResize);
    return () => {
      if (el) el.removeEventListener('scroll', updateTabScrollState);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabListRef.current;
    if (!el) return;
    const delta = Math.max(100, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: dir === 'left' ? -delta : delta, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return;
    const activeEl = el.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [activeTab]);
  
  // 模拟模板数据
  const templates: Template[] = useMemo(() => [
    {
      id: 1,
      name: '津沽文化节主题模板',
      description: '融合天津传统文化元素，适用于各类文化节活动宣传设计。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20cultural%20festival%20template%20design',
      category: '节日主题',
      usageCount: 235
    },
    {
      id: 2,
      name: '海河风光模板',
      description: '以海河风光为背景，适合城市宣传和旅游相关设计。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Haihe%20River%20scenery%20template',
      category: '城市风光',
      usageCount: 189
    },
    {
      id: 3,
      name: '杨柳青年画风格模板',
      description: '模仿杨柳青年画的线条和色彩风格，具有浓厚的传统韵味。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20painting%20style%20template',
      category: '传统风格',
      usageCount: 156
    },
    {
      id: 4,
      name: '天津小吃宣传模板',
      description: '为天津特色小吃设计的宣传模板，突出地方美食特色。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20local%20food%20promotion%20template',
      category: '美食宣传',
      usageCount: 123
    },
    // 城市地标插画模板：地标图形，插画风格
    {
      id: 5,
      name: '城市地标插画模板',
      description: '以天津之眼、解放桥等地标为核心图形的插画类模板。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20city%20landmark%20illustration%20template',
      category: '城市风光',
      usageCount: 144
    },
    // 非遗风物纹样模板：传统纹样，现代排版
    {
      id: 6,
      name: '非遗风物纹样模板',
      description: '提取泥人张、风筝魏等非遗元素纹样，适配现代版式。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20intangible%20heritage%20pattern%20design%20template',
      category: '非遗传承',
      usageCount: 117
    },
    // 夜游光影视觉模板：夜景色彩，光影氛围
    {
      id: 7,
      name: '夜游光影视觉模板',
      description: '以海河夜景的光影氛围为主视觉，适配品牌活动海报。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20night%20tour%20light%20and%20shadow%20visual%20template',
      category: '夜游光影',
      usageCount: 98
    },
    // 老字号联名模板：品牌识别，包装海报
    {
      id: 8,
      name: '老字号联名模板',
      description: '面向老字号品牌的联名海报与包装视觉模板。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20brand%20co-branding%20visual%20template',
      category: '品牌联名',
      usageCount: 135
    },
    // 滨海蓝色旅游模板：海风元素，旅行主题
    {
      id: 9,
      name: '滨海蓝色旅游模板',
      description: '提取滨海新区的海风与蓝色主题，面向旅游宣传设计。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Binhai%20blue%20tourism%20poster%20template',
      category: '旅游主题',
      usageCount: 122
    },
    // 工业记忆影像模板：工业风格，粗粝质感
    {
      id: 10,
      name: '工业记忆影像模板',
      description: '以老厂房与工业质感为主，适合纪录片与影像项目。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20industrial%20memory%20visual%20template',
      category: '工业风',
      usageCount: 87
    },
    // 文博展陈主题模板：展览导视，文化主视觉
    {
      id: 11,
      name: '文博展陈主题模板',
      description: '适用于博物馆、美术馆展陈的主视觉与导视系统。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Museum%20exhibition%20visual%20identity%20template',
      category: '文博展陈',
      usageCount: 95
    },
    // 港口文化视觉模板：港口机械，城市脉络
    {
      id: 12,
      name: '港口文化视觉模板',
      description: '以港口机械与城市航运为元素，体现天津港口文化。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20port%20culture%20visual%20template',
      category: '港口文化',
      usageCount: 76
    }
    ,
    // 五大道历史风情模板：近代建筑群，历史氛围
    {
      id: 13,
      name: '五大道历史风情模板',
      description: '以五大道近代建筑群为视觉元素，突出天津的历史人文风貌。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Wudadao%20historical%20architecture%20poster%20template',
      category: '历史风情',
      usageCount: 142
    },
    // 意式风情区摄影模板：欧式街景，旅行打卡
    {
      id: 14,
      name: '意式风情区摄影模板',
      description: '以意式风情区的欧式街景为背景，适合城市旅行与摄影主题设计。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Italian%20Style%20Town%20photography%20template',
      category: '城市风光',
      usageCount: 168
    },
    // 鼓楼文化宣传模板：里巷市井，城市文化
    {
      id: 15,
      name: '鼓楼文化宣传模板',
      description: '围绕鼓楼与老城厢的市井生活，适合社区文化与城市宣传设计。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Gulou%20culture%20promotion%20template',
      category: '城市文化',
      usageCount: 121
    },
    // 北塘海鲜美食模板：渔港元素，美食海报
    {
      id: 16,
      name: '北塘海鲜美食模板',
      description: '以北塘渔港与海鲜元素为主，适合餐饮美食类宣传设计。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Beitang%20seafood%20promotion%20template%20Tianjin',
      category: '美食宣传',
      usageCount: 132
    },
    // 静海葡萄节活动模板：节庆主视觉，导视系统
    {
      id: 17,
      name: '静海葡萄节活动模板',
      description: '围绕静海葡萄节打造节庆主视觉，适配导视与物料延展。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Jinghai%20grape%20festival%20poster%20template',
      category: '节日主题',
      usageCount: 109
    },
    // 滨海新区科技主题模板：科技蓝，城市未来
    {
      id: 18,
      name: '滨海新区科技主题模板',
      description: '以科技蓝与未来感图形为核心，突出滨海新区产业形象。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Binhai%20New%20Area%20technology%20theme%20visual%20template',
      category: '科技主题',
      usageCount: 87
    },
    // 蓟州长城风光模板：自然风光，人文地标
    {
      id: 19,
      name: '蓟州长城风光模板',
      description: '以蓟州长城与山野风光为主视觉，适合文旅宣传类设计。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Jizhou%20Great%20Wall%20scenery%20poster%20template%20Tianjin',
      category: '自然风光',
      usageCount: 153
    },
    // 海河滨水休闲模板：生活方式，滨水场景
    {
      id: 20,
      name: '海河滨水休闲模板',
      description: '围绕海河滨水休闲的生活方式场景，适合社区活动与品牌海报。',
      thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20riverside%20leisure%20lifestyle%20visual%20template%20Tianjin',
      category: '城市休闲',
      usageCount: 174
    }
  ], []);
  
  // 模拟线下体验数据
  const offlineExperiences: OfflineExperience[] = useMemo(() => [
    {
      id: 1,
      name: '杨柳青古镇年画体验',
      description: '亲手绘制杨柳青年画，体验传统木版年画的制作过程。',
      location: '天津市西青区杨柳青古镇',
      price: '¥128/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20ancient%20town%20New%20Year%20painting%20experience',
      availableSlots: 15,
      rating: 4.8,
      reviewCount: 126
    },
    {
      id: 2,
      name: '泥人张彩塑工坊',
      description: '跟随泥人张传承人学习彩塑技艺，制作属于自己的泥人作品。',
      location: '天津市南开区古文化街',
      price: '¥168/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Nirenzhang%20clay%20sculpture%20workshop%20experience',
      availableSlots: 8,
      rating: 4.9,
      reviewCount: 89
    },
    {
      id: 3,
      name: '风筝魏风筝制作体验',
      description: '学习传统风筝的制作技艺，亲手制作一只精美的天津风筝。',
      location: '天津市和平区劝业场',
      price: '¥98/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Weifeng%20kite%20making%20experience',
      availableSlots: 20,
      rating: 4.7,
      reviewCount: 76
    },
    // 相声社沉浸体验：曲艺特色，互动演出
    {
      id: 4,
      name: '相声社沉浸体验',
      description: '走进相声社，体验台前幕后，与演员互动学习基本“捧逗”。',
      location: '天津市河北区意式风情区',
      price: '¥158/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20crosstalk%20club%20immersive%20experience',
      availableSlots: 12,
      rating: 4.8,
      reviewCount: 64
    },
    // 古文化街导览打卡：人文历史，地道市井
    {
      id: 5,
      name: '古文化街导览打卡',
      description: '深度导览古文化街，打卡风物人文，体验天津老城味道。',
      location: '天津市南开区古文化街',
      price: '¥88/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20guided%20tour',
      availableSlots: 25,
      rating: 4.6,
      reviewCount: 142
    },
    // 瓷器绘彩手作：工艺美学，色彩实践
    {
      id: 6,
      name: '瓷器绘彩手作班',
      description: '在工坊学习瓷器绘彩，从草图到上色完成一件专属作品。',
      location: '天津市红桥区手作工坊',
      price: '¥198/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Ceramic%20painting%20workshop%20experience',
      availableSlots: 10,
      rating: 4.9,
      reviewCount: 58
    },
    // 津味美食烹饪：地方菜谱，家常风味
    {
      id: 7,
      name: '津味美食烹饪体验',
      description: '学习锅巴菜、煎饼果子等家常做法，掌握地道津味。',
      location: '天津市河西区共享厨房',
      price: '¥138/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20local%20cuisine%20cooking%20class%20experience',
      availableSlots: 18,
      rating: 4.7,
      reviewCount: 73
    },
    // 海河夜游船票：夜景游览，解说导览
    {
      id: 8,
      name: '海河夜游船',
      description: '乘坐游船欣赏海河夜景，配合讲解了解城市光影与故事。',
      location: '天津市河东区海河码头',
      price: '¥168/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20night%20cruise%20experience',
      availableSlots: 40,
      rating: 4.5,
      reviewCount: 211
    },
    // 摄影采风活动：地标构图，夜景拍摄
    {
      id: 9,
      name: '天津地标摄影采风',
      description: '跟随向导拍摄地标建筑，学习夜景与构图技巧。',
      location: '天津市河西区文化中心',
      price: '¥158/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20city%20landmark%20photography%20walk',
      availableSlots: 22,
      rating: 4.8,
      reviewCount: 96
    },
    {
      id: 10,
      name: '石头门坎素包制作课',
      description: '学习传统素包制作技法，从和面到包制完整体验。',
      location: '天津市南开区老城厢',
      price: '¥128/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Shitoumenkan%20vegetarian%20bun%20making%20workshop%20experience',
      availableSlots: 16,
      rating: 4.6,
      reviewCount: 54
    },
    {
      id: 11,
      name: '茶汤李手作茶汤体验',
      description: '跟随老师学习传统茶汤调制，体验细腻甘香的津门味道。',
      location: '天津市河东区小吃工坊',
      price: '¥88/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Chatangli%20sweet%20soup%20making%20workshop%20experience',
      availableSlots: 20,
      rating: 4.5,
      reviewCount: 67
    },
    {
      id: 12,
      name: '海河皮划艇城市漫游',
      description: '专业教练带领在海河进行皮划艇体验，欣赏城市水岸风光。',
      location: '天津市河西区海河沿线',
      price: '¥198/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20kayaking%20urban%20tour%20experience',
      availableSlots: 12,
      rating: 4.7,
      reviewCount: 82
    },
    {
      id: 13,
      name: '意式风情区历史徒步',
      description: '专业向导讲解近代建筑与城市史，深度漫步意式风情区。',
      location: '天津市河北区意式风情区',
      price: '¥68/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Italian%20Style%20Town%20heritage%20walking%20tour',
      availableSlots: 30,
      rating: 4.6,
      reviewCount: 134
    },
    {
      id: 14,
      name: '京剧基础脸谱绘制课',
      description: '学习京剧脸谱色彩与构图，完成一幅个人脸谱作品。',
      location: '天津市红桥区戏曲社',
      price: '¥128/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Peking%20opera%20face%20painting%20workshop%20experience',
      availableSlots: 14,
      rating: 4.8,
      reviewCount: 92
    },
    {
      id: 15,
      name: '传统皮影制作与表演',
      description: '体验皮影雕刻与拼装，学习基本操偶，现场小型演出。',
      location: '天津市津南区文化馆',
      price: '¥158/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Chinese%20shadow%20puppetry%20making%20and%20performance%20workshop%20experience',
      availableSlots: 10,
      rating: 4.7,
      reviewCount: 59
    },
    {
      id: 16,
      name: '老字号巡礼美食徒步',
      description: '串联多家天津老字号，边走边品，了解品牌故事与美味。',
      location: '天津市南开区古文化街',
      price: '¥98/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20time-honored%20brands%20food%20tour%20walking%20experience',
      availableSlots: 25,
      rating: 4.7,
      reviewCount: 105
    },
    {
      id: 17,
      name: '杨柳青木版水印工艺课',
      description: '学习木版水印工艺流程，完成一件传统水印作品。',
      location: '天津市西青区杨柳青古镇',
      price: '¥168/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20woodblock%20water%20printing%20craft%20workshop%20experience',
      availableSlots: 12,
      rating: 4.8,
      reviewCount: 64
    },
    // 中文注释：新增——非遗剪纸主题体验，适合亲子与入门学习
    {
      id: 18,
      name: '非遗剪纸工坊体验',
      description: '学习传统剪纸技法，完成节庆主题剪纸作品并装裱展示。',
      location: '天津市和平区文化馆',
      price: '¥88/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Chinese%20paper-cutting%20workshop%20experience%20festive%20designs',
      availableSlots: 24,
      rating: 4.6,
      reviewCount: 72
    },
    // 中文注释：新增——曲艺相关体验，聚焦京韵大鼓与节奏训练
    {
      id: 19,
      name: '京韵大鼓入门体验课',
      description: '在老师带领下体验击鼓与演唱的基本节奏与腔韵。',
      location: '天津市红桥区曲艺社',
      price: '¥128/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Peking%20drum%20music%20beginner%20workshop%20experience%20traditional%20stage',
      availableSlots: 16,
      rating: 4.7,
      reviewCount: 58
    },
    // 中文注释：新增——亲子向拓印课程，强化互动与文化体验
    {
      id: 20,
      name: '年画拓印亲子课',
      description: '亲子共同学习年画拓印流程，完成一幅纪念作品。',
      location: '天津市西青区杨柳青古镇',
      price: '¥98/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20New%20Year%20print%20rubbing%20parent-child%20workshop%20experience',
      availableSlots: 20,
      rating: 4.8,
      reviewCount: 88
    },
    // 中文注释：新增——古文化街夜游摄影，提升夜景构图与用光技巧
    {
      id: 21,
      name: '古文化街夜拍漫步',
      description: '沿古文化街夜游拍摄，学习夜景用光与构图技巧。',
      location: '天津市南开区古文化街',
      price: '¥88/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20night%20photography%20walk%20experience',
      availableSlots: 28,
      rating: 4.6,
      reviewCount: 119
    },
    // 中文注释：新增——港口工业遗址探访，兼具人文与工业美学
    {
      id: 22,
      name: '港口工业遗址探访',
      description: '探访天津港工业遗址，学习纪录摄影与城市工业美学。',
      location: '天津市滨海新区港区',
      price: '¥128/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20port%20industrial%20heritage%20photography%20tour%20experience',
      availableSlots: 18,
      rating: 4.7,
      reviewCount: 76
    },
    // 中文注释：新增——瓷器修复入门，体验修补与彩绘
    {
      id: 23,
      name: '瓷器修复体验课',
      description: '了解瓷器修复基础流程，体验简单修补与彩绘工序。',
      location: '天津市红桥区手作工坊',
      price: '¥168/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Ceramic%20restoration%20beginner%20workshop%20experience%20painting%20and%20repair',
      availableSlots: 12,
      rating: 4.7,
      reviewCount: 64
    },
    // 中文注释：新增——地道美食技法课程，面向烹饪爱好者
    {
      id: 24,
      name: '煎饼果子大师班',
      description: '学习面糊调配与摊制技巧，完成地道风味的煎饼果子。',
      location: '天津市河西区共享厨房',
      price: '¥118/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20jianbing%20guozi%20cooking%20masterclass%20workshop%20experience',
      availableSlots: 20,
      rating: 4.6,
      reviewCount: 91
    },
    // 中文注释：新增——海河沿线骑行体验，结合城市讲解
    {
      id: 25,
      name: '海河城市骑行漫游',
      description: '沿海河骑行漫游，结合导览讲解城市历史与地标。',
      location: '天津市河西区海河沿线',
      price: '¥88/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20riverfront%20city%20cycling%20tour%20experience',
      availableSlots: 30,
      rating: 4.5,
      reviewCount: 110
    },
    // 中文注释：新增——老字号品牌互动体验，传承技艺与故事
    {
      id: 26,
      name: '果仁张栗子手作演示',
      description: '观摩糖炒栗子工艺演示，了解配方与火候，现场试吃。',
      location: '天津市和平区老字号门店',
      price: '¥68/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Candied%20chestnut%20handcraft%20demonstration%20workshop%20experience',
      availableSlots: 26,
      rating: 4.6,
      reviewCount: 85
    },
    // 中文注释：新增——风筝放飞活动日，适合家庭参与
    {
      id: 27,
      name: '传统风筝放飞体验日',
      description: '学习风筝放飞技巧与保养，现场集体放飞与拍照打卡。',
      location: '天津市河西区文化中心绿地',
      price: '¥68/人',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20kite%20flying%20family%20experience%20day%20Tianjin',
      availableSlots: 40,
      rating: 4.7,
      reviewCount: 120
    }
  ], []);
  
  // 模拟老字号品牌数据
  const traditionalBrands: TraditionalBrand[] = useMemo(() => [
    {
      id: 1,
      name: '桂发祥',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Guifaxiang%20traditional%20brand%20logo',
      description: '创建于1927年，以十八街麻花闻名，是天津食品行业的老字号品牌。',
      establishedYear: '1927',
      collaborationTools: 8,
      popularity: 96
    },
    {
      id: 2,
      name: '狗不理',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Goubuli%20traditional%20brand%20logo',
      description: '创建于1858年，以特色包子闻名，是天津餐饮行业的代表性老字号。',
      establishedYear: '1858',
      collaborationTools: 12,
      popularity: 98
    },
    {
      id: 3,
      name: '耳朵眼',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Erduoyan%20traditional%20brand%20logo',
      description: '创建于1900年，以炸糕和酒类产品闻名，是天津的传统老字号。',
      establishedYear: '1900',
      collaborationTools: 6,
      popularity: 92
    },
    {
      id: 4,
      name: '老美华',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Laomeihua%20traditional%20shoe%20brand%20logo',
      description: '始于民国时期的传统鞋履品牌，以手工缝制与舒适耐穿著称。',
      establishedYear: '1911',
      collaborationTools: 5,
      popularity: 88
    },
    {
      id: 5,
      name: '大福来',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Dafulai%20guobacai%20brand%20logo',
      description: '以锅巴菜闻名，糊辣香浓、层次丰富，是天津特色早点代表。',
      establishedYear: '1930',
      collaborationTools: 4,
      popularity: 85
    },
    {
      id: 6,
      name: '果仁张',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Guorenzhang%20candied%20chestnut%20brand%20logo',
      description: '百年坚果品牌，以糖炒栗子香甜饱满闻名，老天津味道的代表。',
      establishedYear: '1906',
      collaborationTools: 6,
      popularity: 90
    },
    {
      id: 7,
      name: '茶汤李',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Chatangli%20sweet%20soup%20brand%20logo',
      description: '源自清末的茶汤品牌，口感细腻柔滑、甘香回甜，承载城市记忆。',
      establishedYear: '1895',
      collaborationTools: 3,
      popularity: 83
    },
    // 利顺德：酒店文化，城市记忆
    {
      id: 8,
      name: '利顺德',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Lishunde%20hotel%20heritage%20brand%20logo',
      description: '百年酒店品牌，承载天津近代史与文化记忆，适合文旅联名。',
      establishedYear: '1863',
      collaborationTools: 7,
      popularity: 91
    },
    // 亨得利：钟表店，精工匠艺
    {
      id: 9,
      name: '亨得利表行',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Hengdeli%20watch%20store%20heritage%20brand%20logo',
      description: '老牌钟表行品牌，精工与匠艺象征，可开展工艺联名。',
      establishedYear: '1890',
      collaborationTools: 5,
      popularity: 86
    },
    // 正兴德：茶庄文化，津门茶韵
    {
      id: 10,
      name: '正兴德茶庄',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Zhengxingde%20tea%20house%20traditional%20brand%20logo',
      description: '历史悠久的茶庄品牌，融合津门茶文化与现代设计。',
      establishedYear: '1908',
      collaborationTools: 4,
      popularity: 84
    },
    // 石头门坎：素包之源，传统技法
    {
      id: 11,
      name: '石头门坎素包',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Shitoumenkan%20vegetarian%20bun%20heritage%20brand%20logo',
      description: '素包名店，传承传统素馅工艺，可做餐饮联名设计。',
      establishedYear: '1926',
      collaborationTools: 3,
      popularity: 82
    },
    // 孙记烧卖：街巷味道，家常点心
    {
      id: 12,
      name: '孙记烧卖',
      logo: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Sunji%20shaomai%20traditional%20brand%20logo',
      description: '街巷点心品牌，家常美味代表，适合集市活动联名。',
      establishedYear: '1935',
      collaborationTools: 2,
      popularity: 79
    }
  ], []);

  // 中文注释：扩充品牌数据（从 lib BRANDS 兼容映射）
  const extraBrands: TraditionalBrand[] = useMemo(() => BRANDS.map((b, i) => ({
    id: 1000 + i,
    name: b.name,
    logo: b.image,
    description: b.story,
    establishedYear: '—',
    collaborationTools: 3 + (i % 7),
    popularity: Math.min(99, 70 + (i % 30)),
  })), []);
  const allBrands: TraditionalBrand[] = useMemo(() => ([...traditionalBrands, ...extraBrands]), [traditionalBrands, extraBrands]);
  
  const handleApplyTemplate = useCallback((templateId: number) => {
    void templateId;
    toast.success('已应用模板到您的创作空间');
  }, []);
  
  const handleBookExperience = useCallback((experienceId: number) => {
    void experienceId;
    toast.success('预约成功！我们会尽快与您联系确认详情');
  }, []);
  
  const searchLower = typeof search === 'string' ? search.trim().toLowerCase() : '';
  
  const filteredTemplates = useMemo(() => {
    return searchLower
      ? templates.filter((t) => [t.name, t.description, t.category].some((s) => typeof s === 'string' && s.toLowerCase().includes(searchLower)))
      : templates;
  }, [searchLower, templates]);
  
  const filteredExperiences = useMemo(() => {
    return searchLower
      ? offlineExperiences.filter((e) => [e.name, e.description, e.location].some((s) => typeof s === 'string' && s.toLowerCase().includes(searchLower)))
      : offlineExperiences;
  }, [searchLower, offlineExperiences]);
  
  const filteredBrands = useMemo(() => {
    return searchLower
      ? allBrands.filter((b) => [b.name, b.description, b.establishedYear].some((s) => typeof s === 'string' && s.toLowerCase().includes(searchLower)))
      : allBrands;
  }, [searchLower, allBrands]);
  
  // 移除分页，直接显示所有内容
  const pagedBrands = filteredBrands;
  const pagedTemplates = filteredTemplates;
  const pagedExperiences = filteredExperiences;
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="flex space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-10 w-24 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`p-0 md:p-0 rounded-none ${isDark ? 'bg-transparent' : 'bg-transparent'} shadow-none flex-1 flex flex-col gap-6`}
    >
      {/* 左侧主内容区 */}
      <div className="w-full">
        {/* 标签页切换 - 仅在电脑端显示 */}
        <div className="relative mb-6 hidden sm:block">
        <div
          role="tablist"
          aria-label="津味共创活动类别"
          ref={tabListRef}
          className="flex space-x-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-0 pb-2"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') scrollTabs('right');
            if (e.key === 'ArrowLeft') scrollTabs('left');
          }}
        >
          {
            [
              { id: 'offline', name: '线下体验' },
              { id: 'templates', name: '地域模板' },
              { id: 'brands', name: '老字号联名' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'templates' | 'offline' | 'brands')}
                role="tab"
                aria-selected={activeTab === tab.id}
                title={tab.name}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold text-left transition-all duration-300 whitespace-nowrap snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
                  activeTab === tab.id 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : isDark 
                      ? 'bg-gray-700/80 hover:bg-gray-700/100 hover:text-red-400' 
                      : 'bg-gray-100 hover:bg-gray-200 hover:text-red-600'
                } ${isDark ? 'focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800' : 'focus-visible:ring-offset-2 focus-visible:ring-offset-white'}`}
              >
                {tab.name}
              </button>
            ))
          }
        </div>
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 ${
            isDark ? 'bg-gradient-to-l from-gray-800/50 to-transparent' : 'bg-gradient-to-l from-white/80 to-transparent'
          } ${!hasOverflow || atEnd ? 'opacity-0' : 'opacity-100'} transition-all duration-300`}
        ></div>
        <button
          aria-label="向左滚动类别"
          onClick={() => scrollTabs('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow-md border ${isDark ? 'border-gray-600' : 'border-gray-200'} ${!hasOverflow || atStart ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          aria-label="向右滚动类别"
          onClick={() => scrollTabs('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-900 hover:bg-gray-100'} shadow-md border ${isDark ? 'border-gray-600' : 'border-gray-200'} ${!hasOverflow || atEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}`}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      
      {/* 主题活动内容 - 已移除，功能迁移至文化活动页 */}
      
      {/* 地域模板内容 */}
      {activeTab === 'templates' && (
        <>
          {/* 移动端专属修改：columns-2 (原columns-1) 实现更紧凑的瀑布流，gap-3 */}
          <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
            {pagedTemplates.map((template) => (
              <div
                key={template.id}
                className={`break-inside-avoid mb-3 md:mb-4 rounded-xl overflow-hidden shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}
              >
                <div className="relative group">
                  <TianjinImage 
                    src={template.thumbnail} 
                    alt={template.name} 
                    className="cursor-pointer"
                    ratio="auto"
                    rounded="none"
                    onClick={() => openTemplateDetail(template)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                {/* 移动端专属修改：p-2 (原p-4) 减少内边距 */}
                <div className={`p-2 md:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm md:text-lg leading-tight line-clamp-1">{template.name}</h4>
                  </div>
                  <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
                    <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-red-50 border-red-100 text-red-600'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                  <p className={`text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {template.description}
                  </p>
                  <div className="flex justify-between items-center text-[10px] md:text-xs mb-2 md:mb-4">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                      <i className="fas fa-fire-alt mr-1 text-red-500"></i>
                      {template.usageCount}
                    </span>
                  </div>
                  {/* 移动端专属修改：Flex布局水平排列按钮，更紧凑 */}
                  <div className="flex md:grid md:grid-cols-2 gap-1 md:gap-2">
                    <button 
                      onClick={() => handleApplyTemplate(template.id)}
                      className="flex-1 py-1.5 md:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                      应用
                    </button>
                    <button 
                      onClick={() => openTemplateDetail(template)}
                      className={`flex-1 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors border whitespace-nowrap ${
                        isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* 线下体验内容 */}
      {activeTab === 'offline' && (
          <>
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
              {pagedExperiences.map((experience) => (
              <div
                key={experience.id}
                className={`break-inside-avoid mb-3 md:mb-4 rounded-xl overflow-hidden shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}
              >
                <div className="relative">
                  <TianjinImage src={experience.image} alt={experience.name} ratio="auto" rounded="none" onClick={() => openExperienceDetail(experience)} loading="lazy" />
                  <div className="absolute top-1 right-1 md:top-2 md:right-2">
                    <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-white/90 backdrop-blur-sm rounded-md text-[10px] md:text-xs font-bold text-red-600 shadow-sm border border-red-100">
                      {experience.price}
                    </span>
                  </div>
                  {experience.rating >= 4.8 && (
                    <div className="absolute top-1 left-1 md:top-2 md:left-2">
                      <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-yellow-400 text-yellow-900 rounded-md text-[10px] md:text-xs font-bold shadow-sm flex items-center gap-1">
                        <i className="fas fa-fire"></i>
                        <span className="hidden md:inline">高分</span>
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-2 md:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-1 md:mb-2">
                    <h4 className="font-bold text-xs md:text-lg leading-tight line-clamp-2">{experience.name}</h4>
                  </div>
                  <div className="flex items-center mb-1.5 md:mb-3 text-yellow-500 text-[10px] md:text-sm">
                    {/* 移动端只显示一颗星+分数，桌面端显示5颗星 */}
                    <div className="hidden md:flex">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`fas fa-star ${i < Math.floor(experience.rating) ? '' : 'text-gray-300'}`}></i>
                      ))}
                    </div>
                    <div className="md:hidden flex items-center">
                       <i className="fas fa-star text-xs mr-0.5"></i>
                    </div>
                    <span className={`ml-0.5 md:ml-2 text-[10px] md:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {experience.rating}
                    </span>
                  </div>
                  <p className={`text-[10px] md:text-sm mb-2 md:mb-4 line-clamp-2 leading-snug ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {experience.description}
                  </p>
                  
                  <div className={`hidden md:block mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} space-y-2`}>
                    <div className="flex items-start text-xs">
                      <i className="fas fa-map-marker-alt mt-0.5 mr-2 text-red-500 w-3"></i>
                      <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-1`}>{experience.location}</span>
                    </div>
                    <div className="flex items-center text-xs justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-users mr-2 text-blue-500 w-3"></i>
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>剩余: <span className="font-bold text-red-500">{experience.availableSlots}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* 移动端专属修改：Flex布局水平排列按钮，更紧凑 */}
                  <div className="flex md:grid md:grid-cols-2 gap-1 md:gap-2">
                    <button 
                      onClick={() => handleBookExperience(experience.id)}
                      className="flex-1 py-1.5 md:py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                    >
                      预约
                    </button>
                    <button 
                      onClick={() => openExperienceDetail(experience)}
                      className={`flex-1 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm font-medium transition-colors border whitespace-nowrap ${
                        isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* 老字号联名内容 */}
      {activeTab === 'brands' && (
          <>
            <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 md:gap-4">
              {pagedBrands.map((brand) => (
              <div
                key={brand.id}
                className={`break-inside-avoid mb-3 md:mb-4 p-3 md:p-5 rounded-xl shadow-md border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                } group relative overflow-hidden`}
              >
                {/* 装饰背景图案 */}
                <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full -mr-6 -mt-6 md:-mr-8 md:-mt-8 pointer-events-none"></div>
                
                <div className="flex flex-col items-center mb-3 relative z-10">
                  <div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden p-2 md:p-2 mb-3 md:mb-4 flex-shrink-0 flex items-center justify-center border transition-colors ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'
                    } shadow-sm group-hover:border-red-200`}
                  >
                    <div className="w-full h-full">
                      <TianjinImage src={brand.logo} alt={brand.name} className="w-full h-full" ratio="square" fit="contain" rounded="lg" loading="lazy" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-sm md:text-lg mb-3 md:mb-4">{brand.name}</h4>
                  </div>
                </div>
                
                {/* 移动端专属修改：Flex布局水平排列按钮，更紧凑 */}
                <div className="flex md:grid md:grid-cols-2 gap-2 md:gap-3">
                  <button 
                    onClick={() => navigate(`/tools?from=tianjin&query=${encodeURIComponent(brand.name + ' 联名 工具')}&mode=inspire`)}
                    className={`flex-1 flex items-center justify-center py-2 md:py-2.5 rounded-lg text-sm md:text-sm font-semibold transition-all duration-300 bg-red-500 hover:bg-red-600 text-white shadow-sm whitespace-nowrap`}
                  >
                    <i className="fas fa-tools mr-2"></i>
                    工具
                  </button>
                  <button 
                    onClick={() => openBrandDetail(brand)}
                    className={`flex-1 flex items-center justify-center py-2 md:py-2.5 rounded-lg text-sm md:text-sm font-semibold transition-colors border whitespace-nowrap ${
                      isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
      
      {/* 右侧补充内容区 - 改为横向排列 */}
      <div className="w-full flex flex-col md:flex-row gap-4">
        {/* 热门话题 */}
        <div className={`w-full md:w-1/2 p-3 rounded-xl shadow-md ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
          <h3 className="font-bold text-base mb-3">热门话题</h3>
          <div className="space-y-2">
            {
              [
                { tag: '#国潮设计', count: 234 },
                { tag: '#天津老字号', count: 189 },
                { tag: '#文创产品', count: 156 },
                { tag: '#津味插画', count: 123 },
                { tag: '#非遗传承', count: 98 }
              ].map((topic, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${isDark ? 'bg-red-500' : 'bg-red-400'} mr-2`}></span>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{topic.tag}</span>
                  </div>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{topic.count}人参与</span>
                </div>
              ))
            }
          </div>
        </div>
        
        {/* 近期活动 */}
        <div className="w-full md:w-1/2 p-3 rounded-xl shadow-md ${isDark ? 'bg-gray-700' : 'bg-white'}">
          <h3 className="font-bold text-base mb-3">近期活动</h3>
          <div className="space-y-3">
            {
              [
                { name: '天津老字号文化节', date: '2025.12.15-2025.12.25' },
                { name: '海河国际艺术季', date: '2025.12.20-2026.01.10' },
                { name: '杨柳青古镇旅游节', date: '2026.01.05-2026.01.15' },
                { name: '津味美食文化展', date: '2026.01.12-2026.01.22' }
              ].map((event, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}">
                  <div className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full ${isDark ? 'bg-blue-500' : 'bg-blue-400'} mr-2"></span>
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{event.name}</span>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{event.date}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
      
      {/* 模板详情弹层 */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeTemplateDetail}></div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
              <button
                onClick={closeTemplateDetail}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedTemplate.thumbnail}
                  alt={selectedTemplate.name}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm mb-2">{selectedTemplate.category}</span>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedTemplate.description}</p>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <i className="fas fa-fire-alt mr-2 text-red-500"></i>
                    <span>{selectedTemplate.usageCount}次使用</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleApplyTemplate(selectedTemplate.id);
                      closeTemplateDetail();
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    立即应用
                  </button>
                  <button
                    onClick={closeTemplateDetail}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* 线下体验详情弹层 */}
      {selectedExperience && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeExperienceDetail}></div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedExperience.name}</h2>
              <button
                onClick={closeExperienceDetail}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedExperience.image}
                  alt={selectedExperience.name}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-500 mr-1">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`fas fa-star ${i < Math.floor(selectedExperience.rating) ? '' : 'text-gray-300'}`}></i>
                      ))}
                    </span>
                    <span className="text-sm text-gray-500">{selectedExperience.rating} ({selectedExperience.reviewCount}条评价)</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedExperience.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <i className="fas fa-map-marker-alt mr-2 text-red-500"></i>
                      <span>{selectedExperience.location}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-tag mr-2 text-green-500"></i>
                      <span>{selectedExperience.price}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-users mr-2 text-blue-500"></i>
                      <span>剩余名额: <span className="font-bold text-red-500">{selectedExperience.availableSlots}</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleBookExperience(selectedExperience.id);
                      closeExperienceDetail();
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    立即预约
                  </button>
                  <button
                    onClick={closeExperienceDetail}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* 老字号品牌详情弹层 */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeBrandDetail}></div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 p-6`}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedBrand.name}</h2>
              <button
                onClick={closeBrandDetail}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <img
                      src={selectedBrand.logo}
                      alt={selectedBrand.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">创立于 {selectedBrand.establishedYear} 年</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">定制工具</p>
                      <p className="text-xl font-bold">{selectedBrand.collaborationTools}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">热度指数</p>
                      <p className="text-xl font-bold">{selectedBrand.popularity}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedBrand.description}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigate(`/tools?from=tianjin&query=${encodeURIComponent(selectedBrand.name + ' 联名 工具')}&mode=inspire`);
                      closeBrandDetail();
                    }}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    查看联名工具
                  </button>
                  <button
                    onClick={closeBrandDetail}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});