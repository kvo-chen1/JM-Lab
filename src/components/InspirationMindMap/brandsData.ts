/**
 * 天津老字号品牌数据
 * 包含20+个天津传统文化品牌
 */

export interface CulturalElement {
  id: string;
  name: string;
  type: 'visual' | 'craft' | 'story' | 'taste';
  meaning: string;
  description: string;
}

export interface BrandData {
  id: string;
  name: string;
  category: 'food' | 'art' | 'history' | 'craft' | 'commerce' | 'culture';
  categoryName: string;
  founded: string;
  description: string;
  story: string;
  image: string;
  location: string;
  honor: string[];
  elements: CulturalElement[];
}

// 天津老字号品牌数据 - 20+个品牌
export const BRANDS_DATA: BrandData[] = [
  // ============ 美食类（9个）============
  {
    id: 'goubuli',
    name: '狗不理包子',
    category: 'food',
    categoryName: '老字号美食',
    founded: '1858年',
    description: '天津"三绝"之首，包子褶花匀称，每个包子不少于15个褶',
    story: '创始人高贵友，乳名"狗子"，因其包子生意太好，顾不上与顾客说话，人们戏称"狗子卖包子，不理人"，遂得名狗不理。',
    image: '🥟',
    location: '天津市和平区山东路',
    honor: ['中华老字号', '国家级非物质文化遗产'],
    elements: [
      { id: 'goubuli-1', name: '十八个褶', type: 'visual', meaning: '象征圆满', description: '包子顶部的十八道褶纹，代表十全十美' },
      { id: 'goubuli-2', name: '圆润形态', type: 'visual', meaning: '团团圆圆', description: '包子圆润饱满的造型，寓意团圆美满' },
      { id: 'goubuli-3', name: '蒸汽升腾', type: 'visual', meaning: '蒸蒸日上', description: '热气腾腾的场景，象征事业兴旺' },
      { id: 'goubuli-4', name: '三鲜馅料', type: 'taste', meaning: '鲜美可口', description: '猪肉、虾仁、鸡蛋的经典搭配' },
    ],
  },
  {
    id: 'guifax',
    name: '桂发祥十八街麻花',
    category: 'food',
    categoryName: '老字号美食',
    founded: '1927年',
    description: '天津"三绝"之一，香酥可口，久放不绵',
    story: '创始人范贵才、范贵林兄弟在十八街开设"桂发祥"和"桂发成"麻花店，因制作精细、口感独特而闻名。',
    image: '🥨',
    location: '天津市河西区大沽南路',
    honor: ['中华老字号', '巴拿马万国博览会金奖'],
    elements: [
      { id: 'guifax-1', name: '螺旋纹理', type: 'visual', meaning: '连绵不断', description: '麻花独特的螺旋形状，象征绵延不绝' },
      { id: 'guifax-2', name: '金黄酥脆', type: 'visual', meaning: '富贵吉祥', description: '油炸后的金黄色泽，代表富贵' },
      { id: 'guifax-3', name: '多股缠绕', type: 'craft', meaning: '团结和谐', description: '多股面条缠绕的工艺，寓意团结' },
      { id: 'guifax-4', name: '芝麻点缀', type: 'visual', meaning: '芝麻开花', description: '表面芝麻点缀，象征节节高升' },
    ],
  },
  {
    id: 'erduoyan',
    name: '耳朵眼炸糕',
    category: 'food',
    categoryName: '老字号美食',
    founded: '清光绪年间',
    description: '天津"三绝"之一，外酥里糯，豆香四溢',
    story: '因店铺位于天津耳朵眼胡同而得名，创始人刘万春以"刘记"炸糕闻名，后改为"耳朵眼炸糕"。',
    image: '🍘',
    location: '天津市红桥区北门外大街',
    honor: ['中华老字号', '天津市级非物质文化遗产'],
    elements: [
      { id: 'erduoyan-1', name: '外酥里嫩', type: 'visual', meaning: '表里如一', description: '外层酥脆，内里软糯，寓意内外兼修' },
      { id: 'erduoyan-2', name: '豆沙馅料', type: 'visual', meaning: '甜甜蜜蜜', description: '传统豆沙馅的深红色，象征甜蜜' },
      { id: 'erduoyan-3', name: '胡同文化', type: 'story', meaning: '市井生活', description: '耳朵眼胡同的历史故事' },
      { id: 'erduoyan-4', name: '油炸金黄', type: 'visual', meaning: '金光闪闪', description: '油炸后的金黄色，代表财富' },
    ],
  },
  {
    id: 'bengdouzhang',
    name: '崩豆张',
    category: 'food',
    categoryName: '老字号美食',
    founded: '清嘉庆年间',
    description: '天津传统炒货，酥脆可口，品种繁多',
    story: '创始人张德，以炒制崩豆（炒蚕豆）闻名，后发展为崩豆张，经营各类炒货食品。',
    image: '🥜',
    location: '天津市南开区古文化街',
    honor: ['中华老字号', '天津市级非物质文化遗产'],
    elements: [
      { id: 'bengdou-1', name: '爆裂纹理', type: 'visual', meaning: '突破创新', description: '崩豆爆裂后的独特纹理，象征突破' },
      { id: 'bengdou-2', name: '棕褐色泽', type: 'visual', meaning: '朴实厚重', description: '炒制后的棕褐色，代表朴实' },
      { id: 'bengdou-3', name: '酥脆口感', type: 'taste', meaning: '干脆利落', description: '酥脆的口感特点' },
      { id: 'bengdou-4', name: '传统炒制', type: 'craft', meaning: '匠心传承', description: '传统炒制工艺' },
    ],
  },
  {
    id: 'guorenzhang',
    name: '果仁张',
    category: 'food',
    categoryName: '老字号美食',
    founded: '清光绪年间',
    description: '天津传统坚果炒货，香甜酥脆',
    story: '创始人张氏，以炒制各类果仁闻名，采用传统配方和工艺，口感独特。',
    image: '🌰',
    location: '天津市和平区滨江道',
    honor: ['中华老字号', '天津特色食品'],
    elements: [
      { id: 'guoren-1', name: '饱满果仁', type: 'visual', meaning: '充实丰盈', description: '果仁饱满圆润的形态' },
      { id: 'guoren-2', name: '糖衣包裹', type: 'craft', meaning: '甜蜜包裹', description: '糖衣包裹的工艺' },
      { id: 'guoren-3', name: '琥珀色泽', type: 'visual', meaning: '晶莹剔透', description: '糖衣的琥珀色' },
      { id: 'guoren-4', name: '香脆口感', type: 'taste', meaning: '愉悦享受', description: '香脆可口的味觉体验' },
    ],
  },
  {
    id: 'pitangzhang',
    name: '皮糖张',
    category: 'food',
    categoryName: '老字号美食',
    founded: '清光绪年间',
    description: '天津传统糖果，软糯香甜，不粘牙',
    story: '创始人张氏，创制出独特的皮糖，口感软糯，甜而不腻，深受喜爱。',
    image: '🍬',
    location: '天津市南开区古文化街',
    honor: ['天津老字号', '传统特色糖果'],
    elements: [
      { id: 'pitang-1', name: '晶莹剔透', type: 'visual', meaning: '纯净透明', description: '皮糖晶莹剔透的外观' },
      { id: 'pitang-2', name: '软糯质地', type: 'taste', meaning: '柔韧温和', description: '软糯不粘牙的口感' },
      { id: 'pitang-3', name: '甜蜜香气', type: 'taste', meaning: '幸福甜蜜', description: '香甜的气味' },
      { id: 'pitang-4', name: '传统熬糖', type: 'craft', meaning: '火候精准', description: '传统熬糖工艺' },
    ],
  },
  {
    id: 'zhilanzai',
    name: '芝兰斋',
    category: 'food',
    categoryName: '老字号美食',
    founded: '清光绪年间',
    description: '天津传统糕点，精致美味，品种丰富',
    story: '芝兰斋以制作传统糕点闻名，产品精致美观，是天津传统糕点代表。',
    image: '🥮',
    location: '天津市和平区南市',
    honor: ['天津老字号', '传统糕点名店'],
    elements: [
      { id: 'zhilan-1', name: '精美造型', type: 'visual', meaning: '雅致精美', description: '糕点造型精致美观' },
      { id: 'zhilan-2', name: '层次分明', type: 'craft', meaning: '层次丰富', description: '糕点层次分明' },
      { id: 'zhilan-3', name: '香甜馅料', type: 'taste', meaning: '甜蜜满足', description: '香甜可口的馅料' },
      { id: 'zhilan-4', name: '传统工艺', type: 'craft', meaning: '匠心独运', description: '传统糕点制作工艺' },
    ],
  },
  {
    id: 'dafu',
    name: '大福来',
    category: 'food',
    categoryName: '老字号美食',
    founded: '清乾隆年间',
    description: '天津传统锅巴菜，香脆可口，早餐首选',
    story: '大福来以锅巴菜闻名，是天津传统早餐的代表，深受市民喜爱。',
    image: '🥣',
    location: '天津市红桥区大胡同',
    honor: ['天津老字号', '市级非物质文化遗产'],
    elements: [
      { id: 'dafu-1', name: '金黄锅巴', type: 'visual', meaning: '香脆诱人', description: '锅巴金黄酥脆' },
      { id: 'dafu-2', name: '卤汁浓郁', type: 'taste', meaning: '醇厚美味', description: '浓郁的卤汁' },
      { id: 'dafu-3', name: '早餐文化', type: 'story', meaning: '市井生活', description: '天津早餐文化代表' },
      { id: 'dafu-4', name: '热气腾腾', type: 'visual', meaning: '温暖人心', description: '热气腾腾的早餐' },
    ],
  },
  {
    id: 'yangcun',
    name: '杨村糕干',
    category: 'food',
    categoryName: '老字号美食',
    founded: '明代',
    description: '天津武清特产，洁白细腻，甜而不腻',
    story: '杨村糕干是天津武清区杨村镇的传统特产，以大米和白糖为原料，口感细腻。',
    image: '🍰',
    location: '天津市武清区杨村镇',
    honor: ['国家地理标志产品', '市级非物质文化遗产'],
    elements: [
      { id: 'yangcun-1', name: '洁白如雪', type: 'visual', meaning: '纯洁无瑕', description: '糕干洁白的外观' },
      { id: 'yangcun-2', name: '细腻质地', type: 'taste', meaning: '细腻柔和', description: '入口即化的口感' },
      { id: 'yangcun-3', name: '米香四溢', type: 'taste', meaning: '清香自然', description: '大米的清香' },
      { id: 'yangcun-4', name: '传统蒸制', type: 'craft', meaning: '蒸腾向上', description: '传统蒸制工艺' },
    ],
  },

  // ============ 工艺品类（6个）============
  {
    id: 'nirenzhang',
    name: '泥人张彩塑',
    category: 'art',
    categoryName: '传统艺术',
    founded: '清道光年间',
    description: '天津民间艺术，形象生动，色彩鲜艳',
    story: '创始人张明山，以捏泥人闻名，其作品"贱卖海张五"的故事广为流传，被誉为"泥人张"。',
    image: '🎨',
    location: '天津市南开区古文化街',
    honor: ['国家级非物质文化遗产', '中国工艺美术大师'],
    elements: [
      { id: 'nirenzhang-1', name: '细腻写实', type: 'craft', meaning: '精益求精', description: '人物表情细腻逼真，追求极致' },
      { id: 'nirenzhang-2', name: '鲜艳色彩', type: 'visual', meaning: '丰富多彩', description: '明快艳丽的配色方案' },
      { id: 'nirenzhang-3', name: '圆润造型', type: 'visual', meaning: '亲和可爱', description: '人物造型圆润饱满' },
      { id: 'nirenzhang-4', name: '民间故事', type: 'story', meaning: '传承文化', description: '取材于民间传说和故事' },
    ],
  },
  {
    id: 'fengzhengwei',
    name: '风筝魏',
    category: 'art',
    categoryName: '传统艺术',
    founded: '1915年',
    description: '巴拿马金奖，做工精细，放飞平稳',
    story: '创始人魏元泰，以制作风筝闻名，其作品在1915年巴拿马万国博览会上获得金奖，被誉为"风筝魏"。',
    image: '🪁',
    location: '天津市南开区古文化街',
    honor: ['国家级非物质文化遗产', '巴拿马万国博览会金奖'],
    elements: [
      { id: 'fengzhengwei-1', name: '对称结构', type: 'visual', meaning: '平衡和谐', description: '风筝的对称设计，象征平衡' },
      { id: 'fengzhengwei-2', name: '彩绘图案', type: 'visual', meaning: '色彩斑斓', description: '传统彩绘技艺，色彩丰富' },
      { id: 'fengzhengwei-3', name: '竹骨架构', type: 'craft', meaning: '坚韧挺拔', description: '竹子骨架的轻盈与坚韧' },
      { id: 'fengzhengwei-4', name: '飞翔姿态', type: 'visual', meaning: '自由翱翔', description: '风筝在空中翱翔的姿态' },
    ],
  },
  {
    id: 'yangliuqing',
    name: '杨柳青年画',
    category: 'art',
    categoryName: '传统艺术',
    founded: '明代崇祯年间',
    description: '中国著名民间木版年画，与苏州桃花坞并称"南桃北柳"',
    story: '起源于天津杨柳青镇，采用木版套印与手工彩绘相结合，题材广泛，以胖娃娃最为著名。',
    image: '🖼️',
    location: '天津市西青区杨柳青镇',
    honor: ['国家级非物质文化遗产', '中国民间艺术瑰宝'],
    elements: [
      { id: 'yangliuqing-1', name: '木版印刷', type: 'craft', meaning: '传统技艺', description: '木版水印工艺，传承千年' },
      { id: 'yangliuqing-2', name: '胖娃娃', type: 'visual', meaning: '多子多福', description: '经典胖娃娃形象，寓意吉祥' },
      { id: 'yangliuqing-3', name: '红蓝配色', type: 'visual', meaning: '喜庆吉祥', description: '传统的红蓝对比色' },
      { id: 'yangliuqing-4', name: '连年有余', type: 'story', meaning: '富足安康', description: '经典年画题材' },
    ],
  },
  {
    id: 'kezhuanliu',
    name: '刻砖刘',
    category: 'art',
    categoryName: '传统艺术',
    founded: '清同治年间',
    description: '天津砖雕艺术，刀法细腻，图案精美',
    story: '创始人刘凤鸣，以砖雕技艺闻名，作品刀法细腻，构图严谨，被誉为"刻砖刘"。',
    image: '🧱',
    location: '天津市南开区古文化街',
    honor: ['国家级非物质文化遗产', '天津工艺美术'],
    elements: [
      { id: 'kezhuan-1', name: '精细刀法', type: 'craft', meaning: '精雕细琢', description: '细腻的雕刻刀法' },
      { id: 'kezhuan-2', name: '层次丰富', type: 'visual', meaning: '层次分明', description: '雕刻层次丰富' },
      { id: 'kezhuan-3', name: '传统纹样', type: 'visual', meaning: '文化传承', description: '传统吉祥纹样' },
      { id: 'kezhuan-4', name: '青砖质感', type: 'visual', meaning: '古朴厚重', description: '青砖的质感美' },
    ],
  },
  {
    id: 'jianzhi',
    name: '天津剪纸',
    category: 'art',
    categoryName: '传统艺术',
    founded: '清代',
    description: '天津民间剪纸，刀法流畅，图案生动',
    story: '天津剪纸历史悠久，刀法流畅，题材广泛，是天津民间艺术的重要组成部分。',
    image: '✂️',
    location: '天津市各区',
    honor: ['天津市级非物质文化遗产', '民间艺术瑰宝'],
    elements: [
      { id: 'jianzhi-1', name: '流畅线条', type: 'craft', meaning: '行云流水', description: '流畅的剪纸线条' },
      { id: 'jianzhi-2', name: '镂空艺术', type: 'visual', meaning: '虚实相生', description: '镂空与留白的艺术' },
      { id: 'jianzhi-3', name: '红色喜庆', type: 'visual', meaning: '红红火火', description: '红色的喜庆氛围' },
      { id: 'jianzhi-4', name: '吉祥图案', type: 'story', meaning: '吉祥如意', description: '传统吉祥图案' },
    ],
  },
  {
    id: 'miansu',
    name: '天津面塑',
    category: 'art',
    categoryName: '传统艺术',
    founded: '清代',
    description: '天津传统面塑，色彩鲜艳，形象生动',
    story: '天津面塑以面粉为原料，经过特殊工艺处理，可长期保存，色彩鲜艳，形象生动。',
    image: '🎭',
    location: '天津市南开区古文化街',
    honor: ['天津市级非物质文化遗产', '民间传统工艺'],
    elements: [
      { id: 'miansu-1', name: '鲜艳色彩', type: 'visual', meaning: '色彩斑斓', description: '面塑的鲜艳色彩' },
      { id: 'miansu-2', name: '生动形象', type: 'craft', meaning: '栩栩如生', description: '形象生动逼真' },
      { id: 'miansu-3', name: '民间题材', type: 'story', meaning: '民间传说', description: '取材于民间故事' },
      { id: 'miansu-4', name: '手工捏制', type: 'craft', meaning: '匠心独运', description: '手工捏制工艺' },
    ],
  },

  // ============ 商业类（4个）============
  {
    id: 'shengxifu',
    name: '盛锡福',
    category: 'commerce',
    categoryName: '老字号商业',
    founded: '1911年',
    description: '中国帽业老字号，工艺精湛，品质优良',
    story: '创始人刘锡三，以制作帽子闻名，"盛锡福"取"盛"字兴旺，"锡"字为本名，"福"字吉祥之意。',
    image: '🎩',
    location: '天津市和平区和平路',
    honor: ['中华老字号', '国家级非物质文化遗产'],
    elements: [
      { id: 'shengxifu-1', name: '精致帽型', type: 'visual', meaning: '端庄优雅', description: '帽型精致端庄' },
      { id: 'shengxifu-2', name: '传统工艺', type: 'craft', meaning: '匠心传承', description: '传统制帽工艺' },
      { id: 'shengxifu-3', name: '优质材料', type: 'craft', meaning: '品质至上', description: '选材考究' },
      { id: 'shengxifu-4', name: '时代印记', type: 'story', meaning: '历史见证', description: '见证时代变迁' },
    ],
  },
  {
    id: 'laomeihua',
    name: '老美华',
    category: 'commerce',
    categoryName: '老字号商业',
    founded: '1911年',
    description: '天津鞋帽老字号，舒适耐穿，工艺传统',
    story: '老美华以制作传统布鞋闻名，选料考究，工艺传统，是天津老字号代表。',
    image: '👞',
    location: '天津市和平区和平路',
    honor: ['中华老字号', '天津非物质文化遗产'],
    elements: [
      { id: 'laomeihua-1', name: '千层底', type: 'craft', meaning: '脚踏实地', description: '千层底布鞋工艺' },
      { id: 'laomeihua-2', name: '舒适耐穿', type: 'craft', meaning: '品质保证', description: '舒适耐穿的品质' },
      { id: 'laomeihua-3', name: '传统工艺', type: 'craft', meaning: '匠心独运', description: '传统制鞋工艺' },
      { id: 'laomeihua-4', name: '布面绣花', type: 'visual', meaning: '精美雅致', description: '布面绣花装饰' },
    ],
  },
  {
    id: 'qianxiangyi',
    name: '谦祥益',
    category: 'commerce',
    categoryName: '老字号商业',
    founded: '清道光年间',
    description: '天津绸缎老字号，布料精良，花色繁多',
    story: '谦祥益是天津著名的绸缎庄，经营各类丝绸布料，品质优良，深受信赖。',
    image: '🧵',
    location: '天津市红桥区估衣街',
    honor: ['中华老字号', '天津传统商业'],
    elements: [
      { id: 'qianxiangyi-1', name: '丝绸光泽', type: 'visual', meaning: '华贵典雅', description: '丝绸的光泽美' },
      { id: 'qianxiangyi-2', name: '花色繁多', type: 'visual', meaning: '丰富多彩', description: '花色品种繁多' },
      { id: 'qianxiangyi-3', name: '传统纹样', type: 'visual', meaning: '文化传承', description: '传统吉祥纹样' },
      { id: 'qianxiangyi-4', name: '商业诚信', type: 'story', meaning: '诚信经营', description: '百年商业信誉' },
    ],
  },
  {
    id: 'hululu',
    name: '葫芦庐',
    category: 'art',
    categoryName: '传统艺术',
    founded: '清代',
    description: '天津葫芦工艺，雕刻精美，寓意吉祥',
    story: '葫芦庐以葫芦雕刻闻名，在葫芦上雕刻各种图案，工艺精湛，寓意吉祥。',
    image: '🍶',
    location: '天津市南开区古文化街',
    honor: ['天津市级非物质文化遗产', '民间传统工艺'],
    elements: [
      { id: 'hululu-1', name: '葫芦形态', type: 'visual', meaning: '福禄双全', description: '葫芦谐音福禄' },
      { id: 'hululu-2', name: '精细雕刻', type: 'craft', meaning: '精雕细琢', description: '精细的雕刻工艺' },
      { id: 'hululu-3', name: '吉祥图案', type: 'visual', meaning: '吉祥如意', description: '雕刻吉祥图案' },
      { id: 'hululu-4', name: '天然材质', type: 'craft', meaning: '自然天成', description: '天然葫芦材质' },
    ],
  },

  // ============ 历史类（2个）============
  {
    id: 'tianhougong',
    name: '天后宫',
    category: 'history',
    categoryName: '历史古迹',
    founded: '元代',
    description: '中国三大天后宫之一，天津民俗文化的发祥地',
    story: '始建于元代，是中国现存年代最早的天后宫之一，每年春节举办皇会，是天津最重要的民俗活动。',
    image: '⛩️',
    location: '天津市南开区古文化街',
    honor: ['全国重点文物保护单位', '国家4A级旅游景区'],
    elements: [
      { id: 'tianhougong-1', name: '妈祖文化', type: 'story', meaning: '护佑平安', description: '妈祖信仰，保佑出海平安' },
      { id: 'tianhougong-2', name: '皇会巡游', type: 'visual', meaning: '热闹非凡', description: '春节皇会，百戏云集' },
      { id: 'tianhougong-3', name: '古建筑群', type: 'visual', meaning: '历史悠久', description: '元明清古建筑群' },
      { id: 'tianhougong-4', name: '民俗活动', type: 'story', meaning: '传承文化', description: '丰富的民俗文化活动' },
    ],
  },
  {
    id: 'wudadao',
    name: '五大道',
    category: 'history',
    categoryName: '历史街区',
    founded: '清末民初',
    description: '万国建筑博览会，2000多栋小洋楼',
    story: '拥有上世纪二三十年代的2000多栋小洋楼，包括英式、法式、德式、意式等不同风格建筑，被称为"万国建筑博览会"。',
    image: '🏛️',
    location: '天津市和平区五大道',
    honor: ['国家4A级旅游景区', '中国历史文化名街'],
    elements: [
      { id: 'wudadao-1', name: '万国建筑', type: 'visual', meaning: '兼容并蓄', description: '各国建筑风格汇聚' },
      { id: 'wudadao-2', name: '梧桐街道', type: 'visual', meaning: '浪漫优雅', description: '两旁梧桐树，浪漫氛围' },
      { id: 'wudadao-3', name: '名人故居', type: 'story', meaning: '历史名人', description: '众多历史名人故居' },
      { id: 'wudadao-4', name: '马车游览', type: 'visual', meaning: '复古风情', description: '马车游览，复古体验' },
    ],
  },

  // ============ 文化类（2个）============
  {
    id: 'tianjinxs',
    name: '天津相声',
    category: 'culture',
    categoryName: '曲艺文化',
    founded: '清代',
    description: '中国相声重要发源地，幽默风趣，雅俗共赏',
    story: '天津是相声的重要发源地，马三立、侯宝林等相声大师都与天津有深厚渊源，天津观众懂相声、爱相声。',
    image: '🎤',
    location: '天津市各区茶馆',
    honor: ['国家级非物质文化遗产', '中国曲艺之乡'],
    elements: [
      { id: 'tianjinxs-1', name: '说学逗唱', type: 'craft', meaning: '多才多艺', description: '相声四门功课' },
      { id: 'tianjinxs-2', name: '幽默风趣', type: 'story', meaning: '乐观豁达', description: '天津人的幽默' },
      { id: 'tianjinxs-3', name: '茶馆文化', type: 'story', meaning: '市井生活', description: '茶馆听相声的传统' },
      { id: 'tianjinxs-4', name: '方言特色', type: 'story', meaning: '地域文化', description: '天津方言的魅力' },
    ],
  },
  {
    id: 'jingdong',
    name: '京东大鼓',
    category: 'culture',
    categoryName: '曲艺文化',
    founded: '清代',
    description: '天津传统曲艺，唱腔激昂，表演生动',
    story: '京东大鼓是流行于天津、北京一带的曲艺形式，唱腔激昂，表演生动，深受群众喜爱。',
    image: '🥁',
    location: '天津市各区',
    honor: ['国家级非物质文化遗产', '传统曲艺形式'],
    elements: [
      { id: 'jingdong-1', name: '激昂唱腔', type: 'craft', meaning: '激情澎湃', description: '激昂的唱腔特点' },
      { id: 'jingdong-2', name: '大鼓伴奏', type: 'craft', meaning: '节奏鲜明', description: '大鼓的伴奏' },
      { id: 'jingdong-3', name: '传统曲目', type: 'story', meaning: '历史传承', description: '传统曲目内容' },
      { id: 'jingdong-4', name: '表演艺术', type: 'craft', meaning: '声情并茂', description: '生动的表演' },
    ],
  },
];

