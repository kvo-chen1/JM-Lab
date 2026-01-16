import React, { useState, useEffect, Suspense, lazy, useRef, useMemo, useCallback } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useTheme } from '@/hooks/useTheme';
import { Routes, Route, Outlet, useLocation, useNavigationType, Link, Navigate, useNavigate } from "react-router-dom";
// 导入mock数据和postService用于初始化
import { mockWorks } from '@/mock/works';
import postsApi from '@/services/postService';
import { addPost } from '@/services/postService';
import { Post } from '@/services/postService';
// 导入性能优化工具
import { createLazyComponent, ROUTE_PRIORITIES, performanceOptimizer } from '@/utils/performanceOptimization';


// 核心页面 - 只保留最关键的页面进行同步加载，减少初始加载时间
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// 优化懒加载策略：根据页面访问频率和大小重新分类

// 1. 高频访问页面 - 懒加载，添加预加载提示
const Dashboard = createLazyComponent(() => import(/* webpackChunkName: "pages-dashboard" */ "@/pages/Dashboard"), {
  priority: ROUTE_PRIORITIES.HIGH,
  preload: true
});
const Explore = createLazyComponent(() => import(/* webpackChunkName: "pages-explore" */ "@/pages/Explore"), {
  priority: ROUTE_PRIORITIES.HIGH,
  preload: true
});
const WorkDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-explore" */ "@/pages/WorkDetail"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const About = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/About"), {
  priority: ROUTE_PRIORITIES.LOW
});
const Square = createLazyComponent(() => import(/* webpackChunkName: "pages-community" */ "@/pages/Square"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const Community = createLazyComponent(() => import(/* webpackChunkName: "pages-community" */ "@/pages/Community"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const Neo = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Neo"), {
  priority: ROUTE_PRIORITIES.LOW
});
const NewsDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/NewsDetail"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const EventDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/EventDetail"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const TestBasic = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/TestBasic"), {
  priority: ROUTE_PRIORITIES.LOW
});
const SearchResults = createLazyComponent(() => import(/* webpackChunkName: "pages-explore" */ "@/pages/SearchResults"), {
  priority: ROUTE_PRIORITIES.HIGH
});

