import React, { useState, useEffect, Suspense, lazy, useRef, useCallback } from 'react';
import { Toaster } from "sonner";

// 条件导入 Vercel 分析组件
let Analytics: React.FC | null = null;
let SpeedInsights: React.FC | null = null;

if (process.env.NODE_ENV === 'production') {
  try {
    const analyticsModule = require("@vercel/analytics/react");
    const speedInsightsModule = require("@vercel/speed-insights/react");
    Analytics = analyticsModule.Analytics;
    SpeedInsights = speedInsightsModule.SpeedInsights;
  } catch (e) {
    console.warn('Vercel analytics modules not found:', e);
  }
}
import { motion } from "framer-motion";
import { debounce } from '@/lib/utils';

import { Routes, Route, Outlet, useLocation, useNavigationType, Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
// 导入postService用于初始化
import postsApi from '@/services/postService';
import { addPost } from '@/services/postService';
import { Post } from '@/services/postService';
import dataSyncService from '@/services/dataSyncService';
// 导入性能优化工具
import { createLazyComponent, ROUTE_PRIORITIES, performanceOptimizer } from '@/utils/performanceOptimization';
// 导入通知上下文
import { NotificationProvider } from '@/contexts/NotificationContext';
// 导入主题上下文

// 导入Toaster样式
import "sonner/dist/styles.css";


import CommandPalette from '@/components/CommandPalette';
import ErrorBoundary from '@/components/ErrorBoundary';
import { TianjinThemeWrapper } from '@/components/TianjinThemeWrapper';
import { ScrollRestoration } from '@/components/ScrollRestoration';

// 核心页面 - 只保留最关键的页面进行同步加载，减少初始加载时间
import Home from "@/pages/Home";
import MobileHome from "@/pages/MobileHome";
import ComponentShowcase from "@/pages/ComponentShowcase";

// 认证相关页面 - 懒加载减少初始包大小
const Login = createLazyComponent(() => import(/* webpackChunkName: "pages-auth" */ "@/pages/Login"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'login'
});
const Register = createLazyComponent(() => import(/* webpackChunkName: "pages-auth" */ "@/pages/Register"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'register'
});
const ForgotPassword = createLazyComponent(() => import(/* webpackChunkName: "pages-auth" */ "@/pages/ForgotPassword"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'forgot-password'
});
const CompleteProfile = createLazyComponent(() => import(/* webpackChunkName: "pages-auth" */ "@/pages/CompleteProfile"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'complete-profile'
});
const OAuthCallback = createLazyComponent(() => import(/* webpackChunkName: "pages-auth" */ "@/pages/OAuthCallback"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'oauth-callback'
});

// 导入Three.js组件懒加载工具
import { createLazyThreeComponent } from '@/components/lazy/LazyThreeComponent';

// 优化懒加载策略：根据页面访问频率和大小重新分类

// 1. 高频访问页面 - 只保留最核心的页面同步加载
const WorkDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/WorkDetail"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'work-detail'
});
const ThreadDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/ThreadDetail"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'thread-detail'
});

// 2. 其他高频页面改为懒加载
const Dashboard = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/Dashboard"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'dashboard'
});
const Community = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/Community"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'community'
});
const Square = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/Square"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'square'
});
const Friends = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/Friends"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'friends'
});
const ChatPage = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/ChatPage"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'chat'
});

// 3. 核心工具页面改为懒加载
const Create = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/create"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'create'
});
const Studio = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/create/Studio"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'studio'
});
const AIWriter = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/create/AIWriter"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'ai-writer'
});
const AIWriterV2 = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/create/AIWriterV2"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'ai-writer-v2'
});

// 其他次要页面保持懒加载
const About = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/About"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'about'
});
const Settings = createLazyComponent(() => import(/* webpackChunkName: "pages-account" */ "@/pages/Settings"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'settings'
});

const Neo = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Neo"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'neo'
});


const EventWorks = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/EventWorks"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'event-works'
});
const SubmitWork = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/SubmitWork"), {
  priority: ROUTE_PRIORITIES.HIGH
});

