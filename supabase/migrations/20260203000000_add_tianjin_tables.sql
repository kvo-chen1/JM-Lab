
-- Create tianjin_templates table
CREATE TABLE IF NOT EXISTS public.tianjin_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tianjin_offline_experiences table
CREATE TABLE IF NOT EXISTS public.tianjin_offline_experiences (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price TEXT,
  image TEXT,
  available_slots INTEGER DEFAULT 0,
  rating NUMERIC(3, 1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tianjin_traditional_brands table
CREATE TABLE IF NOT EXISTS public.tianjin_traditional_brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  description TEXT,
  established_year TEXT,
  collaboration_tools INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tianjin_hotspots table
CREATE TABLE IF NOT EXISTS public.tianjin_hotspots (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  status TEXT,
  start_date TEXT,
  end_date TEXT,
  organizer TEXT,
  image TEXT,
  tags TEXT[],
  cultural_elements TEXT[],
  participant_count INTEGER DEFAULT 0,
  has_prize BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tianjin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tianjin_offline_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tianjin_traditional_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tianjin_hotspots ENABLE ROW LEVEL SECURITY;

-- Create policies (Public read)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tianjin_templates' AND policyname = 'Public templates are viewable') THEN
    CREATE POLICY "Public templates are viewable" ON public.tianjin_templates FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tianjin_offline_experiences' AND policyname = 'Public experiences are viewable') THEN
    CREATE POLICY "Public experiences are viewable" ON public.tianjin_offline_experiences FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tianjin_traditional_brands' AND policyname = 'Public brands are viewable') THEN
    CREATE POLICY "Public brands are viewable" ON public.tianjin_traditional_brands FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tianjin_hotspots' AND policyname = 'Public hotspots are viewable') THEN
    CREATE POLICY "Public hotspots are viewable" ON public.tianjin_hotspots FOR SELECT USING (true);
  END IF;
END
$$;

-- Insert Seed Data for Hotspots
INSERT INTO public.tianjin_hotspots (id, title, description, type, status, start_date, end_date, organizer, image, tags, cultural_elements, participant_count, has_prize)
VALUES 
('hotspot-001', '津湾广场灯光秀', '海河畔的璀璨明珠，光影交织的视觉盛宴，展现天津现代与历史的交融之美。', 'theme', 'ongoing', '每周五-周日', '长期', '天津市文旅局', 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['灯光秀', '夜游', '打卡'], ARRAY['海河文化', '现代光影'], 9999, false),
('hotspot-002', '五大道海棠节', '漫步万国建筑博览群，共赴一场春日花约，感受"万国建筑博览会"的独特魅力。', 'theme', 'upcoming', '2025-04-01', '2025-04-10', '和平区旅游局', 'https://images.pexels.com/photos/2058498/pexels-photo-2058498.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['赏花', '摄影', '历史街区'], ARRAY['洋楼文化', '海棠花'], 5000, false),
('hotspot-003', '西北角早点美食节', '碳水快乐星球，寻找最地道的天津老味，体验"津门第一早"的烟火气。', 'theme', 'ongoing', '长期开放', '长期', '红桥区商务局', 'https://images.pexels.com/photos/2291599/pexels-photo-2291599.jpeg?auto=compress&cs=tinysrgb&w=800', ARRAY['美食', '早点', '老味'], ARRAY['津味美食', '市井文化'], 8888, false)
ON CONFLICT (id) DO NOTHING;

-- Insert Seed Data for Templates
INSERT INTO public.tianjin_templates (name, description, thumbnail, category, usage_count)
VALUES
('津沽文化节主题模板', '融合天津传统文化元素，适用于各类文化节活动宣传设计。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20cultural%20festival%20template%20design', '节日主题', 235),
('海河风光模板', '以海河风光为背景，适合城市宣传和旅游相关设计。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Haihe%20River%20scenery%20template', '城市风光', 189),
('杨柳青年画风格模板', '模仿杨柳青年画的线条和色彩风格，具有浓厚的传统韵味。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20painting%20style%20template', '传统风格', 156),
('天津小吃宣传模板', '为天津特色小吃设计的宣传模板，突出地方美食特色。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20local%20food%20promotion%20template', '美食宣传', 123),
('城市地标插画模板', '以天津之眼、解放桥等地标为核心图形的插画类模板。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20city%20landmark%20illustration%20template', '城市风光', 144),
('非遗风物纹样模板', '提取泥人张、风筝魏等非遗元素纹样，适配现代版式。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20intangible%20heritage%20pattern%20design%20template', '非遗传承', 117),
('夜游光影视觉模板', '以海河夜景的光影氛围为主视觉，适配品牌活动海报。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20night%20tour%20light%20and%20shadow%20visual%20template', '夜游光影', 98),
('老字号联名模板', '面向老字号品牌的联名海报与包装视觉模板。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20traditional%20brand%20co-branding%20visual%20template', '品牌联名', 135),
('滨海蓝色旅游模板', '提取滨海新区的海风与蓝色主题，面向旅游宣传设计。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Binhai%20blue%20tourism%20poster%20template', '旅游主题', 122),
('工业记忆影像模板', '以老厂房与工业质感为主，适合纪录片与影像项目。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20industrial%20memory%20visual%20template', '工业风', 87),
('文博展陈主题模板', '适用于博物馆、美术馆展陈的主视觉与导视系统。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Museum%20exhibition%20visual%20identity%20template', '文博展陈', 95),
('港口文化视觉模板', '以港口机械与城市航运为元素，体现天津港口文化。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20port%20culture%20visual%20template', '港口文化', 76),
('五大道历史风情模板', '以五大道近代建筑群为视觉元素，突出天津的历史人文风貌。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Wudadao%20historical%20architecture%20poster%20template', '历史风情', 142),
('意式风情区摄影模板', '以意式风情区的欧式街景为背景，适合城市旅行与摄影主题设计。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Italian%20Style%20Town%20photography%20template', '城市风光', 168),
('鼓楼文化宣传模板', '围绕鼓楼与老城厢的市井生活，适合社区文化与城市宣传设计。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Gulou%20culture%20promotion%20template', '城市文化', 121),
('北塘海鲜美食模板', '以北塘渔港与海鲜元素为主，适合餐饮美食类宣传设计。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Beitang%20seafood%20promotion%20template%20Tianjin', '美食宣传', 132),
('静海葡萄节活动模板', '围绕静海葡萄节打造节庆主视觉，适配导视与物料延展。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Jinghai%20grape%20festival%20poster%20template', '节日主题', 109),
('滨海新区科技主题模板', '以科技蓝与未来感图形为核心，突出滨海新区产业形象。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Binhai%20New%20Area%20technology%20theme%20visual%20template', '科技主题', 87),
('蓟州长城风光模板', '以蓟州长城与山野风光为主视觉，适合文旅宣传类设计。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Jizhou%20Great%20Wall%20scenery%20poster%20template%20Tianjin', '自然风光', 153),
('海河滨水休闲模板', '围绕海河滨水休闲的生活方式场景，适合社区活动与品牌海报。', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20riverside%20leisure%20lifestyle%20visual%20template%20Tianjin', '城市休闲', 174);

-- Insert Seed Data for Brands
INSERT INTO public.tianjin_traditional_brands (name, logo, description, established_year, collaboration_tools, popularity)
VALUES
('桂发祥', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Guifaxiang%20traditional%20brand%20logo', '创建于1927年，以十八街麻花闻名，是天津食品行业的老字号品牌。', '1927', 8, 96),
('狗不理', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Goubuli%20traditional%20brand%20logo', '创建于1858年，以特色包子闻名，是天津餐饮行业的代表性老字号。', '1858', 12, 98),
('耳朵眼', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Erduoyan%20traditional%20brand%20logo', '创建于1900年，以炸糕和酒类产品闻名，是天津的传统老字号。', '1900', 6, 92),
('老美华', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Laomeihua%20traditional%20shoe%20brand%20logo', '始于民国时期的传统鞋履品牌，以手工缝制与舒适耐穿著称。', '1911', 5, 88),
('大福来', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Dafulai%20guobacai%20brand%20logo', '以锅巴菜闻名，糊辣香浓、层次丰富，是天津特色早点代表。', '1930', 4, 85),
('果仁张', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Guorenzhang%20candied%20chestnut%20brand%20logo', '百年坚果品牌，以糖炒栗子香甜饱满闻名，老天津味道的代表。', '1906', 6, 90),
('茶汤李', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Chatangli%20sweet%20soup%20brand%20logo', '源自清末的茶汤品牌，口感细腻柔滑、甘香回甜，承载城市记忆。', '1895', 3, 83),
('利顺德', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Lishunde%20hotel%20heritage%20brand%20logo', '百年酒店品牌，承载天津近代史与文化记忆，适合文旅联名。', '1863', 7, 91),
('亨得利表行', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Hengdeli%20watch%20store%20heritage%20brand%20logo', '老牌钟表行品牌，精工与匠艺象征，可开展工艺联名。', '1890', 5, 86),
('正兴德茶庄', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Zhengxingde%20tea%20house%20traditional%20brand%20logo', '历史悠久的茶庄品牌，融合津门茶文化与现代设计。', '1908', 4, 84),
('石头门坎素包', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Shitoumenkan%20vegetarian%20bun%20heritage%20brand%20logo', '素包名店，传承传统素馅工艺，可做餐饮联名设计。', '1926', 3, 82),
('孙记烧卖', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Sunji%20shaomai%20traditional%20brand%20logo', '街巷点心品牌，家常美味代表，适合集市活动联名。', '1935', 2, 79),
('天津海河乳品', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20Dairy%20Tianjin%20brand%20logo', '天津本土知名乳品企业，以新鲜牛奶和乳制品闻名，是天津市民信赖的乳品品牌。', '1957', 8, 95),
('海河', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20River%20brand%20logo%20Tianjin', '以海河命名的天津本土品牌，承载着天津人的城市记忆与情感。', '1950', 6, 88);

-- Insert Seed Data for Offline Experiences
INSERT INTO public.tianjin_offline_experiences (name, description, location, price, image, available_slots, rating, review_count)
VALUES
('杨柳青古镇年画体验', '亲手绘制杨柳青年画，体验传统木版年画的制作过程。', '天津市西青区杨柳青古镇', '¥128/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20ancient%20town%20New%20Year%20painting%20experience', 15, 4.8, 126),
('泥人张彩塑工坊', '跟随泥人张传承人学习彩塑技艺，制作属于自己的泥人作品。', '天津市南开区古文化街', '¥168/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Nirenzhang%20clay%20sculpture%20workshop%20experience', 8, 4.9, 89),
('风筝魏风筝制作体验', '学习传统风筝的制作技艺，亲手制作一只精美的天津风筝。', '天津市和平区劝业场', '¥98/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Weifeng%20kite%20making%20experience', 20, 4.7, 76),
('相声社沉浸体验', '走进相声社，体验台前幕后，与演员互动学习基本“捧逗”。', '天津市河北区意式风情区', '¥158/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20crosstalk%20club%20immersive%20experience', 12, 4.8, 64),
('古文化街导览打卡', '深度导览古文化街，打卡风物人文，体验天津老城味道。', '天津市南开区古文化街', '¥88/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20guided%20tour', 25, 4.6, 142),
('瓷器绘彩手作班', '在工坊学习瓷器绘彩，从草图到上色完成一件专属作品。', '天津市红桥区手作工坊', '¥198/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Ceramic%20painting%20workshop%20experience', 10, 4.9, 58),
('津味美食烹饪体验', '学习锅巴菜、煎饼果子等家常做法，掌握地道津味。', '天津市河西区共享厨房', '¥138/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20local%20cuisine%20cooking%20class%20experience', 18, 4.7, 73),
('海河夜游船', '乘坐游船欣赏海河夜景，配合讲解了解城市光影与故事。', '天津市河东区海河码头', '¥168/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20night%20cruise%20experience', 40, 4.5, 211),
('天津地标摄影采风', '跟随向导拍摄地标建筑，学习夜景与构图技巧。', '天津市河西区文化中心', '¥158/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20city%20landmark%20photography%20walk', 22, 4.8, 96),
('石头门坎素包制作课', '学习传统素包制作技法，从和面到包制完整体验。', '天津市南开区老城厢', '¥128/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Shitoumenkan%20vegetarian%20bun%20making%20workshop%20experience', 16, 4.6, 54),
('茶汤李手作茶汤体验', '跟随老师学习传统茶汤调制，体验细腻甘香的津门味道。', '天津市河东区小吃工坊', '¥88/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Chatangli%20sweet%20soup%20making%20workshop%20experience', 20, 4.5, 67),
('海河皮划艇城市漫游', '专业教练带领在海河进行皮划艇体验，欣赏城市水岸风光。', '天津市河西区海河沿线', '¥198/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20kayaking%20urban%20tour%20experience', 12, 4.7, 82),
('意式风情区历史徒步', '专业向导讲解近代建筑与城市史，深度漫步意式风情区。', '天津市河北区意式风情区', '¥68/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Italian%20Style%20Town%20heritage%20walking%20tour', 30, 4.6, 134),
('京剧基础脸谱绘制课', '学习京剧脸谱色彩与构图，完成一幅个人脸谱作品。', '天津市红桥区戏曲社', '¥128/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Peking%20opera%20face%20painting%20workshop%20experience', 14, 4.8, 92),
('传统皮影制作与表演', '体验皮影雕刻与拼装，学习基本操偶，现场小型演出。', '天津市津南区文化馆', '¥158/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Chinese%20shadow%20puppetry%20making%20and%20performance%20workshop%20experience', 10, 4.7, 59),
('老字号巡礼美食徒步', '串联多家天津老字号，边走边品，了解品牌故事与美味。', '天津市南开区古文化街', '¥98/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20time-honored%20brands%20food%20tour%20walking%20experience', 25, 4.7, 105),
('杨柳青木版水印工艺课', '学习木版水印工艺流程，完成一件传统水印作品。', '天津市西青区杨柳青古镇', '¥168/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20woodblock%20water%20printing%20craft%20workshop%20experience', 12, 4.8, 64),
('非遗剪纸工坊体验', '学习传统剪纸技法，完成节庆主题剪纸作品并装裱展示。', '天津市和平区文化馆', '¥88/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Chinese%20paper-cutting%20workshop%20experience%20festive%20designs', 24, 4.6, 72),
('京韵大鼓入门体验课', '在老师带领下体验击鼓与演唱的基本节奏与腔韵。', '天津市红桥区曲艺社', '¥128/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Peking%20drum%20music%20beginner%20workshop%20experience%20traditional%20stage', 16, 4.7, 58),
('年画拓印亲子课', '亲子共同学习年画拓印流程，完成一幅纪念作品。', '天津市西青区杨柳青古镇', '¥98/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Yangliuqing%20New%20Year%20print%20rubbing%20parent-child%20workshop%20experience', 20, 4.8, 88),
('古文化街夜拍漫步', '沿古文化街夜游拍摄，学习夜景用光与构图技巧。', '天津市南开区古文化街', '¥88/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20Ancient%20Culture%20Street%20night%20photography%20walk%20experience', 28, 4.6, 119),
('港口工业遗址探访', '探访天津港工业遗址，学习纪录摄影与城市工业美学。', '天津市滨海新区港区', '¥128/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20port%20industrial%20heritage%20photography%20tour%20experience', 18, 4.7, 76),
('瓷器修复体验课', '了解瓷器修复基础流程，体验简单修补与彩绘工序。', '天津市红桥区手作工坊', '¥168/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Ceramic%20restoration%20beginner%20workshop%20experience%20painting%20and%20repair', 12, 4.7, 64),
('煎饼果子大师班', '学习面糊调配与摊制技巧，完成地道风味的煎饼果子。', '天津市河西区共享厨房', '¥118/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Tianjin%20jianbing%20guozi%20cooking%20masterclass%20workshop%20experience', 20, 4.6, 91),
('海河城市骑行漫游', '沿海河骑行漫游，结合导览讲解城市历史与地标。', '天津市河西区海河沿线', '¥88/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Haihe%20riverfront%20city%20cycling%20tour%20experience', 30, 4.5, 110),
('果仁张栗子手作演示', '观摩糖炒栗子工艺演示，了解配方与火候，现场试吃。', '天津市和平区老字号门店', '¥68/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Candied%20chestnut%20handcraft%20demonstration%20workshop%20experience', 26, 4.6, 85),
('传统风筝放飞体验日', '学习风筝放飞技巧与保养，现场集体放飞与拍照打卡。', '天津市河西区文化中心绿地', '¥68/人', '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=square&prompt=Traditional%20kite%20flying%20family%20experience%20day%20Tianjin', 40, 4.7, 120);