// src/components/ui/Tabs.tsx
// Tabs 组件实现

import * as React from 'react';
import { clsx } from 'clsx';

// Tabs 根组件
interface TabsProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

const Tabs: React.FC<TabsProps> = ({ children, value, defaultValue, onValueChange, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  }, [isControlled, onValueChange]);

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={clsx('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

// TabsList 组件
interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div className={clsx('flex space-x-1 bg-gray-100 p-1 rounded-lg', className)}>
      {children}
    </div>
  );
};

// TabsTrigger 组件
interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, value, className }) => {
  const { value: selectedValue, onValueChange } = useTabs();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={clsx(
        'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all',
        isSelected
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200',
        className
      )}
    >
      {children}
    </button>
  );
};

// TabsContent 组件
interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const TabsContent: React.FC<TabsContentProps> = ({ children, value, className }) => {
  const { value: selectedValue } = useTabs();

  if (selectedValue !== value) {
    return null;
  }

  return <div className={clsx('mt-4', className)}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
