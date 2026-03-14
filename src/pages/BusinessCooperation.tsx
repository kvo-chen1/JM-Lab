import { useState, useEffect, useContext } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';
import { BRANDS } from '@/lib/brands';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import {
  ThreeColumnLayout,
  LeftSidebar,
  HeroSection,
  FeaturesSection,
  BrandOnboarding,
  BrandApplicationForm,
} from '@/components/business';
import {
  Building2,
  Users,
  Briefcase,
  MapPin,
  Clock,
  FileText,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export default function BusinessCooperation() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const [selectedBrand, setSelectedBrand] = useState(BRANDS[0]);
  const [brandSearch, setBrandSearch] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'records'>('form');
  const [showOnboarding, setShowOnboarding] = useState(true); // 默认显示入驻引导
  const [partnerships, setPartnerships] = useState<BrandPartnership[]>([]);
  const [approvedBrands, setApprovedBrands] = useState<BrandPartnership[]>([]);
  const [stats, setStats] = useState({
    totalPartnerships: 0,
    approvedPartnerships: 0,
    totalEvents: 0,
    publishedEvents: 0,
  });

  // 获取合作申请记录
  const fetchPartnerships = async () => {
    try {
      // 获取当前用户的品牌申请
      const myData = await brandPartnershipService.getMyPartnerships();
      setPartnerships(myData);
      
      // 获取所有已审核通过的品牌（用于显示已入驻品牌列表）
      const approvedData = await brandPartnershipService.getApprovedBrands();
      setApprovedBrands(approvedData);
      
      // 获取统计数据
      const statsData = await brandPartnershipService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('获取合作申请失败:', error);
    }
  };

  useEffect(() => {
    fetchPartnerships();
  }, [reloadTick]);

  // 处理品牌选择
  const handleBrandSelect = (brand: typeof BRANDS[0]) => {
    setSelectedBrand(brand);
    toast.success(`已选择品牌：${brand.name}`);
  };

  // 处理快速灵感
  const handleQuickIdea = (idea: string) => {
    toast.info('灵感已生成，请在表单中查看');
  };

  // 处理步骤点击
  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  // 处理品牌入驻申请提交
  const handleBrandApplicationSubmit = async (data: {
    brandName: string;
    brandLogo: string;
    description: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
  }) => {
    if (!user?.id) {
      toast.error('请先登录后再提交申请');
      return;
    }
    
    const result = await brandPartnershipService.createPartnership({
      brand_name: data.brandName,
      brand_logo: data.brandLogo || 'https://via.placeholder.com/200?text=Brand',
      description: data.description,
      contact_name: data.contactName,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail,
      reward: '待协商',
      applicant_id: user.id,
    });

    if (result) {
      setReloadTick((t) => t + 1);
      toast.success('品牌入驻申请已提交，我们将在1-3个工作日内完成审核！');
      // 显示成功提示后返回入驻引导页面
      setTimeout(() => {
        setShowOnboarding(true);
      }, 2000);
    } else {
      toast.error('提交申请失败，请重试');
    }
  };

  // 处理表单提交（旧版，保留兼容）
  const handleFormSubmit = async (data: { contact: string; phone: string; idea: string }) => {
    if (!user?.id) {
      toast.error('请先登录后再提交申请');
      return;
    }
    
    const result = await brandPartnershipService.createPartnership({
      brand_name: selectedBrand.name,
      brand_logo: selectedBrand.image,
      brand_id: selectedBrand.id,
      description: data.idea,
      contact_name: data.contact,
      contact_phone: data.phone,
      reward: '待协商',
      applicant_id: user.id,
    });

    if (result) {
      setReloadTick((t) => t + 1);
      toast.success('合作申请已提交，我们将尽快与您联系！');
      setActiveTab('records');
    } else {
      toast.error('提交申请失败，请重试');
    }
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'negotiating':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已婉拒';
      case 'negotiating':
        return '洽谈中';
      default:
        return '审核中';
    }
  };

  // 统计数据
  const displayStats = [
    { label: '入驻品牌', value: `${stats.approvedPartnerships}+`, icon: Building2 },
    { label: '品牌活动', value: `${stats.publishedEvents}+`, icon: Briefcase },
    { label: '合作申请', value: `${stats.totalPartnerships}+`, icon: Users },
    { label: '覆盖城市', value: '天津', icon: MapPin },
  ];

  // 滚动到表单区域
  const scrollToForm = () => {
    const formElement = document.getElementById('cooperation-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 开始申请入驻
  const handleStartApplication = () => {
    setShowOnboarding(false);
    setTimeout(() => {
      const formElement = document.getElementById('cooperation-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // 返回入驻引导
  const handleBackToOnboarding = () => {
    setShowOnboarding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 主内容区
  const mainContent = (
    <div className="pb-12">
      {showOnboarding ? (
        // 显示品牌入驻引导
        <BrandOnboarding 
          isDark={isDark} 
          onStartApplication={handleStartApplication}
          stats={{
            approvedPartnerships: stats.approvedPartnerships,
            publishedEvents: stats.publishedEvents,
          }}
        />
      ) : (
        <>
          {/* 返回按钮 */}
          <div className="mb-6">
            <button
              onClick={handleBackToOnboarding}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              返回入驻介绍
            </button>
          </div>

          {/* Hero区域 */}
          <HeroSection isDark={isDark} stats={displayStats} onStartCooperation={scrollToForm} />

          {/* 特性展示 */}
          <FeaturesSection isDark={isDark} />

          {/* 品牌入驻申请表单 */}
          <div id="cooperation-form">
            <BrandApplicationForm
              isDark={isDark}
              onSubmit={handleBrandApplicationSubmit}
            />
          </div>

      {/* 申请记录 */}
      <div className={activeTab === 'records' ? 'block' : 'hidden lg:block'}>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                我的申请记录
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                查看您的合作申请状态和历史记录
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>审核中</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>已通过</span>
              </div>
            </div>
          </div>

          {partnerships.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`
                p-12 rounded-3xl text-center border-2 border-dashed
                ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50 border-gray-200'}
              `}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <FileText className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                暂无申请记录
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                快去发起您的第一个品牌合作吧！
              </p>
              <button
                onClick={() => setActiveTab('form')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105"
              >
                立即申请
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {partnerships.map((partnership, index) => (
                <motion.div
                  key={partnership.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    p-6 rounded-2xl border transition-all hover:shadow-lg
                    ${isDark ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <img
                        src={partnership.brand_logo}
                        alt={partnership.brand_name}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {partnership.brand_name}
                            </h3>
                            <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {partnership.description?.slice(0, 100)}...
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusStyle(
                              partnership.status
                            )}`}
                          >
                            {getStatusText(partnership.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            <Clock className="w-4 h-4" />
                            {new Date(partnership.updated_at).toLocaleDateString()}
                          </div>
                          <div className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            <TrendingUp className="w-4 h-4" />
                            奖励：{partnership.reward}
                          </div>
                        </div>
                      </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
        </>
      )}
    </div>
  );

  return (
    <ThreeColumnLayout
      isDark={isDark}
      leftSidebar={
        <LeftSidebar
          isDark={isDark}
          selectedBrand={selectedBrand}
          onBrandSelect={handleBrandSelect}
          searchQuery={brandSearch}
          onSearchChange={setBrandSearch}
          partnershipCount={partnerships.length}
          approvedBrands={approvedBrands}
          stats={{
            approvedPartnerships: stats.approvedPartnerships,
            totalEvents: stats.totalEvents,
          }}
        />
      }
      mainContent={mainContent}
    />
  );
}
