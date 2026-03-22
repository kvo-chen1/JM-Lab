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
import { useUserSession } from '@/hooks/useUserSession';
// 导入postService用于初始化
import postsApi from '@/services/postService';
import { addPost } from '@/services/postService';
import { Post } from '@/services/postService';
import dataSyncService from '@/services/dataSyncService';
// 导入性能优化工具
import { createLazyComponent, ROUTE_PRIORITIES, performanceOptimizer } from '@/utils/performanceOptimization';
// 导入 Web Vitals 监控
import { initWebVitalsMonitoring } from '@/utils/webVitals';
// 导入 Service Worker 注册
import { registerServiceWorker } from '@/utils/serviceWorker';
// 导入通知上下文
import { NotificationProvider } from '@/contexts/NotificationContext';
// 导入主题上下文

// 导入Toaster样式
import "sonner/dist/styles.css";


import CommandPalette from '@/components/CommandPalette';
import ErrorBoundary from '@/components/ErrorBoundary';
import { TianjinThemeWrapper } from '@/components/TianjinThemeWrapper';
import { ScrollRestoration } from '@/components/ScrollRestoration';
import { HamsterWheelLoader } from '@/components/ui';
import AIChatBot from '@/components/AIChatBot';
import EntryAnimation from '@/components/EntryAnimation';

// 核心页面 - 只保留最关键的页面进行同步加载，减少初始加载时间
import Home from "@/pages/Home";
import MobileHome from "@/pages/MobileHome";
import ComponentShowcase from "@/pages/ComponentShowcase";
import IPPosterGenerator from "@/pages/IPPosterGenerator";
import IPPosterComposerPage from "@/pages/IPPosterComposerPage";
import ThemeTestPage from "@/pages/ThemeTestPage";
import HamsterLoaderDemo from "@/pages/HamsterLoaderDemo";

// ImagePasteInput 演示页面 - 懒加载
const ImagePasteInputDemo = createLazyComponent(() => import(/* webpackChunkName: "pages-demo" */ "@/pages/ImagePasteInputDemo"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'image-paste-input-demo'
});

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

// 高频访问页面 - 同步导入，确保快速打开
import Dashboard from "@/pages/Dashboard";
import Community from "@/pages/Community";
import Square from "@/pages/Square";
import Feed from "@/pages/Feed";
import WorkDetail from "@/pages/WorkDetail";

// 中等频率页面 - 懒加载
const Friends = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/Friends"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'friends'
});
const ChatPage = createLazyComponent(() => import(/* webpackChunkName: "pages-core" */ "@/pages/ChatPage"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'chat'
});

// 核心工具页面 - 懒加载
const Create = createLazyComponent(() => import(/* webpackChunkName: "pages-create" */ "@/pages/create"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'create'
});
const SkillAgentChatPage = createLazyComponent(() => import(/* webpackChunkName: "pages-skill" */ "@/pages/skill/chat"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'skill-agent-chat'
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

// Agent 页面 - 独立于 create 目录
const AgentPage = createLazyComponent(() => import(/* webpackChunkName: "pages-agent" */ "@/pages/agent"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'agent'
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

// 活动详情页 - 全新设计
const EventDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-activities" */ "@/pages/EventDetail"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'event-detail'
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
const SystemStatus = createLazyComponent(() => import(/* webpackChunkName: "pages-admin" */ "@/pages/SystemStatus"), {
  priority: ROUTE_PRIORITIES.LOW
});
const LotteryManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin" */ "@/pages/admin/LotteryManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'lottery-management'
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

const PointsLottery = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/PointsLottery"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 创作者认证页面 - 懒加载
const Certification = createLazyComponent(() => import(/* webpackChunkName: "pages-certification" */ "@/pages/Certification"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'certification'
});
const CertificationAudit = createLazyComponent(() => import(/* webpackChunkName: "pages-admin" */ "@/pages/admin/CertificationAudit"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'certification-audit'
});

// 津币管理页面 - 懒加载
const JinbiManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-membership" */ "@/pages/JinbiManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 创作者中心 - 懒加载
const CreatorCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-creator" */ "@/pages/creator-center"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'creator-center'
});

// 商单任务页面 - 懒加载（使用创作者中心布局）
const BrandTaskCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-creator" */ "@/pages/creator-center/BrandTaskLayout"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'brand-task-center'
});

// 商单广场页面 - 懒加载（使用创作者中心布局）
const OrderSquareCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-creator" */ "@/pages/creator-center/OrderSquareLayout"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'order-square-center'
});

// 发布商单页面 - 懒加载（使用创作者中心布局）
const PublishOrderCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-creator" */ "@/pages/creator-center/PublishOrderLayout"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'publish-order-center'
});

// 商单中心页面 - 懒加载（使用创作者中心布局）
const OrderCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-creator" */ "@/pages/creator-center/OrderCenterLayout"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'order-center'
});

// 品牌方商单管理页面 - 懒加载（使用创作者中心布局）
const BrandOrderManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-creator" */ "@/pages/creator-center/BrandOrderManagementLayout"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'brand-order-management'
});

// 商单审核页面 - 懒加载
const OrderAudit = createLazyComponent(() => import(/* webpackChunkName: "pages-admin" */ "@/pages/admin/OrderAudit"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'order-audit'
});

// ============================================
// P0 核心Admin功能页面 - 懒加载
// ============================================
const UserAudit = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-core" */ "@/pages/admin/UserAudit"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'user-audit'
});
const ContentAudit = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-core" */ "@/pages/admin/ContentAudit"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'content-audit'
});
const ReportManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-core" */ "@/pages/admin/ReportManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'report-management'
});
const EventManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-core" */ "@/pages/admin/EventManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'event-management'
});


