// src/components/ui/Card.tsx

import { ReactNode, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { componentVariants } from '@/utils/designSystem';

// 卡片变体类型
export type CardVariant = keyof typeof componentVariants.card.variants.variant;

// 卡片大小类型
export type CardSize = keyof typeof componentVariants.card.variants.size;

// 卡片阴影类型
export type CardShadow = keyof typeof componentVariants.card.variants.shadow;

// 卡片属性接口
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  shadow?: CardShadow;
  padding?: 'small' | 'medium' | 'large';
  className?: string;
}

// 卡片头部属性接口
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

// 卡片标题属性接口
interface CardTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'size'> {
  children: ReactNode;
  className?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

// 卡片正文属性接口
interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

// 卡片底部属性接口
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

// 卡片描述属性接口
interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  className?: string;
}

// 卡片组件
const Card = ({ children, variant = 'default', size = 'default', shadow = 'default', padding = 'medium', className, ...props }: CardProps) => {
  // 获取卡片变体样式
  const variantConfig = componentVariants.card.variants.variant[variant];
  const sizeConfig = componentVariants.card.variants.size[size];
  const shadowConfig = componentVariants.card.variants.shadow[shadow];

  // 内边距样式映射
  const paddingClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  return (
    <div className={clsx(
      'transition-all duration-200',
      variantConfig,
      sizeConfig,
      shadowConfig,
      paddingClasses[padding],
      className
    )} {...props}>
      {children}
    </div>
  );
};

// 卡片头部组件
const CardHeader = ({ children, className, ...props }: CardHeaderProps) => {
  return (
    <div className={clsx('flex flex-col space-y-2', className)} {...props}>
      {children}
    </div>
  );
};

// 卡片标题组件
const CardTitle = ({ children, className, level = 'h3', ...props }: CardTitleProps) => {
  const Tag = level;
  const headingClass = clsx('text-xl font-semibold text-foreground', className);
  if (Tag === 'h1') return <h1 className={headingClass} {...props}>{children}</h1>;
  if (Tag === 'h2') return <h2 className={headingClass} {...props}>{children}</h2>;
  if (Tag === 'h3') return <h3 className={headingClass} {...props}>{children}</h3>;
  if (Tag === 'h4') return <h4 className={headingClass} {...props}>{children}</h4>;
  if (Tag === 'h5') return <h5 className={headingClass} {...props}>{children}</h5>;
  return <h6 className={headingClass} {...props}>{children}</h6>;
};

// 卡片正文组件
const CardBody = ({ children, className, ...props }: CardBodyProps) => {
  return (
    <div className={clsx('space-y-4', className)} {...props}>
      {children}
    </div>
  );
};

// 卡片底部组件
const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  return (
    <div className={clsx('flex items-center justify-between pt-4 border-t border-border', className)} {...props}>
      {children}
    </div>
  );
};

// 卡片描述组件
const CardDescription = ({ children, className, ...props }: CardDescriptionProps) => {
  return (
    <p className={clsx('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
};

// 导出卡片组件及其子组件
export { Card, CardHeader, CardTitle, CardBody, CardFooter, CardDescription };

export default Card;