// 移动端活动作品相关页面
const MobileEventWorks = createLazyComponent(() => import(/* webpackChunkName: "pages-mobile-events" */ "@/pages/MobileEventWorks"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'mobile-event-works'
});
const MobileWorkDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-mobile-events" */ "@/pages/MobileWorkDetail"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'mobile-work-detail'
});
const MobilePostDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-mobile-events" */ "@/pages/MobilePostDetail"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'mobile-post-detail'
});
const MobileSubmitWork = createLazyComponent(() => import(/* webpackChunkName: "pages-mobile-events" */ "@/pages/MobileSubmitWork"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'mobile-submit-work'
});

const SearchResults = createLazyComponent(() => import(/* webpackChunkName: "pages-explore" */ "@/pages/SearchResults"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'search'
});

// 动态内容展示页面 - 懒加载
const Feed = createLazyComponent(() => import(/* webpackChunkName: "pages-feed" */ "@/pages/Feed"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'feed'
});

const CreateLayout = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/create/CreateLayout"), {
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
const MyWorks = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/MyWorks"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 文化和知识相关 - 懒加载
const CulturalKnowledge = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/CulturalKnowledge"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'knowledge'
});
// Tianjin页面 - 懒加载，因为它是内容丰富的页面
const Tianjin = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/Tianjin"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'tianjin'
});

// 津脉脉络页面 - 懒加载
const InspirationMindMapPage = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/InspirationMindMapPage"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'inspiration-mindmap'
});

const CulturalEvents = createLazyComponent(() => import(/* webpackChunkName: "pages-cultural" */ "@/pages/CulturalEvents"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'events'
});


// 活动相关 - 懒加载优化
const ActivityDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-activities" */ "@/pages/ActivityDetail"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'activity-detail'
});
const EditActivity = createLazyComponent(() => import(/* webpackChunkName: "pages-activities" */ "@/pages/EditActivity"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'edit-activity'
});
const MyActivities = createLazyComponent(() => import(/* webpackChunkName: "pages-activities" */ "@/pages/MyActivities"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'my-activities'
});
const OrganizerCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-activities" */ "@/pages/OrganizerCenter"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'organizer-center'
});
const OrganizerEventDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-activities" */ "@/pages/OrganizerEventDetail"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'organizer-event-detail'
});
const EventRanking = createLazyComponent(() => import(/* webpackChunkName: "pages-activities" */ "@/pages/EventRanking"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'event-ranking'
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
const PersonalPayment = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/PersonalPayment"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'personal-payment'
});

const PointsMall = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/PointsMall"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 创作者中心 - 懒加载
const CreatorCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-creator" */ "@/pages/creator-center"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'creator-center'
});

// 社区和互动相关 - 懒加载
const Leaderboard = createLazyComponent(() => import(/* webpackChunkName: "pages-community" */ "@/pages/Leaderboard"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'leaderboard'
});
const Checkin = createLazyComponent(() => import(/* webpackChunkName: "pages-checkin" */ "@/pages/Checkin"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'checkin'
});
const CreativeMatchmaking = createLazyComponent(() => import(/* webpackChunkName: "components-community" */ "@/components/CreativeMatchmaking"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
const AchievementMuseum = createLazyComponent(() => import(/* webpackChunkName: "components-community" */ "@/components/AchievementMuseum"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});


// 作者个人资料页面 - 懒加载
const AuthorProfile = createLazyComponent(() => import(/* webpackChunkName: "pages-community" */ "@/pages/AuthorProfile"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});



const Games = createLazyThreeComponent(() => import(/* webpackChunkName: "pages-experimental" */ "@/pages/Games"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'games'
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
  priority: ROUTE_PRIORITIES.LOW,
  name: 'brand'
});
const BusinessCooperation = createLazyComponent(() => import(/* webpackChunkName: "pages-business" */ "@/pages/BusinessCooperation"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'business'
});
const BrandServiceAgreement = createLazyComponent(() => import(/* webpackChunkName: "pages-business" */ "@/pages/BrandServiceAgreement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'brand-agreement'
});
const Authenticity = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Authenticity"), {
  priority: ROUTE_PRIORITIES.LOW
});
const Wizard = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Wizard"), {
  priority: ROUTE_PRIORITIES.LOW
});

