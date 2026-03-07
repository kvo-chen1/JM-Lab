// src/components/ui/Textarea.tsx

import React, { TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { error = false, errorMessage, fullWidth = false, className, ...rest } = props;
  return (
    <div className={clsx(fullWidth && 'w-full')}>
      <textarea
        ref={ref}
        className={clsx(
          'px-4 py-2 border border-gray-300 rounded-md bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500',
          'transition-all duration-200',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100',
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      />
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
