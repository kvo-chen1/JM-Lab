#!/usr/bin/env tsx
/**
 * 将本地文化知识数据同步到数据库
 * 
 * 使用方法:
 * npx tsx scripts/sync-cultural-knowledge-to-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
  console.log('Loading .env.local...');
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading .env...');
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ No .env or .env.local file found!');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 本地文化知识数据（从 CulturalKnowledge.tsx 提取）
const heritageStories = [
  {
    title: '泥人张彩塑：指尖上的天津文化',
    category: '非遗传承',
    excerpt: '探索泥人张彩塑的历史渊源与现代传承，了解这项国家级非物质文化遗产的独特魅力。',
    tags: ['泥人张', '非遗', '彩塑', '天津'],
    content: '泥人张彩塑是天津著名的传统民间艺术，以形神兼备、色彩鲜明、做工精细而闻名，是中国泥塑艺术的代表。泥人张彩塑的历史可以追溯到清代道光年间，创始人张明山被誉为"泥人张"，他的作品生动传神，深受人们喜爱。\n\n张明山出生于1826年，自幼跟随父亲学习泥塑技艺，20岁时便在天津城崭露头角。他善于观察生活，能够在短时间内捕捉人物的神态和特征，将其栩栩如生地塑造出来。传说张明山曾在戏院看戏时，仅凭观察就能在袖口中捏出演员的形象，令观众叹为观止。\n\n泥人张彩塑的制作工艺非常复杂，需要经过选泥、和泥、捏制、晾干、彩绘等多个环节。制作泥人使用的泥土经过特殊处理，具有良好的可塑性和耐久性。彩绘采用天然颜料，色彩鲜艳持久，富有传统韵味。\n\n经过几代人的传承和发展，泥人张彩塑已经形成了独特的艺术风格。作品题材广泛，包括历史人物、民间故事、戏曲角色、生活场景等。泥人张彩塑不仅具有很高的艺术价值，还具有重要的历史和文化价值，是研究中国民间艺术和社会生活的重要资料。\n\n2006年，泥人张彩塑被列入第一批国家级非物质文化遗产名录，得到了国家的重视和保护。如今，泥人张彩塑已经成为天津的文化名片之一，吸引了众多国内外游客前来观赏和学习。同时，泥人张彩塑也在不断创新和发展，结合现代艺术元素，创作出更多符合时代审美的作品，让这一传统艺术在现代社会中焕发出新的生机和活力。\n\n泥人张彩塑的传承和发展，离不开一代代艺人的努力和奉献。他们不仅继承了传统的技艺，还不断探索和创新，让泥人张彩塑在保持传统特色的同时，适应现代社会的需求。相信在未来，泥人张彩塑这一传统艺术将会继续传承下去，为中国的民间艺术宝库增添更多精彩的作品。'
  },
  {
    title: '杨柳青年画：年画中的天津故事',
    category: '民间艺术',
    excerpt: '杨柳青年画是中国四大木版年画之一，以色彩艳丽、题材丰富、构图饱满而著称，具有浓郁的民间艺术特色。',
    tags: ['杨柳青', '年画', '民间艺术', '天津'],
    content: '杨柳青年画起源于明代崇祯年间，至今已有400多年的历史。它以木版套印与手工彩绘相结合的方法制作，题材广泛，包括神话传说、历史故事、民俗风情、花鸟鱼虫等。杨柳青年画的特点是色彩艳丽、线条流畅、造型夸张、寓意吉祥，深受广大群众喜爱，被誉为"中国年画之首"。'
  },
  {
    title: '天津风筝魏：放飞的艺术',
    category: '传统工艺',
    excerpt: '天津风筝魏是中国著名的风筝制作技艺，以造型美观、工艺精湛、放飞平稳而著称，是国家级非物质文化遗产。',
    tags: ['风筝魏', '风筝', '传统工艺', '天津'],
    content: '天津风筝魏由魏元泰于清代光绪年间创立，至今已有100多年的历史。魏元泰制作的风筝种类繁多，造型优美，工艺精湛，放飞平稳，被誉为"风筝之王"。风筝魏的风筝不仅具有很高的艺术价值，还具有很强的实用性，深受国内外风筝爱好者的喜爱。'
  },
  {
    title: '果仁张：天津的美味传说',
    category: '传统美食',
    excerpt: '果仁张是天津著名的传统小吃，以选料精细、制作考究、风味独特而闻名，是天津的老字号之一。',
    tags: ['果仁张', '传统美食', '老字号', '天津'],
    content: '果仁张的历史可以追溯到清代嘉庆年间，创始人张明纯以制作各种美味的果仁食品而闻名。果仁张的果仁选料精细，制作考究，风味独特，深受人们喜爱。经过几代人的传承和发展，果仁张已经成为天津的著名小吃之一，远销国内外。'
  },
  {
    title: '北京同仁堂：350年的中药传奇',
    category: '中药文化',
    excerpt: '创立于1669年的同仁堂，历经八代皇帝，见证了中国中医药文化的传承与发展...',
    tags: ['中药', '清朝', '老字号', '文化传承'],
    content: '北京同仁堂是中国最负盛名的中药老字号，创建于清康熙八年（1669年），创始人乐显扬。三百多年来，同仁堂始终坚守"炮制虽繁必不敢省人工，品味虽贵必不敢减物力"的古训，其产品以"配方独特、选料上乘、工艺精湛、疗效显著"而享誉海内外。同仁堂的发展史与中国近现代史紧密相连，从清朝宫廷御药房到现代上市公司，同仁堂不仅是一家企业，更是中国中医药文化的重要象征和传承者。'
  },
  {
    title: '景德镇瓷器：白如玉、明如镜、薄如纸、声如磬',
    category: '陶瓷文化',
    excerpt: '景德镇制瓷历史可追溯至汉代，宋元时期逐渐发展，明清时期达到鼎盛...',
    tags: ['陶瓷', '手工艺', '非遗', '艺术'],
    content: '景德镇被誉为"世界瓷都"，制瓷历史悠久，技艺精湛。早在汉代，这里就开始了陶瓷生产；唐代，景德镇白瓷已享有盛名；宋代，景德镇陶瓷进入快速发展期，以青白瓷（影青瓷）著称于世；元代，景德镇成功烧制出青花、釉里红等新品种；明代，景德镇成为全国制瓷中心，设立了御窑厂；清代，景德镇制瓷工艺达到历史高峰，创烧了粉彩、珐琅彩等名贵品种。'
  },
  {
    title: '茅台酒：中国白酒的典范',
    category: '酒文化',
    excerpt: '茅台酒以其独特的酱香风格和卓越的品质，被誉为"国酒"，其酿造技艺堪称中华酿酒文化的瑰宝...',
    tags: ['白酒', '酿造', '非遗', '饮食文化'],
    content: '茅台酒产于贵州省仁怀市茅台镇，是中国酱香型白酒的代表。茅台镇独特的地理环境、气候条件和水质，为茅台酒的酿造提供了得天独厚的自然条件。茅台酒的酿造工艺复杂，需要经过制曲、制酒、陈酿、勾兑、包装等多个环节，整个生产周期长达一年，还要经过五年以上的陈酿才能出厂。茅台酒以"酱香突出、幽雅细腻、酒体醇厚、回味悠长、空杯留香持久"的特点著称，其独特的风味和品质使其成为中国白酒的典范，被誉为"国酒"。'
  },
  {
    title: '相声：津门笑声的源与流',
    category: '曲艺文化',
    excerpt: '晚清以来在天津形成的曲艺形式，强调说学逗唱与语言节奏...',
    tags: ['曲艺', '民俗', '相声', '天津'],
    content: '相声在天津形成成熟的表演体系，影响至全国。其文本与表演的结合，成为研究民俗语言与城市文化的重要范式。相声强调说学逗唱与语言节奏，是中国传统文化中的瑰宝，也是天津城市文化的重要组成部分。'
  },
  {
    title: '桂发祥十八街麻花：百年津味的酥与脆',
    category: '传统美食',
    excerpt: '创建于1927年的桂发祥，以十八街麻花闻名，形成独特的传统工艺与口感标准。',
    tags: ['天津', '老字号', '食品', '传统工艺'],
    content: '桂发祥十八街麻花以多褶形态与香酥口感著称，传统工艺讲究和面、擀条、拧花、油炸的每一步火候与比例。其"条条分明、不含水分"的标准来自长期的工艺经验积累，成为津门特色小吃的代表。'
  },
  {
    title: '狗不理包子：皮薄馅大的城市名片',
    category: '传统美食',
    excerpt: '始于清代光绪年间的狗不理，以皮薄馅大、鲜香味美闻名，成为天津餐饮文化符号。',
    tags: ['天津', '美食', '非遗', '餐饮文化'],
    content: '狗不理包子强调醒发与包制的手法，讲究"十八个褶"，汤汁鲜而不腻。其品牌发展见证了天津餐饮业与城市商业的现代化进程。'
  },
  {
    title: '耳朵眼炸糕：外酥里糯的甜香记忆',
    category: '传统美食',
    excerpt: '创建于清光绪年间的耳朵眼炸糕，以糯米与红豆的比例与火候著称，香甜不腻。',
    tags: ['天津', '小吃', '老字号'],
    content: '耳朵眼炸糕的制作工艺重在选材与油温控制，外皮酥脆、内里细糯，甜香层次分明。它承载着天津街巷里的生活味道，是城市小吃文化的典型代表。'
  },
  {
    title: '茶汤李：一碗温润的城市温度',
    category: '传统美食',
    excerpt: '源自清末的茶汤李，以细腻柔滑、甘香回甜的口感，成为老天津的温暖记忆。',
    tags: ['天津', '甜品', '城市记忆'],
    content: '茶汤李的茶汤以米粉与红糖的比例与熬煮火候见长，入口细腻，回甜绵长。它折射出天津城市生活的节奏与人情味，承载代际记忆。'
  },
  {
    title: '老美华：手工鞋履的温度',
    category: '传统工艺',
    excerpt: '始于民国的老美华，以手工缝制技艺与舒适耐穿著称，延续匠作精神。',
    tags: ['天津', '手工', '品牌焕新'],
    content: '老美华鞋履的工艺强调楦型与针脚，讲究脚感与耐用性，体现传统与现代生活的结合。品牌在城市更新中通过联名与设计焕新，重塑老字号的当代价值。'
  },
  {
    title: '利顺德饭店：近代史的见证者',
    category: '历史建筑',
    excerpt: '始建于1863年的利顺德饭店，是近代中国对外交流与现代文明传播的重要窗口。',
    tags: ['天津', '近代史', '建筑'],
    content: '利顺德饭店作为天津近代化的重要地标，承载着城市与国际交流的历史记忆。它见证了从租界到现代城市的变迁，成为研究近代史与城市文化的关键节点。'
  },
  {
    title: '海河：城市记忆的水脉',
    category: '城市文化',
    excerpt: '海河串联了天津的工业、商业与生活空间，记录了城市发展之路。',
    tags: ['海河', '城市更新', '工业遗产', '天津'],
    content: '海河两岸的工业遗产与公共空间更新，反映出城市从生产转向生活与文化的空间叙事。'
  },
  {
    title: '泥人张：形神兼备的民间艺术',
    category: '非遗传承',
    excerpt: '以彩塑语言传达人物神韵，形成了津派美术的独特风格。',
    tags: ['非遗', '美术', '彩塑', '天津'],
    content: '泥人张彩塑在造型与色彩上形成规范体系，成为非遗传承与当代设计创新的重要来源。'
  },
  {
    title: '荣宝斋木版水印：文人美学的传承',
    category: '传统工艺',
    excerpt: '以木版拓印复刻书画精品，凝结传统工艺与文人趣味。',
    tags: ['书画', '印刷', '非遗'],
    content: '荣宝斋木版水印以分版分色的工艺复刻书画作品，讲究墨色层次与宣纸肌理的还原。它承载了近现代书画传播与大众审美普及的历史价值。'
  },
  {
    title: '全聚德烤鸭：京味烟火与匠心火候',
    category: '传统美食',
    excerpt: '挂炉烤制成就酥脆鸭皮与香嫩鸭肉，成为京城餐饮名片。',
    tags: ['美食', '北京', '餐饮文化'],
    content: '全聚德烤鸭以挂炉火候与刀工见长，皮酥肉嫩、肥而不腻。它折射近代城市餐饮业的标准化与品牌化进程。'
  },
  {
    title: '剪纸：红色的民间记忆',
    category: '民间艺术',
    excerpt: '以一刀一剪呈现民间审美与生活祝愿的图像艺术。',
    tags: ['民俗', '手工', '非遗'],
    content: '剪纸重在构图的虚实与刀法的节奏，广泛用于节庆与礼俗。它是理解民间图像语言与社会情感表达的重要窗口。'
  },
  {
    title: '扬州漆器：光泽与时间的工艺',
    category: '传统工艺',
    excerpt: '以髹饰工艺显现温润光泽，体现江南工艺的细腻美学。',
    tags: ['工艺', '漆器', '江苏'],
    content: '扬州漆器以髹、磨、描的工序见长，漆膜细致而耐久。在现代设计中通过纹样与配色焕新传统。'
  },
  {
    title: '周村烧饼：薄脆之间的历史温度',
    category: '传统美食',
    excerpt: '以薄、香、脆著称的老字号点心，见证商贾繁华与市井生活。',
    tags: ['美食', '山东', '老字号'],
    content: '周村烧饼讲究醒面、擀薄与火候控制，香酥不腻。它是齐鲁地区饮食文化与市镇经济记忆的载体。'
  },
  {
    title: '景泰蓝：铜与火的色彩艺术',
    category: '传统工艺',
    excerpt: '掐丝、烧蓝、镶嵌的综合工艺，呈现金属与釉彩的和鸣。',
    tags: ['工艺', '金属', '非遗'],
    content: '景泰蓝以铜胎为骨、掐丝成线、填釉着色，历经多次烧制与打磨成型。其色彩语言与纹样体系体现宫廷美学的秩序与华彩。'
  },
  {
    title: '旗袍：东方曲线与近代都市美学',
    category: '服饰文化',
    excerpt: '在上海近代都市文化中形成风格，融合传统与现代的服饰语言。',
    tags: ['服饰', '上海', '近代史'],
    content: '旗袍以立领、盘扣与收腰线条体现东方审美与身体叙事。它连接了女性身份、都市生活与时尚产业的多重维度。'
  },
  {
    title: '徽墨：文房雅器的黑与光',
    category: '文房四宝',
    excerpt: '以油烟与胶为材，经制、雕、磨等工序，呈现细腻墨性与雕刻美学。',
    tags: ['文房', '工艺', '书写系统'],
    content: '徽墨讲究原料比例与炼制火候，雕刻图案体现文人意趣与吉祥寓意。其与宣纸、毛笔、砚台共同构成书写系统的工艺基座。'
  },
  {
    title: '蜀锦：经纬之间的繁复之美',
    category: '传统工艺',
    excerpt: '以彩纬显花的织造工艺，呈现华美纹样与层次结构。',
    tags: ['织造', '纹样', '非遗'],
    content: '蜀锦在组织结构与纹样布局上高度复杂，形成东方织造的代表体系。现代设计中常以其色彩与图形语言进行跨界再设计。'
  },
  {
    title: '潍坊风筝：骨与纸的空气造型',
    category: '民间艺术',
    excerpt: '以竹骨为骨、宣纸为肤，结合彩绘形成可飞行的造型艺术。',
    tags: ['民俗', '造型', '公共文化'],
    content: '风筝结构讲究受力与配重，绘饰体现地域风格。在公共艺术与品牌活动中常见文化视觉化的应用。'
  },
  {
    title: '宣纸：纤维网络的书写载体',
    category: '文房四宝',
    excerpt: '以青檀与稻草为核心原料，形成强韧而吸墨的书写媒介。',
    tags: ['材料', '书画', '工艺'],
    content: '宣纸的吸墨与抗老化性能使其成为书画的经典载体。现代应用包括艺术复制、装帧设计与材质实验。'
  },
  {
    title: '京味小吃体系：口味与技法的城市谱系',
    category: '传统美食',
    excerpt: '以炒、炸、蒸多种技法构成风味结构，形成市井美食的文化谱系。',
    tags: ['美食', '城市文化', '品牌'],
    content: '通过技法、器具与配方的标准化，形成可复制的城市味觉记忆。品牌焕新案例中常以包装与故事化表达连接年轻消费。'
  },
  {
    title: '景德镇青花：蓝与白的视觉秩序',
    category: '陶瓷文化',
    excerpt: '以钴料呈色与釉下发色形成典型的青花视觉体系。',
    tags: ['陶瓷', '配色', '纹样'],
    content: '青花瓷的色阶与笔触影响纹样表达的层次。当代衍生产品多以抽象化纹样实现现代场景适配。'
  },
  {
    title: '皮影戏：光与影的叙事装置',
    category: '民间艺术',
    excerpt: '以灯、幕、人、偶构成的叙事体系，表现动作与情感。',
    tags: ['戏曲', '叙事', '设计借鉴'],
    content: '皮影的造型语汇可迁移到品牌角色与动画设计中。其关节运动的平面化方法适合简洁叙事与节奏控制。'
  },
  {
    title: '苏帮菜：火候与刀工的雅致风味',
    category: '传统美食',
    excerpt: '以清鲜平和的风味与精细刀工著称，呈现江南饮食美学。',
    tags: ['饮食文化', '江南', '美学'],
    content: '苏帮菜重在食材本味与火候控制，器皿与摆盘体现审美追求。在品牌传播中常以视觉化呈现"清雅平衡"的风格。'
  },
  {
    title: '德化白瓷：温润如玉的器物语言',
    category: '陶瓷文化',
    excerpt: '以白釉细腻与造型圆融著称，呈现"玉质"般的光泽与肌理。',
    tags: ['陶瓷', '福建', '器物美学'],
    content: '德化白瓷强调胎釉匹配与温控曲线，人物与器物均体现柔和气质。现代设计中以其"白"的审美延展到空间与品牌视觉。'
  },
  {
    title: '张小泉：刀工与钢性的一体化标准',
    category: '传统工艺',
    excerpt: '以锻造与热处理形成稳定钢性，建立现代刀剪标准。',
    tags: ['金工', '品牌', '生活方式'],
    content: '从材质到工艺流程的标准化，提升刀剪的使用寿命与安全性。品牌更新以工艺叙事与生活方式拍摄强化信任。'
  },
  {
    title: '潮绣：潮汕地域的立体绣艺',
    category: '传统工艺',
    excerpt: '以金线与立体效果见长，呈现华美庄重的视觉表达。',
    tags: ['刺绣', '广东', '礼仪'],
    content: '潮绣常用金银线与垫绣技术形成起伏层次，适合礼仪与陈设场景。现代应用可转化为高端服饰与饰品的工艺亮点。'
  },
  {
    title: '宜兴紫砂：泥与火的壶学体系',
    category: '传统工艺',
    excerpt: '以泥料配比与成型技法构筑茶壶功能与美学的统一。',
    tags: ['陶瓷', '茶文化', '功能美学'],
    content: '紫砂壶讲究泥性、气孔与壁厚的平衡，成型与烧成决定出汤与保温。传播中以"工与用"的叙事连接专业与大众。'
  },
  {
    title: '雕版印刷：文字与木版的知识生产',
    category: '传统工艺',
    excerpt: '以手工刻版与印刷传递知识与审美，形成出版史的重要阶段。',
    tags: ['出版', '木工', '版画'],
    content: '雕版印刷强调排版与刻工配合，墨色与纸材影响阅读体验。现代延展包括艺术版画与手工出版的复兴。'
  },
  {
    title: '苗族银饰：锻敲与纹样的身体叙事',
    category: '民族文化',
    excerpt: '以锻打、錾刻与焊接形成复杂纹样，承载族群身份与审美。',
    tags: ['金工', '民族文化', '饰品'],
    content: '银饰的构件组合体现工艺体系，纹样语言传递文化记忆。在时尚与博物馆叙事中具有强烈的视觉辨识度。'
  },
  {
    title: '汴绣：工笔绣法的精雅',
    category: '传统工艺',
    excerpt: '以工笔式线描与设色形成精致画面，强调细节控制。',
    tags: ['刺绣', '河南', '工笔'],
    content: '汴绣借鉴工笔绘画的线与色方法，针法细密、层次丰富。现代跨界多见于文创与礼盒的高雅表达。'
  },
  {
    title: '剪纸：正负形的民间叙事',
    category: '民间艺术',
    excerpt: '以剪映与留白塑造叙事节奏，适合节庆与装饰。',
    tags: ['民俗', '构图', '节庆'],
    content: '剪纸的构图强调正负形的平衡，图案常带吉祥寓意。媒介转化容易，适合教育与轻量化设计。'
  },
  {
    title: '雕漆：髹饰之上的浮雕工艺',
    category: '传统工艺',
    excerpt: '以多层漆堆积后雕刻成形，呈现厚重与精致的统一。',
    tags: ['漆艺', '器物', '团花'],
    content: '雕漆需要耐心与材料控制，适合器物与陈设的高端表达。纹样语言常见缠枝与团花体系。'
  },
  {
    title: '绍兴黄酒：时间与陶的风味载体',
    category: '酒文化',
    excerpt: '以陶坛贮存与发酵周期形成独有的香气与层次。',
    tags: ['饮食文化', '酿造', '浙江'],
    content: '黄酒的酿造强调时间与温度控制，陶坛微孔影响风味演化。品牌叙事多以家族与地域记忆深化情感连接。'
  },
  {
    title: '黎族织锦：经纬之间的身份纹样',
    category: '民族文化',
    excerpt: '以经纬显花形成部落纹样，承载族群记忆与美学。',
    tags: ['织造', '民族文化', '纹样'],
    content: '纹样语汇强调身份与故事，织造技法体现地域性。适合服饰与空间软装的文化化应用。'
  },
  {
    title: '匠作窗棂：几何秩序与光影',
    category: '传统建筑',
    excerpt: '以木构几何形成秩序美感，塑造空间的光影语言。',
    tags: ['建筑', '木作', '栅格'],
    content: '窗棂的比例与榫卯影响整体视觉与耐久。在品牌与界面设计中可转化为栅格系统的灵感。'
  }
];

// 生成图片prompt
function generatePrompt(story: typeof heritageStories[0]): string {
  const { title, category, tags } = story;
  
  const keywords = tags?.join(', ') || '';
  const shortTitle = title?.split('：')[0] || title;
  
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
  
  const prompt = `${shortTitle}, ${categoryStyle}${keywords ? ', ' + keywords : ''}, high quality, detailed, cultural heritage, artistic, professional photography style`.trim();
  
  return prompt;
}

// 主函数
async function main() {
  console.log('🚀 Syncing Cultural Knowledge to Database');
  console.log('=========================================\n');
  
  let success = 0;
  let failed = 0;
  
  for (const story of heritageStories) {
    try {
      // 检查是否已存在
      const { data: existing } = await supabase
        .from('cultural_knowledge')
        .select('id')
        .eq('title', story.title)
        .single();
      
      if (existing) {
        console.log(`⏭️  Skipped (exists): ${story.title}`);
        continue;
      }
      
      // 生成prompt
      const prompt = generatePrompt(story);
      
      // 插入数据
      const { error } = await supabase
        .from('cultural_knowledge')
        .insert({
          title: story.title,
          content: story.content,
          category: story.category,
          tags: story.tags,
          excerpt: story.excerpt,
          image_prompt: prompt,
          image_generation_status: 'pending',
          views: 0,
          likes: 0
        });
      
      if (error) {
        console.error(`❌ Failed: ${story.title} - ${error.message}`);
        failed++;
      } else {
        console.log(`✅ Inserted: ${story.title}`);
        success++;
      }
    } catch (error) {
      console.error(`❌ Error: ${story.title} - ${error}`);
      failed++;
    }
  }
  
  console.log('\n=========================================');
  console.log('📊 Sync Summary');
  console.log('=========================================');
  console.log(`Total: ${heritageStories.length}`);
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${heritageStories.length - success - failed}`);
}

main();
