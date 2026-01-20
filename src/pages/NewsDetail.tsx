import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';

// 资讯类型定义
interface NewsItem {
  id: number;
  title: string;
  description: string;
  image: string;
  date: string;
  category: string;
  source: string;
  views: number;
  content: string;
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 模拟完整的资讯数据列表
  const newsItems: NewsItem[] = [
    // 政策动态
    {
      id: 1,
      title: '全国非物质文化遗产保护工作会议在京召开',
      description: '会议总结了近年来非遗保护工作成果，部署了下一阶段重点任务，强调要加强非遗的活态传承和创新发展。',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=National%20intangible%20cultural%20heritage%20protection%20work%20conference%20Beijing',
      date: '2025-12-03',
      category: '政策动态',
      source: '文化和旅游部',
      views: 12563,
      content: `12月3日，全国非物质文化遗产保护工作会议在北京召开。文化和旅游部部长胡和平出席会议并讲话，副部长李群主持会议。

会议总结了近年来我国非物质文化遗产保护工作取得的显著成效。截至目前，我国已建立了国家、省、市、县四级非物质文化遗产保护体系，认定了国家级非物质文化遗产代表性项目1557项，国家级非物质文化遗产代表性传承人3068名，设立了23个国家级文化生态保护区。

会议强调，要深入学习贯彻习近平总书记关于非物质文化遗产保护的重要指示精神，坚持以社会主义核心价值观为引领，坚持创造性转化、创新性发展，加强非遗的活态传承和创新发展。

下一阶段，我国将重点推进以下工作：一是加强非遗保护立法和政策体系建设；二是完善非遗代表性项目和代表性传承人管理制度；三是加强非遗传承人群培养；四是推进非遗与旅游融合发展；五是加强非遗数字化保护和传播；六是推动非遗走向世界。

会议还表彰了全国非物质文化遗产保护工作先进集体和先进个人，并对2026年重点工作进行了部署。

来自全国各省、自治区、直辖市文化和旅游厅（局）主要负责同志，以及有关专家学者、非遗代表性传承人代表等共300余人参加了会议。`
    },
    {
      id: 2,
      title: '《中国传统工艺振兴计划》实施成效显著',
      description: '五年来，该计划推动了1500余项传统工艺项目的保护和发展，带动了200多万从业人员就业增收。',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20traditional%20craft%20revitalization%20plan%20implementation%20achievements',
      date: '2025-11-28',
      category: '政策动态',
      source: '光明日报',
      views: 15678,
      content: `五年来，《中国传统工艺振兴计划》实施成效显著，推动了1500余项传统工艺项目的保护和发展，带动了200多万从业人员就业增收。

该计划自2020年实施以来，以振兴传统工艺为目标，以传承人为核心，以产业发展为导向，以创新设计为动力，通过政策支持、人才培养、市场拓展、国际交流等多种方式，推动传统工艺实现创造性转化和创新性发展。

截至目前，全国已建立了100个传统工艺工作站，培训了10万人次以上的传统工艺从业者，支持了1000余项传统工艺创新项目，推动了传统工艺产品销售额增长了50%以上。

同时，该计划还推动了传统工艺与旅游、文化创意、数字经济等产业的融合发展，形成了一批具有影响力的传统工艺品牌和产品，提高了传统工艺的市场竞争力和社会影响力。

下一步，文化和旅游部将继续深入实施《中国传统工艺振兴计划》，进一步加强传统工艺的保护和传承，推动传统工艺实现更高质量的发展。`
    },
    {
      id: 3,
      title: '中国传统音乐保护与传承工程启动',
      description: '工程将通过录制、整理、研究等方式，对中国传统音乐进行系统保护和传承，预计历时五年完成。',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20traditional%20music%20protection%20and%20transmission%20project%20launch',
      date: '2025-11-15',
      category: '政策动态',
      source: '中国音乐家协会',
      views: 10345,
      content: `中国传统音乐保护与传承工程于11月15日正式启动，该工程将通过录制、整理、研究等方式，对中国传统音乐进行系统保护和传承，预计历时五年完成。

该工程由中国音乐家协会牵头，联合教育部、文化和旅游部等部门共同实施，旨在全面保护和传承中国传统音乐文化，推动传统音乐的创造性转化和创新性发展。

工程将重点开展以下工作：一是对全国范围内的传统音乐资源进行全面普查和录制；二是建立中国传统音乐数据库和数字图书馆；三是加强传统音乐理论研究和人才培养；四是推动传统音乐的创新发展和传播推广；五是加强传统音乐的国际交流与合作。

中国传统音乐是中华民族优秀传统文化的重要组成部分，具有悠久的历史和丰富的内涵。该工程的实施将有助于更好地保护和传承中国传统音乐文化，推动传统音乐在新时代焕发新的活力。`
    },
    {
      id: 4,
      title: '《文化产业数字化战略实施方案》正式发布',
      description: '方案提出到2035年，实现文化产业数字化转型全面完成，数字文化产业成为国民经济支柱性产业。',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Cultural%20industry%20digitalization%20strategy%20implementation%20plan%20release',
      date: '2025-11-08',
      category: '政策动态',
      source: '新华社',
      views: 18923,
      content: `《文化产业数字化战略实施方案》于11月8日正式发布，方案提出到2035年，实现文化产业数字化转型全面完成，数字文化产业成为国民经济支柱性产业。

该方案由文化和旅游部、国家发展改革委、工业和信息化部等部门联合发布，是指导我国文化产业数字化发展的纲领性文件。

方案提出了以下主要目标：到2027年，文化产业数字化转型取得显著成效，数字文化产业占文化产业比重达到50%以上；到2035年，文化产业数字化转型全面完成，数字文化产业成为国民经济支柱性产业，我国成为全球数字文化产业创新中心。

方案还明确了以下重点任务：一是加强数字文化基础设施建设；二是推动文化产业数字化转型；三是培育数字文化新业态新模式；四是加强数字文化内容创作生产；五是完善数字文化产业生态；六是加强数字文化国际合作。

该方案的发布将为我国文化产业数字化发展提供重要指导，推动我国文化产业实现高质量发展。`
    },
    // 赛事活动
    {
      id: 7,
      title: '2025中国传统文化创意设计大赛启动',
      description: '本次大赛以"传统与现代融合"为主题，面向全球设计师征集优秀作品，推动传统文化的创造性转化和创新性发展。',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=2025%20China%20traditional%20culture%20creative%20design%20competition%20launch',
      date: '2025-12-01',
      category: '赛事活动',
      source: '中国文化产业协会',
      views: 8921,
      content: `2025中国传统文化创意设计大赛于12月1日正式启动，本次大赛以"传统与现代融合"为主题，面向全球设计师征集优秀作品，推动传统文化的创造性转化和创新性发展。

本次大赛由中国文化产业协会主办，中国设计协会承办，旨在通过创意设计的方式，挖掘和传承中国传统文化，推动传统文化与现代设计的融合发展。

大赛设有以下参赛类别：视觉设计、产品设计、空间设计、数字创意设计等。参赛作品要求以中国传统文化元素为核心，结合现代设计理念和技术，具有创新性、实用性和艺术性。

大赛奖项设置如下：金奖10名，奖金各10万元；银奖20名，奖金各5万元；铜奖30名，奖金各2万元；优秀奖100名，颁发证书。

大赛报名截止日期为2026年3月1日，评审结果将于2026年5月公布。获奖作品将在全国范围内进行巡展，并推荐给相关企业进行产业化合作。

本次大赛的举办将有助于推动传统文化的创造性转化和创新性发展，培育一批具有国际影响力的传统文化创意设计作品和人才。`
    },
    {
      id: 8,
      title: '2025国际非遗博览会在济南开幕',
      description: '博览会吸引了来自全球40多个国家和地区的非遗项目参展，展示了丰富的人类非物质文化遗产。',
      image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=2025%20International%20intangible%20cultural%20heritage%20expo%20Jinan',
      date: '2025-11-20',
      category: '赛事活动',
      source: '中国非物质文化遗产保护中心',
      views: 12345,
      content: `2025国际非遗博览会于11月20日在济南开幕，博览会吸引了来自全球40多个国家和地区的非遗项目参展，展示了丰富的人类非物质文化遗产。

本次博览会由文化和旅游部、山东省人民政府主办，济南市人民政府、山东省文化和旅游厅承办，以"传承文化遗产，促进文明互鉴"为主题，旨在通过展览、展示、交流、交易等方式，推动非遗的保护和传承，促进不同国家和地区之间的文明交流互鉴。

博览会设有以下展区：国际展区、国内展区、互动体验区、成果展区等。参展项目涵盖了传统音乐、传统舞蹈、传统戏剧、传统技艺、传统美术等多个门类。

博览会期间，还将举办非遗保护国际论坛、非遗项目展演、非遗产品交易等活动。预计将有超过100万人次参观本次博览会。

本次博览会的举办将有助于推动非遗的保护和传承，促进不同国家和地区之间的文明交流互鉴，提升我国在国际非遗领域的影响力和话语权。`
    }
  ];
  
