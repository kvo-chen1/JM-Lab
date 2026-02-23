-- 插入文化知识数据（包含预生成的AI图片URL）
-- 删除现有的平台知识数据（category = 'platform'）
DELETE FROM cultural_knowledge WHERE category = 'platform';

-- 插入天津文化知识数据
INSERT INTO cultural_knowledge (title, category, subcategory, content, image_url, tags, related_items, sources, status, created_at, updated_at) VALUES
(
  '杨柳青年画',
  '文化遗产',
  '传统美术',
  '杨柳青年画是中国著名的民间木版年画之一，起源于天津市杨柳青镇，具有悠久的历史和独特的艺术风格。其特点是色彩鲜艳、线条流畅、形象生动，内容多以吉祥喜庆、历史故事、神话传说等为主题。杨柳青年画的制作工艺复杂，包括勾、刻、印、画、裱等多个环节，是中国民间艺术的瑰宝。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Yangliuqing%20New%20Year%20paintings%20traditional%20workshop',
  ARRAY['杨柳青年画', '传统美术', '民间艺术'],
  ARRAY['泥人张彩塑', '天津风筝魏'],
  ARRAY['《中国民间美术史》', '《天津地方志》'],
  'active',
  NOW(),
  NOW()
),
(
  '泥人张彩塑',
  '传统技艺',
  '雕塑艺术',
  '泥人张彩塑是天津著名的民间传统手工艺品，创始于清代道光年间，以张明山为代表。其作品以细腻的手法、逼真的形象和丰富的色彩著称，题材广泛，包括历史人物、民间故事、神话传说等。泥人张彩塑的制作工艺精湛，从取土、和泥、塑造到彩绘，每一个环节都需要高超的技艺和丰富的经验。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20clay%20sculpture%20workshop%20Tianjin',
  ARRAY['泥人张', '彩塑', '传统技艺', '雕塑艺术'],
  ARRAY['杨柳青年画', '天津风筝魏'],
  ARRAY['《中国传统工艺全集》', '《天津民间艺术志》'],
  'active',
  NOW(),
  NOW()
),
(
  '天津方言',
  '方言文化',
  '地方语言',
  '天津方言是中国北方方言的一种，具有独特的语音、词汇和语法特点。天津方言的语音特点包括一声变调、轻声较多、儿化音丰富等；词汇方面有很多独特的方言词，如"嘛"（什么）、"哏儿"（有趣）、"倍儿"（非常）等；语法上也有一些特殊的表达方式。天津方言生动活泼，富有表现力，是天津地域文化的重要组成部分。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20dialect%20culture%20traditional%20street%20scene',
  ARRAY['天津方言', '地方语言', '方言文化'],
  ARRAY['天津民俗', '天津曲艺'],
  ARRAY['《天津方言词典》', '《汉语方言大词典》'],
  'active',
  NOW(),
  NOW()
),
(
  '天津之眼',
  '建筑风格',
  '现代建筑',
  '天津之眼是世界上唯一建在桥上的摩天轮，位于天津市红桥区海河畔，是天津的标志性建筑之一。摩天轮直径110米，轮外装挂48个360度透明座舱，每个座舱可乘坐8人，旋转一周约需30分钟。天津之眼不仅是一个游乐设施，也是欣赏天津城市风光的绝佳地点，尤其是夜晚灯光亮起时，美轮美奂。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20Eye%20Ferris%20wheel%20night%20view',
  ARRAY['天津之眼', '摩天轮', '现代建筑', '地标建筑'],
  ARRAY['海河', '天津夜景'],
  ARRAY['天津旅游局官方网站', '《天津城市规划志》'],
  'active',
  NOW(),
  NOW()
),
(
  '狗不理包子',
  '地方小吃',
  '传统美食',
  '狗不理包子是天津著名的传统小吃，始创于清代咸丰年间，以其皮薄、馅大、味道鲜美而闻名。其特点是选用优质面粉制作皮料，馅料讲究，制作工艺精细，每个包子有18个褶。狗不理包子的名称来源于创始人高贵有（乳名"狗子"），因其生意繁忙，顾不上搭理顾客，久而久之被称为"狗不理"。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Goubuli%20steamed%20buns%20traditional%20shop',
  ARRAY['狗不理包子', '传统美食', '天津小吃'],
  ARRAY['十八街麻花', '耳朵眼炸糕'],
  ARRAY['《天津小吃志》', '《中国名小吃大全》'],
  'active',
  NOW(),
  NOW()
),
(
  '五大道建筑群',
  '建筑风格',
  '近代建筑',
  '五大道位于天津市和平区，是天津近代建筑的集中地，拥有英、法、意、德、西班牙等国各式建筑2000多栋，其中风貌建筑300余栋。这些建筑风格多样，包括哥特式、罗马式、巴洛克式、文艺复兴式等，被誉为"万国建筑博览馆"。五大道是天津历史文化的重要载体，反映了天津近代的发展历程和多元文化融合的特点。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20Five%20Avenues%20historic%20buildings',
  ARRAY['五大道', '近代建筑', '历史建筑', '建筑风格'],
  ARRAY['意式风情区', '天津租界历史'],
  ARRAY['《天津近代建筑志》', '《五大道历史文化街区保护规划》'],
  'active',
  NOW(),
  NOW()
),
(
  '天津时调',
  '文学艺术',
  '曲艺',
  '天津时调是天津特有的曲艺形式，起源于清代，流行于天津及周边地区。它以天津方言演唱，曲调丰富，表现力强，内容多反映天津人民的生活和思想感情。天津时调的表演形式简单，通常由一人演唱，伴奏乐器主要有三弦、四胡等。其代表曲目有《放风筝》、《踢毽》、《大西厢》等。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20traditional%20folk%20music%20performance',
  ARRAY['天津时调', '曲艺', '民间艺术'],
  ARRAY['京韵大鼓', '天津快板'],
  ARRAY['《中国曲艺志·天津卷》', '《天津曲艺史》'],
  'active',
  NOW(),
  NOW()
),
(
  '天后宫',
  '宗教信仰',
  '道教',
  '天津天后宫俗称"娘娘宫"，位于南开区古文化街中心，是天津市区最古老的建筑群之一，也是中国北方最大的妈祖庙。天后宫始建于元代，明永乐年间重建，是天津城市发展的历史见证。天后宫内供奉着海神妈祖，每年农历三月二十三日是妈祖诞辰，届时会举行盛大的庙会活动，吸引众多信徒和游客前来朝拜。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Tianjin%20Tianhou%20Palace%20temple%20architecture',
  ARRAY['天后宫', '妈祖庙', '道教', '古建筑'],
  ARRAY['古文化街', '妈祖文化'],
  ARRAY['《天津天后宫志》', '《中国道教宫观志》'],
  'active',
  NOW(),
  NOW()
);

