import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';
import GradientHero from '@/components/GradientHero';

const Developers: React.FC = () => {
  const { isDark } = useTheme();

  const apis = [
    {
      title: '文生图 API',
      description: '基于 Stable Diffusion 和 Flux 的高性能图像生成接口。支持中文提示词，毫秒级响应。',
      endpoint: 'POST /v1/images/generations',
      price: '¥0.1 / 张',
      icon: 'fa-image',
      color: 'blue'
    },
    {
      title: '国潮风格化 API',
      description: '专为中国传统文化优化的风格迁移接口，一键生成剪纸、水墨、年画风格。',
      endpoint: 'POST /v1/images/style-transfer',
      price: '¥0.15 / 张',
      icon: 'fa-paint-brush',
      color: 'red'
    },
    {
      title: '文生视频 API',
      description: '基于可灵/Sora 模型的短视频生成能力，支持 5s/10s 视频生成。',
      endpoint: 'POST /v1/videos/generations',
      price: '¥2.0 / 秒',
      icon: 'fa-video',
      color: 'purple'
    },
    {
      title: 'IP 智能问答 API',
      description: '基于 RAG 技术的垂直领域问答，内置非遗知识库。',
      endpoint: 'POST /v1/chat/completions',
      price: '¥0.02 / 1k tokens',
      icon: 'fa-comments',
      color: 'green'
    }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <GradientHero
        title="开发者 API"
        subtitle="用 AI 赋能你的应用，连接传统文化与未来科技"
        theme="blue"
        size="lg"
      />

      <main className="container mx-auto px-4 py-12">
        {/* API 列表 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">核心能力</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apis.map((api, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className={`w-12 h-12 rounded-lg bg-${api.color}-100 flex items-center justify-center mb-4 text-${api.color}-600`}>
                  <i className={`fas ${api.icon} text-xl`}></i>
                </div>
                <h3 className="text-xl font-bold mb-2">{api.title}</h3>
                <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{api.description}</p>
                <div className={`font-mono text-sm p-3 rounded-md mb-4 ${isDark ? 'bg-gray-900 text-green-400' : 'bg-gray-100 text-green-700'}`}>
                  {api.endpoint}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-orange-500">{api.price}</span>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">查看文档 &rarr;</button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 接入流程 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">快速接入</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '获取 API Key', desc: '注册开发者账号，创建应用并获取密钥' },
              { step: '02', title: '阅读文档', desc: '查看详细的接口定义与 SDK 使用指南' },
              { step: '03', title: '开始调用', desc: '在你的应用中集成 AI 能力' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 底部 CTA */}
        <section className={`rounded-2xl p-8 md:p-12 text-center ${isDark ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white`}>
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="mb-8 text-lg opacity-90">加入 1000+ 开发者，共同构建 AI 国潮生态</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              申请开发者账号
            </button>
            <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-bold hover:bg-white/10 transition-colors">
              联系商务合作
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Developers;