  // 数据加载
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // 模拟API请求延迟
    setTimeout(() => {
      try {
        const newsId = parseInt(id || '1');
        const foundNews = newsItems.find(item => item.id === newsId);
        
        if (foundNews) {
          setNews(foundNews);
        } else {
          setError('未找到该资讯内容');
          setNews(null);
        }
      } catch (err) {
        setError('加载资讯详情失败，请稍后重试');
        console.error('Failed to load news detail:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [id]);
  
  if (isLoading) {
    return (
      <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen py-12 px-4 sm:px-6 lg:px-8`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-md max-w-4xl mx-auto`}>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="flex justify-between items-center mb-6">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-700 rounded w-32"></div>
            </div>
            <div className="w-full h-64 bg-gray-700 rounded mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-700 rounded w-4/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !news) {
    return (
      <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen py-12 px-4 sm:px-6 lg:px-8`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-md max-w-4xl mx-auto text-center`}>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold mb-2">{error || '资讯不存在'}</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {error ? '请稍后重试或返回资讯列表' : '您访问的资讯不存在或已被删除。'}
            </p>
            <button
              onClick={() => navigate('/news')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              返回资讯列表
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen py-12 px-4 sm:px-6 lg:px-8`}>
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-md max-w-4xl mx-auto`}>
        {/* 返回按钮 */}
        <motion.button
          onClick={() => navigate('/news')}
          className={`mb-6 flex items-center ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          whileHover={{ x: -5 }}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          返回资讯列表
        </motion.button>
        
        {/* 分类标签 */}
        <div className="mb-4">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {news.category}
          </span>
        </div>
        
        {/* 标题 */}
        <motion.h1 
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {news.title}
        </motion.h1>
        
        {/* 元信息 */}
        <div className={`flex justify-between items-center mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>{news.date}</span>
          <span className="flex items-center">
            <i className="far fa-eye mr-1"></i>
            {news.views.toLocaleString()}
          </span>
          <span>{news.source}</span>
        </div>
        
        {/* 主图 */}
        <motion.div 
          className="mb-8 overflow-hidden rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img 
            src={news.image} 
            alt={news.title} 
            className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
          />
        </motion.div>
        
        {/* 描述 */}
        <motion.div 
          className={`mb-8 text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {news.description}
        </motion.div>
        
        {/* 内容 */}
        <motion.div 
          className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'} space-y-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {news.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </motion.div>
        
        {/* 分享按钮 */}
        <div className="mt-12 pt-6 border-t border-gray-700/30">
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>分享资讯</h3>
          <div className="flex space-x-4">
            <motion.button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <i className="fab fa-weixin mr-2"></i> 微信
            </motion.button>
            <motion.button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <i className="fab fa-weibo mr-2"></i> 微博
            </motion.button>
            <motion.button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <i className="fas fa-link mr-2"></i> 复制链接
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
