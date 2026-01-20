import React from 'react';

// Input组件
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error 
          ? 'border-red-500 bg-red-50' 
          : 'border-gray-300 focus:border-blue-500'}`}
        {...props}
      />
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

// Textarea组件
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '',
  rows = 4,
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${error 
          ? 'border-red-500 bg-red-50' 
          : 'border-gray-300 focus:border-blue-500'}`}
        {...props}
      />
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

// Select组件
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  error, 
  helperText, 
  options,
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error 
          ? 'border-red-500 bg-red-50' 
          : 'border-gray-300 focus:border-blue-500'}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
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
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium">
          {label}
        </label>
      )}
      <input
        type={showTime ? 'datetime-local' : 'date'}
        value={value.toISOString().slice(0, showTime ? 16 : 10)}
        onChange={handleChange}
        required={required}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${error 
          ? 'border-red-500 bg-red-50' 
          : 'border-gray-300 focus:border-blue-500'}`}
      />
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
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
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500`}
          {...props}
        />
        {label && (
          <label className="text-sm font-medium">
            {label}
          </label>
        )}
      </div>
      {helperText && (
        <p className="text-xs text-gray-500 ml-6">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 ml-6">{error}</p>
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
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  error, 
  helperText, 
  multiple = false,
  accept = '*/*',
  onChange,
  disabled = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleButtonClick = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium">
          {label}
        </label>
      )}
      <div className="flex space-x-2">
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
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          <i className="fas fa-file-upload mr-2"></i>
          选择文件
        </button>
      </div>
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};