// 2. 高频访问但较大的页面 - 懒加载，优先加载
const Create = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/Create"), {
  priority: ROUTE_PRIORITIES.HIGH
});
const Tools = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/Tools"), {
  priority: ROUTE_PRIORITIES.HIGH
});
const Settings = createLazyComponent(() => import(/* webpackChunkName: "pages-account" */ "@/pages/Settings"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
// 账户设置相关页面 - 懒加载
const ProfileEdit = createLazyComponent(() => import(/* webpackChunkName: "pages-account" */ "@/pages/ProfileEdit"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const ChangePassword = createLazyComponent(() => import(/* webpackChunkName: "pages-account" */ "@/pages/ChangePassword"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const AccountSecurity = createLazyComponent(() => import(/* webpackChunkName: "pages-account" */ "@/pages/AccountSecurity"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 创作和工具相关 - 懒加载
const Generation = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/Generation"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const InputHub = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/InputHub"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const Drafts = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/Drafts"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 文化和知识相关 - 懒加载
const CulturalKnowledge = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/CulturalKnowledge"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const Tianjin = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/Tianjin"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const TianjinMap = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/TianjinMap"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const CulturalEvents = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/CulturalEvents"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const CulturalNewsPage = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/CulturalNewsPage"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 管理相关 - 懒加载
const Admin = createLazyComponent(() => import(/* webpackChunkName: "pages-admin" */ "@/pages/admin/Admin"), {
  priority: ROUTE_PRIORITIES.LOW
});
const AdminAnalytics = createLazyComponent(() => import(/* webpackChunkName: "pages-admin" */ "@/pages/AdminAnalytics"), {
  priority: ROUTE_PRIORITIES.LOW
});
const ErrorMonitoringDashboard = createLazyComponent(() => import(/* webpackChunkName: "components-admin" */ "@/components/ErrorMonitoringDashboard"), {
  priority: ROUTE_PRIORITIES.LOW
});

// 会员和激励相关 - 懒加载
const Membership = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/Membership"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const MembershipPayment = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/MembershipPayment"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const MembershipBenefits = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/MembershipBenefits"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const Incentives = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/Incentives"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const PointsMall = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/PointsMall"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 社区和互动相关 - 懒加载
const Leaderboard = createLazyComponent(() => import(/* webpackChunkName: "pages-community" */ "@/pages/Leaderboard"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const DailyCheckin = createLazyComponent(() => import(/* webpackChunkName: "components-community" */ "@/components/DailyCheckin"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const CreativeMatchmaking = createLazyComponent(() => import(/* webpackChunkName: "components-community" */ "@/components/CreativeMatchmaking"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const AchievementMuseum = createLazyComponent(() => import(/* webpackChunkName: "components-community" */ "@/components/AchievementMuseum"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
// 好友系统相关 - 懒加载
const Friends = createLazyComponent(() => import(/* webpackChunkName: "pages-community" */ "@/pages/Friends"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 实验和特色功能 - 懒加载
const Lab = createLazyComponent(() => import(/* webpackChunkName: "pages-experimental" */ "@/pages/Lab"), {
  priority: ROUTE_PRIORITIES.LOW
});
const ParticleArt = createLazyComponent(() => import(/* webpackChunkName: "pages-experimental" */ "@/pages/ParticleArt"), {
  priority: ROUTE_PRIORITIES.LOW
});
const Games = createLazyComponent(() => import(/* webpackChunkName: "pages-experimental" */ "@/pages/Games"), {
  priority: ROUTE_PRIORITIES.LOW
});
const CollaborationDemo = createLazyComponent(() => import(/* webpackChunkName: "pages-experimental" */ "@/pages/CollaborationDemo"), {
  priority: ROUTE_PRIORITIES.LOW
});

// 辅助和测试页面 - 懒加载
const TestPage = createLazyComponent(() => import(/* webpackChunkName: "pages-test" */ "@/pages/TestPage"), {
  priority: ROUTE_PRIORITIES.LOW
});
const ImageTest = createLazyComponent(() => import(/* webpackChunkName: "pages-test" */ "@/pages/ImageTest"), {
  priority: ROUTE_PRIORITIES.LOW
});
const GitHubImageTestPage = createLazyComponent(() => import(/* webpackChunkName: "pages-test" */ "@/pages/GitHubImageTestPage"), {
  priority: ROUTE_PRIORITIES.LOW
});

// 其他低频页面 - 懒加载
const Terms = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Terms"), {
  priority: ROUTE_PRIORITIES.LOW
});
const Help = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Help"), {
  priority: ROUTE_PRIORITIES.LOW
});
const Privacy = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Privacy"), {
  priority: ROUTE_PRIORITIES.LOW
});
const BrandGuide = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/BrandGuide"), {
  priority: ROUTE_PRIORITIES.LOW
});
const Authenticity = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Authenticity"), {
  priority: ROUTE_PRIORITIES.LOW
});
const Wizard = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Wizard"), {
  priority: ROUTE_PRIORITIES.LOW
});
const AnalyticsPage = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Analytics"), {
  priority: ROUTE_PRIORITIES.LOW
});
const UserCollection = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/UserCollection"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 特殊功能组件 - 懒加载
const IPIncubationCenter = createLazyComponent(() => import(/* webpackChunkName: "components-other" */ "@/components/IPIncubationCenter"), {
  priority: ROUTE_PRIORITIES.LOW
});
const CrossDeviceSync = createLazyComponent(() => import(/* webpackChunkName: "components-other" */ "@/components/CrossDeviceSync"), {
  priority: ROUTE_PRIORITIES.LOW
});
const BlindBoxShop = createLazyComponent(() => import(/* webpackChunkName: "components-other" */ "@/components/BlindBoxShop"), {
  priority: ROUTE_PRIORITIES.LOW
});

// 优化LazyComponent和LoadingSkeleton
// 改进LoadingSkeleton，添加更多视觉反馈
const SimpleLoadingSkeleton = React.memo(() => (
  <div className="min-h-[200px] p-6">
    <div className="space-y-6">
      {/* 标题骨架 */}
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
          <div className="h-3 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
        </div>
      </div>
      
      {/* 内容骨架 */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
        <div className="h-4 w-5/6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
        <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
      </div>
      
      {/* 卡片骨架 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
        <div className="h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
      </div>
      
      {/* 行动按钮骨架 */}
      <div className="flex space-x-3">
        <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
        <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
      </div>
    </div>
  </div>
));

SimpleLoadingSkeleton.displayName = 'SimpleLoadingSkeleton';

// 优化LazyComponent，添加延迟加载和错误处理
const LazyComponent = React.memo(({ 
  children, 
  fallback = <SimpleLoadingSkeleton /> 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
});

LazyComponent.displayName = 'LazyComponent';



// 路由缓存组件
const RouteCache = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const cacheRef = useRef<Map<string, React.ReactNode>>(new Map());
  
  // 仅缓存核心页面
  const cacheableRoutes = ['/', '/dashboard', '/explore', '/tools', '/about'];
  
  // 检查当前路由是否可缓存
  const isCacheable = cacheableRoutes.includes(location.pathname);
  
  // 直接渲染子组件，不使用缓存机制，避免无限重渲染问题
  return <>{children}</>;
};

// 布局组件
import SidebarLayout from '@/components/SidebarLayout';
import MobileLayout from '@/components/MobileLayout';

// 路由守卫组件
import PrivateRoute from '@/components/PrivateRoute';
import AdminRoute from '@/components/AdminRoute';

// 创作者仪表盘组件 - 懒加载
const CreatorDashboard = createLazyComponent(() => import(/* webpackChunkName: "components-core" */ '@/components/CreatorDashboard'), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
// PWA 安装按钮组件 - 懒加载
const PWAInstallButton = createLazyComponent(() => import(/* webpackChunkName: "components-auxiliary" */ '@/components/PWAInstallButton'), {
  priority: ROUTE_PRIORITIES.LOW
});
// 首次启动引导组件 - 懒加载
const FirstLaunchGuide = createLazyComponent(() => import(/* webpackChunkName: "components-auxiliary" */ '@/components/FirstLaunchGuide'), {
  priority: ROUTE_PRIORITIES.LOW
});
// 悬浮AI助手组件 - 懒加载
const FloatingAIAssistant = createLazyComponent(() => import(/* webpackChunkName: "components-ai" */ '@/components/FloatingAIAssistant'), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
// 用户反馈组件 - 懒加载
const UserFeedback = createLazyComponent(() => import(/* webpackChunkName: "components-auxiliary" */ '@/components/UserFeedback'), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
// 满意度调查组件 - 懒加载
const SatisfactionSurvey = createLazyComponent(() => import(/* webpackChunkName: "components-auxiliary" */ '@/components/SatisfactionSurvey'), {
  priority: ROUTE_PRIORITIES.LOW
});
// 满意度调查服务
import surveyService from '@/services/surveyService';
// 认证上下文
import { useContext } from 'react';
import { AuthContext } from './contexts/authContext.tsx';


export default function App() {
  const location = useLocation();
  // 添加响应式布局状态 - 服务器端和客户端初始状态必须一致
  const [isMobile, setIsMobile] = useState(false);
  // 添加用户反馈状态
  const [showFeedback, setShowFeedback] = useState(false);
  
  // 优化：延迟初始化mock数据，减少初始加载时间
  useEffect(() => {
    // 初始化性能优化器
    performanceOptimizer.initialize();
    
    // 设置延迟，在应用启动后一段时间再初始化数据
    const initTimer = setTimeout(() => {
      // 检查localStorage中是否已有数据
      const existingPosts = postsApi.getPosts();
      if (existingPosts.length === 0) {
        // 优化：只初始化部分核心数据，减少一次性处理量
        const coreWorks = mockWorks.slice(0, 10); // 只初始化前10个作品
        
        // 批量添加到localStorage，减少localStorage操作次数
        const postDataArray = coreWorks.map(work => ({
          title: work.title,
          thumbnail: work.thumbnail,
          category: work.category as any,
          tags: work.tags,
          description: work.description || '',
          creativeDirection: '',
          culturalElements: [],
          colorScheme: [],
          toolsUsed: [],
          resolution: undefined,
          fileSize: undefined,
          downloadCount: 0,
          license: undefined
        }));
        
        // 使用postsApi的批量添加方法（如果有）或自定义批量添加逻辑
        // 这里假设postsApi有批量添加方法，如果没有则需要实现
        try {
          // 优化：直接操作localStorage，减少函数调用开销
          const existingPosts = JSON.parse(localStorage.getItem('posts') || '[]');
          const updatedPosts = [...existingPosts, ...postDataArray];
          localStorage.setItem('posts', JSON.stringify(updatedPosts));
        } catch (error) {
        }
      }
    }, 1000); // 延迟1秒执行，让应用先完成基本渲染
    
    return () => clearTimeout(initTimer);
  }, []);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始化检查
    checkIsMobile();
    
    // 添加 resize 事件监听
    window.addEventListener('resize', checkIsMobile);
    
    // 清理事件监听
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 移除智能预取逻辑，减少不必要的预加载请求
  // 预加载会增加初始加载时间和内存消耗，对于低性能设备来说可能会导致卡顿
  // 导航跳转速度的提升应该通过优化组件渲染和减少不必要的资源加载来实现

  // 全局console日志过滤，用于过滤WebAssembly内存地址日志
  useEffect(() => {
    // 保存原始console方法
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;
    
    // 过滤内存地址日志的通用函数
    const filterMemoryAddressLog = (args: unknown[]) => {
      // 检查每个参数
      for (const arg of args) {
        // 如果参数是数组，检查是否包含多个内存地址
        if (Array.isArray(arg)) {
          // 检查数组中是否包含多个内存地址
          const memoryAddresses = arg.filter(item => {
            const str = String(item);
            return /0x[0-9a-fA-F]{8,}/i.test(str);
          });
          if (memoryAddresses.length >= 2) {
            return true;
          }
        } 
        // 如果参数是字符串，检查是否是内存地址数组
        else if (typeof arg === 'string') {
          // 检查是否包含多个内存地址
          const memoryAddressCount = (arg.match(/0x[0-9a-fA-F]{8,}/gi) || []).length;
          if (memoryAddressCount >= 2) {
            return true;
          }
          // 检查是否是括号包裹的内存地址数组
          if (/\[(\s*0x[0-9a-fA-F]{8,}\s*[,\s]*)+\]/i.test(arg)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    // 替换全局console.log
    console.log = function(...args) {
      if (!filterMemoryAddressLog(args)) {
        originalLog.apply(console, args);
      }
    };
    
    // 替换全局console.warn
    console.warn = function(...args) {
      if (!filterMemoryAddressLog(args)) {
        originalWarn.apply(console, args);
      }
    };
    
    // 替换全局console.error
    console.error = function(...args) {
      if (!filterMemoryAddressLog(args)) {
        originalError.apply(console, args);
      }
    };
    
    // 替换全局console.info
    console.info = function(...args) {
      if (!filterMemoryAddressLog(args)) {
        originalInfo.apply(console, args);
      }
    };
    
    // 清理函数，恢复原始console方法
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  // 右侧内容组件 - 使用memo优化，避免不必要的重新渲染
  const RightContent = React.memo(() => (
    <aside className="w-64 p-4 overflow-y-auto">
      <div className="space-y-4">
        {/* 用户信息卡片 */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-2">欢迎使用</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">探索AI创作的无限可能</p>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">开始创作</button>
            <button className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">了解更多</button>
          </div>
        </div>
        
        {/* 快速链接 */}
        <div className="rounded-xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <h4 className="font-medium mb-2">快速链接</h4>
          <ul className="space-y-2">
            <li><a href="/explore" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">浏览作品</a></li>
            <li><a href="/create" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">创作中心</a></li>
            <li><a href="/tools" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">AI工具</a></li>
            <li><a href="/tianjin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">天津特色</a></li>
          </ul>
        </div>
        
        {/* 通知区域 */}
        <div className="rounded-xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <h4 className="font-medium mb-2">最新通知</h4>
          <div className="space-y-3">
            <div className="text-xs p-2 bg-yellow-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium mb-1">系统更新</p>
              <p className="text-gray-600 dark:text-gray-400">平台已更新至最新版本，体验更多功能</p>
            </div>
            <div className="text-xs p-2 bg-green-50 dark:bg-gray-700 rounded-lg">
              <p className="font-medium mb-1">活动通知</p>
              <p className="text-gray-600 dark:text-gray-400">新一期创作活动即将开始，敬请期待</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  ));
  
  // 右侧内容组件的延迟加载版本 - 仅在需要时加载
  const LazyRightContent = lazy(() => Promise.resolve({ default: RightContent }));

  // 浮动按钮组件
  const FloatingButtons = () => {
    // 认证上下文
    const { user } = useContext(AuthContext);
    const { isDark } = useTheme(); // 获取当前主题状态
    const navigate = useNavigate(); // 导入导航函数
    // 使用外部App组件的isMobile状态，避免状态不一致
    // 内部状态管理
    const [showCommunityMessages, setShowCommunityMessages] = useState(false);
    const [showSurvey, setShowSurvey] = useState(false);
    const messagesRef = useRef<HTMLDivElement | null>(null);

    // 社群消息数据结构
    interface CommunityMessage {
      id: string;
      sender: string;
      content: string;
      time: string;
      read: boolean;
      avatar: string;
    }
    
    // 社群消息状态
    const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>(() => {
      // 在SSR期间返回默认值，不访问localStorage
      return [
        { id: 'm1', sender: '创意达人', content: '分享一个新的创作技巧...', time: '刚刚', read: false, avatar: '👤' },
        { id: 'm2', sender: '设计师小王', content: '大家觉得这个配色方案怎么样？', time: '1 小时前', read: false, avatar: '🎨' },
        { id: 'm3', sender: '系统通知', content: '新活动：创意挑战赛开始了！', time: '昨天', read: true, avatar: '📢' },
      ];
    });
    
    // 在客户端挂载后从localStorage加载消息
    useEffect(() => {
      try {
        const stored = localStorage.getItem('jmzf_community_messages');
        if (stored) {
          const parsed = JSON.parse(stored);
          // 确保返回的是数组
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCommunityMessages(parsed);
          }
        }
      } catch {}
    }, []);
    
    // 未读消息计数
    const unreadMessageCount = useMemo(() => 
      communityMessages.filter(m => !m.read).length,
      [communityMessages]
    );
    
    // 保存消息到本地存储
    useEffect(() => {
      try {
        localStorage.setItem('jmzf_community_messages', JSON.stringify(communityMessages));
      } catch {}
    }, [communityMessages]);
    
    // 点击外部关闭消息面板
    useEffect(() => {
      // 只在浏览器环境中添加事件监听
      if (typeof document === 'undefined') return;
      
      const handler = (e: MouseEvent) => {
        if (!messagesRef.current) return;
        if (!messagesRef.current.contains(e.target as Node)) {
          setShowCommunityMessages(false);
        }
      };
      if (showCommunityMessages) {
        document.addEventListener('mousedown', handler);
      }
      return () => document.removeEventListener('mousedown', handler);
    }, [showCommunityMessages]);

    return (
      <>
        {/* 底部浮动按钮组 */}
        <div className="fixed right-4 top-[80%] transform -translate-y-1/2 flex flex-col gap-2 z-30">
          {/* 社群消息提醒按钮 */}
          <div className="relative" ref={messagesRef}>
            <button
              onClick={() => setShowCommunityMessages(v => !v)}
              className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center relative"
              aria-label="社群消息"
              title="社群消息"
            >
              <i className="fas fa-comments text-base"></i>
              {/* 消息提示红点 */}
              {unreadMessageCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold px-1">
                  {unreadMessageCount}
                </span>
              )}
            </button>
            {/* 消息面板 */}
            {showCommunityMessages && (
              <div className="absolute right-0 bottom-full mb-2 w-80 rounded-xl shadow-lg ring-1 bg-white dark:bg-gray-800 ring-gray-200 dark:ring-gray-700 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">社群消息</span>
                  <div className="flex items-center space-x-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => setCommunityMessages(prev => prev.map(m => ({ ...m, read: true })))}>
                      全部已读
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-gray-300 focus:rounded"
                      onClick={() => {
                        setShowCommunityMessages(false);
                        navigate('/community');
                      }}
                      aria-label="查看全部社区消息">
                      查看全部
                    </button>
                  </div>
                </div>
                <ul className="max-h-80 overflow-auto">
                  {communityMessages.length === 0 ? (
                    <li className="text-gray-500 dark:text-gray-400 px-4 py-6 text-sm">暂无消息</li>
                  ) : (
                    communityMessages.map(m => (
                      <li key={m.id}>
                        <button
                          className="w-full text-left px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => {
                            setCommunityMessages(prev => prev.map(x => 
                              x.id === m.id ? { ...x, read: true } : x
                            ));
                          }}
                        >
                          <span className="text-2xl">{m.avatar}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{m.sender}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{m.time}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{m.content}</p>
                          </div>
                          {!m.read && (
                            <span className="mt-1 inline-flex items-center justify-center w-2 h-2 rounded-full bg-red-500"></span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {/* 满意度调查按钮 */}
          <button
              onClick={() => setShowSurvey(true)}
              className="bg-yellow-500 text-white p-2.5 rounded-full shadow-lg hover:bg-yellow-600 transition-all duration-300 flex items-center justify-center"
              aria-label="满意度调查"
              title="满意度调查"
            >
              <i className="fas fa-star text-base"></i>
            </button>
        </div>
        
        {/* 满意度调查组件 */}
        <SatisfactionSurvey 
          isOpen={showSurvey} 
          onClose={() => setShowSurvey(false)} 
          onSubmit={(data) => {
            // 使用调查服务提交数据
            surveyService.submitSurvey(
              data,
              user?.id || `anonymous-${Date.now()}`,
              user?.username || '匿名用户'
            );
          }} 
        />
      </>
    );
  }

  FloatingButtons.displayName = 'FloatingButtons';

  // 优化全局加载骨架屏，实现更美观的品牌化加载体验
  const GlobalLoadingSkeleton = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8">
        {/* 品牌Logo骨架 */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse relative overflow-hidden">
              {/* 添加品牌元素的骨架 */}
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
            {/* 添加旋转动画效果 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-xl opacity-50 animate-spin-slow"></div>
          </div>
          {/* 品牌名称骨架 */}
          <div className="mt-6 space-y-2">
            <div className="h-8 w-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
          </div>
        </div>
        
        {/* 进度指示器 */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse rounded-full" style={{ width: '70%' }}></div>
          </div>
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            加载中...
          </div>
        </div>
        
        {/* 内容骨架 */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
            <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
            <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
          </div>
          <div className="h-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg"></div>
        </div>
        
        {/* 版权信息骨架 */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          <div className="h-3 w-40 mx-auto bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded"></div>
        </div>
      </div>
    </div>
  );

  // 简化的AnimatedPage组件，减少动画效果，提高性能
  const AnimatedPage = React.memo(({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
  });
  
  AnimatedPage.displayName = 'AnimatedPage';
  
  return (
    <div className="relative min-h-screen bg-white dark:bg-[var(--bg-primary)]">
      <Analytics />
      <SpeedInsights />
      <Routes>
        {/* 核心页面直接渲染，无需懒加载，添加缓存和动画 */}
        {/* 确保根路径是第一个路由，提高匹配优先级 */}
        <Route path="/" element={
          <RouteCache>
            <AnimatedPage>
              {isMobile ? (
                <MobileLayout><PrivateRoute><Home /></PrivateRoute></MobileLayout>
              ) : (
                <SidebarLayout><PrivateRoute><Home /></PrivateRoute></SidebarLayout>
              )}
            </AnimatedPage>
          </RouteCache>
        } />
        {/* Landing页面路由 */}
        <Route path="/landing" element={<Landing />} />
        
        {/* 搜索结果页面 */}
        <Route path="/search" element={
          <RouteCache>
            <AnimatedPage>
              {isMobile ? (
                <MobileLayout><SearchResults /></MobileLayout>
              ) : (
                <SidebarLayout><SearchResults /></SidebarLayout>
              )}
            </AnimatedPage>
          </RouteCache>
        } />
        
        {/* 不需要布局的页面 */}
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
        {/* 测试页面 */}
        <Route path="/test" element={<AnimatedPage><TestPage /></AnimatedPage>} />
        <Route path="/test-basic" element={<AnimatedPage><TestBasic /></AnimatedPage>} />
        
        {/* 使用布局的页面，为所有子路由添加动画 */}
        <Route element={
          <AnimatedPage>
            {isMobile ? (
              <MobileLayout><Outlet /></MobileLayout>
            ) : (
              <SidebarLayout><Outlet /></SidebarLayout>
            )}
          </AnimatedPage>
        }>
          <Route path="/explore" element={<RouteCache><LazyComponent><Explore /></LazyComponent></RouteCache>} />
          <Route path="/explore/:id" element={<LazyComponent><WorkDetail /></LazyComponent>} />
          <Route path="/works/:id" element={<LazyComponent><WorkDetail /></LazyComponent>} />
          <Route path="/tools" element={<RouteCache><LazyComponent><Tools /></LazyComponent></RouteCache>} />
          <Route path="/about" element={<RouteCache><LazyComponent><About /></LazyComponent></RouteCache>} />
          <Route path="/neo" element={<LazyComponent><Neo /></LazyComponent>} />
          <Route path="/square" element={<LazyComponent><PrivateRoute><Square /></PrivateRoute></LazyComponent>} />
          <Route path="/square/:id" element={<LazyComponent><PrivateRoute><Square /></PrivateRoute></LazyComponent>} />
          <Route path="/community" element={<LazyComponent><PrivateRoute><Community /></PrivateRoute></LazyComponent>} />          <Route path="/friends" element={<LazyComponent><PrivateRoute><Friends /></PrivateRoute></LazyComponent>} />
          <Route path="/dashboard" element={<RouteCache><LazyComponent><PrivateRoute><Dashboard /></PrivateRoute></LazyComponent></RouteCache>} />
          <Route path="/create" element={<LazyComponent><PrivateRoute><Create /></PrivateRoute></LazyComponent>} />
          <Route path="/creates" element={<Navigate to="/create" replace />} />
          
          {/* 大型组件和低频访问页面使用懒加载 */}
          <Route path="/particle-art" element={<LazyComponent><ParticleArt /></LazyComponent>} />
          <Route path="/collaboration" element={<LazyComponent><CollaborationDemo /></LazyComponent>} />
          <Route path="/privacy" element={<LazyComponent><Privacy /></LazyComponent>} />
          <Route path="/terms" element={<LazyComponent><Terms /></LazyComponent>} />
          <Route path="/help" element={<LazyComponent><Help /></LazyComponent>} />
          <Route path="/leaderboard" element={<LazyComponent><Leaderboard /></LazyComponent>} />
          <Route path="/games" element={<LazyComponent><Games /></LazyComponent>} />
          <Route path="/lab" element={<LazyComponent><PrivateRoute><Lab /></PrivateRoute></LazyComponent>} />
          <Route path="/image-test" element={<LazyComponent><ImageTest /></LazyComponent>} />
          <Route path="/github-image-test" element={<LazyComponent><GitHubImageTestPage /></LazyComponent>} />
          <Route path="/wizard" element={<LazyComponent><PrivateRoute><Wizard /></PrivateRoute></LazyComponent>} />
          <Route path="/brand" element={<LazyComponent><PrivateRoute><BrandGuide /></PrivateRoute></LazyComponent>} />
          <Route path="/input" element={<LazyComponent><PrivateRoute><InputHub /></PrivateRoute></LazyComponent>} />
          <Route path="/generate" element={<LazyComponent><PrivateRoute><Generation /></PrivateRoute></LazyComponent>} />
          <Route path="/authenticity" element={<LazyComponent><PrivateRoute><Authenticity /></PrivateRoute></LazyComponent>} />
          <Route path="/incentives" element={<LazyComponent><PrivateRoute><Incentives /></PrivateRoute></LazyComponent>} />
          <Route path="/drafts" element={<LazyComponent><PrivateRoute><Drafts /></PrivateRoute></LazyComponent>} />
          <Route path="/settings" element={<LazyComponent><PrivateRoute><Settings /></PrivateRoute></LazyComponent>} />
          {/* 账户设置相关路由 */}
          <Route path="/profile/edit" element={<LazyComponent><PrivateRoute><ProfileEdit /></PrivateRoute></LazyComponent>} />
          <Route path="/password/change" element={<LazyComponent><PrivateRoute><ChangePassword /></PrivateRoute></LazyComponent>} />
          <Route path="/account/security" element={<LazyComponent><PrivateRoute><AccountSecurity /></PrivateRoute></LazyComponent>} />
          <Route path="/analytics" element={<LazyComponent><PrivateRoute><AnalyticsPage /></PrivateRoute></LazyComponent>} />
          <Route path="/collection" element={<LazyComponent><PrivateRoute><UserCollection /></PrivateRoute></LazyComponent>} />
          <Route path="/collections" element={<LazyComponent><PrivateRoute><UserCollection /></PrivateRoute></LazyComponent>} />
          <Route path="/knowledge" element={<LazyComponent><PrivateRoute><CulturalKnowledge /></PrivateRoute></LazyComponent>} />
          <Route path="/knowledge/:type/:id" element={<LazyComponent><PrivateRoute><CulturalKnowledge /></PrivateRoute></LazyComponent>} />
          <Route path="/cultural-knowledge" element={<LazyComponent><PrivateRoute><CulturalKnowledge /></PrivateRoute></LazyComponent>} />
          <Route path="/news" element={<LazyComponent><CulturalNewsPage /></LazyComponent>} />
          <Route path="/news/:id" element={<LazyComponent><NewsDetail /></LazyComponent>} />
          <Route path="/cultural-news" element={<LazyComponent><CulturalNewsPage /></LazyComponent>} />
          <Route path="/tianjin" element={<LazyComponent><Tianjin /></LazyComponent>} />
          <Route path="/tianjin/map" element={<LazyComponent><TianjinMap /></LazyComponent>} />
          <Route path="/tianjin-map" element={<LazyComponent><TianjinMap /></LazyComponent>} />
          <Route path="/events" element={<LazyComponent><CulturalEvents /></LazyComponent>} />
          <Route path="/events/:id" element={<LazyComponent><EventDetail /></LazyComponent>} />
          <Route path="/cultural-events" element={<LazyComponent><CulturalEvents /></LazyComponent>} />
          
          {/* 创新功能路由 - 懒加载 */}
          <Route path="/daily-checkin" element={<LazyComponent><PrivateRoute><DailyCheckin /></PrivateRoute></LazyComponent>} />
          <Route path="/creative-matchmaking" element={<LazyComponent><PrivateRoute><CreativeMatchmaking /></PrivateRoute></LazyComponent>} />
          <Route path="/ip-incubation" element={<LazyComponent><PrivateRoute><IPIncubationCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/cross-device-sync" element={<LazyComponent><PrivateRoute><CrossDeviceSync /></PrivateRoute></LazyComponent>} />
          <Route path="/achievement-museum" element={<LazyComponent><PrivateRoute><AchievementMuseum /></PrivateRoute></LazyComponent>} />
          <Route path="/blind-box" element={<LazyComponent><PrivateRoute><BlindBoxShop /></PrivateRoute></LazyComponent>} />
          {/* 积分商城路由 */}
          <Route path="/points-mall" element={<LazyComponent><PrivateRoute><PointsMall /></PrivateRoute></LazyComponent>} />
          
          {/* 会员相关路由 - 懒加载 */}
          <Route path="/membership" element={<LazyComponent><Membership /></LazyComponent>} />
          <Route path="/membership/payment" element={<LazyComponent><PrivateRoute><MembershipPayment /></PrivateRoute></LazyComponent>} />
          <Route path="/membership/benefits" element={<LazyComponent><MembershipBenefits /></LazyComponent>} />
          <Route path="/membership/upgrade" element={<LazyComponent><PrivateRoute><Membership /></PrivateRoute></LazyComponent>} />
          
          {/* 管理员路由 - 懒加载 */}
          <Route path="/admin" element={<LazyComponent><AdminRoute component={Admin} /></LazyComponent>} />
          <Route path="/errors" element={<LazyComponent><AdminRoute component={ErrorMonitoringDashboard} /></LazyComponent>} />
          <Route path="/admin-analytics" element={<LazyComponent><AdminRoute component={AdminAnalytics} /></LazyComponent>} />
        </Route>
      </Routes>
      
      {/* PWA 安装按钮 - 懒加载，隐藏固定按钮，只在个人菜单中显示 */}
      <LazyComponent>
        <PWAInstallButton hideFixedButton={true} />
      </LazyComponent>
      {/* 恢复FirstLaunchGuide组件，优化首次启动体验 - 懒加载 */}
      <LazyComponent>
        <FirstLaunchGuide />
      </LazyComponent>
      
      {/* 悬浮AI助手 - 懒加载 */}
      <LazyComponent>
        <FloatingAIAssistant />
      </LazyComponent>
      
      {/* 用户反馈组件 - 懒加载 */}
      <LazyComponent>
        <UserFeedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      </LazyComponent>
      
      {/* 优化：使用独立的FloatingButtons组件，避免不必要的全局重新渲染 */}
      <LazyComponent>
        <FloatingButtons />
      </LazyComponent>
      

    </div>
);
}
