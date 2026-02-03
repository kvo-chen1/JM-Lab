// src/components/ui/index.ts

// 导出UI组件
export { default as Button, type ButtonVariant, type ButtonSize } from './Button';
export { default as Card, CardHeader, CardTitle, CardBody, CardFooter } from './Card';
export { default as Input } from './Input';
export { default as LoadingSpinner, type SpinnerSize, type SpinnerVariant } from './LoadingSpinner';
export { default as Badge, type BadgeVariant, type BadgeSize, type BadgeShape } from './Badge';
export { default as Avatar, AvatarGroup, type AvatarSize, type AvatarShape, type AvatarStatus } from './Avatar';

// 导出工具函数
export * from './utils';

// 后续可以添加更多组件，如Select、Textarea、Progress、Tabs等
