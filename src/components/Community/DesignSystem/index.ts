// 津脉社区设计系统入口
// 统一导出所有设计相关的组件和配置

// 主题配置
export {
  communityColors,
  communitySpacing,
  communityRadius,
  communityShadows,
  communityAnimations,
  communityTypography,
  communityZIndex,
  communityBreakpoints,
  generateCSSVariables,
  generateCommunityTheme,
} from './CommunityTheme';

// 动画组件
export {
  PageTransition,
  FadeIn,
  ScaleIn,
  ListItem,
  HoverCard,
  AnimatedButton,
  Skeleton,
  Pulse,
  SlidePanel,
  ModalOverlay,
  StaggerContainer,
  StaggerItem,
  InfiniteScrollLoader,
  EmptyState,
  ErrorState,
} from './CommunityAnimations';

// 默认导出
export { default } from './CommunityTheme';
