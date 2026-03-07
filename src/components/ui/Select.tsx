// src/components/ui/Select.tsx
// Select 组件实现

import * as React from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

// Select 根组件
interface SelectProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
};

const Select: React.FC<SelectProps> = ({ children, value, defaultValue, onValueChange, disabled }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const [open, setOpen] = React.useState(false);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  }, [isControlled, onValueChange]);

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

// SelectTrigger 组件
interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className }) => {
  const { open, setOpen } = useSelect();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={clsx(
        'flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        className
      )}
    >
      {children}
      <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
    </button>
  );
};

// SelectValue 组件
interface SelectValueProps {
  placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = useSelect();
  return <span className={clsx(!value && 'text-gray-400')}>{value || placeholder}</span>;
};

// SelectContent 组件
interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const { open } = useSelect();

  if (!open) return null;

  return (
    <div className={clsx(
      'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto',
      className
    )}>
      {children}
    </div>
  );
};

// SelectItem 组件
interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const SelectItem: React.FC<SelectItemProps> = ({ children, value, className }) => {
  const { value: selectedValue, onValueChange } = useSelect();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={clsx(
        'w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100',
        isSelected && 'bg-blue-50 text-blue-900',
        className
      )}
    >
      {children}
    </button>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
