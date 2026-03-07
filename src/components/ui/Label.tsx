// src/components/ui/Label.tsx

import React, { LabelHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  error?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const { children, required = false, error = false, className, ...rest } = props;
  return (
    <label
      ref={ref}
      className={clsx(
        'block text-sm font-medium mb-1',
        error ? 'text-red-500' : 'text-gray-700',
        className
      )}
      {...rest}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
});

Label.displayName = 'Label';

export { Label };
export default Label;
