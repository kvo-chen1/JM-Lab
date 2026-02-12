export interface Brand {
  id: string
  name: string
  story: string
  image: string
}

const mkImg = (prompt: string, size: 'landscape_16_9' | 'square' = 'landscape_16_9') =>
  `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`

export const BRANDS: Brand[] = [
  {
    id: 'guifaxiang',
    name: '桂发祥十八街麻花',
    story:
      '源自清末的天津风味代表，以多褶形态与香酥口感著称，沿袭手作工艺与津味记忆，承载城市味道与技艺传承，百年老字号与年轻创意不断融合。',
    image: mkImg('SDXL, Tianjin Guifaxiang Shibajie mahua, traditional Chinese snack photography, red and gold accents, studio lighting, high detail, cultural motif'),
  },
  {
    id: 'erduoyan',
    name: '耳朵眼炸糕',
    story:
      '以糯米与红豆为主料，外酥里糯、香甜不腻，街巷烟火与市井风味的象征，凝聚天津人情味与老字号精神，口碑与故事历久弥新。',
    image: mkImg('SDXL, Tianjin Erduoyan zha gao, traditional snack, street food vibe, warm tone, cultural atmosphere, high detail'),
  },
  {
    id: 'guorenzhang',
    name: '果仁张',
    story:
      '精选坚果与传统技法相结合，香酥适口、回味悠长，承载节令习俗与团圆记忆，老味道焕新表达，成为伴手礼与城市名片。',
    image: mkImg('SDXL, Tianjin Guoren Zhang nuts snack, product shot, festive red packaging, cultural pattern, studio lighting'),
  },
  {
    id: 'nirenzhang',
    name: '泥人张',
    story:
      '以细腻彩塑著称，人物生动传神，艺术与民俗交融的代表，见证天津手艺与美学传承，滋养城市文化与现代创意表达。',
    image: mkImg('SDXL, Tianjin Niren Zhang clay figurines, museum display, warm lighting, traditional art, cultural heritage'),
  },
  // 中文注释：以下为新增30个老字号，覆盖天津与全国知名品牌，便于联名创意
  { id: 'goubuli', name: '狗不理包子', story: '天津传统包子名店，褶形饱满、馅香协调，老字号美味与城市记忆的象征，适合与潮流文化联名焕新表达。', image: mkImg('SDXL, Tianjin Goubuli baozi, traditional steamed bun, bamboo steamer, warm restaurant ambiance, cultural motif') },
  { id: 'laomeihua', name: '老美华鞋店', story: '始创于天津的百年鞋履品牌，手工技艺与舒适体验并重，适合与国潮服饰进行联名合作。', image: mkImg('SDXL, Laomeihua traditional shoes, vintage store interior, warm tone, craftsmanship detail') },
  { id: 'seagullwatch', name: '海鸥表', story: '天津制造的经典机械表品牌，以机芯工艺著称，适合与城市主题与工业美学联名。', image: mkImg('SDXL, Tianjin Seagull mechanical watch, macro shot of movement, industrial aesthetic, high detail') },
  { id: 'qianxiangyi', name: '谦祥益布店', story: '天津老字号布店，传统面料与现代设计结合，适合与纺织纹样、服装联名打造文化系列。', image: mkImg('SDXL, Tianjin Qianxiangyi fabric store, traditional textile patterns, soft lighting, cultural motif') },
  { id: 'longshunyu', name: '隆顺榆酱园', story: '天津老字号酱园，酱香浓郁、风味地道，适合与餐饮品牌联名推出限定酱料与包装设计。', image: mkImg('SDXL, Tianjin Longshunyu sauce shop, traditional jars, rustic shelf, warm lighting') },
  { id: 'hongshunde', name: '鸿顺德酱菜', story: '以酱菜闻名的天津老字号，口感鲜爽，适合与家常餐饮、礼盒文化联名。', image: mkImg('SDXL, Tianjin Hongshunde pickles, glass jars, wooden table, homestyle vibe, high detail') },
  { id: 'tongrentang', name: '同仁堂', story: '中华老字号中药品牌，药食同源与养生理念深入人心，适合与健康生活方式联名。', image: mkImg('SDXL, Tongrentang traditional Chinese medicine, apothecary jars, wooden cabinet, warm lighting, cultural elements') },
  { id: 'daoxiangcun', name: '稻香村', story: '糕点名家，节令点心与礼盒文化代表，适合与节日主题、非遗纹样联名。', image: mkImg('SDXL, Daoxiangcun pastries, festive packaging, red and gold accents, studio lighting') },
  { id: 'quanjude', name: '全聚德', story: '烤鸭名店，京味美食文化符号，适合与城市美食地图及文旅联名。', image: mkImg('SDXL, Quanjude Peking duck, restaurant plating, warm tone, cultural atmosphere') },
  { id: 'liubiju', name: '六必居', story: '酱菜与调味品牌，古法酿造与现代口味结合，适合与家宴主题联名。', image: mkImg('SDXL, Liubiju sauce and pickles, traditional jars, heritage store, warm lighting') },
  { id: 'wangzhihe', name: '王致和', story: '以腐乳闻名的老字号，醇香浓郁，适合与家常料理与创意包装联名。', image: mkImg('SDXL, Wangzhihe fermented tofu, product shot, rustic wooden background, high detail') },
  { id: 'laofengxiang', name: '老凤祥', story: '百年珠宝品牌，经典工艺与现代设计融合，适合与文化符号与首饰联名。', image: mkImg('SDXL, Laofengxiang jewelry, close-up, gold and jade, elegant display, soft lighting') },
  { id: 'huqingyutang', name: '胡庆余堂', story: '杭州老字号中药品牌，讲究选材与炮制工艺，适合与养生文化联名。', image: mkImg('SDXL, Huqingyutang TCM pharmacy, wooden drawers, herb jars, warm tone') },
  { id: 'pangaoshou', name: '潘高寿', story: '岭南传统药业品牌，止咳润喉类产品知名，适合与健康生活联名。', image: mkImg('SDXL, Pangaoshou traditional medicine, product lineup, vintage packaging, cultural background') },
  { id: 'chenliji', name: '陈李济', story: '广府中药老字号，工艺严谨、经典方剂传承，适合与岭南文化联名。', image: mkImg('SDXL, Chenliji pharmacy, classic apothecary, wooden cabinets, cultural elements') },
  { id: 'guangzhoujiujia', name: '广州酒家', story: '广式餐饮老字号，经典点心与年味文化代表，适合与节庆礼盒联名。', image: mkImg('SDXL, Guangzhou Restaurant dim sum, festive atmosphere, red lanterns, high detail') },
  { id: 'lianxianglou', name: '莲香楼', story: '广府糕点老字号，传统饼食与礼盒美学结合，适合与节令联名。', image: mkImg('SDXL, Lianxianglou pastries, floral packaging, warm tone, studio lighting') },
  { id: 'zhangxiaoqian', name: '张小泉', story: '百年刀剪品牌，锋利耐用与工艺美学结合，适合与工艺设计联名。', image: mkImg('SDXL, Zhangxiaoquan knives and scissors, product shot, craftsmanship detail, industrial background') },
  { id: 'yingxiong', name: '英雄钢笔', story: '书写工具老品牌，经典外形与书写质感，适合与校园文化与文创联名。', image: mkImg('SDXL, Hero fountain pen, macro nib shot, vintage desk, warm lighting') },
  { id: 'zhonghuapencil', name: '中华铅笔', story: '经典书写品牌，课堂记忆与国民书写符号，适合与教育主题联名。', image: mkImg('SDXL, Zhonghua pencil, stationery flatlay, retro classroom vibe, soft light') },
  { id: 'huili', name: '回力', story: '国民运动鞋老品牌，简约复古与潮流回归，适合与街头文化联名。', image: mkImg('SDXL, Huili sneakers, streetwear style, urban background, dynamic composition') },
  { id: 'tsingtao', name: '青岛啤酒', story: '百年啤酒品牌，清爽口感与城市记忆结合，适合与音乐节与夏日主题联名。', image: mkImg('SDXL, Tsingtao beer, bottle and glass, summer vibe, condensation, high detail') },
  { id: 'dongaejiao', name: '东阿阿胶', story: '滋补养生品牌，传统工艺与现代健康理念结合，适合与养生生活方式联名。', image: mkImg('SDXL, Dong-e Ejiao product, premium packaging, warm tone, health concept') },
  { id: 'fenjiu', name: '汾酒', story: '清香型白酒代表，历史悠久，适合与文化典藏与庆典主题联名。', image: mkImg('SDXL, Fenjiu Chinese liquor, elegant bottle, calligraphy backdrop, cultural atmosphere') },
  { id: 'xifeng', name: '西凤酒', story: '凤香型白酒代表，历史传承与地域文化，适合与礼遇主题联名。', image: mkImg('SDXL, Xifeng liquor, phoenix motif, red and gold, ceremonial display') },
  { id: 'gujinggong', name: '古井贡酒', story: '名酒老字号，典雅包装与礼仪文化，适合与商务礼赠联名。', image: mkImg('SDXL, Gujinggong liquor, premium gift box, calligraphy, warm lighting') },
  { id: 'luzhoulaojiao', name: '泸州老窖', story: '浓香型白酒代表，酿造工艺与文化传承，适合与节庆主题联名。', image: mkImg('SDXL, Luzhou Laojiao liquor, cellar imagery, warm tone, cultural elements') },
  { id: 'langjiu', name: '郎酒', story: '浓香型与酱香型兼具的老品牌，包装设计与品牌叙事亮眼，适合与艺术跨界联名。', image: mkImg('SDXL, Langjiu liquor, red-blue bottle, modern art backdrop, high detail') },
  { id: 'dezhoupaji', name: '德州扒鸡', story: '传统卤味名品，口感鲜香，适合与城市美食文化联名。', image: mkImg('SDXL, Dezhou braised chicken, product shot, rustic table, warm lighting') },
  // 中文注释：继续新增30个老字号，覆盖餐饮、酒类、茶叶、工艺与日用品牌
  { id: 'ruifuxiang', name: '瑞蚨祥', story: '京城布庄老字号，丝绸与锦缎见长，适合联合非遗纹样与服装艺术开展联名系列。', image: mkImg('SDXL, Ruifuxiang silk and brocade, textile patterns display, elegant store interior, soft warm lighting') },
  { id: 'zhangyiyuan', name: '张一元', story: '北京茶庄老字号，讲究选茶与拼配，适合与茶文化空间与文创联名。', image: mkImg('SDXL, Zhangyiyuan tea house, tea tins and wooden shelves, cultural ambiance, warm tone') },
  { id: 'wuyutai', name: '吴裕泰', story: '北京传统茶品牌，清雅口感与礼盒文化，适合与节令主题联名。', image: mkImg('SDXL, Wuyutai tea, elegant packaging, green tea motif, studio lighting') },
  { id: 'donglaishun', name: '东来顺', story: '涮羊肉名店，清真饮食文化代表，适合与美食地图与文旅联名。', image: mkImg('SDXL, Donglaishun hotpot, copper pot lamb slices, restaurant ambiance, warm lighting') },
  { id: 'tongheju', name: '同和居', story: '北京鲁菜老字号，菜品经典，适合与城市礼遇与餐饮联名。', image: mkImg('SDXL, Tongheju restaurant dishes, classic plating, heritage interior, warm tone') },
  { id: 'shaguoju', name: '砂锅居', story: '以砂锅菜肴闻名的老字号，朴素风味与京味烟火，适合与家常文化联名。', image: mkImg('SDXL, Shaguoju claypot cuisine, rustic table, warm lighting, homestyle vibe') },
  { id: 'xinghualou', name: '杏花楼', story: '沪上糕点老字号，海派礼盒美学代表，适合与节庆联名打造限定。', image: mkImg('SDXL, Xinghualou pastries, elegant packaging, floral motif, studio lighting') },
  { id: 'qiaojiashan', name: '乔家栅', story: '上海传统糕点与点心品牌，适合与怀旧风格联名。', image: mkImg('SDXL, Qiaojiashan pastries, nostalgic packaging, warm tone, cultural elements') },
  { id: 'guanshengyuan', name: '冠生园（大白兔）', story: '老牌食品企业，经典“大白兔”奶糖文化符号，适合与潮玩与跨界艺术联名。', image: mkImg('SDXL, Guanshengyuan White Rabbit candy, retro packaging, playful design, studio lighting') },
  { id: 'wangmazi', name: '王麻子', story: '刀剪老字号，锋利耐用与工艺纹样结合，适合与厨房文化联名。', image: mkImg('SDXL, Wangmazi knives, craftsmanship close-up, industrial background, high detail') },
  { id: 'feiyue', name: '飞跃', story: '经典帆布鞋品牌，复古潮流回归，适合与街头文化联名。', image: mkImg('SDXL, Feiyue canvas sneakers, street style, urban scene, dynamic composition') },
  { id: 'shanghaiwatch', name: '上海牌手表', story: '机械表老品牌，海派工业美学代表，适合与城市意象联名。', image: mkImg('SDXL, Shanghai brand mechanical watch, macro movement, industrial aesthetic, high detail') },
  { id: 'fenghuangbike', name: '凤凰牌自行车', story: '国民经典出行品牌，复古交通与生活记忆，适合与城市骑行文化联名。', image: mkImg('SDXL, Phoenix bicycle, retro city street, warm tone, nostalgic vibe') },
  { id: 'yongjiubike', name: '永久牌自行车', story: '老品牌自行车，坚固耐用，适合与城市通勤与复古生活方式联名。', image: mkImg('SDXL, Yongjiu bicycle, vintage style, urban background, soft warm light') },
  { id: 'yanjingbeer', name: '燕京啤酒', story: '啤酒老品牌，清爽口感与城市夏日记忆，适合与音乐与体育联名。', image: mkImg('SDXL, Yanjing beer, bottle with condensation, summer vibe, high detail') },
  { id: 'xuehuabeer', name: '雪花啤酒', story: '经典啤酒品牌，畅快口感，适合与户外运动与社交场景联名。', image: mkImg('SDXL, Snow Beer (Xuehua), frosty bottle, mountain motif, cool tone') },
  { id: 'guyuelongshan', name: '古越龙山', story: '黄酒老品牌，绍兴文化与礼仪场景代表，适合与书法与节令联名。', image: mkImg('SDXL, Guyuelongshan Shaoxing huangjiu, elegant bottle, calligraphy backdrop, warm lighting') },
  { id: 'kuaijishan', name: '会稽山', story: '绍兴黄酒老字号，典雅礼盒与文化意象，适合与节庆联名。', image: mkImg('SDXL, Kuaijishan huangjiu, premium gift box, cultural elements, warm tone') },
  { id: 'maotai', name: '茅台', story: '酱香型白酒代表，国宴文化与收藏属性，适合与艺术跨界与礼遇主题联名。', image: mkImg('SDXL, Moutai Chinese liquor, premium bottle, ceremonial display, red and gold accents') },
  { id: 'wuliangye', name: '五粮液', story: '浓香型白酒代表，典雅包装与品牌故事，适合与商务礼赠联名。', image: mkImg('SDXL, Wuliangye liquor, elegant bottle, premium packaging, warm light') },
  { id: 'jiannanchun', name: '剑南春', story: '川酒老品牌，历史底蕴丰富，适合与文化典藏联名。', image: mkImg('SDXL, Jiannanchun liquor, cultural backdrop, calligraphy elements, warm tone') },
  { id: 'yanghe', name: '洋河', story: '苏酒老品牌，柔顺口感与蓝色瓶身识别度高，适合与现代设计联名。', image: mkImg('SDXL, Yanghe liquor, blue bottle, modern design backdrop, soft lighting') },
  { id: 'changyuwine', name: '张裕葡萄酒', story: '葡萄酒老品牌，近代酿酒工业代表，适合与城市夜生活与餐酒文化联名。', image: mkImg('SDXL, Changyu wine, wine glass and bottle, warm restaurant ambiance, high detail') },
  { id: 'guangyuyuan', name: '广誉远', story: '中药老字号，定坤丹等经典方剂知名，适合与养生文化联名。', image: mkImg('SDXL, Guangyuyuan pharmacy, classic drawers, herb jars, warm light') },
  { id: 'leiyunshang', name: '雷允上', story: '苏州中药老字号，讲究炮制与选材，适合与健康生活方式联名。', image: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800&q=80' },
  { id: 'hengdeli', name: '亨得利', story: '钟表眼镜老字号，服务与专业并重，适合与时间主题联名。', image: mkImg('SDXL, Hengdeli watch and optical store, elegant interior, warm light') },
  { id: 'pechoin', name: '百雀羚', story: '国货护肤老品牌，复古包装与东方植物配方，适合与美妆与文创联名。', image: mkImg('SDXL, Pechoin skincare, retro packaging, floral botanical elements, soft lighting') },
  { id: 'shuijingfang', name: '水井坊', story: '川酒老品牌，考古与文化叙事结合，适合与典藏主题联名。', image: mkImg('SDXL, Shuijingfang liquor, archaeological motif, premium packaging, warm tone') },
  { id: 'yongshengpen', name: '永生钢笔', story: '经典钢笔老品牌，书写质感与复古设计，适合与校园文化联名。', image: mkImg('SDXL, Yongsheng fountain pen, macro nib, vintage desk, warm light') },
  { id: 'hudiepai', name: '蝴蝶牌缝纫机', story: '传统缝纫机械老品牌，工艺与家政记忆，适合与手作文化联名。', image: mkImg('SDXL, Butterfly sewing machine, vintage home setting, warm tone, craftsmanship detail') },
  
  // 天津老字号品牌扩展 - 经核实真实存在的津门老字号
  { id: 'wanziqianhong', name: '万紫千红', story: '天津渤海轻工集团旗下品牌，以润肤脂等护肤品著称，是天津人记忆中的经典国货。', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80' },
  { id: 'yumeijing', name: '郁美净', story: '天津知名护肤品牌，以儿童护肤品起家，是天津本土成长起来的老字号品牌。', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80' },
  { id: 'haihe', name: '海河牛奶', story: '天津本土乳制品品牌，陪伴几代天津人成长，是天津市民熟悉的本地牛奶品牌。', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80' },
  { id: 'xianghe', name: '祥禾饽饽铺', story: '天津传统糕点老字号，以中式传统点心闻名，是天津非物质文化遗产代表性项目。', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80' },
  { id: 'daqiaodao', name: '大桥道', story: '天津知名糕点食品企业，以月饼、汤圆等传统节日食品著称，深受天津市民喜爱。', image: 'https://images.unsplash.com/photo-1631206753348-db44968fd440?w=800&q=80' },
  { id: 'fengzhengwei', name: '风筝魏', story: '天津著名风筝制作世家，由魏元泰创始，风筝做工精细，曾在巴拿马万国博览会上获奖。', image: 'https://images.unsplash.com/photo-1534531173927-aeb928d54385?w=800&q=80' },
  { id: 'yangliuqing', name: '杨柳青年画', story: '中国四大木版年画之一，始于明代，以色彩艳丽、构图饱满著称，是国家级非物质文化遗产。', image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80' },
  { id: 'zhengchenghao', name: '正兴德', story: '天津传统茶叶老字号，以茉莉花茶著称，是天津人喜爱的本地茶庄品牌。', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80' },
  { id: 'yuanlong', name: '元隆', story: '天津传统绸布业老字号，历史悠久，是天津传统商业文化的代表之一。', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80' },
  { id: 'tongchengxiang', name: '同升祥', story: '天津传统鞋业老字号，以布鞋和皮鞋著称，是天津传统鞋履文化的代表。', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80' },
  { id: 'yizhoucha', name: '一枝春', story: '天津传统茶叶品牌，以优质茶叶和拼配技艺闻名，是天津茶文化的代表。', image: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=800&q=80' },
]

// 天津老字号品牌分类 - 经核实真实存在的津门老字号
export const TIANJIN_BRANDS = BRANDS.filter(brand =>
  ['guifaxiang', 'erduoyan', 'guorenzhang', 'nirenzhang', 'goubuli', 'laomeihua', 'seagullwatch',
   'qianxiangyi', 'longshunyu', 'hongshunde', 'wanziqianhong', 'yumeijing', 'haihe', 'xianghe',
   'daqiaodao', 'fengzhengwei', 'yangliuqing', 'zhengchenghao', 'yuanlong', 'tongchengxiang',
   'yizhoucha'].includes(brand.id)
)

// 按类别分类的天津品牌
export const TIANJIN_BRANDS_BY_CATEGORY = {
  food: TIANJIN_BRANDS.filter(b => ['guifaxiang', 'erduoyan', 'guorenzhang', 'goubuli', 'longshunyu', 'hongshunde', 'xianghe', 'daqiaodao'].includes(b.id)),
  craft: TIANJIN_BRANDS.filter(b => ['nirenzhang', 'fengzhengwei', 'yangliuqing'].includes(b.id)),
  textile: TIANJIN_BRANDS.filter(b => ['laomeihua', 'qianxiangyi', 'yuanlong'].includes(b.id)),
  stationery: TIANJIN_BRANDS.filter(b => ['yingxiong', 'zhonghuapencil', 'yongshengpen'].includes(b.id)),
  timepiece: TIANJIN_BRANDS.filter(b => ['seagullwatch'].includes(b.id)),
  tea: TIANJIN_BRANDS.filter(b => ['yizhoucha', 'zhengchenghao'].includes(b.id)),
  skincare: TIANJIN_BRANDS.filter(b => ['wanziqianhong', 'yumeijing'].includes(b.id)),
  dairy: TIANJIN_BRANDS.filter(b => ['haihe'].includes(b.id)),
  footwear: TIANJIN_BRANDS.filter(b => ['tongchengxiang'].includes(b.id)),
}

export default BRANDS
