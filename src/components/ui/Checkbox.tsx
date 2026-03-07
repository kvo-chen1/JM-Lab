// src/components/ui/Checkbox.tsx
// Checkbox 组件实现

import * as React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, indeterminate, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate]);

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={inputRef}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only peer"
          {...props}
        />
        <div
          className={clsx(
            'w-5 h-5 border-2 border-gray-300 rounded transition-all duration-200 flex items-center justify-center',
            'peer-checked:bg-blue-600 peer-checked:border-blue-600',
            'peer-focus:ring-2 peer-focus:ring-blue-300 peer-focus:ring-offset-2',
            'hover:border-gray-400',
            className
          )}
        >
          {checked && !indeterminate && (
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          )}
          {indeterminate && (
            <div className="w-2.5 h-0.5 bg-white rounded" />
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;
