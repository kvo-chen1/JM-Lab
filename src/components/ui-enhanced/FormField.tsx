import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/designSystem';

interface FormFieldProps {
  label?: string;
  error?: string;
  touched?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  error,
  touched,
  hint,
  children,
  className,
}: FormFieldProps) => {
  const hasError = touched && error;
  const hasSuccess = touched && !error;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {children}
        {(hasError || hasSuccess) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {hasError ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            )}
          </motion.div>
        )}
      </div>
      {hasError && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
        >
          <AlertTriangle size={14} />
          {error}
        </motion.p>
      )}
      {hint && !hasError && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
};

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
}

export const FloatingLabelInput = ({
  label,
  error,
  touched,
  className,
  ...props
}: FloatingLabelInputProps) => {
  const hasError = touched && error;

  return (
    <div className="relative">
      <input
        {...props}
        placeholder=" "
        className={cn(
          'w-full px-4 py-3 bg-transparent border rounded-lg text-gray-900 dark:text-white placeholder-transparent transition-all',
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
          className
        )}
      />
      <label
        className={cn(
          'absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200',
          hasError ? 'text-red-500' : 'text-gray-500 dark:text-gray-400',
          props.value || props.placeholder !== ' '
            ? 'top-0 -translate-y-1/2 scale-85 bg-white dark:bg-gray-900 px-1'
            : ''
        )}
      >
        {label}
      </label>
    </div>
  );
};

export default FormField;
