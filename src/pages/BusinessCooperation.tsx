import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { BRANDS } from '@/lib/brands';
import ipService from '@/services/ipService';
import { toast } from 'sonner';
import {
  ThreeColumnLayout,
  LeftSidebar,
  RightSidebar,
  HeroSection,
  FeaturesSection,
  ProcessSection,
  CooperationForm,
} from '@/components/business';
import {
  Building2,
  Users,
  Briefcase,
  MapPin,
  CheckCircle,
  Clock,
  X,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function BusinessCooperation() {
  const { isDark } = useTheme();
  const [selectedBrand, setSelectedBrand] = useState(BRANDS[0]);
  const [brandSearch, setBrandSearch] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'records'>('form');

  // 统计数据
  const stats = [
    { label: '入驻品牌', value: '50+', icon: Building2 },
    { label: '活跃创作者', value: '10k+', icon: Users },
    { label: '落地案例', value: '120+', icon: Briefcase },
    { label: '覆盖城市', value: '天津', icon: MapPin },
  ];

  // 获取合作申请记录
  const partnerships = useMemo(() => {
    return ipService.getAllPartnerships();
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

  // 处理表单提交
  const handleFormSubmit = (data: { contact: string; phone: string; idea: string }) => {
    ipService.createPartnership({
      brandName: selectedBrand.name,
      brandLogo: selectedBrand.image,
      description: `${data.idea}（联系人：${data.contact}，电话：${data.phone}）`,
      reward: '待协商',
      status: 'pending',
      ipAssetId: 'ip-001',
    });
    setReloadTick((t) => t + 1);
    toast.success('合作申请已提交，我们将尽快与您联系！');
    setActiveTab('records');
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

  // 主内容区
  const mainContent = (
    <div className="pb-12">
      {/* Hero区域 */}
      <HeroSection isDark={isDark} stats={stats} />

      {/* 特性展示 */}
      <FeaturesSection isDark={isDark} />

      {/* 合作流程 */}
      <ProcessSection
        isDark={isDark}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {/* 标签切换（移动端） */}
      <div className="lg:hidden flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'form'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
              : isDark
              ? 'bg-slate-800 text-gray-400 border border-slate-700'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          提交申请
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'records'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
              : isDark
              ? 'bg-slate-800 text-gray-400 border border-slate-700'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          申请记录 ({partnerships.length})
        </button>
      </div>

      {/* 合作表单 */}
      <div className={activeTab === 'form' ? 'block' : 'hidden lg:block'}>
        <CooperationForm
          isDark={isDark}
          selectedBrand={selectedBrand}
          onSubmit={handleFormSubmit}
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
                      src={partnership.brandLogo}
                      alt={partnership.brandName}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-gray-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {partnership.brandName}
                          </h3>
                          <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {partnership.description.slice(0, 100)}...
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
                          {new Date(partnership.updatedAt).toLocaleDateString()}
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
        />
      }
      mainContent={mainContent}
      rightSidebar={
        <RightSidebar
          isDark={isDark}
          onQuickIdea={handleQuickIdea}
          selectedBrand={selectedBrand}
        />
      }
    />
  );
}