// ============================================
// P1 重要Admin功能页面 - 懒加载
// ============================================
const FeedbackManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-important" */ "@/pages/admin/FeedbackManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'feedback-management'
});
const ContentManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-important" */ "@/pages/admin/ContentManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'content-management'
});
const CommunityManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-important" */ "@/pages/admin/CommunityManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'community-management'
});
const PaymentAudit = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-important" */ "@/pages/admin/PaymentAudit"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'payment-audit'
});
const AuditLog = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-important" */ "@/pages/admin/AuditLog"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'audit-log'
});

// ============================================
// 商城管理Admin页面 - 懒加载
// ============================================
const MarketplaceProductManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-marketplace" */ "@/pages/admin/MarketplaceProductManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'marketplace-product-management'
});
const OrderManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-marketplace" */ "@/pages/admin/OrderManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'order-management'
});
const BrandManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-marketplace" */ "@/pages/admin/BrandManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'brand-management'
});

// ============================================
// 推广与营销Admin页面 - 懒加载
// ============================================
const PromotionUserManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-promotion" */ "@/pages/admin/PromotionUserManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'promotion-user-management'
});
const PromotionOrderManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-promotion" */ "@/pages/admin/PromotionOrderManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'promotion-order-management'
});
const PromotionAnalytics = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-promotion" */ "@/pages/admin/PromotionAnalytics"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'promotion-analytics'
});
const HomeRecommendationManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-promotion" */ "@/pages/admin/HomeRecommendationManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'home-recommendation-management'
});

// ============================================
// 数据分析与监控Admin页面 - 懒加载
// ============================================
const DataAnalytics = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-analytics" */ "@/pages/admin/DataAnalytics"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'data-analytics'
});
const AdvancedAnalytics = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-analytics" */ "@/pages/admin/AdvancedAnalytics"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'advanced-analytics'
});
const SystemMonitor = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-analytics" */ "@/pages/admin/SystemMonitor"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'system-monitor'
});

// ============================================
// 其他Admin功能页面 - 懒加载
// ============================================
const AIFeedbackManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/AIFeedbackManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'ai-feedback-management'
});
const TemplateManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/TemplateManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'template-management'
});
const KnowledgeBaseManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/KnowledgeBaseManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'knowledge-base-management'
});
const WorkSubmissionAudit = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/WorkSubmissionAudit"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'work-submission-audit'
});
const AchievementManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/AchievementManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'achievement-management'
});
const JinmaiCommunityManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/JinmaiCommunityManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'jinmai-community-management'
});
const NotificationManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/NotificationManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'notification-management'
});
const AdminSettings = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/Settings"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'admin-settings'
});
const AuthorizationManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/AuthorizationManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'authorization-management'
});
const ProductManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/ProductManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'product-management'
});
const PromotionOrderImplementation = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/PromotionOrderImplementation"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'promotion-order-implementation'
});
const LotteryPrizeManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/LotteryPrizeManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'lottery-prize-management'
});
const EnhancedDashboard = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/EnhancedDashboard"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'enhanced-dashboard'
});
const BrandOrderExecution = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/BrandOrderExecution"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'brand-order-execution'
});
const BrandTaskAudit = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/BrandTaskAudit"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'brand-task-audit'
});
const SearchRecordManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/SearchRecordManagement"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'search-record-management'
});
const StrategicAdoption = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-other" */ "@/pages/admin/StrategicAdoption"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'strategic-adoption'
});

// ============================================
// 组织者模块页面 - 懒加载
// ============================================
const OrganizerBrandTaskManager = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/BrandTaskManager"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'organizer-brand-tasks'
});
const OrganizerFundManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/FundManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'organizer-funds'
});
const OrganizerWorkScoring = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/WorkScoring"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'organizer-scoring'
});
const OrganizerAnalyticsDashboard = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/AnalyticsDashboard"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'organizer-analytics'
});
const OrganizerSettingsPage = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/OrganizerSettings"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'organizer-settings'
});
const MobileOrganizerCenterPage = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/MobileOrganizerCenter"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'mobile-organizer-center'
});
const BrandProfileEdit = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/BrandProfileEdit"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'brand-profile-edit'
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
const ChallengeCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-community" */ "@/components/ChallengeCenter"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'challenge-center'
});
const TaskCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-community" */ "@/components/TaskCenter"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'task-center'
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
const Help = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/HelpEnhanced"), {
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
const BrandShowcase = createLazyComponent(() => import(/* webpackChunkName: "pages-business" */ "@/pages/BrandShowcase"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'brand-showcase'
});
const BrandShowcaseManager = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/BrandShowcaseManager"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'brand-showcase-manager'
});
const CopyrightLicenseManager = createLazyComponent(() => import(/* webpackChunkName: "pages-organizer" */ "@/pages/organizer/CopyrightLicenseManager"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'copyright-license-manager'
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
const OriginalProtection = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/OriginalProtection"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'original-protection'
});
const OriginalProtectionManagement = createLazyComponent(() => import(/* webpackChunkName: "pages-admin" */ "@/pages/admin/OriginalProtectionManagement"), {
  priority: ROUTE_PRIORITIES.LOW
});

// 津小脉AI助手移动端页面 - 懒加载
const AIAssistantMobile = createLazyComponent(() => import(/* webpackChunkName: "pages-ai" */ "@/pages/AIAssistantMobile"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'ai-assistant-mobile'
});

