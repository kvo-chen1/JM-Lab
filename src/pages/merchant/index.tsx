/**
 * 商家工作平台 - 主页面
 * 三栏式布局：左侧导航 + 中间内容 + 右侧数据概览
 * 包含商家入驻状态检查
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, Clock, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { merchantApplicationService } from '@/services/merchantApplicationService';
import { merchantStoreService, MerchantStore } from '@/services/merchantStoreService';
import { Button } from '@/components/ui/Button';

// 布局组件
import MerchantLayout from './components/MerchantLayout';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import HeaderBar from './components/HeaderBar';

// 功能模块
import ProductManager from './components/modules/ProductManager';
import OrderManager from './components/modules/OrderManager';
import AfterSalesManager from './components/modules/AfterSalesManager';
import ReviewManager from './components/modules/ReviewManager';
import DataCenter from './components/modules/DataCenter';

// 功能模块配置
const MODULES = [
  { id: 'products', label: '商品管理', icon: 'Package' },
  { id: 'orders', label: '交易管理', icon: 'ShoppingCart' },
  { id: 'aftersales', label: '售后管理', icon: 'RefreshCw' },
  { id: 'reviews', label: '评论管理', icon: 'MessageSquare' },
  { id: 'datacenter', label: '数据中心', icon: 'BarChart3' },
];

const MerchantWorkbench: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('products');
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [rejectionReason, setRejectionReason] = useState('');
  const [hasStore, setHasStore] = useState(false);
  const [storeInfo, setStoreInfo] = useState<MerchantStore | null>(null);

  // 检查商家申请状态和店铺状态
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        
        // 检查申请状态
        const application = await merchantApplicationService.getMyApplication();
        if (!application) {
          setApplicationStatus('none');
        } else {
          setApplicationStatus(application.status);
          if (application.status === 'rejected') {
            setRejectionReason(application.rejection_reason || '');
          }
        }
        
        // 检查是否有店铺
        const store = await merchantStoreService.getMyStore();
        setHasStore(!!store);
        setStoreInfo(store);
      } catch (error) {
        console.error('检查状态失败:', error);
        setApplicationStatus('none');
        setHasStore(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkStatus();
    }
  }, [user]);

  // 渲染当前功能模块
  const renderModule = () => {
    switch (activeModule) {
      case 'products':
        return <ProductManager />;
      case 'orders':
        return <OrderManager />;
      case 'aftersales':
        return <AfterSalesManager />;
      case 'reviews':
        return <ReviewManager />;
      case 'datacenter':
        return <DataCenter />;
      default:
        return <ProductManager />;
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5ba3d4] mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">正在检查商家状态...</p>
        </div>
      </div>
    );
  }

  // 未申请状态
  if (applicationStatus === 'none') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#5ba3d4]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-[#5ba3d4]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            您还不是商家
          </h1>
          <p className="text-[var(--text-muted)] mb-6">
            您还没有提交商家入驻申请。<br />
            请先提交申请，审核通过后即可使用商家工作台。
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/merchant/apply')}
              className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
            >
              申请入驻
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/business')}
              className="border-[var(--border-primary)]"
            >
              返回品牌合作
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 审核中状态
  if (applicationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            申请审核中
          </h1>
          <p className="text-[var(--text-muted)] mb-6">
            您的商家入驻申请正在审核中。<br />
            审核通常需要 1-3 个工作日，请耐心等待。
          </p>
          <Button
            onClick={() => navigate('/business')}
            className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
          >
            返回品牌合作
          </Button>
        </div>
      </div>
    );
  }

  // 已拒绝状态
  if (applicationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            申请被拒绝
          </h1>
          <p className="text-[var(--text-muted)] mb-4">
            很抱歉，您的商家入驻申请未通过审核。
          </p>
          {rejectionReason && (
            <div className="bg-red-500/10 rounded-lg p-4 text-left mb-6">
              <p className="text-sm text-red-400 mb-1">拒绝原因：</p>
              <p className="text-[var(--text-primary)]">{rejectionReason}</p>
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/merchant/apply')}
              className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
            >
              重新申请
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/business')}
              className="border-[var(--border-primary)]"
            >
              返回品牌合作
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 已通过状态 - 检查是否有店铺
  if (!hasStore) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#5ba3d4]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-[#5ba3d4]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            创建您的店铺
          </h1>
          <p className="text-[var(--text-muted)] mb-6">
            您已通过商家入驻审核，但还没有创建店铺。<br />
            请先创建店铺，然后才能进入商家工作台。
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/merchant/create-store')}
              className="bg-[#5ba3d4] hover:bg-[#4a8ab8] text-white"
            >
              创建店铺
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/business')}
              className="border-[var(--border-primary)]"
            >
              返回品牌合作
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 已通过状态且有店铺 - 正常显示工作台
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 顶部商家信息栏 */}
      <HeaderBar />

      {/* 三栏式主体内容 - 优化间距 */}
      <div className="p-6 pt-6">
        <div className="grid grid-cols-12 gap-8">

          {/* 左栏：功能导航 */}
          <div className="col-span-12 lg:col-span-2">
            <LeftSidebar
              modules={MODULES}
              activeModule={activeModule}
              onModuleChange={setActiveModule}
            />
          </div>

          {/* 中栏：内容区域 */}
          <div className="col-span-12 lg:col-span-7">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-6"
            >
              {renderModule()}
            </motion.div>
          </div>

          {/* 右栏：数据概览 */}
          <div className="col-span-12 lg:col-span-3">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantWorkbench;