-- 插入其他中国文化知识数据
INSERT INTO cultural_knowledge (title, category, subcategory, content, image_url, tags, related_items, sources, status, created_at, updated_at) VALUES
(
  '传统纹样分类',
  '文化知识',
  '传统纹样',
  '中国传统纹样主要包括：1. 几何纹样（如回纹、云纹），2. 动物纹样（如龙纹、凤纹），3. 植物纹样（如牡丹纹、莲花纹），4. 人物纹样，5. 文字纹样。这些纹样常被用于传统服饰、陶瓷、建筑等领域。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20patterns%20geometric%20floral%20designs',
  ARRAY['传统纹样', '分类', '文化元素'],
  ARRAY['传统服饰', '陶瓷', '建筑'],
  ARRAY['《中国传统纹样大全》'],
  'active',
  NOW(),
  NOW()
),
(
  '非遗技艺介绍',
  '文化知识',
  '非遗传承',
  '非物质文化遗产技艺包括：1. 传统手工艺（如刺绣、木雕、陶瓷），2. 传统表演艺术（如京剧、皮影戏），3. 传统节日（如春节、端午节），4. 传统知识（如中医、天文历法）。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20intangible%20cultural%20heritage%20craftsmanship%20workshop',
  ARRAY['非遗技艺', '传统工艺', '文化传承'],
  ARRAY['刺绣', '木雕', '陶瓷', '京剧'],
  ARRAY['《中国非物质文化遗产名录》'],
  'active',
  NOW(),
  NOW()
),
(
  '中国传统色彩体系',
  '文化知识',
  '传统色彩',
  '中国传统色彩体系源于自然和哲学思想，主要包括：1. 五行色彩（青、赤、黄、白、黑），2. 传统染料（如靛蓝、朱砂、赭石），3. 宫廷色彩（如明黄、朱红），4. 民间色彩（如大红、翠绿）。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20color%20palette%20five%20elements%20philosophy',
  ARRAY['传统色彩', '五行色彩', '色彩体系'],
  ARRAY['传统染料', '宫廷色彩', '民间色彩'],
  ARRAY['《中国传统色彩》'],
  'active',
  NOW(),
  NOW()
),
(
  '传统建筑元素',
  '文化知识',
  '传统建筑',
  '中国传统建筑元素包括：1. 斗拱，2. 飞檐，3. 彩绘，4. 石狮，5. 门钉，6. 藻井。这些元素不仅具有实用功能，还蕴含着丰富的文化内涵。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20architecture%20elements%20dougong%20brackets',
  ARRAY['传统建筑', '建筑元素', '文化内涵'],
  ARRAY['斗拱', '飞檐', '彩绘'],
  ARRAY['《中国传统建筑》'],
  'active',
  NOW(),
  NOW()
),
(
  '传统节日习俗',
  '文化知识',
  '传统节日',
  '中国传统节日有丰富的习俗：1. 春节（贴春联、吃年夜饭、放鞭炮），2. 元宵节（赏花灯、吃元宵），3. 清明节（扫墓、踏青），4. 端午节（吃粽子、赛龙舟），5. 中秋节（赏月、吃月饼）。',
  '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20traditional%20festival%20celebrations%20lanterns%20red',
  ARRAY['传统节日', '节日习俗', '文化活动'],
  ARRAY['春节', '元宵节', '清明节', '端午节', '中秋节'],
  ARRAY['《中国传统节日》'],
  'active',
  NOW(),
  NOW()
);