// AI助手桌面端页面 - 懒加载
const AIAssistant = createLazyComponent(() => import(/* webpackChunkName: "pages-ai" */ "@/pages/AIAssistant"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'ai-assistant'
});
const AnalyticsPage = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Analytics"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'analytics'
});
const UserCollection = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/UserCollection"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'collections'
});
const PublicCollectionPage = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/PublicCollectionPage"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'public-collection'
});
const Notifications = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/Notifications"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'notifications'
});
const MessageCenter = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/MessageCenter"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'message-center'
});
const HistoryPage = createLazyComponent(() => import(/* webpackChunkName: "pages-other" */ "@/pages/History/HistoryPage"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'history-page'
});

const AIGenerationHistoryPage = createLazyComponent(() => import(/* webpackChunkName: "pages-ai-history" */ "@/pages/AIGenerationHistory"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'ai-generation-history'
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

// 推广用户申请页面 - 懒加载
const PromotionApplication = createLazyComponent(() => import(/* webpackChunkName: "pages-promotion" */ "@/pages/PromotionApplication"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'promotion-application'
});

// TrendingCard 设计对比演示页面
const TrendingCardDemo = createLazyComponent(() => import(/* webpackChunkName: "pages-demo" */ "@/pages/TrendingCardDemo"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'trending-card-demo'
});

// ============================================
// 文创商城相关页面 - 懒加载
// ============================================
const Marketplace = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'marketplace'
});

// ============================================
// 商家工作台 - 懒加载
// ============================================
const MerchantWorkbench = createLazyComponent(() => import(/* webpackChunkName: "pages-merchant" */ "@/pages/merchant"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'merchant-workbench'
});
const MerchantApplyPage = createLazyComponent(() => import(/* webpackChunkName: "pages-merchant" */ "@/pages/business/MerchantApplyPage"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'merchant-apply'
});
const CreateStorePage = createLazyComponent(() => import(/* webpackChunkName: "pages-merchant" */ "@/pages/merchant/CreateStorePage"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'create-store'
});
// 商品详情页 - 直接导入，确保快速打开
import ProductDetail from "@/pages/marketplace/ProductDetail";
// 购物车页面 - 直接导入，确保快速打开
import Cart from "@/pages/marketplace/Cart";
const OrderConfirm = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/OrderConfirm"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'order-confirm'
});
const OrderPayPage = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/OrderPay"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'order-pay'
});
const LicensedProducts = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/LicensedProducts"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'licensed-products'
});
const LicensedProductDetail = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/LicensedProductDetail"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'licensed-product-detail'
});

// 新增商城页面
const SearchResultsPage = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/SearchResults"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'marketplace-search'
});
// 收藏页面 - 直接导入，确保快速打开
import FavoritesPage from "@/pages/marketplace/Favorites";
const OrdersPage = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/Orders"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'marketplace-orders'
});
const OrderDetailPage = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/OrderDetail"), {
  priority: ROUTE_PRIORITIES.HIGH,
  name: 'marketplace-order-detail'
});
const AddressManagementPage = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/AddressManagement"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'marketplace-address'
});

// ============================================
// 商城后台管理页面 - 懒加载
// ============================================
const MarketplaceAdmin = createLazyComponent(() => import(/* webpackChunkName: "pages-admin-marketplace" */ "@/pages/admin/MarketplaceAdmin"), {
  priority: ROUTE_PRIORITIES.LOW,
  name: 'marketplace-admin'
});

// 评价页面
const ReviewPage = createLazyComponent(() => import(/* webpackChunkName: "pages-marketplace" */ "@/pages/marketplace/ReviewPage"), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  name: 'review-page'
});

// 导入新的骨架屏组件
import { DashboardSkeleton, ProfileSkeleton, SimpleLoadingSkeleton } from '@/components/skeletons/PageSkeletons';

const InstantLoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
    <HamsterWheelLoader size="large" text="正在加载..." />
  </div>
);

