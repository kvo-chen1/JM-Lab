import React from 'react';

// Select选项类型
interface SelectOption {
  value: string;
  label: string;
}

// Input组件
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '',
  required = false,
  ...props 
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 hover:shadow-sm ${error 
          ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-white'}`}
        {...props}
      />
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-red-500 text-xs"></i>
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

// Textarea组件
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '',
  rows = 4,
  required = false,
  ...props 
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 resize-y hover:shadow-sm ${error 
          ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-white'}`}
        {...props}
      />
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-red-500 text-xs"></i>
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

// Select组件
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  error, 
  helperText, 
  options,
  className = '',
  required = false,
  ...props 
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 appearance-none bg-white dark:bg-gray-700 hover:shadow-sm ${error 
          ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:hover:border-gray-500 dark:text-white'}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-red-500 text-xs"></i>
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

// DatePicker组件
interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  helperText?: string;
  showTime?: boolean;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  label, 
  value, 
  onChange, 
  error, 
  helperText, 
  showTime = false,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      onChange(date);
    }
  };
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={showTime ? 'datetime-local' : 'date'}
        value={value.toISOString().slice(0, showTime ? 16 : 10)}
        onChange={handleChange}
        required={required}
        className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 hover:shadow-sm ${error 
          ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-white'}`}
      />
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-red-500 text-xs"></i>
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

// Checkbox组件
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          className={`h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-300 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 hover:shadow-sm`}
          {...props}
        />
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            {label}
          </label>
        )}
      </div>
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">{helperText}</p>
      )}
      {error && (
        <div className="flex items-center gap-1.5 ml-8">
          <i className="fas fa-exclamation-circle text-red-500 text-xs"></i>
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

// FileUpload组件
interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  multiple?: boolean;
  accept?: string;
  onChange: (files: FileList | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  error, 
  helperText, 
  multiple = false,
  accept = '*/*',
  onChange,
  disabled = false,
  required = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleButtonClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex space-x-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={(e) => onChange(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className={`px-5 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 font-medium shadow-md ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-400 text-gray-700 dark:bg-gray-600 dark:text-gray-400' 
            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'}`}
        >
          <i className="fas fa-file-upload"></i>
          选择文件
        </button>
      </div>
      {helperText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && (
        <div className="flex items-center gap-1.5">
          <i className="fas fa-exclamation-circle text-red-500 text-xs"></i>
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};