// 天津方言提示
export const TIANJIN_QUOTES = [
  '嘛钱不钱的，乐呵乐呵得了',
  '借钱吃海货，不算不会过',
  '卫嘴子，京油子，保定府的狗腿子',
  '九河下梢天津卫，三道浮桥两道关',
  '天津卫，天天乐',
  '吃尽穿绝天津卫',
  '当当吃海货，不算不会过',
  '天津人，会说话',
];

// 类别配置
export const CATEGORIES = [
  { id: 'food', name: '美食', color: 'amber', gradient: 'from-amber-400 to-orange-500' },
  { id: 'art', name: '艺术', color: 'rose', gradient: 'from-rose-400 to-red-500' },
  { id: 'history', name: '历史', color: 'emerald', gradient: 'from-emerald-400 to-green-500' },
  { id: 'commerce', name: '商业', color: 'blue', gradient: 'from-blue-400 to-cyan-500' },
  { id: 'culture', name: '文化', color: 'purple', gradient: 'from-purple-400 to-violet-500' },
];

// 获取品牌总数
export const getTotalBrands = () => BRANDS_DATA.length;

// 获取元素总数
export const getTotalElements = () => 
  BRANDS_DATA.reduce((acc, brand) => acc + brand.elements.length, 0);

// 按类别获取品牌
export const getBrandsByCategory = (category: string) => 
  BRANDS_DATA.filter(brand => brand.category === category);

// 获取类别颜色
export const getCategoryColor = (categoryId: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    food: { 
      bg: 'bg-amber-50', 
      text: 'text-amber-700', 
      border: 'border-amber-200',
      gradient: 'from-amber-400 to-orange-500'
    },
    art: { 
      bg: 'bg-rose-50', 
      text: 'text-rose-700', 
      border: 'border-rose-200',
      gradient: 'from-rose-400 to-red-500'
    },
    history: { 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700', 
      border: 'border-emerald-200',
      gradient: 'from-emerald-400 to-green-500'
    },
    commerce: { 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      border: 'border-blue-200',
      gradient: 'from-blue-400 to-cyan-500'
    },
    culture: { 
      bg: 'bg-purple-50', 
      text: 'text-purple-700', 
      border: 'border-purple-200',
      gradient: 'from-purple-400 to-violet-500'
    },
  };
  return colors[categoryId] || colors.food;
};

export default BRANDS_DATA;
