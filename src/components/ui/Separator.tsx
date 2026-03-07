// src/components/ui/Separator.tsx

import React, { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const Separator = forwardRef<HTMLDivElement, SeparatorProps>((props, ref) => {
  const { orientation = 'horizontal', className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx(
        'bg-gray-200',
        orientation === 'horizontal' ? 'h-px w-full my-4' : 'w-px h-full mx-4',
        className
      )}
      {...rest}
    />
  );
});

Separator.displayName = 'Separator';

export { Separator };
export default Separator;
