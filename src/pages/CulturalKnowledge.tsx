import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import GradientHero from '@/components/GradientHero';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { mockWorks } from '@/mock/works';
import TianjinCreativeActivities from '@/components/TianjinCreativeActivities';

// 示例数据：非遗故事
const heritageStories = [
  {
    id: 'story-001',
    title: '泥人张彩塑：指尖上的天津文化',
    category: '非遗传承',
    excerpt: '探索泥人张彩塑的历史渊源与现代传承，了解这项国家级非物质文化遗产的独特魅力。',
    tags: ['泥人张', '非遗', '彩塑', '天津'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20clay%20sculpture%20workshop%20Tianjin',
    content: '泥人张彩塑是天津著名的传统民间艺术，以形神兼备、色彩鲜明、做工精细而闻名，是中国泥塑艺术的代表。泥人张彩塑的历史可以追溯到清代道光年间，创始人张明山被誉为"泥人张"，他的作品生动传神，深受人们喜爱。\n\n张明山出生于1826年，自幼跟随父亲学习泥塑技艺，20岁时便在天津城崭露头角。他善于观察生活，能够在短时间内捕捉人物的神态和特征，将其栩栩如生地塑造出来。传说张明山曾在戏院看戏时，仅凭观察就能在袖口中捏出演员的形象，令观众叹为观止。\n\n泥人张彩塑的制作工艺非常复杂，需要经过选泥、和泥、捏制、晾干、彩绘等多个环节。制作泥人使用的泥土经过特殊处理，具有良好的可塑性和耐久性。彩绘采用天然颜料，色彩鲜艳持久，富有传统韵味。\n\n经过几代人的传承和发展，泥人张彩塑已经形成了独特的艺术风格。作品题材广泛，包括历史人物、民间故事、戏曲角色、生活场景等。泥人张彩塑不仅具有很高的艺术价值，还具有重要的历史和文化价值，是研究中国民间艺术和社会生活的重要资料。\n\n2006年，泥人张彩塑被列入第一批国家级非物质文化遗产名录，得到了国家的重视和保护。如今，泥人张彩塑已经成为天津的文化名片之一，吸引了众多国内外游客前来观赏和学习。同时，泥人张彩塑也在不断创新和发展，结合现代艺术元素，创作出更多符合时代审美的作品，让这一传统艺术在现代社会中焕发出新的生机和活力。\n\n泥人张彩塑的传承和发展，离不开一代代艺人的努力和奉献。他们不仅继承了传统的技艺，还不断探索和创新，让泥人张彩塑在保持传统特色的同时，适应现代社会的需求。相信在未来，泥人张彩塑这一传统艺术将会继续传承下去，为中国的民间艺术宝库增添更多精彩的作品。'
  },
  {
    id: 'story-002',
    title: '杨柳青年画：年画中的天津故事',
    category: '民间艺术',
    excerpt: '杨柳青年画是中国四大木版年画之一，以色彩艳丽、题材丰富、构图饱满而著称，具有浓郁的民间艺术特色。',
    tags: ['杨柳青', '年画', '民间艺术', '天津'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Yangliuqing%20New%20Year%20paintings%20traditional%20workshop',
    content: '杨柳青年画起源于明代崇祯年间，至今已有400多年的历史。它以木版套印与手工彩绘相结合的方法制作，题材广泛，包括神话传说、历史故事、民俗风情、花鸟鱼虫等。杨柳青年画的特点是色彩艳丽、线条流畅、造型夸张、寓意吉祥，深受广大群众喜爱，被誉为"中国年画之首"。'
  },
  {
    id: 'story-003',
    title: '天津风筝魏：放飞的艺术',
    category: '传统工艺',
    excerpt: '天津风筝魏是中国著名的风筝制作技艺，以造型美观、工艺精湛、放飞平稳而著称，是国家级非物质文化遗产。',
    tags: ['风筝魏', '风筝', '传统工艺', '天津'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20kite%20making%20workshop',
    content: '天津风筝魏由魏元泰于清代光绪年间创立，至今已有100多年的历史。魏元泰制作的风筝种类繁多，造型优美，工艺精湛，放飞平稳，被誉为"风筝之王"。风筝魏的风筝不仅具有很高的艺术价值，还具有很强的实用性，深受国内外风筝爱好者的喜爱。'
  },
  {
    id: 'story-004',
    title: '果仁张：天津的美味传说',
    category: '传统美食',
    excerpt: '果仁张是天津著名的传统小吃，以选料精细、制作考究、风味独特而闻名，是天津的老字号之一。',
    tags: ['果仁张', '传统美食', '老字号', '天津'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20nut%20snacks%20Tianjin',
    content: '果仁张的历史可以追溯到清代嘉庆年间，创始人张明纯以制作各种美味的果仁食品而闻名。果仁张的果仁选料精细，制作考究，风味独特，深受人们喜爱。经过几代人的传承和发展，果仁张已经成为天津的著名小吃之一，远销国内外。'
  },
  // 补充的历史故事
  {
    id: 'story-005',
    title: '北京同仁堂：350年的中药传奇',
    category: '中药文化',
    excerpt: '创立于1669年的同仁堂，历经八代皇帝，见证了中国中医药文化的传承与发展...',
    tags: ['中药', '清朝', '老字号', '文化传承'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Beijing%20Tongrentang%20traditional%20Chinese%20medicine%20store%20historical%20photo',
    content: '北京同仁堂是中国最负盛名的中药老字号，创建于清康熙八年（1669年），创始人乐显扬。三百多年来，同仁堂始终坚守"炮制虽繁必不敢省人工，品味虽贵必不敢减物力"的古训，其产品以"配方独特、选料上乘、工艺精湛、疗效显著"而享誉海内外。同仁堂的发展史与中国近现代史紧密相连，从清朝宫廷御药房到现代上市公司，同仁堂不仅是一家企业，更是中国中医药文化的重要象征和传承者。'
  },
  {
    id: 'story-006',
    title: '景德镇瓷器：白如玉、明如镜、薄如纸、声如磬',
    category: '陶瓷文化',
    excerpt: '景德镇制瓷历史可追溯至汉代，宋元时期逐渐发展，明清时期达到鼎盛...',
    tags: ['陶瓷', '手工艺', '非遗', '艺术'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Jingdezhen%20porcelain%20traditional%20workshop%20and%20artworks',
    content: '景德镇被誉为"世界瓷都"，制瓷历史悠久，技艺精湛。早在汉代，这里就开始了陶瓷生产；唐代，景德镇白瓷已享有盛名；宋代，景德镇陶瓷进入快速发展期，以青白瓷（影青瓷）著称于世；元代，景德镇成功烧制出青花、釉里红等新品种；明代，景德镇成为全国制瓷中心，设立了御窑厂；清代，景德镇制瓷工艺达到历史高峰，创烧了粉彩、珐琅彩等名贵品种。'
  },
  {
    id: 'story-007',
    title: '茅台酒：中国白酒的典范',
    category: '酒文化',
    excerpt: '茅台酒以其独特的酱香风格和卓越的品质，被誉为"国酒"，其酿造技艺堪称中华酿酒文化的瑰宝...',
    tags: ['白酒', '酿造', '非遗', '饮食文化'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Moutai%20liquor%20traditional%20brewing%20process',
    content: '茅台酒产于贵州省仁怀市茅台镇，是中国酱香型白酒的代表。茅台镇独特的地理环境、气候条件和水质，为茅台酒的酿造提供了得天独厚的自然条件。茅台酒的酿造工艺复杂，需要经过制曲、制酒、陈酿、勾兑、包装等多个环节，整个生产周期长达一年，还要经过五年以上的陈酿才能出厂。茅台酒以"酱香突出、幽雅细腻、酒体醇厚、回味悠长、空杯留香持久"的特点著称，其独特的风味和品质使其成为中国白酒的典范，被誉为"国酒"。'
  },
  {
    id: 'story-008',
    title: '相声：津门笑声的源与流',
    category: '曲艺文化',
    excerpt: '晚清以来在天津形成的曲艺形式，强调说学逗唱与语言节奏...',
    tags: ['曲艺', '民俗', '相声', '天津'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20crosstalk%20performance%20historic%20photo',
    content: '相声在天津形成成熟的表演体系，影响至全国。其文本与表演的结合，成为研究民俗语言与城市文化的重要范式。相声强调说学逗唱与语言节奏，是中国传统文化中的瑰宝，也是天津城市文化的重要组成部分。'
  }
];

// 从备份文件中添加的历史故事
heritageStories.push(
  {
    id: 'story-009',
    title: '北京同仁堂：350年的中药传奇',
    category: '中药文化',
    excerpt: '创立于1669年的同仁堂，历经八代皇帝，见证了中国中医药文化的传承与发展...',
    tags: ['中药', '清朝', '老字号', '文化传承'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Beijing%20Tongrentang%20traditional%20Chinese%20medicine%20store%20historical%20photo',
    content: '北京同仁堂是中国最负盛名的中药老字号，创建于清康熙八年（1669年），创始人乐显扬。三百多年来，同仁堂始终坚守"炮制虽繁必不敢省人工，品味虽贵必不敢减物力"的古训，其产品以"配方独特、选料上乘、工艺精湛、疗效显著"而享誉海内外。同仁堂的发展史与中国近现代史紧密相连，从清朝宫廷御药房到现代上市公司，同仁堂不仅是一家企业，更是中国中医药文化的重要象征和传承者。'
  },
  {
    id: 'story-010',
    title: '景德镇瓷器：白如玉、明如镜、薄如纸、声如磬',
    category: '陶瓷文化',
    excerpt: '景德镇制瓷历史可追溯至汉代，宋元时期逐渐发展，明清时期达到鼎盛...',
    tags: ['陶瓷', '手工艺', '非遗', '艺术'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Jingdezhen%20porcelain%20traditional%20workshop%20and%20artworks',
    content: '景德镇被誉为"世界瓷都"，制瓷历史悠久，技艺精湛。早在汉代，这里就开始了陶瓷生产；唐代，景德镇白瓷已享有盛名；宋代，景德镇陶瓷进入快速发展期，以青白瓷（影青瓷）著称于世；元代，景德镇成功烧制出青花、釉里红等新品种；明代，景德镇成为全国制瓷中心，设立了御窑厂；清代，景德镇制瓷工艺达到历史高峰，创烧了粉彩、珐琅彩等名贵品种。'
  },
  {
    id: 'story-011',
    title: '茅台酒：中国白酒的典范',
    category: '酒文化',
    excerpt: '茅台酒以其独特的酱香风格和卓越的品质，被誉为"国酒"，其酿造技艺堪称中华酿酒文化的瑰宝...',
    tags: ['白酒', '酿造', '非遗', '饮食文化'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Moutai%20liquor%20traditional%20brewing%20process',
    content: '茅台酒产于贵州省仁怀市茅台镇，是中国酱香型白酒的代表。茅台镇独特的地理环境、气候条件和水质，为茅台酒的酿造提供了得天独厚的自然条件。茅台酒的酿造工艺复杂，需要经过制曲、制酒、陈酿、勾兑、包装等多个环节，整个生产周期长达一年，还要经过五年以上的陈酿才能出厂。茅台酒以"酱香突出、幽雅细腻、酒体醇厚、回味悠长、空杯留香持久"的特点著称，其独特的风味和品质使其成为中国白酒的典范，被誉为"国酒"。'
  },
  {
    id: 'story-012',
    title: '桂发祥十八街麻花：百年津味的酥与脆',
    category: '传统美食',
    excerpt: '创建于1927年的桂发祥，以十八街麻花闻名，形成独特的传统工艺与口感标准。',
    tags: ['天津', '老字号', '食品', '传统工艺'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Guifaxiang%20mahua%20traditional%20workshop%20photo',
    content: '桂发祥十八街麻花以多褶形态与香酥口感著称，传统工艺讲究和面、擀条、拧花、油炸的每一步火候与比例。其"条条分明、不含水分"的标准来自长期的工艺经验积累，成为津门特色小吃的代表。'
  },
  {
    id: 'story-013',
    title: '狗不理包子：皮薄馅大的城市名片',
    category: '传统美食',
    excerpt: '始于清代光绪年间的狗不理，以皮薄馅大、鲜香味美闻名，成为天津餐饮文化符号。',
    tags: ['天津', '美食', '非遗', '餐饮文化'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Goubuli%20steamed%20buns%20traditional%20shop',
    content: '狗不理包子强调醒发与包制的手法，讲究"十八个褶"，汤汁鲜而不腻。其品牌发展见证了天津餐饮业与城市商业的现代化进程。'
  },
  {
    id: 'story-014',
    title: '耳朵眼炸糕：外酥里糯的甜香记忆',
    category: '传统美食',
    excerpt: '创建于清光绪年间的耳朵眼炸糕，以糯米与红豆的比例与火候著称，香甜不腻。',
    tags: ['天津', '小吃', '老字号'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Erduoyan%20fried%20cake%20street%20scene',
    content: '耳朵眼炸糕的制作工艺重在选材与油温控制，外皮酥脆、内里细糯，甜香层次分明。它承载着天津街巷里的生活味道，是城市小吃文化的典型代表。'
  },
  {
    id: 'story-015',
    title: '茶汤李：一碗温润的城市温度',
    category: '传统美食',
    excerpt: '源自清末的茶汤李，以细腻柔滑、甘香回甜的口感，成为老天津的温暖记忆。',
    tags: ['天津', '甜品', '城市记忆'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chatangli%20sweet%20soup%20stall',
    content: '茶汤李的茶汤以米粉与红糖的比例与熬煮火候见长，入口细腻，回甜绵长。它折射出天津城市生活的节奏与人情味，承载代际记忆。'
  },
  {
    id: 'story-016',
    title: '老美华：手工鞋履的温度',
    category: '传统工艺',
    excerpt: '始于民国的老美华，以手工缝制技艺与舒适耐穿著称，延续匠作精神。',
    tags: ['天津', '手工', '品牌焕新'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Laomeihua%20traditional%20shoe%20store',
    content: '老美华鞋履的工艺强调楦型与针脚，讲究脚感与耐用性，体现传统与现代生活的结合。品牌在城市更新中通过联名与设计焕新，重塑老字号的当代价值。'
  },
  {
    id: 'story-017',
    title: '利顺德饭店：近代史的见证者',
    category: '历史建筑',
    excerpt: '始建于1863年的利顺德饭店，是近代中国对外交流与现代文明传播的重要窗口。',
    tags: ['天津', '近代史', '建筑'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Lishunde%20Hotel%20historic%20building%20photo',
    content: '利顺德饭店作为天津近代化的重要地标，承载着城市与国际交流的历史记忆。它见证了从租界到现代城市的变迁，成为研究近代史与城市文化的关键节点。'
  },
  {
    id: 'story-018',
    title: '海河：城市记忆的水脉',
    category: '城市文化',
    excerpt: '海河串联了天津的工业、商业与生活空间，记录了城市发展之路。',
    tags: ['海河', '城市更新', '工业遗产', '天津'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Haihe%20river%20historical%20photo%20bridge%20view',
    content: '海河两岸的工业遗产与公共空间更新，反映出城市从生产转向生活与文化的空间叙事。'
  },
  {
    id: 'story-019',
    title: '泥人张：形神兼备的民间艺术',
    category: '非遗传承',
    excerpt: '以彩塑语言传达人物神韵，形成了津派美术的独特风格。',
    tags: ['非遗', '美术', '彩塑', '天津'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Nirenzhang%20studio%20historic%20photo',
    content: '泥人张彩塑在造型与色彩上形成规范体系，成为非遗传承与当代设计创新的重要来源。'
  },
  {
    id: 'story-020',
    title: '荣宝斋木版水印：文人美学的传承',
    category: '传统工艺',
    excerpt: '以木版拓印复刻书画精品，凝结传统工艺与文人趣味。',
    tags: ['书画', '印刷', '非遗'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Rongbaozhai%20woodblock%20printing%20workshop%20historic%20photo',
    content: '荣宝斋木版水印以分版分色的工艺复刻书画作品，讲究墨色层次与宣纸肌理的还原。它承载了近现代书画传播与大众审美普及的历史价值。'
  },
  {
    id: 'story-021',
    title: '全聚德烤鸭：京味烟火与匠心火候',
    category: '传统美食',
    excerpt: '挂炉烤制成就酥脆鸭皮与香嫩鸭肉，成为京城餐饮名片。',
    tags: ['美食', '北京', '餐饮文化'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Quanjude%20Peking%20duck%20roasting%20historic%20restaurant%20photo',
    content: '全聚德烤鸭以挂炉火候与刀工见长，皮酥肉嫩、肥而不腻。它折射近代城市餐饮业的标准化与品牌化进程。'
  },
  {
    id: 'story-022',
    title: '剪纸：红色的民间记忆',
    category: '民间艺术',
    excerpt: '以一刀一剪呈现民间审美与生活祝愿的图像艺术。',
    tags: ['民俗', '手工', '非遗'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20paper%20cutting%20folk%20art%20red%20patterns',
    content: '剪纸重在构图的虚实与刀法的节奏，广泛用于节庆与礼俗。它是理解民间图像语言与社会情感表达的重要窗口。'
  },
  {
    id: 'story-023',
    title: '扬州漆器：光泽与时间的工艺',
    category: '传统工艺',
    excerpt: '以髹饰工艺显现温润光泽，体现江南工艺的细腻美学。',
    tags: ['工艺', '漆器', '江苏'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Yangzhou%20lacquerware%20traditional%20craft%20studio',
    content: '扬州漆器以髹、磨、描的工序见长，漆膜细致而耐久。在现代设计中通过纹样与配色焕新传统。'
  },
  {
    id: 'story-024',
    title: '周村烧饼：薄脆之间的历史温度',
    category: '传统美食',
    excerpt: '以薄、香、脆著称的老字号点心，见证商贾繁华与市井生活。',
    tags: ['美食', '山东', '老字号'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Zhoucun%20sesame%20biscuit%20traditional%20bakery%20photo',
    content: '周村烧饼讲究醒面、擀薄与火候控制，香酥不腻。它是齐鲁地区饮食文化与市镇经济记忆的载体。'
  },
  {
    id: 'story-025',
    title: '景泰蓝：铜与火的色彩艺术',
    category: '传统工艺',
    excerpt: '掐丝、烧蓝、镶嵌的综合工艺，呈现金属与釉彩的和鸣。',
    tags: ['工艺', '金属', '非遗'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Cloisonne%20enamel%20Beijing%20workshop%20historic%20photo',
    content: '景泰蓝以铜胎为骨、掐丝成线、填釉着色，历经多次烧制与打磨成型。其色彩语言与纹样体系体现宫廷美学的秩序与华彩。'
  },
  {
    id: 'story-026',
    title: '旗袍：东方曲线与近代都市美学',
    category: '服饰文化',
    excerpt: '在上海近代都市文化中形成风格，融合传统与现代的服饰语言。',
    tags: ['服饰', '上海', '近代史'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Qipao%20cheongsam%20Shanghai%20fashion%20historic%20photo',
    content: '旗袍以立领、盘扣与收腰线条体现东方审美与身体叙事。它连接了女性身份、都市生活与时尚产业的多重维度。'
  },
  {
    id: 'story-027',
    title: '徽墨：文房雅器的黑与光',
    category: '文房四宝',
    excerpt: '以油烟与胶为材，经制、雕、磨等工序，呈现细腻墨性与雕刻美学。',
    tags: ['文房', '工艺', '书写系统'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Hui%20inkstick%20carving%20workshop%20tools%20and%20patterns',
    content: '徽墨讲究原料比例与炼制火候，雕刻图案体现文人意趣与吉祥寓意。其与宣纸、毛笔、砚台共同构成书写系统的工艺基座。'
  },
  {
    id: 'story-028',
    title: '蜀锦：经纬之间的繁复之美',
    category: '传统工艺',
    excerpt: '以彩纬显花的织造工艺，呈现华美纹样与层次结构。',
    tags: ['织造', '纹样', '非遗'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Shu%20brocade%20loom%20weaving%20workshop%20colorful%20patterns',
    content: '蜀锦在组织结构与纹样布局上高度复杂，形成东方织造的代表体系。现代设计中常以其色彩与图形语言进行跨界再设计。'
  },
  {
    id: 'story-029',
    title: '潍坊风筝：骨与纸的空气造型',
    category: '民间艺术',
    excerpt: '以竹骨为骨、宣纸为肤，结合彩绘形成可飞行的造型艺术。',
    tags: ['民俗', '造型', '公共文化'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Weifang%20kite%20making%20bamboo%20frame%20and%20painting',
    content: '风筝结构讲究受力与配重，绘饰体现地域风格。在公共艺术与品牌活动中常见文化视觉化的应用。'
  },
  {
    id: 'story-030',
    title: '宣纸：纤维网络的书写载体',
    category: '文房四宝',
    excerpt: '以青檀与稻草为核心原料，形成强韧而吸墨的书写媒介。',
    tags: ['材料', '书画', '工艺'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Xuan%20paper%20making%20workshop%20fiber%20pulp%20drying%20racks',
    content: '宣纸的吸墨与抗老化性能使其成为书画的经典载体。现代应用包括艺术复制、装帧设计与材质实验。'
  },
  {
    id: 'story-031',
    title: '京味小吃体系：口味与技法的城市谱系',
    category: '传统美食',
    excerpt: '以炒、炸、蒸多种技法构成风味结构，形成市井美食的文化谱系。',
    tags: ['美食', '城市文化', '品牌'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Beijing%20street%20snacks%20assortment%20historic%20stall%20photo',
    content: '通过技法、器具与配方的标准化，形成可复制的城市味觉记忆。品牌焕新案例中常以包装与故事化表达连接年轻消费。'
  },
  {
    id: 'story-032',
    title: '景德镇青花：蓝与白的视觉秩序',
    category: '陶瓷文化',
    excerpt: '以钴料呈色与釉下发色形成典型的青花视觉体系。',
    tags: ['陶瓷', '配色', '纹样'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Jingdezhen%20blue%20and%20white%20porcelain%20museum%20display',
    content: '青花瓷的色阶与笔触影响纹样表达的层次。当代衍生产品多以抽象化纹样实现现代场景适配。'
  },
  {
    id: 'story-033',
    title: '皮影戏：光与影的叙事装置',
    category: '民间艺术',
    excerpt: '以灯、幕、人、偶构成的叙事体系，表现动作与情感。',
    tags: ['戏曲', '叙事', '设计借鉴'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20shadow%20puppet%20stage%20performance%20lamp%20and%20screen',
    content: '皮影的造型语汇可迁移到品牌角色与动画设计中。其关节运动的平面化方法适合简洁叙事与节奏控制。'
  },
  {
    id: 'story-034',
    title: '苏帮菜：火候与刀工的雅致风味',
    category: '传统美食',
    excerpt: '以清鲜平和的风味与精细刀工著称，呈现江南饮食美学。',
    tags: ['饮食文化', '江南', '美学'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Suzhou%20cuisine%20kitchen%20knife%20skills%20and%20plating',
    content: '苏帮菜重在食材本味与火候控制，器皿与摆盘体现审美追求。在品牌传播中常以视觉化呈现"清雅平衡"的风格。'
  },
  {
    id: 'story-035',
    title: '德化白瓷：温润如玉的器物语言',
    category: '陶瓷文化',
    excerpt: '以白釉细腻与造型圆融著称，呈现"玉质"般的光泽与肌理。',
    tags: ['陶瓷', '福建', '器物美学'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Dehua%20blanc%20de%20chine%20porcelain%20museum%20display',
    content: '德化白瓷强调胎釉匹配与温控曲线，人物与器物均体现柔和气质。现代设计中以其"白"的审美延展到空间与品牌视觉。'
  },
  {
    id: 'story-036',
    title: '张小泉：刀工与钢性的一体化标准',
    category: '传统工艺',
    excerpt: '以锻造与热处理形成稳定钢性，建立现代刀剪标准。',
    tags: ['金工', '品牌', '生活方式'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20forging%20knife%20workshop%20Hangzhou',
    content: '从材质到工艺流程的标准化，提升刀剪的使用寿命与安全性。品牌更新以工艺叙事与生活方式拍摄强化信任。'
  },
  {
    id: 'story-037',
    title: '潮绣：潮汕地域的立体绣艺',
    category: '传统工艺',
    excerpt: '以金线与立体效果见长，呈现华美庄重的视觉表达。',
    tags: ['刺绣', '广东', '礼仪'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chaozhou%20embroidery%20gold%20thread%20three-dimensional%20work',
    content: '潮绣常用金银线与垫绣技术形成起伏层次，适合礼仪与陈设场景。现代应用可转化为高端服饰与饰品的工艺亮点。'
  },
  {
    id: 'story-038',
    title: '宜兴紫砂：泥与火的壶学体系',
    category: '传统工艺',
    excerpt: '以泥料配比与成型技法构筑茶壶功能与美学的统一。',
    tags: ['陶瓷', '茶文化', '功能美学'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Yixing%20zisha%20teapot%20making%20workshop',
    content: '紫砂壶讲究泥性、气孔与壁厚的平衡，成型与烧成决定出汤与保温。传播中以"工与用"的叙事连接专业与大众。'
  },
  {
    id: 'story-039',
    title: '雕版印刷：文字与木版的知识生产',
    category: '传统工艺',
    excerpt: '以手工刻版与印刷传递知识与审美，形成出版史的重要阶段。',
    tags: ['出版', '木工', '版画'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20woodblock%20printing%20workshop%20historic%20photo',
    content: '雕版印刷强调排版与刻工配合，墨色与纸材影响阅读体验。现代延展包括艺术版画与手工出版的复兴。'
  },
  {
    id: 'story-040',
    title: '苗族银饰：锻敲与纹样的身体叙事',
    category: '民族文化',
    excerpt: '以锻打、錾刻与焊接形成复杂纹样，承载族群身份与审美。',
    tags: ['金工', '民族文化', '饰品'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Miao%20silver%20jewelry%20craft%20workshop',
    content: '银饰的构件组合体现工艺体系，纹样语言传递文化记忆。在时尚与博物馆叙事中具有强烈的视觉辨识度。'
  },
  {
    id: 'story-041',
    title: '汴绣：工笔绣法的精雅',
    category: '传统工艺',
    excerpt: '以工笔式线描与设色形成精致画面，强调细节控制。',
    tags: ['刺绣', '河南', '工笔'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Kaifeng%20embroidery%20studio%20delicate%20stitches',
    content: '汴绣借鉴工笔绘画的线与色方法，针法细密、层次丰富。现代跨界多见于文创与礼盒的高雅表达。'
  },
  {
    id: 'story-042',
    title: '剪纸：正负形的民间叙事',
    category: '民间艺术',
    excerpt: '以剪映与留白塑造叙事节奏，适合节庆与装饰。',
    tags: ['民俗', '构图', '节庆'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20paper%20cutting%20traditional%20workshop%20red%20paper',
    content: '剪纸的构图强调正负形的平衡，图案常带吉祥寓意。媒介转化容易，适合教育与轻量化设计。'
  },
  {
    id: 'story-043',
    title: '雕漆：髹饰之上的浮雕工艺',
    category: '传统工艺',
    excerpt: '以多层漆堆积后雕刻成形，呈现厚重与精致的统一。',
    tags: ['漆艺', '器物', '团花'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20carved%20lacquer%20red%20carving%20workshop',
    content: '雕漆需要耐心与材料控制，适合器物与陈设的高端表达。纹样语言常见缠枝与团花体系。'
  },
  {
    id: 'story-044',
    title: '绍兴黄酒：时间与陶的风味载体',
    category: '酒文化',
    excerpt: '以陶坛贮存与发酵周期形成独有的香气与层次。',
    tags: ['饮食文化', '酿造', '浙江'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Shaoxing%20yellow%20wine%20traditional%20brewery%20jars',
    content: '黄酒的酿造强调时间与温度控制，陶坛微孔影响风味演化。品牌叙事多以家族与地域记忆深化情感连接。'
  },
  {
    id: 'story-045',
    title: '黎族织锦：经纬之间的身份纹样',
    category: '民族文化',
    excerpt: '以经纬显花形成部落纹样，承载族群记忆与美学。',
    tags: ['织造', '民族文化', '纹样'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Li%20ethnic%20brocade%20loom%20patterns%20Hainan',
    content: '纹样语汇强调身份与故事，织造技法体现地域性。适合服饰与空间软装的文化化应用。'
  },
  {
    id: 'story-046',
    title: '匠作窗棂：几何秩序与光影',
    category: '传统建筑',
    excerpt: '以木构几何形成秩序美感，塑造空间的光影语言。',
    tags: ['建筑', '木作', '栅格'],
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20wooden%20lattice%20window%20craft%20workshop',
    content: '窗棂的比例与榫卯影响整体视觉与耐久。在品牌与界面设计中可转化为栅格系统的灵感。'
  }
);

// 示例数据：学习教程
const tutorials = [
  {
    id: 'tutorial-001',
    title: '如何制作天津泥人张彩塑',
    category: '手工制作',
    duration: '30分钟',
    difficulty: '中级',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Clay%20sculpture%20tutorial%20step%20by%20step',
    steps: [
      '准备材料：黏土、颜料、工具等',
      '设计造型：画出草图，确定造型',
      '制作胚体：用黏土制作出基本造型',
      '精细刻画：用工具进行精细刻画',
      '上色：用颜料进行上色',
      '晾干：将作品晾干'    ]
  },
  {
    id: 'tutorial-002',
    title: '杨柳青年画制作工艺详解',
    category: '传统工艺',
    duration: '45分钟',
    difficulty: '高级',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Woodblock%20printing%20tutorial%20traditional%20Chinese%20painting',
    steps: [
      '准备材料：木板、颜料、宣纸等',
      '设计画稿：画出年画稿样',
      '雕刻木板：将画稿雕刻在木板上',
      '印刷：用木板进行套色印刷',
      '手工彩绘：对印刷品进行手工彩绘',
      '装裱：将成品装裱起来'    ]
  },
  {
    id: 'tutorial-003',
    title: '天津风筝制作基础',
    category: '手工制作',
    duration: '60分钟',
    difficulty: '初级',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Kite%20making%20tutorial%20traditional%20Chinese',
    steps: [
      '准备材料：竹条、纸张、线绳等',
      '制作骨架：用竹条制作风筝骨架',
      '糊纸：将纸张糊在骨架上',
      '绘制图案：在风筝上绘制图案',
      '安装提线：安装风筝提线',
      '试飞调整：进行试飞并调整'    ]
  },
  // 补充的非遗教程
  {
    id: 'tutorial-004',
    title: '传统剪纸技法入门',
    category: '手工制作',
    duration: '25分钟',
    difficulty: '初级',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20paper%20cutting%20tutorial%20beginner',
    steps: [
      '准备材料：红纸、剪刀、铅笔等',
      '设计图案：画出简单的剪纸图案',
      '折叠纸张：按照需要折叠纸张',
      '裁剪图案：用剪刀沿着线条裁剪',
      '展开作品：小心展开剪纸作品',
      '整理修饰：对作品进行整理和修饰'
    ]
  },
  {
    id: 'tutorial-005',
    title: '中国结编织基础',
    category: '手工编织',
    duration: '35分钟',
    difficulty: '中级',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20knot%20bracelet%20tutorial',
    steps: [
      '准备材料：红绳、剪刀、打火机等',
      '学习基本结：掌握平结、金刚结等基本结',
      '编织手链：用基本结编织简单手链',
      '调整长度：根据需要调整手链长度',
      '收尾固定：固定手链两端',
      '完成作品：检查并整理作品'
    ]
  },
  {
    id: 'tutorial-006',
    title: '国画山水基本技法',
    category: '绘画艺术',
    duration: '45分钟',
    difficulty: '中级',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20ink%20painting%20landscape%20tutorial',
    steps: [
      '准备材料：宣纸、毛笔、墨汁等',
      '学习笔法：掌握中锋、侧锋等笔法',
      '练习皴法：学习各种皴法技巧',
      '绘制山石：画出山石的基本形态',
      '添加树木：绘制树木和植被',
      '完成构图：调整画面构图和意境'
    ]
  }
];

// 示例数据：文化元素
const culturalElements = [
  {
    id: 'element-001',
    name: '泥人张彩塑',
    category: '非遗',
    description: '天津著名的传统民间艺术，以形神兼备、色彩鲜明、做工精细而闻名。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20clay%20sculpture%20artwork',
    tags: ['泥人张', '彩塑', '非遗', '天津']
  },
  {
    id: 'element-002',
    name: '杨柳青年画',
    category: '民间艺术',
    description: '中国四大木版年画之一，以色彩艳丽、题材丰富、构图饱满而著称。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20New%20Year%20painting',
    tags: ['杨柳青', '年画', '民间艺术', '天津']
  },
  {
    id: 'element-003',
    name: '天津风筝',
    category: '传统工艺',
    description: '天津传统风筝制作技艺，以造型美观、工艺精湛、放飞平稳而著称。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20kite%20colorful%20design',
    tags: ['风筝', '传统工艺', '天津']
  },
  {
    id: 'element-004',
    name: '天津包子',
    category: '传统美食',
    description: '天津著名的传统小吃，以皮薄馅大、鲜香可口而闻名。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20steamed%20buns%20Tianjin%20style',
    tags: ['包子', '传统美食', '天津']
  },
  {
    id: 'element-005',
    name: '天津麻花',
    category: '传统美食',
    description: '天津传统名点，以酥脆香甜、久放不绵而闻名。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20fried%20dough%20twist%20Tianjin',
    tags: ['麻花', '传统美食', '天津']
  },
  {
    id: 'element-006',
    name: '天津快板',
    category: '传统曲艺',
    description: '天津传统曲艺形式，以节奏明快、语言幽默而著称。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20clapper%20performance%20Tianjin',
    tags: ['快板', '传统曲艺', '天津']
  },
  // 补充的文化元素
  {
    id: 'element-007',
    name: '中国书法',
    category: '传统艺术',
    description: '中国特有的一种传统艺术形式，以汉字为表现对象，通过点画、结构、章法等表现情感和意境。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20calligraphy%20artwork',
    tags: ['书法', '传统艺术', '汉字', '文化']
  },
  {
    id: 'element-008',
    name: '京剧脸谱',
    category: '传统戏曲',
    description: '京剧艺术中塑造人物形象的重要手段，通过不同颜色和图案表现人物的性格和品质。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Beijing%20opera%20face%20paintings',
    tags: ['京剧', '脸谱', '传统戏曲', '文化']
  },
  {
    id: 'element-009',
    name: '青花瓷',
    category: '陶瓷艺术',
    description: '中国传统陶瓷工艺的珍品，以白地青花为主要特征，具有独特的艺术魅力。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Blue%20and%20white%20porcelain%20vase',
    tags: ['青花瓷', '陶瓷', '传统工艺', '艺术']
  },
  {
    id: 'element-010',
    name: '中国传统建筑',
    category: '建筑艺术',
    description: '中国传统建筑以木构架为主要结构方式，具有独特的东方美学特征。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20architecture%20temple',
    tags: ['建筑', '传统建筑', '东方美学', '文化']
  }
];

// 示例数据：文化百科
const encyclopedia = [
  {
    id: 'encyclopedia-001',
    title: '天津老字号',
    category: '商业文化',
    content: '天津老字号是指在天津地区具有悠久历史、良好声誉和独特文化内涵的商业企业或品牌。这些老字号企业大多有着几十年甚至上百年的历史，是天津商业文化的重要组成部分。天津老字号涵盖了餐饮、零售、医药、食品等多个行业，如狗不理包子、十八街麻花、耳朵眼炸糕等都是著名的天津老字号。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20old%20store%20facade%20Tianjin'  },
  {
    id: 'encyclopedia-002',
    title: '天津非遗',
    category: '文化遗产',
    content: '天津非遗是指在天津地区流传的、具有历史、文化、艺术、科学价值的非物质文化遗产。截至目前，天津已有多项非遗项目被列入国家级非物质文化遗产名录，如泥人张彩塑、杨柳青年画、天津风筝魏等。这些非遗项目是天津文化的重要组成部分，也是中华民族优秀传统文化的瑰宝。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Intangible%20cultural%20heritage%20exhibition%20Tianjin'  },
  {
    id: 'encyclopedia-003',
    title: '天津民俗文化',
    category: '民俗风情',
    content: '天津民俗文化是指天津地区人民在长期的生产生活中形成的风俗习惯、民间信仰、传统节日等文化现象。天津民俗文化具有浓郁的地方特色，如天津的春节习俗、元宵节习俗、端午节习俗等都有着独特的魅力。天津民俗文化是天津人民智慧的结晶，也是天津文化的重要组成部分。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20folk%20festival%20celebration%20Tianjin'  }
];

// 示例数据：文化人物
const culturalFigures = [
  {
    id: 'figure-001',
    name: '张明山',
    field: '泥人张彩塑创始人',
    bio: '清代道光年间著名的泥塑艺术家，被誉为"泥人张"，他的作品生动传神，深受人们喜爱。',
    image: 'https://picsum.photos/id/1005/400/400',
    achievements: ['泥人张彩塑创始人', '国家级非遗传承人']
  },
  {
    id: 'figure-002',
    name: '魏元泰',
    field: '风筝魏创始人',
    bio: '清代光绪年间著名的风筝制作艺术家，被誉为"风筝魏"，他的风筝造型优美，工艺精湛。',
    image: 'https://picsum.photos/id/1012/400/400',
    achievements: ['风筝魏创始人', '国家级非遗传承人']
  },
  {
    id: 'figure-003',
    name: '白先生',
    field: '工笔绘画',
    bio: '以工笔设色见长，探索传统绘画在设计中的应用。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20gongbi%20painter%20portrait%20studio',
    achievements: ['工笔画展获奖', '插画与产品联名']
  },
  // 补充的传承人物
  {
    id: 'figure-004',
    name: '王师傅',
    field: '木作榫卯',
    bio: '从事传统木作三十余年，擅长复杂榫卯结构与家具修复。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20master%20carpenter%20portrait%20workshop',
    achievements: ['国家级非遗项目传承人', '传统家具修复工作室创办']
  },
  {
    id: 'figure-005',
    name: '李老师',
    field: '髹漆工艺',
    bio: '专注器物髹漆与现代材料融合，探索漆艺当代表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20lacquer%20artist%20portrait%20studio',
    achievements: ['省级非遗代表性传承人', '漆艺跨界联名项目主理']
  },
  {
    id: 'figure-006',
    name: '张老师',
    field: '织造与纹样',
    bio: '研究织造组织结构与纹样体系，推进传统织锦的现代转化。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20weaving%20artisan%20portrait%20loom',
    achievements: ['传统织锦研究课题负责人', '高校·工坊联合实践导师']
  },
  {
    id: 'figure-007',
    name: '周大师',
    field: '德化白瓷',
    bio: '专注白瓷人物与器物创作，追求温润与光的统一。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Dehua%20porcelain%20artist%20portrait%20studio',
    achievements: ['省级工艺美术大师', '白瓷艺术展策展人']
  },
  {
    id: 'figure-008',
    name: '黄老师',
    field: '潮绣',
    bio: '致力于金线与立体绣的当代表达，推动潮绣走进生活。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chaozhou%20embroidery%20artist%20portrait%20studio',
    achievements: ['非遗传承工作坊主理', '潮绣生活美学项目']
  }
];

// 示例数据：文化资产
const culturalAssets = [
  {
    id: 'asset-001',
    name: '泥人张彩塑图片素材',
    type: '图片',
    format: 'JPG',
    size: '10MB',
    downloadUrl: '#',
    preview: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20clay%20sculpture%20collection'  },
  {
    id: 'asset-002',
    name: '杨柳青年画矢量素材',
    type: '矢量图',
    format: 'AI',
    size: '5MB',
    downloadUrl: '#',
    preview: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20New%20Year%20painting%20vector%20art'  },
  {
    id: 'asset-003',
    name: '天津方言音频素材',
    type: '音频',
    format: 'MP3',
    size: '2MB',
    downloadUrl: '#',
    preview: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Audio%20recording%20equipment%20traditional%20Chinese%20dialect'  }
];

// 示例数据：工艺与技法
const craftTechniques = [
  {
    id: 'craft-001',
    title: '榫卯结构',
    category: '木作',
    description: '中国传统木作中使用的一种连接方式，通过榫头和卯眼的结合实现结构的稳固，无需钉子或胶水。',
    content: '榫卯结构是中国传统木作工艺的核心，具有悠久的历史和丰富的类型。它通过精心设计的榫头和卯眼的结合，实现了木材之间的牢固连接，同时允许木材在不同温度和湿度下自然伸缩，具有很高的科学性和艺术性。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20mortise%20and%20tenon%20joint%20woodworking',
    tags: ['榫卯', '木作', '传统工艺', '结构']
  },
  {
    id: 'craft-002',
    title: '髹漆工艺',
    category: '漆艺',
    description: '将天然漆涂在器物表面，经过干燥、打磨、推光等工序，形成光滑、耐久的漆膜。',
    content: '髹漆工艺是中国传统工艺中的瑰宝，具有悠久的历史。天然漆具有耐腐蚀、耐磨损、防水等特性，经过髹漆处理的器物不仅美观耐用，还具有很高的艺术价值。现代漆艺在传统基础上融合了新的材料和技术，展现出更加丰富的表现形式。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20lacquer%20art%20craft',
    tags: ['漆艺', '髹漆', '传统工艺', '装饰']
  },
  {
    id: 'craft-003',
    title: '织锦工艺',
    category: '织造',
    description: '一种用彩色丝线或金银线织出花纹图案的传统工艺，具有很高的艺术价值。',
    content: '织锦是中国传统织造工艺中的珍品，历史悠久，品种繁多。不同地区的织锦具有不同的特点，如蜀锦、宋锦、云锦等，各具特色。织锦工艺复杂，需要精湛的技艺和丰富的经验，是中国传统文化的重要组成部分。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20brocade%20weaving',
    tags: ['织锦', '织造', '传统工艺', '纺织品']
  },
  {
    id: 'craft-004',
    title: '陶瓷烧制',
    category: '陶瓷',
    description: '将粘土或其他无机非金属材料经过成型、干燥、烧制等工序，制成具有特定性能的陶瓷制品。',
    content: '陶瓷烧制是中国传统工艺中的重要组成部分，历史悠久，技艺精湛。不同地区的陶瓷烧制工艺具有不同的特点，如景德镇的青花瓷、宜兴的紫砂壶等。现代陶瓷烧制技术在传统基础上融合了新的材料和工艺，展现出更加丰富的表现力。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20ceramic%20kiln%20firing',
    tags: ['陶瓷', '烧制', '传统工艺', '器皿']
  },
  {
    id: 'craft-005',
    title: '金属锻造',
    category: '金工',
    description: '通过锤击、拉伸、弯曲等工艺，将金属材料加工成各种形状和器物。',
    content: '金属锻造是一种古老的工艺，在中国有着悠久的历史。传统金属锻造工艺包括青铜器铸造、铁器锻造、金银器制作等，具有很高的技术含量和艺术价值。现代金属锻造技术在传统基础上融合了新的设备和工艺，展现出更加丰富的表现力。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20metal%20forging%20craft',
    tags: ['锻造', '金工', '传统工艺', '金属']
  },
  {
    id: 'craft-006',
    title: '刺绣工艺',
    category: '纺织',
    description: '用针和线在织物上绣出各种花纹图案的传统工艺。',
    content: '刺绣是中国传统工艺中的重要组成部分，历史悠久，品种繁多。不同地区的刺绣具有不同的特点，如苏绣、湘绣、粤绣、蜀绣等，各具特色。刺绣工艺复杂，需要精湛的技艺和丰富的经验，是中国传统文化的重要组成部分。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20embroidery%20craft',
    tags: ['刺绣', '纺织', '传统工艺', '装饰']
  }
];

type TabType = 'stories' | 'tutorials' | 'elements' | 'encyclopedia' | 'figures' | 'works' | 'crafts' | 'assets' | 'activities';

// 调试用的isSafeForProxy函数
// 生成与内容相关的图片URL
const getContentImageUrl = (content: string, width: number, height: number, isPerson: boolean = false) => {
  // 使用内容ID生成稳定的图片URL，使用seed模式而非ID模式，确保每个内容都有对应的图片
  const contentId = content.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // 如果是人物图片，添加person关键词确保生成人物相关图片
  if (isPerson) {
    return `https://picsum.photos/seed/person-${contentId}/${width}/${height}`;
  }
  
  // 使用seed参数确保相同内容生成相同图片，同时避免ID不存在的问题
  return `https://picsum.photos/seed/${contentId}/${width}/${height}`;
}

// 备用图片URL，当图片加载失败时使用
const fallbackImageUrl = (width: number, height: number, isPerson: boolean = false) => {
  if (isPerson) {
    return `https://picsum.photos/seed/person-fallback/${width}/${height}`;
  }
  return `https://picsum.photos/seed/fallback/${width}/${height}`;
}

export default function CulturalKnowledge() {
  const { isDark = false } = useTheme() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams();
  
  const [activeTab, setActiveTab] = useState<TabType>('stories');
  // 作品展示数量控制，直接显示所有作品
  const [displayedWorksCount, setDisplayedWorksCount] = useState<number>(mockWorks.length);
  // 每次加载更多的作品数量（已不再使用）
  const worksPerLoad = 16;
  
  // 从location.state中获取activeTab参数，用于左侧导航直接切换到文化资讯
  useEffect(() => {
    const state = location.state as { activeTab?: string };
    if (state && state.activeTab) {
      setActiveTab(state.activeTab as TabType);
    }
  }, [location.state]);
  
  // 根据type参数从URL中切换activeTab
  useEffect(() => {
    if (type && Object.values<TabType>(['stories', 'tutorials', 'elements', 'encyclopedia', 'figures', 'works', 'crafts', 'assets']).includes(type as TabType)) {
      setActiveTab(type as TabType);
      // 切换标签时显示所有作品
      setDisplayedWorksCount(mockWorks.length);
    }
  }, [type]);
  
  // 选中的非遗故事
  const [selectedStory, setSelectedStory] = useState<any>(null);
  // 选中的文化人物
  const [selectedFigure, setSelectedFigure] = useState<any>(null);
  // 选中的学习教程
  const [selectedTutorial, setSelectedTutorial] = useState<any>(null);
  
  // 加载更多作品的处理函数
  const handleLoadMoreWorks = () => {
    setDisplayedWorksCount(prev => prev + worksPerLoad);
  };
  
  // 处理标签切换
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedStory(null);
    setSelectedFigure(null);
    setSelectedTutorial(null);
    // 切换标签时显示所有作品
    setDisplayedWorksCount(mockWorks.length);
  };
  
  // 处理故事点击
  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
  };
  
  // 处理人物点击
  const handleFigureClick = (figure: any) => {
    setSelectedFigure(figure);
  };
  
  // 处理教程点击
  const handleTutorialClick = (tutorial: any) => {
    setSelectedTutorial(tutorial);
  };
  
  // 关闭详情
  const handleCloseDetail = () => {
    setSelectedStory(null);
    setSelectedFigure(null);
    setSelectedTutorial(null);
  };
  
  // 检测是否为天津特色专区
  const isTianjin = location.pathname.startsWith('/tianjin');

  return (
    <div>
      {/* 主内容 */}
      <main className="flex-1 container mx-auto px-4 py-8 pb-16">
        
        {/* 中文注释：新增统一的渐变英雄区 */}
        <GradientHero
          title={isTianjin ? "天津特色专区" : "文化知识库"}
          subtitle={isTianjin ? "探索天津特色文化、老字号与非遗传承" : "系统化了解老字号、非遗与城市文化的故事与资产"}
          badgeText="Beta"
          theme={isTianjin ? "red" : "indigo"}
          size="lg"
          pattern
          // 中文注释：使用可靠的图片服务确保背景图显示
          backgroundImage="https://picsum.photos/seed/culture/1920/1080"
          stats={isTianjin ? [
            { label: '津门老字号', value: '精选' },
            { label: '天津元素', value: '资产' },
            { label: '非遗传承', value: '导览' },
            { label: '津味应用', value: '共创' },
          ] : [
            { label: '专题', value: '精选' },
            { label: '元素', value: '资产' },
            { label: '学习', value: '导览' },
            { label: '应用', value: '共创' },
          ]}
        />
        
        {/* 标签导航 */}
        <div className="flex flex-wrap gap-3 my-8 justify-center">
          {
            [
              { id: 'stories', label: '非遗故事', icon: '📖' },
              { id: 'tutorials', label: '学习教程', icon: '🎓' },
              { id: 'elements', label: '文化元素', icon: '🎨' },
              { id: 'encyclopedia', label: '文化百科', icon: '📚' },
              { id: 'figures', label: '文化人物', icon: '👤' },
              { id: 'works', label: '优质作品', icon: '🖼️' },
              { id: 'crafts', label: '工艺与技法', icon: '🔨' },
              { id: 'assets', label: '文化资产', icon: '📦' }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                  /* 响应式样式 */
                  sm:px-4 sm:py-2 sm:gap-1.5
                  
                  /* 激活状态 */
                  ${activeTab === tab.id ? (isDark ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20' : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20') : (isDark ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white shadow-md hover:shadow-lg' : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700')}
                  
                  /* 手机端特有样式 */
                  min-h-[44px]`}
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  // 响应式字体大小
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  // 确保在移动设备上有足够的点击区域
                  touchAction: 'manipulation'
                }}
              >
                <span style={{ fontSize: 'clamp(1rem, 3vw, 1.125rem)' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </motion.button>
            ))
          }
        </div>
        
        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {activeTab === 'stories' && (
            <motion.div
              key="stories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedStory ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {/* 故事详情 */}
                  <div className="md:col-span-2 space-y-8">
                    <div className="relative h-[650px] overflow-hidden rounded-2xl shadow-2xl">
                      <img
                        src={getContentImageUrl(selectedStory.title + selectedStory.content, 1200, 800)}
                        alt={selectedStory.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = fallbackImageUrl(1200, 800);
                          target.alt = `${selectedStory.title} - 图片加载失败`;
                        }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <div className="absolute bottom-8 left-8 right-8 text-white">
                        <div className="inline-block bg-red-600 text-white px-5 py-2 rounded-full text-base font-medium mb-4 shadow-lg">{selectedStory.category}</div>
                        <h2 className="text-5xl font-bold leading-tight tracking-tight">{selectedStory.title}</h2>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* 标签和元数据 */}
                      <div className="flex flex-wrap gap-3 items-center">
                        {selectedStory.tags.map((tag: string, index: number) => (
                          <span key={index} className={`px-4 py-1.5 rounded-full text-sm font-medium ${isDark ? 'bg-gray-750 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-300 hover:shadow-md`}>{tag}</span>
                        ))}
                      </div>
                      
                      {/* 正文内容 */}
                      <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none prose-xl ${isDark ? 'prose-headings:text-white' : 'prose-headings:text-gray-900'} prose-p:text-xl prose-p:leading-relaxed prose-p:tracking-wide prose-p:mb-8`}>
                        {selectedStory.content.split('\n\n').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                    
                    {/* 返回按钮 */}
                    <button
                      onClick={handleCloseDetail}
                      className={`px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 font-medium shadow-md hover:shadow-lg ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      <i className="fas fa-arrow-left text-lg"></i>
                      <span>返回列表</span>
                    </button>
                  </div>
                  
                  {/* 相关推荐 */}
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}>
                    <h3 className="text-2xl font-bold mb-8 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">相关推荐</h3>
                    <div className="space-y-8">
                      {heritageStories.filter(s => s.id !== selectedStory.id)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 4)
                        .map((story) => (
                        <motion.div
                          key={story.id} 
                          className={`${isDark ? 'bg-gray-750' : 'bg-gray-50'} rounded-xl p-4 flex gap-5 cursor-pointer transition-all duration-300 hover:${isDark ? 'bg-gray-700' : 'bg-white'} hover:shadow-md`}
                          onClick={() => handleStoryClick(story)}
                          whileHover={{ x: 5 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex-shrink-0">
                            <img
                              src={getContentImageUrl(story.title, 400, 300)}
                              alt={story.title}
                              className="w-40 h-32 object-cover rounded-lg mb-3"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = fallbackImageUrl(400, 300);
                                target.alt = `${story.title} - 图片加载失败`;
                              }}
                              loading="lazy"
                            />
                            <div className="flex flex-wrap gap-2">
                              {story.tags.slice(0, 3).map((tag: string, index: number) => (
                                <span key={index} className={`text-sm px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{tag}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <h4 className="font-bold text-xl line-clamp-2 leading-tight">{story.title}</h4>
                            <div className="mt-3">
                              <span className="inline-block bg-red-600 text-white text-sm px-3 py-1 rounded-full mb-3">{story.category}</span>
                            </div>
                            <p className="text-base text-gray-500 dark:text-gray-400 line-clamp-4 mt-1 flex-grow">{story.excerpt}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {heritageStories.map((story) => (
                    <motion.div
                      key={story.id}
                      whileHover={{ y: -8 }}
                      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-3xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} cursor-pointer`}
                      onClick={() => handleStoryClick(story)}
                    >
                      <div className="relative h-80 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={getContentImageUrl(story.title, 600, 400)}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImageUrl(600, 400);
                            target.alt = `${story.title} - 图片加载失败`;
                          }}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">{story.category}</span>
                        </div>
                      </div>
                      <div className="p-8">
                        <h3 className="text-2xl font-bold mb-4 line-clamp-2 leading-tight">{story.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-base mb-6 line-clamp-4 leading-relaxed">{story.excerpt}</p>
                        <div className="flex flex-wrap gap-3">
                          {story.tags.map((tag: string, index: number) => (
                            <span key={index} className={`px-3.5 py-2 rounded-full text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors duration-200`}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'tutorials' && (
            <motion.div
              key="tutorials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedTutorial ? (
                <div className="space-y-8">
                  <div className="relative h-[650px] overflow-hidden rounded-2xl shadow-2xl">
                    <img
                        src={getContentImageUrl(selectedTutorial.title, 1200, 800)}
                        alt={selectedTutorial.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = fallbackImageUrl(1200, 800);
                          target.alt = `${selectedTutorial.title} - 图片加载失败`;
                        }}
                        loading="lazy"
                      />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8 right-8 text-white">
                      <div className="inline-block bg-red-600 text-white px-5 py-2 rounded-full text-base font-medium mb-4 shadow-lg">{selectedTutorial.category}</div>
                      <h2 className="text-5xl font-bold leading-tight tracking-tight">{selectedTutorial.title}</h2>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* 教程信息 */}
                    <div className="md:col-span-2 space-y-8">
                      {/* 教程元数据 */}
                      <div className="flex flex-wrap gap-4 items-center">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-gray-750 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-300 hover:shadow-md flex items-center gap-2`}>
                          <i className="fas fa-clock"></i>
                          <span>{selectedTutorial.duration}</span>
                        </span>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-gray-750 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-300 hover:shadow-md flex items-center gap-2`}>
                          <i className="fas fa-signal"></i>
                          <span>{selectedTutorial.difficulty}</span>
                        </span>
                      </div>
                      
                      {/* 制作步骤 */}
                      <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className="text-2xl font-bold mb-6 pb-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">制作步骤</h3>
                        <ol className="space-y-5">
                          {selectedTutorial.steps.map((step: string, index: number) => (
                            <li key={index} className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-medium shadow-md">{index + 1}</div>
                              <div className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-800'} flex-grow`}>{step}</div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    
                    {/* 相关推荐 */}
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-lg mt-8`}>
                      <h3 className="text-2xl font-bold mb-6 pb-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}">相关教程</h3>
                      <div className="space-y-5">
                        {tutorials.filter(t => t.id !== selectedTutorial.id).map((tutorial) => (
                          <motion.div
                            key={tutorial.id} 
                            className={`${isDark ? 'bg-gray-750' : 'bg-gray-50'} rounded-lg p-3 flex gap-4 cursor-pointer transition-all duration-300 hover:${isDark ? 'bg-gray-700' : 'bg-white'} hover:shadow-md`}
                            onClick={() => handleTutorialClick(tutorial)}
                            whileHover={{ x: 5 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <img
                              src={getContentImageUrl(tutorial.title, 300, 200)}
                              alt={tutorial.title}
                              className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = fallbackImageUrl(300, 200);
                                target.alt = `${tutorial.title} - 图片加载失败`;
                              }}
                              loading="lazy"
                            />
                            <div className="flex-1 flex flex-col justify-between">
                              <h4 className="font-semibold text-lg line-clamp-2 leading-tight">{tutorial.title}</h4>
                              <div className="mt-2">
                                <span className="inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded-full mb-2">{tutorial.category}</span>
                              </div>
                              <div className="flex gap-2 mt-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400"><i className="fas fa-clock mr-1"></i>{tutorial.duration}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400"><i className="fas fa-signal mr-1"></i>{tutorial.difficulty}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCloseDetail}
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2"
                  >
                    <i className="fas fa-arrow-left"></i>
                    返回列表
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tutorials.map((tutorial) => (
                    <motion.div
                      key={tutorial.id}
                      whileHover={{ y: -5 }}
                      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} cursor-pointer`}
                      onClick={() => handleTutorialClick(tutorial)}
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={getContentImageUrl(tutorial.title, 400, 200)}
                          alt={tutorial.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImageUrl(400, 200);
                            target.alt = `${tutorial.title} - 图片加载失败`;
                          }}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">{tutorial.category}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-bold mb-2 line-clamp-2">{tutorial.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            <i className="fas fa-clock mr-1"></i>
                            {tutorial.duration}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            <i className="fas fa-signal mr-1"></i>
                            {tutorial.difficulty}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'elements' && (
            <motion.div
              key="elements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {culturalElements.map((element) => (
                  <motion.div
                    key={element.id}
                    whileHover={{ y: -5 }}
                    className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={getContentImageUrl(element.name, 400, 200)}
                          alt={element.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImageUrl(400, 200);
                            target.alt = `${element.name} - 图片加载失败`;
                          }}
                          loading="lazy"
                        />
                    </div>
                    <div className="p-5">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium mb-2 inline-block">{element.category}</span>
                      <h3 className="text-xl font-bold mb-2">{element.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{element.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {element.tags.map((tag: string, index: number) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
                </div>
              </motion.div>
            )}
          
          {activeTab === 'encyclopedia' && (
            <motion.div
              key="encyclopedia"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {encyclopedia.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -5 }}
                    className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
                      <div className="md:col-span-1">
                        <img
                          src={getContentImageUrl(item.title, 200, 200)}
                          alt={item.title}
                          className="w-full h-40 object-cover rounded-xl transition-transform duration-500 hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImageUrl(200, 200);
                            target.alt = `${item.title} - 图片加载失败`;
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">{item.category}</span>
                        <h3 className="text-xl font-bold">{item.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3">{item.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'figures' && (
            <motion.div
              key="figures"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {selectedFigure ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* 人物详情 */}
                  <div className="md:col-span-1">
                    <div className="sticky top-8 space-y-6">
                      <div className="relative h-80 overflow-hidden rounded-2xl">
                        <img
                        src={selectedFigure.image}
                        alt={selectedFigure.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = fallbackImageUrl(400, 600, true);
                          target.alt = `${selectedFigure.name} - 图片加载失败`;
                        }}
                        loading="lazy"
                      />
                      </div>
                      <button
                        onClick={() => {
                          const base = `${selectedFigure.name} ${selectedFigure.field}`.trim();
                          const text = `${base} ${selectedFigure.bio}`.trim();
                          const url = `/create?from=knowledge&prompt=${encodeURIComponent(text)}`;
                          navigate(url);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      >
                        <i className="fas fa-magic mr-2"></i>
                        应用到创作
                      </button>
                    </div>
                  </div>
                  
                  {/* 人物信息 */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <h2 className="text-2xl font-bold">{selectedFigure.name}</h2>
                        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{selectedFigure.field}</span>
                      </div>
                      <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{selectedFigure.bio}</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedFigure.achievements || []).map((a: string, i: number) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {culturalFigures.map((figure) => (
                    <motion.div
                      key={figure.id}
                      whileHover={{ y: -5 }}
                      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} cursor-pointer`}
                      onClick={() => handleFigureClick(figure)}
                    >
                      <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <img
                          src={figure.image}
                          alt={figure.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImageUrl(400, 400, true);
                            target.alt = `${figure.name} - 图片加载失败`;
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-bold mb-1">{figure.name}</h3>
                        <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'} mb-3`}>{figure.field}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3">{figure.bio}</p>
                        <div className="flex flex-wrap gap-1">
                          {(figure.achievements || []).map((achievement: string, index: number) => (
                            <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{achievement}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'activities' && (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TianjinCreativeActivities search="" />
            </motion.div>
          )}
          
          {activeTab === 'works' && (
            <motion.div
              key="works"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">优质作品展示</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  精选的优质作品，展示传统文化与现代设计的完美结合
                </p>
              </div>
              {/* 移动端专属修改：使用 columns-2 实现瀑布流，md以上保持 Grid */}
              <div className="block columns-2 gap-3 space-y-3 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-8 md:space-y-0">
                {mockWorks.slice(0, displayedWorksCount).map((work) => (
                  <motion.div
                    key={work.id}
                    whileHover={{ y: -5 }}
                    /* 移动端专属修改：添加 break-inside-avoid 防止卡片断裂，mb-3 用于列间距 */
                    className={`break-inside-avoid mb-3 md:mb-0 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} cursor-pointer`}
                  >
                    <div className="relative h-32 md:h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img
                        src={getContentImageUrl(work.title, 400, 200)}
                        alt={work.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = fallbackImageUrl(400, 200);
                          target.alt = `${work.title} - 图片加载失败`;
                        }}
                        loading="lazy"
                      />
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">{work.category}</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs flex items-center">
                        <i className="far fa-heart mr-1"></i>
                        {work.likes}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                        src={getContentImageUrl(work.creator, 100, 100)}
                        alt={work.creator}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = fallbackImageUrl(100, 100);
                          target.alt = `${work.creator} - 头像加载失败`;
                        }}
                        loading="eager"
                      />
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{work.creator}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{work.title}</h3>
                      <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{work.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {work.tags.map((tag: string, index: number) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'crafts' && (
            <motion.div
              key="crafts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">工艺与技法</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  探索中国传统工艺的精湛技艺与现代传承
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {craftTechniques.map((craft) => (
                  <motion.div
                    key={craft.id}
                    whileHover={{ y: -5 }}
                    className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img
                        src={getContentImageUrl(craft.title, 400, 200)}
                        alt={craft.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = fallbackImageUrl(400, 200);
                          target.alt = `${craft.title} - 图片加载失败`;
                        }}
                        loading="lazy"
                      />
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">{craft.category}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold mb-2">{craft.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3">{craft.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {craft.tags.map((tag: string, index: number) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'assets' && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {culturalAssets.map((asset) => (
                  <motion.div
                    key={asset.id}
                    whileHover={{ y: -5 }}
                    className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img
                        src={getContentImageUrl(asset.name, 400, 200)}
                        alt={asset.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = fallbackImageUrl(400, 200);
                          target.alt = `${asset.name} - 图片加载失败`;
                        }}
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold mb-2">{asset.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{asset.type}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fas fa-file-alt mr-1"></i>
                          {asset.format}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fas fa-weight-hanging mr-1"></i>
                          {asset.size}
                        </span>
                      </div>
                      <a
                        href={asset.downloadUrl}
                        className="block w-full text-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition-all duration-200 hover:scale-105"
                      >
                        <i className="fas fa-download mr-2"></i>
                        下载素材
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {/* 页脚 */}
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4 z-10 relative`}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2025 AI共创平台. 保留所有权利
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
            <a href="/terms" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
            <a href="/help" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
