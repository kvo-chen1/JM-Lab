import { clsx } from 'clsx';

// 加载器大小类型
export type HamsterSize = 'small' | 'medium' | 'large' | 'xlarge';

// 加载器属性接口
interface HamsterWheelLoaderProps {
  size?: HamsterSize;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

// 大小样式映射
const sizeClasses = {
  small: {
    container: 'w-16 h-16',
    scale: 'scale-[0.4]'
  },
  medium: {
    container: 'w-24 h-24',
    scale: 'scale-[0.6]'
  },
  large: {
    container: 'w-32 h-32',
    scale: 'scale-[0.8]'
  },
  xlarge: {
    container: 'w-40 h-40',
    scale: 'scale-100'
  }
};

/**
 * 仓鼠跑轮加载动画组件
 * 一个可爱的仓鼠在轮子里奔跑的 CSS 动画
 */
export function HamsterWheelLoader({
  size = 'medium',
  text = '加载中...',
  fullScreen = false,
  overlay = false,
  className
}: HamsterWheelLoaderProps) {
  const currentSize = sizeClasses[size];

  const HamsterAnimation = (
    <div 
      className={clsx(
        'relative flex items-center justify-center',
        currentSize.container,
        className
      )}
    >
      <div className={clsx('origin-center', currentSize.scale)}>
        <div 
          aria-label="Orange and tan hamster running in a metal wheel"
          role="img"
          className="wheel-and-hamster"
        >
          <div className="wheel"></div>
          <div className="hamster">
            <div className="hamster__body">
              <div className="hamster__head">
                <div className="hamster__ear"></div>
                <div className="hamster__eye"></div>
                <div className="hamster__nose"></div>
              </div>
              <div className="hamster__limb hamster__limb--fr"></div>
              <div className="hamster__limb hamster__limb--fl"></div>
              <div className="hamster__limb hamster__limb--br"></div>
              <div className="hamster__limb hamster__limb--bl"></div>
              <div className="hamster__tail"></div>
            </div>
          </div>
          <div className="spoke"></div>
        </div>
      </div>
    </div>
  );

  // 全屏加载器
  if (fullScreen) {
    return (
      <div className={clsx(
        'fixed inset-0 flex flex-col items-center justify-center z-[70]',
        overlay ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent'
      )}>
        {HamsterAnimation}
        {text && (
          <p className={clsx(
            'mt-4 font-medium animate-pulse',
            overlay ? 'text-white' : 'text-gray-600 dark:text-gray-400'
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }

  // 内联加载器
  return (
    <div className="flex flex-col items-center gap-3">
      {HamsterAnimation}
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
      )}
    </div>
  );
}

export default HamsterWheelLoader;