const LazyComponent = React.memo(({ 
  children, 
  fallback = <SimpleLoadingSkeleton />,
  instant = false
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
  instant?: boolean;
}) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        {instant ? <InstantLoadingSkeleton /> : fallback}
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
import DesignPlatformGuard from '@/components/DesignPlatformGuard';

// 社群管理面板组件 - 懒加载
const CommunityAdminPanel = createLazyComponent(() => import(/* webpackChunkName: "components-community" */ '@/components/Community/Admin/CommunityAdminPanel'), {
  priority: ROUTE_PRIORITIES.MEDIUM
});

// 导入 supabase
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const isAdmin = user?.isAdmin || false;

  // 获取社群数据
  useEffect(() => {
    const fetchCommunityData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // 获取社群信息
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();

        if (communityError) {
          console.error('Failed to fetch community:', communityError);
          toast.error('获取社群信息失败');
        } else if (communityData) {
          setCommunity({
            id: communityData.id,
            name: communityData.name,
            description: communityData.description || '',
            cover: communityData.cover_url,
            tags: communityData.tags || [],
            members: communityData.member_count || 0,
            bookmarks: communityData.bookmarks || []
          });
        }

        // 获取社群成员
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select('user_id, role, joined_at')
          .eq('community_id', id);

        if (membersError) {
          console.error('Failed to fetch members:', membersError);
        } else if (membersData && membersData.length > 0) {
          const userIds = membersData.map(m => m.user_id).filter(Boolean);

          if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabaseAdmin
              .from('users')
              .select('id, username, email, avatar_url')
              .in('id', userIds);

            if (usersError) {
              console.error('Failed to fetch users:', usersError);
            } else {
              const userMap = new Map(usersData?.map(u => [u.id, u]) || []);

              const formattedMembers = membersData.map(m => {
                const user = userMap.get(m.user_id);
                return {
                  id: m.user_id,
                  email: user?.email || '',
                  name: user?.username || '未知用户',
                  role: m.role || 'member',
                  joinedAt: new Date(m.joined_at),
                  avatar: user?.avatar_url
                };
              });

              setMembers(formattedMembers);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching community data:', error);
        toast.error('加载社群数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityData();
  }, [id]);

  // 添加成员
  const handleAddMember = async (email: string, role: string) => {
    try {
      // 1. 根据邮箱查找用户
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, username, email, avatar_url')
        .eq('email', email)
        .limit(1);

      if (userError || !users || users.length === 0) {
        toast.error('未找到该邮箱对应的用户');
        return;
      }

      const user = users[0];

      // 2. 检查是否已经是成员
      const { data: existingMember } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast.error('该用户已经是社群成员');
        return;
      }

      // 3. 添加到数据库
      const { error: insertError } = await supabase
        .from('community_members')
        .insert({
          community_id: id,
          user_id: user.id,
          role: role,
          joined_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to add member:', insertError);
        toast.error('添加成员失败');
        return;
      }

      // 4. 更新本地状态
      const newMember = {
        id: user.id,
        email: user.email || '',
        name: user.username || '未知用户',
        role: role,
        joinedAt: new Date(),
        avatar: user.avatar_url
      };
      setMembers(prev => [...prev, newMember]);
      toast.success('成员已添加');

    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('添加成员失败');
    }
  };

  // 移除成员
  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', id)
        .eq('user_id', memberId);

      if (error) {
        console.error('Failed to remove member:', error);
        toast.error('移除成员失败');
        return;
      }

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('成员已移除');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('移除成员失败');
    }
  };

  // 更新成员角色
  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role })
        .eq('community_id', id)
        .eq('user_id', memberId);

      if (error) {
        console.error('Failed to update member role:', error);
        toast.error('更新角色失败');
        return;
      }

      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, role } : m
      ));
      toast.success('角色已更新');
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('更新角色失败');
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${isDark ? 'border-blue-500' : 'border-blue-600'}`} />
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>加载中...</p>
        </div>
      </div>
    );
  }

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
      onAddMember={handleAddMember}
      onRemoveMember={handleRemoveMember}
      onUpdateMemberRole={handleUpdateMemberRole}
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
// 悬浮AI助手组件 - 懒加载（带错误处理）
const FloatingAIAssistant = createLazyComponent(() => import(/* webpackChunkName: "components-ai" */ '@/components/FloatingAIAssistantV2'), {
  priority: ROUTE_PRIORITIES.MEDIUM,
  retryCount: 1, // 减少重试次数，避免长时间等待
  timeout: 10000 // 减少超时时间
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
  
  // 使用用户会话跟踪
  useUserSession();
  
  // 性能优化：延迟初始化非关键数据
  useEffect(() => {
    // 初始化 Web Vitals 监控
    initWebVitalsMonitoring((metric) => {
      // 可以在这里发送到分析服务
      if (import.meta.env.DEV) {
        const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'poor' ? '❌' : '⚠️';
        console.log(`[Web Vitals] ${emoji} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
      }
    });

    // 注册 Service Worker（PWA 支持）
    registerServiceWorker();

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
      const listenerId = eventBus.on('auth:login', handleLogin);

      return () => {
        // 清理事件监听
        eventBus.off('auth:login', listenerId);
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



  // 优化全局加载骨架屏，使用仓鼠跑轮动画
  const GlobalLoadingSkeleton = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <HamsterWheelLoader size="xlarge" text="正在加载..." />
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
            <EntryAnimation onComplete={(choice) => {
              if (choice === 'guide' && user?.id) {
                // 清除新手引导完成标记，触发引导
                localStorage.removeItem(`guide_completed_${user.id}`);
                // 延迟一点确保组件已挂载
                setTimeout(() => {
                  import('@/lib/eventBus').then(({ default: eventBus }) => {
                    eventBus.emit('auth:login', { 
                      userId: user.id, 
                      user: { ...user, isNewUser: true },
                      isProfileComplete: true 
                    });
                  });
                }, 500);
              }
            }} />
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

        
        {/* 主题测试页面 */}
        <Route path="/theme-test" element={
          <AnimatedPage>
            {isMobile ? (
              <MobileLayout><LazyComponent><ThemeTestPage /></LazyComponent></MobileLayout>
            ) : (
              <SidebarLayout><LazyComponent><ThemeTestPage /></LazyComponent></SidebarLayout>
            )}
          </AnimatedPage>
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
          <Route path="/square" element={<Square />} />
<Route path="/square/:id" element={<LazyComponent>{isMobile ? <MobilePostDetail /> : <Square />}</LazyComponent>} />
          <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
          <Route path="/community/:id" element={<LazyComponent><PrivateRoute><Community /></PrivateRoute></LazyComponent>} />
          <Route path="/community/:id/:channel" element={<LazyComponent><PrivateRoute><Community /></PrivateRoute></LazyComponent>} />
          <Route path="/community/:id/admin" element={<LazyComponent><PrivateRoute><CommunityAdminPanelWrapper /></PrivateRoute></LazyComponent>} />
          <Route path="/friends" element={<LazyComponent><PrivateRoute><Friends /></PrivateRoute></LazyComponent>} />
          <Route path="/chat/:userId" element={<LazyComponent><PrivateRoute><ChatPage /></PrivateRoute></LazyComponent>} />
          <Route path="/post/:id" element={<LazyComponent>{isMobile ? <MobilePostDetail /> : <WorkDetail />}</LazyComponent>} />
          <Route path="/work/:id" element={isMobile ? <MobilePostDetail /> : <WorkDetail />} />
          <Route path="/works/:id" element={isMobile ? <MobilePostDetail /> : <WorkDetail />} />
          <Route path="/creator-community" element={<Navigate to="/community" replace />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
          {/* 设计平台路由 - 使用 DesignPlatformGuard 进行严格保护 */}
          <Route path="/create/*" element={<LazyComponent><DesignPlatformGuard><Create /></DesignPlatformGuard></LazyComponent>} />
          {/* Agent 路由 - 独立于 create */}
          <Route path="/agent/*" element={<LazyComponent><DesignPlatformGuard><AgentPage /></DesignPlatformGuard></LazyComponent>} />
          <Route path="/skill/chat" element={<LazyComponent><SkillAgentChatPage /></LazyComponent>} />
          <Route path="/create-activity" element={<Navigate to="/organizer" replace />} />
          <Route path="/creates" element={<Navigate to="/create" replace />} />
          <Route path="/wizard" element={<LazyComponent><DesignPlatformGuard><Wizard /></DesignPlatformGuard></LazyComponent>} />
          <Route path="/ai-writer" element={<LazyComponent><DesignPlatformGuard><AIWriterV2 /></DesignPlatformGuard></LazyComponent>} />
          
          {/* 津小脉AI助手移动端页面 */}
          <Route path="/ai-assistant" element={<LazyComponent><PrivateRoute>{isMobile ? <AIAssistantMobile /> : <AIAssistant />}</PrivateRoute></LazyComponent>} />
          
          {/* 动态内容展示页面 */}
          <Route path="/feed" element={<PrivateRoute><Feed /></PrivateRoute>} />
          
          {/* 大型组件和低频访问页面使用懒加载 */}


          <Route path="/privacy" element={<LazyComponent><Privacy /></LazyComponent>} />
          <Route path="/terms" element={<LazyComponent><Terms /></LazyComponent>} />
          <Route path="/help" element={<LazyComponent><Help /></LazyComponent>} />
          <Route path="/leaderboard" element={<LazyComponent><Leaderboard /></LazyComponent>} />
          <Route path="/games" element={<LazyComponent><Games /></LazyComponent>} />
          <Route path="/challenge-center" element={<LazyComponent><ChallengeCenter /></LazyComponent>} />
          <Route path="/task-center" element={<LazyComponent><TaskCenter /></LazyComponent>} />

          <Route path="/author/:id" element={<LazyComponent><AuthorProfile currentUser={user} /></LazyComponent>} />

          <Route path="/brand" element={<LazyComponent><PrivateRoute><BrandGuide /></PrivateRoute></LazyComponent>} />
          <Route path="/business" element={<LazyComponent><BusinessCooperation /></LazyComponent>} />
          <Route path="/business-cooperation" element={<LazyComponent><BusinessCooperation /></LazyComponent>} />
          <Route path="/brand-showcase" element={<LazyComponent><BrandShowcase /></LazyComponent>} />
          <Route path="/brand-service-agreement" element={<LazyComponent><BrandServiceAgreement isDark={isDark} /></LazyComponent>} />
          {/* 设计平台相关路由 - 使用 DesignPlatformGuard 保护 */}
          <Route path="/input" element={<LazyComponent><DesignPlatformGuard><InputHub /></DesignPlatformGuard></LazyComponent>} />
          <Route path="/generate" element={<LazyComponent><DesignPlatformGuard><Generation /></DesignPlatformGuard></LazyComponent>} />
          <Route path="/authenticity" element={<LazyComponent><DesignPlatformGuard><Authenticity /></DesignPlatformGuard></LazyComponent>} />

          <Route path="/drafts" element={<LazyComponent><DesignPlatformGuard><Drafts /></DesignPlatformGuard></LazyComponent>} />
          <Route path="/history" element={<LazyComponent><PrivateRoute><HistoryPage /></PrivateRoute></LazyComponent>} />
          <Route path="/ai-history" element={<LazyComponent><PrivateRoute><AIGenerationHistoryPage /></PrivateRoute></LazyComponent>} />
          <Route path="/my-works" element={<LazyComponent><DesignPlatformGuard><MyWorks /></DesignPlatformGuard></LazyComponent>} />
          <Route path="/settings" element={<LazyComponent><PrivateRoute><Settings /></PrivateRoute></LazyComponent>} />
          {/* 账户设置相关路由 */}
          <Route path="/profile/edit" element={<ErrorBoundary><AnimatedPage><PrivateRoute><ProfileEdit /></PrivateRoute></AnimatedPage></ErrorBoundary>} />
          <Route path="/password/change" element={<LazyComponent><PrivateRoute><ChangePassword /></PrivateRoute></LazyComponent>} />
          <Route path="/account/security" element={<LazyComponent><PrivateRoute><AccountSecurity /></PrivateRoute></LazyComponent>} />
          <Route path="/analytics" element={<LazyComponent><PrivateRoute><AnalyticsPage /></PrivateRoute></LazyComponent>} />
          <Route path="/collection" element={<LazyComponent><PrivateRoute><UserCollection /></PrivateRoute></LazyComponent>} />
          <Route path="/collections" element={<LazyComponent><PrivateRoute><UserCollection /></PrivateRoute></LazyComponent>} />
          <Route path="/collection/:shareCode" element={<LazyComponent><PublicCollectionPage /></LazyComponent>} />
          <Route path="/notifications" element={<LazyComponent><PrivateRoute><Notifications /></PrivateRoute></LazyComponent>} />
          <Route path="/messages" element={<LazyComponent><PrivateRoute><MessageCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/component-showcase" element={<ComponentShowcase />} />
          <Route path="/ip-poster-generator" element={<IPPosterGenerator />} />
          <Route path="/ip-poster-composer" element={<IPPosterComposerPage />} />
          <Route path="/hamster-loader-demo" element={<HamsterLoaderDemo />} />
          <Route path="/trending-card-demo" element={<LazyComponent><TrendingCardDemo /></LazyComponent>} />
          <Route path="/image-paste-input-demo" element={<LazyComponent><ImagePasteInputDemo /></LazyComponent>} />
          <Route path="/knowledge" element={<LazyComponent><CulturalKnowledge /></LazyComponent>} />
          <Route path="/knowledge/:type/:id" element={<LazyComponent><CulturalKnowledge /></LazyComponent>} />
          <Route path="/cultural-knowledge" element={<LazyComponent><CulturalKnowledge /></LazyComponent>} />

          <Route path="/tianjin" element={<LazyComponent><Tianjin /></LazyComponent>} />
          <Route path="/inspiration-mindmap" element={<LazyComponent><PrivateRoute><InspirationMindMapPage /></PrivateRoute></LazyComponent>} />

          <Route path="/events" element={<LazyComponent><CulturalEvents /></LazyComponent>} />
          <Route path="/events/:id" element={<LazyComponent><EventDetail /></LazyComponent>} />
          <Route path="/events/:id/works" element={<LazyComponent>{isMobile ? <MobileEventWorks /> : <EventWorks />}</LazyComponent>} />
          <Route path="/events/:id/submit" element={<LazyComponent><PrivateRoute>{isMobile ? <MobileSubmitWork /> : <SubmitWork />}</PrivateRoute></LazyComponent>} />
          <Route path="/events/:eventId/works/:workId" element={<LazyComponent>{isMobile ? <MobileWorkDetail /> : <WorkDetail />}</LazyComponent>} />
          <Route path="/cultural-events" element={<LazyComponent><CulturalEvents /></LazyComponent>} />
          
          {/* 活动管理相关路由 */}
          <Route path="/activities" element={<LazyComponent><CulturalEvents /></LazyComponent>} />
          <Route path="/activities/:id" element={<LazyComponent><PrivateRoute><ActivityDetail /></PrivateRoute></LazyComponent>} />
          <Route path="/edit-activity/:id" element={<LazyComponent><PrivateRoute><EditActivity /></PrivateRoute></LazyComponent>} />
          <Route path="/my-activities" element={<LazyComponent><PrivateRoute><MyActivities /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer" element={<LazyComponent><PrivateRoute><OrganizerCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer-center" element={<LazyComponent><PrivateRoute><OrganizerCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/events/:id" element={<LazyComponent><PrivateRoute><OrganizerEventDetail /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/brand-showcase" element={<LazyComponent><PrivateRoute><BrandShowcaseManager /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/copyright-license" element={<LazyComponent><PrivateRoute><CopyrightLicenseManager /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/brand-tasks" element={<LazyComponent><PrivateRoute><OrganizerBrandTaskManager /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/funds" element={<LazyComponent><PrivateRoute><OrganizerFundManagement /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/scoring" element={<LazyComponent><PrivateRoute><OrganizerWorkScoring /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/analytics" element={<LazyComponent><PrivateRoute><OrganizerAnalyticsDashboard /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/settings" element={<LazyComponent><PrivateRoute><OrganizerSettingsPage /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/mobile-center" element={<LazyComponent><PrivateRoute><MobileOrganizerCenterPage /></PrivateRoute></LazyComponent>} />
          <Route path="/organizer/brand-profile" element={<LazyComponent><PrivateRoute><BrandProfileEdit /></PrivateRoute></LazyComponent>} />
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
          
          {/* 积分抽奖路由 */}
          <Route path="/points-lottery" element={<LazyComponent><PrivateRoute><PointsLottery /></PrivateRoute></LazyComponent>} />
          
          {/* 会员相关路由 - 懒加载 */}
          <Route path="/membership" element={<LazyComponent><Membership /></LazyComponent>} />
          <Route path="/membership/payment" element={<LazyComponent><PrivateRoute><MembershipPayment /></PrivateRoute></LazyComponent>} />
          <Route path="/membership/payment/personal" element={<LazyComponent><PrivateRoute><PersonalPayment /></PrivateRoute></LazyComponent>} />
          <Route path="/membership/benefits" element={<LazyComponent><MembershipBenefits /></LazyComponent>} />
          <Route path="/membership/upgrade" element={<LazyComponent><PrivateRoute><Membership /></PrivateRoute></LazyComponent>} />

          {/* 创作者认证路由 */}
          <Route path="/certification" element={<LazyComponent><PrivateRoute><Certification /></PrivateRoute></LazyComponent>} />
          
          {/* 津币管理路由 */}
          <Route path="/jinbi" element={<LazyComponent><PrivateRoute><JinbiManagement /></PrivateRoute></LazyComponent>} />
          
          {/* 移动端瀑布流作品展示页面 */}
          <Route path="/mobile-works" element={<LazyComponent><MobileWorksGalleryDemo /></LazyComponent>} />
          
          {/* 创作者中心路由 - 使用 SidebarLayout 布局 */}
          <Route path="/creator-center" element={<LazyComponent><PrivateRoute><CreatorCenter /></PrivateRoute></LazyComponent>} />
          <Route path="/creator-center/:tab" element={<LazyComponent><PrivateRoute><CreatorCenter /></PrivateRoute></LazyComponent>} />
          
          {/* 品牌任务中心 - 独立页面 */}
          <Route path="/brand-tasks" element={<LazyComponent><PrivateRoute><BrandTaskCenter /></PrivateRoute></LazyComponent>} />
          
          {/* 商单广场 - 独立页面 */}
          <Route path="/order-square" element={<LazyComponent><PrivateRoute><OrderSquareCenter /></PrivateRoute></LazyComponent>} />
          
          {/* 发布商单 - 独立页面 */}
          <Route path="/publish-order" element={<LazyComponent><PrivateRoute><PublishOrderCenter /></PrivateRoute></LazyComponent>} />
          
          {/* 商单中心 - 独立页面 */}
          <Route path="/order-center" element={<LazyComponent><PrivateRoute><OrderCenter /></PrivateRoute></LazyComponent>} />
          
          {/* 品牌方商单管理 - 独立页面 */}
          <Route path="/brand-order-management" element={<LazyComponent><PrivateRoute><BrandOrderManagement /></PrivateRoute></LazyComponent>} />
          
          {/* 原创保护中心路由 */}
          <Route path="/original-protection" element={<LazyComponent><PrivateRoute><OriginalProtection /></PrivateRoute></LazyComponent>} />
          
          {/* ============================================ */}
          {/* 文创商城路由 */}
          {/* ============================================ */}
          <Route path="/marketplace" element={<LazyComponent><Marketplace /></LazyComponent>} />
          <Route path="/marketplace/product/:id" element={<ProductDetail />} />
          <Route path="/marketplace/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/marketplace/order/confirm" element={<LazyComponent><PrivateRoute><OrderConfirm /></PrivateRoute></LazyComponent>} />
          <Route path="/marketplace/order/pay/:orderId" element={<LazyComponent><PrivateRoute><OrderPayPage /></PrivateRoute></LazyComponent>} />
          <Route path="/marketplace/order/:orderId" element={<LazyComponent><PrivateRoute><OrderDetailPage /></PrivateRoute></LazyComponent>} />
          <Route path="/marketplace/licensed-products" element={<LazyComponent><LicensedProducts /></LazyComponent>} />
          <Route path="/marketplace/licensed-product/:id" element={<LazyComponent><LicensedProductDetail /></LazyComponent>} />
          <Route path="/marketplace/search" element={<LazyComponent><SearchResultsPage /></LazyComponent>} />
          <Route path="/marketplace/orders" element={<LazyComponent><PrivateRoute><OrdersPage /></PrivateRoute></LazyComponent>} />
          <Route path="/marketplace/address" element={<LazyComponent><PrivateRoute><AddressManagementPage /></PrivateRoute></LazyComponent>} />
          <Route path="/marketplace/order/review/:orderId/:itemId?" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
          
          {/* ============================================ */}
          {/* 商家工作台路由 */}
          {/* ============================================ */}
          <Route path="/merchant" element={<LazyComponent><PrivateRoute><MerchantWorkbench /></PrivateRoute></LazyComponent>} />
          <Route path="/merchant/:module" element={<LazyComponent><PrivateRoute><MerchantWorkbench /></PrivateRoute></LazyComponent>} />
          <Route path="/merchant/apply" element={<LazyComponent><PrivateRoute><MerchantApplyPage /></PrivateRoute></LazyComponent>} />
          <Route path="/merchant/create-store" element={<LazyComponent><PrivateRoute><CreateStorePage /></PrivateRoute></LazyComponent>} />
          
          {/* 管理员路由 - 懒加载 */}
        </Route>
        
        {/* 管理员路由 - 独立于 SidebarLayout */}
        <Route path="/admin" element={<LazyComponent><AdminRoute component={Admin} /></LazyComponent>} />
        <Route path="/admin/order-audit" element={<LazyComponent><AdminRoute component={OrderAudit} /></LazyComponent>} />
        <Route path="/admin/lottery" element={<LazyComponent><AdminRoute component={LotteryManagement} /></LazyComponent>} />
        <Route path="/errors" element={<LazyComponent><AdminRoute component={ErrorMonitoringDashboard} /></LazyComponent>} />
        <Route path="/admin-analytics" element={<LazyComponent><AdminRoute component={AdminAnalytics} /></LazyComponent>} />
        <Route path="/system-status" element={<LazyComponent><SystemStatus /></LazyComponent>} />
        <Route path="/admin/original-protection" element={<LazyComponent><AdminRoute component={OriginalProtectionManagement} /></LazyComponent>} />
        
        {/* 商城管理后台路由 */}
        <Route path="/admin/marketplace" element={<LazyComponent><AdminRoute component={MarketplaceAdmin} /></LazyComponent>} />
        
        {/* ============================================ */}
        {/* P0 核心Admin功能路由 */}
        {/* ============================================ */}
        <Route path="/admin/user-audit" element={<LazyComponent><AdminRoute component={UserAudit} /></LazyComponent>} />
        <Route path="/admin/content-audit" element={<LazyComponent><AdminRoute component={ContentAudit} /></LazyComponent>} />
        <Route path="/admin/reports" element={<LazyComponent><AdminRoute component={ReportManagement} /></LazyComponent>} />
        <Route path="/admin/events" element={<LazyComponent><AdminRoute component={EventManagement} /></LazyComponent>} />

        
        {/* ============================================ */}
        {/* P1 重要Admin功能路由 */}
        {/* ============================================ */}
        <Route path="/admin/feedback" element={<LazyComponent><AdminRoute component={FeedbackManagement} /></LazyComponent>} />
        <Route path="/admin/content" element={<LazyComponent><AdminRoute component={ContentManagement} /></LazyComponent>} />
        <Route path="/admin/community" element={<LazyComponent><AdminRoute component={CommunityManagement} /></LazyComponent>} />
        <Route path="/admin/payment-audit" element={<LazyComponent><AdminRoute component={PaymentAudit} /></LazyComponent>} />
        <Route path="/admin/audit-logs" element={<LazyComponent><AdminRoute component={AuditLog} /></LazyComponent>} />
        
        {/* ============================================ */}
        {/* 商城管理路由 */}
        {/* ============================================ */}
        <Route path="/admin/marketplace/products" element={<LazyComponent><AdminRoute component={MarketplaceProductManagement} /></LazyComponent>} />
        <Route path="/admin/orders" element={<LazyComponent><AdminRoute component={OrderManagement} /></LazyComponent>} />
        <Route path="/admin/brands" element={<LazyComponent><AdminRoute component={BrandManagement} /></LazyComponent>} />
        
        {/* ============================================ */}
        {/* 推广与营销路由 */}
        {/* ============================================ */}
        <Route path="/admin/promotion/users" element={<LazyComponent><AdminRoute component={PromotionUserManagement} /></LazyComponent>} />
        <Route path="/admin/promotion/orders" element={<LazyComponent><AdminRoute component={PromotionOrderManagement} /></LazyComponent>} />
        <Route path="/admin/promotion/analytics" element={<LazyComponent><AdminRoute component={PromotionAnalytics} /></LazyComponent>} />
        <Route path="/admin/home-recommendations" element={<LazyComponent><AdminRoute component={HomeRecommendationManagement} /></LazyComponent>} />
        
        {/* ============================================ */}
        {/* 数据分析与监控路由 */}
        {/* ============================================ */}
        <Route path="/admin/data-analytics" element={<LazyComponent><AdminRoute component={DataAnalytics} /></LazyComponent>} />
        <Route path="/admin/advanced-analytics" element={<LazyComponent><AdminRoute component={AdvancedAnalytics} /></LazyComponent>} />
        <Route path="/admin/system-monitor" element={<LazyComponent><AdminRoute component={SystemMonitor} /></LazyComponent>} />
        
        {/* ============================================ */}
        {/* 其他Admin功能路由 */}
        {/* ============================================ */}
        <Route path="/admin/ai-feedback" element={<LazyComponent><AdminRoute component={AIFeedbackManagement} /></LazyComponent>} />
        <Route path="/admin/templates" element={<LazyComponent><AdminRoute component={TemplateManagement} /></LazyComponent>} />
        <Route path="/admin/knowledge-base" element={<LazyComponent><AdminRoute component={KnowledgeBaseManagement} /></LazyComponent>} />
        <Route path="/admin/work-submissions" element={<LazyComponent><AdminRoute component={WorkSubmissionAudit} /></LazyComponent>} />
        <Route path="/admin/certification" element={<LazyComponent><AdminRoute component={CertificationAudit} /></LazyComponent>} />
        <Route path="/admin/achievements" element={<LazyComponent><AdminRoute component={AchievementManagement} /></LazyComponent>} />
        <Route path="/admin/jinmai-community" element={<LazyComponent><AdminRoute component={JinmaiCommunityManagement} /></LazyComponent>} />
        <Route path="/admin/notifications" element={<LazyComponent><AdminRoute component={NotificationManagement} /></LazyComponent>} />
        <Route path="/admin/settings" element={<LazyComponent><AdminRoute component={AdminSettings} /></LazyComponent>} />
        <Route path="/admin/authorization" element={<LazyComponent><AdminRoute component={AuthorizationManagement} /></LazyComponent>} />
        <Route path="/admin/products" element={<LazyComponent><AdminRoute component={ProductManagement} /></LazyComponent>} />
        <Route path="/admin/promotion/implementation" element={<LazyComponent><AdminRoute component={PromotionOrderImplementation} /></LazyComponent>} />
        <Route path="/admin/lottery/prizes" element={<LazyComponent><AdminRoute component={LotteryPrizeManagement} /></LazyComponent>} />
        <Route path="/admin/enhanced-dashboard" element={<LazyComponent><AdminRoute component={EnhancedDashboard} /></LazyComponent>} />
        <Route path="/admin/brand-order-execution" element={<LazyComponent><AdminRoute component={BrandOrderExecution} /></LazyComponent>} />
        <Route path="/admin/brand-task-audit" element={<LazyComponent><AdminRoute component={BrandTaskAudit} /></LazyComponent>} />
        <Route path="/admin/search-records" element={<LazyComponent><AdminRoute component={SearchRecordManagement} /></LazyComponent>} />
        <Route path="/admin/strategic-adoption" element={<LazyComponent><AdminRoute component={StrategicAdoption} /></LazyComponent>} />
        
        {/* 推广用户申请页面 */}
        <Route path="/promotion/apply" element={<LazyComponent><PromotionApplication /></LazyComponent>} />
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
        <Suspense fallback={null}>
          <FloatingAIAssistant />
        </Suspense>
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

      {/* AI 智能客服机器人 - 只在帮助中心页面显示 */}
      {location.pathname === '/help' && <AIChatBot />}

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
