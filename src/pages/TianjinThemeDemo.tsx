/**
 * 天津文化主题展示页面
 * 展示天津文化主题深化的所有组件和效果
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TianjinCard,
  TianjinButton,
  TianjinBadge,
  TianjinDivider,
  TianjinIcon,
  TianjinEyeDecoration,
  JinmenShowcase,
  LaozihaoShowcase,
} from '../components/TianjinThemeComponents';
import {
  Sparkles,
  Palette,
  Wind,
  Crown,
  MapPin,
  Award,
  Star,
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
} from 'lucide-react';

const TianjinThemeDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAF8] to-[#F5F3F0] py-12 px-4 sm:px-6 lg:px-8">
      {/* 页面标题 */}
      <div className="max-w-7xl mx-auto mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <TianjinIcon name="haihe" size={48} animated />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1E5F8E] via-[#C68E17] to-[#C21807] bg-clip-text text-transparent">
              津门雅韵·文化主题
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            融合海河文化、津门老字号、传统技艺的天津文化主题深化版
            <br />
            展现天津独特的城市魅力与文化底蕴
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto space-y-16">
        {/* 1. 天津文化色彩展示 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <Palette className="w-6 h-6 text-[#1E5F8E]" />
            天津文化色彩体系
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: '海河蓝', color: '#1E5F8E', desc: '主色调' },
              { name: '砖红', color: '#A0522D', desc: '历史建筑' },
              { name: '泥人张红', color: '#C21807', desc: '传统工艺' },
              { name: '杨柳青绿', color: '#228B22', desc: '年画艺术' },
              { name: '风筝魏蓝', color: '#87CEEB', desc: '传统技艺' },
              { name: '桂发祥金', color: '#C68E17', desc: '尊贵典雅' },
            ].map((item, index) => (
              <motion.div
                key={item.name}
                className="rounded-xl overflow-hidden shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div
                  className="h-24 w-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="p-3 bg-white">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                  <p className="text-xs font-mono text-gray-400 mt-1">{item.color}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <TianjinDivider variant="haihe" />

        {/* 2. 特色卡片展示 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#C68E17]" />
            天津文化特色卡片
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TianjinCard variant="haihe" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TianjinIcon name="haihe" size={32} />
                <h3 className="text-xl font-bold text-[#1E5F8E]">海河波纹</h3>
              </div>
              <p className="text-gray-600 mb-4">
                海河是天津的母亲河，波纹设计象征着天津的灵动与活力。
              </p>
              <div className="flex gap-2">
                <TianjinBadge variant="jinmen">津门特色</TianjinBadge>
              </div>
            </TianjinCard>

            <TianjinCard variant="brick" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-8 h-8 text-[#A0522D]" />
                <h3 className="text-xl font-bold text-[#A0522D]">五大道</h3>
              </div>
              <p className="text-gray-600 mb-4">
                五大道是天津的历史文化街区，砖墙纹理展现历史厚重感。
              </p>
              <div className="flex gap-2">
                <TianjinBadge variant="laozihao">历史街区</TianjinBadge>
              </div>
            </TianjinCard>

            <TianjinCard variant="nianhua" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TianjinIcon name="yangliuqing" size={32} />
                <h3 className="text-xl font-bold text-[#228B22]">杨柳青年画</h3>
              </div>
              <p className="text-gray-600 mb-4">
                杨柳青年画是中国四大木版年画之一，色彩鲜艳明快。
              </p>
              <div className="flex gap-2">
                <TianjinBadge variant="feiyi">非遗文化</TianjinBadge>
              </div>
            </TianjinCard>

            <TianjinCard variant="clay" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TianjinIcon name="nirenzhang" size={32} />
                <h3 className="text-xl font-bold text-[#C21807]">泥人张</h3>
              </div>
              <p className="text-gray-600 mb-4">
                泥人张彩塑是天津传统民间艺术，泥塑质感展现传统工艺。
              </p>
              <div className="flex gap-2">
                <TianjinBadge variant="feiyi">非遗文化</TianjinBadge>
              </div>
            </TianjinCard>

            <TianjinCard variant="kite" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TianjinIcon name="fengzheng" size={32} animated />
                <h3 className="text-xl font-bold text-[#87CEEB]">风筝魏</h3>
              </div>
              <p className="text-gray-600 mb-4">
                风筝魏是天津传统风筝制作技艺，轻盈飘逸展现匠心。
              </p>
              <div className="flex gap-2">
                <TianjinBadge variant="laozihao">老字号</TianjinBadge>
              </div>
            </TianjinCard>

            <TianjinCard variant="golden" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <TianjinIcon name="guifaxiang" size={32} />
                <h3 className="text-xl font-bold text-[#C68E17]">桂发祥</h3>
              </div>
              <p className="text-gray-600 mb-4">
                桂发祥十八街麻花是天津传统名吃，金色象征尊贵与品质。
              </p>
              <div className="flex gap-2">
                <TianjinBadge variant="laozihao">中华老字号</TianjinBadge>
              </div>
            </TianjinCard>
          </div>
        </section>

        <TianjinDivider variant="haihe" />

        {/* 3. 特色按钮展示 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#C21807]" />
            天津文化特色按钮
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">海河蓝</h3>
              <div className="flex flex-wrap gap-3">
                <TianjinButton variant="haihe" size="sm">小型按钮</TianjinButton>
                <TianjinButton variant="haihe" size="md">中型按钮</TianjinButton>
                <TianjinButton variant="haihe" size="lg">大型按钮</TianjinButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">泥人张红</h3>
              <div className="flex flex-wrap gap-3">
                <TianjinButton variant="nirenzhang" size="sm">小型按钮</TianjinButton>
                <TianjinButton variant="nirenzhang" size="md">中型按钮</TianjinButton>
                <TianjinButton variant="nirenzhang" size="lg">大型按钮</TianjinButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">杨柳青绿</h3>
              <div className="flex flex-wrap gap-3">
                <TianjinButton variant="yangliuqing" size="sm">小型按钮</TianjinButton>
                <TianjinButton variant="yangliuqing" size="md">中型按钮</TianjinButton>
                <TianjinButton variant="yangliuqing" size="lg">大型按钮</TianjinButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">桂发祥金</h3>
              <div className="flex flex-wrap gap-3">
                <TianjinButton variant="guifaxiang" size="sm">小型按钮</TianjinButton>
                <TianjinButton variant="guifaxiang" size="md">中型按钮</TianjinButton>
                <TianjinButton variant="guifaxiang" size="lg">大型按钮</TianjinButton>
              </div>
            </div>
          </div>
        </section>

        <TianjinDivider variant="haihe" />

        {/* 4. 徽章展示 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <Crown className="w-6 h-6 text-[#C68E17]" />
            天津文化特色徽章
          </h2>
          <div className="flex flex-wrap gap-4">
            <TianjinBadge variant="laozihao">中华老字号</TianjinBadge>
            <TianjinBadge variant="feiyi">非物质文化遗产</TianjinBadge>
            <TianjinBadge variant="jinmen">津门特色</TianjinBadge>
            <TianjinBadge variant="vip-gold">VIP会员</TianjinBadge>
            <TianjinBadge variant="laozihao" icon={<Star className="w-3 h-3" />}>百年传承</TianjinBadge>
            <TianjinBadge variant="feiyi" icon={<Heart className="w-3 h-3" />}>匠心工艺</TianjinBadge>
          </div>
        </section>

        <TianjinDivider variant="haihe" />

        {/* 5. 天津之眼装饰 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <Wind className="w-6 h-6 text-[#1E5F8E]" />
            天津之眼
          </h2>
          <div className="flex justify-center py-8">
            <TianjinEyeDecoration size={200} />
          </div>
          <p className="text-center text-gray-600 mt-4">
            天津之眼是世界唯一建在桥上的摩天轮，象征着天津的现代化与浪漫
          </p>
        </section>

        <TianjinDivider variant="haihe" />

        {/* 6. 津门特色展示组件 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#1E5F8E]" />
            津门特色展示
          </h2>
          <JinmenShowcase
            title="探索天津文化"
            description="天津是一座拥有600多年历史的文化名城，融合了南北文化精髓，形成了独特的津门文化。"
            features={[
              { icon: <Palette className="w-5 h-5" />, text: '传统工艺' },
              { icon: <Award className="w-5 h-5" />, text: '老字号' },
              { icon: <Wind className="w-5 h-5" />, text: '民俗艺术' },
              { icon: <Star className="w-5 h-5" />, text: '非遗文化' },
            ]}
          />
        </section>

        <TianjinDivider variant="haihe" />

        {/* 7. 老字号展示 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#C68E17]" />
            津门老字号
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LaozihaoShowcase
              name="泥人张彩塑"
              category="泥人张"
              founded="清代道光年间"
              description="泥人张彩塑是天津传统民间艺术，以塑古塑今、形神兼备著称，是中国泥塑艺术的杰出代表。"
            />
            <LaozihaoShowcase
              name="杨柳青年画"
              category="杨柳青"
              founded="明代崇祯年间"
              description="杨柳青年画是中国四大木版年画之一，以色彩鲜艳、构图饱满、寓意吉祥而闻名。"
            />
            <LaozihaoShowcase
              name="风筝魏"
              category="风筝魏"
              founded="清代同治年间"
              description="风筝魏是天津传统风筝制作技艺，以造型优美、彩绘精湛、放飞高稳而著称。"
            />
            <LaozihaoShowcase
              name="桂发祥十八街麻花"
              category="桂发祥"
              founded="清代光绪年间"
              description="桂发祥十八街麻花是天津传统名吃，以香、甜、酥、脆、久放不绵的特点享誉海内外。"
            />
          </div>
        </section>

        <TianjinDivider variant="haihe" />

        {/* 8. 图标展示 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#228B22]" />
            天津文化图标
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {[
              { name: 'haihe', label: '海河' },
              { name: 'tianjin-eye', label: '天津之眼' },
              { name: 'nirenzhang', label: '泥人张' },
              { name: 'yangliuqing', label: '杨柳青' },
              { name: 'fengzheng', label: '风筝魏' },
              { name: 'guifaxiang', label: '桂发祥' },
              { name: 'goubuli', label: '狗不理' },
            ].map((item) => (
              <div key={item.name} className="flex flex-col items-center gap-2">
                <TianjinIcon name={item.name as any} size={48} animated={item.name === 'fengzheng' || item.name === 'tianjin-eye'} />
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <TianjinDivider variant="haihe" />

        {/* 9. 使用示例 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-2">
            <Star className="w-6 h-6 text-[#C68E17]" />
            实际应用示例
          </h2>
          
          {/* 作品卡片示例 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TianjinCard variant="haihe" className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-[#1E5F8E]/20 to-[#87CEEB]/20 flex items-center justify-center">
                <TianjinIcon name="haihe" size={80} />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TianjinBadge variant="jinmen">津门特色</TianjinBadge>
                  <TianjinBadge variant="feiyi">非遗</TianjinBadge>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">海河文化之旅</h3>
                <p className="text-gray-600 mb-4">探索天津海河沿岸的历史文化，感受津门风情...</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" /> 256
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" /> 48
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" /> 32
                    </span>
                  </div>
                  <TianjinButton variant="haihe" size="sm" icon={<Bookmark className="w-4 h-4" />}>
                    收藏
                  </TianjinButton>
                </div>
              </div>
            </TianjinCard>

            <TianjinCard variant="golden" className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-[#C68E17]/20 to-[#FDF8E8] flex items-center justify-center">
                <TianjinIcon name="guifaxiang" size={80} />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TianjinBadge variant="laozihao">老字号</TianjinBadge>
                  <TianjinBadge variant="vip-gold">精选</TianjinBadge>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">天津美食地图</h3>
                <p className="text-gray-600 mb-4">品味天津地道美食，从狗不理包子到十八街麻花...</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" /> 512
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" /> 96
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" /> 64
                    </span>
                  </div>
                  <TianjinButton variant="guifaxiang" size="sm" icon={<Bookmark className="w-4 h-4" />}>
                    收藏
                  </TianjinButton>
                </div>
              </div>
            </TianjinCard>
          </div>
        </section>

        {/* 页面底部 */}
        <div className="text-center py-12">
          <TianjinDivider variant="haihe" className="mb-8" />
          <p className="text-gray-500">
            津脉智坊 · 传承津门文化 · 共创美好未来
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <TianjinIcon name="haihe" size={24} />
            <TianjinIcon name="tianjin-eye" size={24} />
            <TianjinIcon name="nirenzhang" size={24} />
            <TianjinIcon name="yangliuqing" size={24} />
            <TianjinIcon name="fengzheng" size={24} />
            <TianjinIcon name="guifaxiang" size={24} />
            <TianjinIcon name="goubuli" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TianjinThemeDemo;