// 津小脉AI助手移动端页面 - 懒加载
const AIAssistantMobile = createLazyComponent(() => import(/* webpackChunkName: "pages-ai" */ "@/pages/AIAssistantMobile"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'ai-assistant-mobile'
});
const AnalyticsPage = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Analytics"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'analytics'
});
const UserCollection = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/UserCollection"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'collections'
});
const Notifications = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Notifications"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'notifications'
});
const MessageCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/MessageCenter"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'message-center'
});

// 移动端瀑布流作品展示页面
const MobileWorksGalleryDemo = createLazyComponent(() => import(/* webpackChunkName: "pages-mobile-gallery" */ "@/pages/MobileWorksGalleryDemo"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'mobile-works-gallery'
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

// 导入新的骨架屏组件
import { DashboardSkeleton, ProfileSkeleton, SimpleLoadingSkeleton } from '@/components/skeletons/PageSkeletons';

// 优化LazyComponent，添加延迟加载和错误处理
const LazyComponent = React.memo(({ 
  children, 
  fallback = <SimpleLoadingSkeleton /> 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        {fallback}
      </div>
    }>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
});

LazyComponent.displayName = 'LazyComponent';



// 布局组件
import SidebarLayout from '@/components/SidebarLayout';
import MobileLayout from '@/components/MobileLayout';

// 路由守卫组件
import PrivateRoute from '@/components/PrivateRoute';
import AdminRoute from '@/components/AdminRoute';

// 社群管理面板组件 - 懒加载
const CommunityAdminPanel = createLazyComponent(() => import(/* webpackChunkName: "components-community" */ '@/components/Community/Admin/CommunityAdminPanel'), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 社群管理面板包装组件 - 提供必要的props
const CommunityAdminPanelWrapper: React.FC = () => {
  const { isDark } = useTheme();
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingContent, setPendingContent] = useState<any[]>([]);
  const [approvedContent, setApprovedContent] = useState<any[]>([]);
  const [rejectedContent, setRejectedContent] = useState<any[]>([]);
  const [moderationRules, setModerationRules] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const { user } = useAuth();
  
  const isAdmin = user?.isAdmin || false;
  
  return (
    <CommunityAdminPanel
      isDark={isDark}
      communityId={id || ''}
      community={community}
      members={members}
      pendingContent={pendingContent}
      approvedContent={approvedContent}
      rejectedContent={rejectedContent}
      moderationRules={moderationRules}
      announcement={announcement}
      isAdmin={isAdmin}
      onAddMember={(email, role) => console.log('Add member:', email, role)}
      onRemoveMember={(memberId) => console.log('Remove member:', memberId)}
      onUpdateMemberRole={(memberId, role) => console.log('Update role:', memberId, role)}
      onUpdateAnnouncement={(content) => setAnnouncement(content)}
      onUpdateCommunity={(community) => setCommunity({ ...community })}
      onApproveContent={(contentId) => console.log('Approve:', contentId)}
      onRejectContent={(contentId, reason) => console.log('Reject:', contentId, reason)}
      onAddModerationRule={(rule) => setModerationRules([...moderationRules, { ...rule, id: Date.now().toString() }])}
      onUpdateModerationRule={(rule) => setModerationRules(moderationRules.map(r => r.id === rule.id ? rule : r))}
      onDeleteModerationRule={(ruleId) => setModerationRules(moderationRules.filter(r => r.id !== ruleId))}
    />
  );
};
// PWA 安装按钮组件 - 懒加载
const PWAInstallButton = createLazyComponent(() => import(/* webpackChunkName: "components-auxiliary" */ '@/components/PWAInstallButton'), {
  priority: ROUTE_PRIORITIES.LOW
});
// 首次启动引导组件 - 懒加载
const FirstLaunchGuide = createLazyComponent(() => import(/* webpackChunkName: "components-auxiliary" */ '@/components/FirstLaunchGuide'), {
  priority: ROUTE_PRIORITIES.LOW
});
// 悬浮AI助手组件 - 懒加载
const FloatingAIAssistant = createLazyComponent(() => import(/* webpackChunkName: "components-ai" */ '@/components/FloatingAIAssistantV2'), {
  priority: ROUTE_PRIORITIES.MEDIUM
});
// 用户反馈组件 - 懒加载
const UserFeedback = createLazyComponent(() => import(/* webpackChunkName: "components-auxiliary" */ '@/components/UserFeedback'), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 津门文化随机弹窗 - 懒加载
const JinmenCulturePopup = createLazyComponent(() => import(/* webpackChunkName: "components-cultural" */ '@/components/JinmenCulturePopup'), {
  priority: ROUTE_PRIORITIES.LOW
});



import { GuideProvider } from '@/contexts/GuideContext';
import { Onboarding } from '@/components/Onboarding';
import { AuthContext } from '@/contexts/authContext';
import { EventProvider } from '@/contexts/EventContext';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = React.useContext(AuthContext);
  const { isDark } = useTheme();
  // 添加响应式布局状态 - 服务器端和客户端初始状态必须一致
  const [isMobile, setIsMobile] = useState(false);
  // 添加用户反馈状态
  const [showFeedback, setShowFeedback] = useState(false);
  
  // 性能优化：延迟初始化非关键数据
  useEffect(() => {
    // 初始化数据同步服务
    dataSyncService.initialize();

    // 使用 requestIdleCallback 在浏览器空闲时初始化性能优化器
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        performanceOptimizer.initialize();
      }, { timeout: 3000 });
    } else {
      // 降级方案：使用 requestAnimationFrame 确保在渲染完成后初始化
      requestAnimationFrame(() => {
        performanceOptimizer.initialize();
      });
    }

    // 使用 Intersection Observer 检测首屏渲染完成后再初始化非核心数据
    const initObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 首屏内容已渲染，开始初始化非核心数据
            initNonCriticalData();
            initObserver.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    // 观察根元素，检测首屏渲染
    const rootElement = document.getElementById('root');
    if (rootElement) {
      initObserver.observe(rootElement);
    }

    // 备用方案：最多等待5秒后强制初始化
    const backupTimer = setTimeout(() => {
      initNonCriticalData();
      initObserver.disconnect();
    }, 5000);

    // 初始化非核心数据的函数
    async function initNonCriticalData() {
      try {
        // 紧急清理：检查localStorage使用情况
        try {
          const testKey = '__test_storage__';
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
        } catch (e) {
          console.warn('LocalStorage is full, performing cleanup...');
          // 清理非关键数据
          localStorage.removeItem('ai_creation_platform_errors');
          localStorage.removeItem('ai_creation_platform_alerts');
        }

        // 检查localStorage中是否已有数据
        const storedPosts = localStorage.getItem('posts');
        if (!storedPosts) {
          // 初始化为空数组，确保新用户看到的是空状态
          localStorage.setItem('posts', JSON.stringify([]));
        }
      } catch (error) {
        console.error('初始化数据失败:', error);
      }
    }

    return () => {
      clearTimeout(backupTimer);
      initObserver.disconnect();
    };
  }, []);

  // 监听登录成功事件，检查用户信息是否完整，不完整则跳转到CompleteProfile页面
  useEffect(() => {
    // 动态导入eventBus，避免SSR问题
    import('@/lib/eventBus').then(({ default: eventBus }) => {
      const handleLogin = (data: any) => {
        console.log('登录成功事件触发:', data);
        // 检查用户信息是否完整
        if (data && !data.isProfileComplete) {
          console.log('用户信息不完整，跳转到CompleteProfile页面');
          // 延迟跳转，确保路由已准备就绪
          setTimeout(() => {
            navigate('/complete-profile');
          }, 100);
        }
      };

      // 监听登录成功事件，保存listenerId用于取消订阅
      const listenerId = eventBus.subscribe('auth:login', handleLogin);

      return () => {
        // 清理事件监听
        eventBus.unsubscribe('auth:login', listenerId);
      };
    });
  }, [navigate]);
  
  // 优化：使用防抖函数减少resize事件触发频率
  const checkIsMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  useEffect(() => {
    // 初始化检查
    checkIsMobile();
    
    // 添加 resize 事件监听，使用防抖优化
    const debouncedCheck = debounce(checkIsMobile, 200);
    window.addEventListener('resize', debouncedCheck);
    
    // 清理事件监听
    return () => window.removeEventListener('resize', debouncedCheck);
  }, [checkIsMobile]);

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
            <li><a href="/square" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">浏览作品</a></li>
            <li><a href="/create" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">创作中心</a></li>

            <li><a href="/tianjin" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">天津特色</a></li>
          </ul>
        </div>
        
        {/* 通知区域 */}
        <div className="rounded-xl p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <h4 className="font-medium mb-2">最新通知</h4>
          <div className="space-y-3">
             <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
               <p>暂无新通知</p>
             </div>
          </div>
        </div>
      </div>
    </aside>
  ));
  
  // 右侧内容组件的延迟加载版本 - 仅在需要时加载
  const LazyRightContent = lazy(() => Promise.resolve({ default: RightContent }));



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

  // Enhanced AnimatedPage component with optimized transitions
  const AnimatedPage = React.memo(({ children }: { children: React.ReactNode }) => {
    return (
      <div className="w-full h-full bg-white dark:bg-gray-900">
        {children}
      </div>
    );
  });
  
  AnimatedPage.displayName = 'AnimatedPage';
  
  // 优化根元素样式，使用CSS变量而不是条件类，减少重排
  const rootClass: string = 'relative min-h-screen transition-colors duration-300';

  return (
      <NotificationProvider>
        <GuideProvider>
          <EventProvider>
            <div className={rootClass} style={{ backgroundColor: 'var(--bg-primary, #ffffff)' }}>
            {Analytics && <Analytics />}
            {SpeedInsights && <SpeedInsights />}
            <Routes location={location} key={location.pathname}>
          {/* 核心页面直接渲染，无需懒加载，添加缓存和动画 */}
          {/* 确保根路径是第一个路由，提高匹配优先级 */}
          <Route path="/" element={
            <ErrorBoundary>
              <AnimatedPage>
                {isMobile ? (
                  <MobileLayout><MobileHome /></MobileLayout>
                ) : (
                  <SidebarLayout><Home /></SidebarLayout>
                )}
              </AnimatedPage>
            </ErrorBoundary>
          } />
          <Route path="/landing" element={
            <ErrorBoundary>
              <AnimatedPage>
                <div className="min-h-screen">
                  {/* 这里将加载landing.html的内容 */}
                  <h1 className="text-2xl font-bold text-center py-10">津脉智坊 - 欢迎页面</h1>
                  <p className="text-center">正在加载 landing 页面内容...</p>
                </div>
              </AnimatedPage>
            </ErrorBoundary>
          } />

        
        {/* 搜索结果页面 */}
        <Route path="/search" element={
          <AnimatedPage>
            {isMobile ? (
              <MobileLayout><LazyComponent><SearchResults /></LazyComponent></MobileLayout>
            ) : (
              <SidebarLayout><LazyComponent><SearchResults /></LazyComponent></SidebarLayout>
            )}
          </AnimatedPage>
        } />
        
        {/* 不需要布局的页面 */}
        <Route path="/login" element={<ErrorBoundary><AnimatedPage><Login /></AnimatedPage></ErrorBoundary>} />
        <Route path="/register" element={<ErrorBoundary><AnimatedPage><Register /></AnimatedPage></ErrorBoundary>} />
        <Route path="/forgot-password" element={<ErrorBoundary><AnimatedPage><ForgotPassword /></AnimatedPage></ErrorBoundary>} />
        <Route path="/complete-profile" element={<ErrorBoundary><AnimatedPage><CompleteProfile /></AnimatedPage></ErrorBoundary>} />
        <Route path="/oauth/callback/:provider" element={<ErrorBoundary><AnimatedPage><OAuthCallback /></AnimatedPage></ErrorBoundary>} />

        
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

          <Route path="/about" element={<LazyComponent><About /></LazyComponent>} />
          <Route path="/neo" element={<Navigate to="/create/inspiration" replace />} />
          <Route path="/square" element={<LazyComponent><PrivateRoute><Square /></PrivateRoute></LazyComponent>} />
<Route path="/square/:id" element={<LazyComponent><PrivateRoute>{isMobile ? <MobilePostDetail /> : <Square />}</PrivateRoute></LazyComponent>} />
          <Route path="/community" element={<LazyComponent><PrivateRoute><Community /></PrivateRoute></LazyComponent>} />
          <Route path="/community/:id" element={<LazyComponent><PrivateRoute><Community /></PrivateRoute></LazyComponent>} />
          <Route path="/community/:id/:channel" element={<LazyComponent><PrivateRoute><Community /></PrivateRoute></LazyComponent>} />
          <Route path="/community/:id/post/:postId" element={<LazyComponent><PrivateRoute><ThreadDetail /></PrivateRoute></LazyComponent>} />
          <Route path="/community/:id/admin" element={<LazyComponent><PrivateRoute><CommunityAdminPanelWrapper /></PrivateRoute></LazyComponent>} />
          <Route path="/friends" element={<LazyComponent><PrivateRoute><Friends /></PrivateRoute></LazyComponent>} />
          <Route path="/chat/:userId" element={<LazyComponent><PrivateRoute><ChatPage /></PrivateRoute></LazyComponent>} />
          <Route path="/post/:id" element={<LazyComponent>{isMobile ? <MobilePostDetail /> : <WorkDetail />}</LazyComponent>} />
          <Route path="/work/:id" element={<LazyComponent>{isMobile ? <MobilePostDetail /> : <WorkDetail />}</LazyComponent>} />
          <Route path="/creator-community" element={<Navigate to="/community" replace />} />
          <Route path="/dashboard" element={<LazyComponent fallback={<DashboardSkeleton />}><PrivateRoute><Dashboard /></PrivateRoute></LazyComponent>} />
          <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
          <Route path="/create/*" element={<LazyComponent><PrivateRoute><Create /></PrivateRoute></LazyComponent>} />
          <Route path="/create-activity" element={<Navigate to="/organizer" replace />} />
          <Route path="/creates" element={<Navigate to="/create" replace />} />
          <Route path="/wizard" element={<LazyComponent><PrivateRoute><Wizard /></PrivateRoute></LazyComponent>} />
          <Route path="/ai-writer" element={<LazyComponent><PrivateRoute><AIWriterV2 /></PrivateRoute></LazyComponent>} />
          
          {/* 津小脉AI助手移动端页面 */}
          <Route path="/ai-assistant" element={<LazyComponent><PrivateRoute><AIAssistantMobile /></PrivateRoute></LazyComponent>} />
          
          {/* 动态内容展示页面 */}
          <Route path="/feed" element={<LazyComponent><PrivateRoute><Feed /></PrivateRoute></LazyComponent>} />
          
          {/* 大型组件和低频访问页面使用懒加载 */}


          <Route path="/privacy" element={<LazyComponent><Privacy /></LazyComponent>} />
          <Route path="/terms" element={<LazyComponent><Terms /></LazyComponent>} />
          <Route path="/help" element={<LazyComponent><Help /></LazyComponent>} />
          <Route path="/leaderboard" element={<LazyComponent><Leaderboard /></LazyComponent>} />
          <Route path="/games" element={<LazyComponent><Games /></LazyComponent>} />

          <Route path="/author/:id" element={<LazyComponent><AuthorProfile currentUser={user} /></LazyComponent>} />

          <Route path="/brand" element={<LazyComponent><PrivateRoute><BrandGuide /></PrivateRoute></LazyComponent>} />
          <Route path="/business" element={<LazyComponent><BusinessCooperation /></LazyComponent>} />
          <Route path="/business-cooperation" element={<LazyComponent><BusinessCooperation /></LazyComponent>} />
          <Route path="/brand-service-agreement" element={<LazyComponent><BrandServiceAgreement isDark={isDark} /></LazyComponent>} />
          <Route path="/input" element={<LazyComponent><PrivateRoute><InputHub /></PrivateRoute></LazyComponent>} />
          <Route path="/generate" element={<LazyComponent><PrivateRoute><Generation /></PrivateRoute></LazyComponent>} />
          <Route path="/authenticity" element={<LazyComponent><PrivateRoute><Authenticity /></PrivateRoute></LazyComponent>} />

          <Route path="/drafts" element={<LazyComponent><PrivateRoute><Drafts /></PrivateRoute></LazyComponent>} />
          <Route path="/my-works" element={<LazyComponent><PrivateRoute><MyWorks /></PrivateRoute></LazyComponent>} />
          <Route path="/settings" element={<LazyComponent><PrivateRoute><Settings /></PrivateRoute></LazyComponent>} />
          {/* 账户设置相关路由 */}
          <Route path="/profile/edit" element={<ErrorBoundary><AnimatedPage><PrivateRoute><ProfileEdit /></PrivateRoute></AnimatedPage></ErrorBoundary>} />
          <Route path="/password/change" element={<LazyComponent><PrivateRoute><ChangePassword /></PrivateRoute></LazyComponent>} />
          <Route path="/account/security" element={<LazyComponent><PrivateRoute><AccountSecurity /></PrivateRoute></LazyComponent>} />
          <Route path="/analytics" element={<LazyComponent><PrivateRoute><AnalyticsPage /></PrivateRoute></LazyComponent>} />
          <Route path="/collection" element={<LazyComponent><PrivateRoute><UserCollection /></PrivateRoute></LazyComponent>} />
          <Route path="/collections" element={<LazyComponent><PrivateRoute><UserCollection /></PrivateRoute></LazyComponent>} />
          <Route path="/notifications" element={<LazyComponent><PrivateRoute><Notifications /></PrivateRoute></LazyComponent>} />
          <Route path="/messages" element={<LazyComponent><PrivateRoute><MessageCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/component-showcase" element={<ComponentShowcase />} />
          <Route path="/knowledge" element={<LazyComponent><CulturalKnowledge /></LazyComponent>} />
          <Route path="/knowledge/:type/:id" element={<LazyComponent><CulturalKnowledge /></LazyComponent>} />
          <Route path="/cultural-knowledge" element={<LazyComponent><CulturalKnowledge /></LazyComponent>} />

          <Route path="/tianjin" element={<LazyComponent><Tianjin /></LazyComponent>} />
          <Route path="/inspiration-mindmap" element={<LazyComponent><PrivateRoute><InspirationMindMapPage /></PrivateRoute></LazyComponent>} />

          <Route path="/events" element={<LazyComponent><CulturalEvents /></LazyComponent>} />
          <Route path="/events/:id/works" element={<LazyComponent>{isMobile ? <MobileEventWorks /> : <EventWorks />}</LazyComponent>} />
          <Route path="/events/:id/submit" element={<LazyComponent><PrivateRoute>{isMobile ? <MobileSubmitWork /> : <SubmitWork />}</PrivateRoute></LazyComponent>} />
          <Route path="/events/:eventId/works/:workId" element={<LazyComponent>{isMobile ? <MobileWorkDetail /> : <WorkDetail />}</LazyComponent>} />
          <Route path="/cultural-events" element={<LazyComponent><CulturalEvents /></LazyComponent>} />
          
          {/* 活动管理相关路由 */}
          <Route path="/activities/:id" element={<LazyComponent><PrivateRoute><ActivityDetail /></PrivateRoute></LazyComponent>} />
          <Route path="/edit-activity/:id" element={<LazyComponent><PrivateRoute><EditActivity /></PrivateRoute></LazyComponent>} />
          <Route path="/my-activities" element={<LazyComponent><PrivateRoute><MyActivities /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer" element={<LazyComponent><PrivateRoute><OrganizerCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/events/:id" element={<LazyComponent><PrivateRoute><OrganizerEventDetail /></PrivateRoute></LazyComponent>} />
          <Route path="/ranking/:eventId" element={<LazyComponent><PrivateRoute><EventRanking /></PrivateRoute></LazyComponent>} />
          
          {/* 创新功能路由 - 懒加载 */}
          <Route path="/checkin" element={<LazyComponent><PrivateRoute><Checkin /></PrivateRoute></LazyComponent>} />
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
<Route path="/membership/payment/personal" element={<LazyComponent><PrivateRoute><PersonalPayment /></PrivateRoute></LazyComponent>} />
          <Route path="/membership/benefits" element={<LazyComponent><MembershipBenefits /></LazyComponent>} />
          <Route path="/membership/upgrade" element={<LazyComponent><PrivateRoute><Membership /></PrivateRoute></LazyComponent>} />
          
          {/* 移动端瀑布流作品展示页面 */}
          <Route path="/mobile-works" element={<LazyComponent><MobileWorksGalleryDemo /></LazyComponent>} />
          
          {/* 创作者中心路由 - 使用 SidebarLayout 布局 */}
          <Route path="/creator-center" element={<LazyComponent><PrivateRoute><CreatorCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/creator-center/:tab" element={<LazyComponent><PrivateRoute><CreatorCenter /></PrivateRoute></LazyComponent>} />
          
          {/* 管理员路由 - 懒加载 */}
        </Route>
        
        {/* 管理员路由 - 独立于 SidebarLayout */}
        <Route path="/admin" element={<LazyComponent><AdminRoute component={Admin} /></LazyComponent>} />
        <Route path="/errors" element={<LazyComponent><AdminRoute component={ErrorMonitoringDashboard} /></LazyComponent>} />
        <Route path="/admin-analytics" element={<LazyComponent><AdminRoute component={AdminAnalytics} /></LazyComponent>} />
      </Routes>
      
      {/* PWA 安装按钮 - 懒加载，隐藏固定按钮，只在个人菜单中显示 */}
      <LazyComponent>
        <PWAInstallButton hideFixedButton={true} forceShow={true} />
      </LazyComponent>
      {/* 恢复FirstLaunchGuide组件，优化首次启动体验 - 懒加载 */}
      <LazyComponent>
        <FirstLaunchGuide />
      </LazyComponent>
      
      {/* 悬浮AI助手按钮 - 用于打开侧边栏AI助手，登录页面和落地页不显示，移动端不显示（已在底部导航栏集成） */}
      {!isMobile && location.pathname !== '/login' && location.pathname !== '/landing.html' && location.pathname !== '/landing' && (
        <ErrorBoundary fallback={null}>
          <LazyComponent>
            <FloatingAIAssistant />
          </LazyComponent>
        </ErrorBoundary>
      )}
      
      {/* 用户反馈组件 - 懒加载 */}
      <LazyComponent>
        <UserFeedback isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      </LazyComponent>
      
      {/* 津门文化随机弹窗 - 落地页不显示 */}
      {location.pathname !== '/landing.html' && location.pathname !== '/landing' && (
        <ErrorBoundary fallback={null}>
          <LazyComponent>
            <JinmenCulturePopup />
          </LazyComponent>
        </ErrorBoundary>
      )}
      
      {/* 全局命令面板 */}
      <CommandPalette />

      {/* 新手引导组件 */}
      <Onboarding />

      {/* 全局 Toast 通知 */}
      <Toaster position="top-center" richColors closeButton />

      {/* 天津主题特色功能 */}
      <TianjinThemeWrapper />

      {/* 滚动位置恢复 */}
      <ScrollRestoration />
    </div>
          </EventProvider>
        </GuideProvider>
      </NotificationProvider>
);
}
