-- 更新文化知识数据，使用稳定的Unsplash图片替代AI生成图片
-- 这样可以避免"The image is generating..."的占位符问题

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1584448082978-4553a877b910?w=800&h=600&fit=crop&q=80'
WHERE title = '杨柳青年画';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=800&h=600&fit=crop&q=80'
WHERE title = '泥人张彩塑';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=600&fit=crop&q=80'
WHERE title = '天津方言';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1513622790541-eaa84d356909?w=800&h=600&fit=crop&q=80'
WHERE title = '天津之眼';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop&q=80'
WHERE title = '狗不理包子';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop&q=80'
WHERE title = '五大道建筑群';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop&q=80'
WHERE title = '天津时调';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop&q=80'
WHERE title = '天后宫';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800&h=600&fit=crop&q=80'
WHERE title = '传统纹样分类';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=800&h=600&fit=crop&q=80'
WHERE title = '非遗技艺介绍';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&h=600&fit=crop&q=80'
WHERE title = '中国传统色彩体系';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop&q=80'
WHERE title = '传统建筑元素';

UPDATE cultural_knowledge 
SET image_url = 'https://images.unsplash.com/photo-1548625361-1d6e23c9d6ad?w=800&h=600&fit=crop&q=80'
WHERE title = '传统节日习俗';
