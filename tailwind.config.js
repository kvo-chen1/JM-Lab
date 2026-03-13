/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        marquee: 'marquee 20s linear infinite',
      },
      colors: {
        // 主色调 - 使用CSS变量
        primary: {
          DEFAULT: 'var(--color-primary, #c21807)',
          50: 'var(--color-gray-1, #f9fafb)',
          100: 'var(--color-gray-2, #f3f4f6)',
          200: 'var(--color-gray-3, #e5e7eb)',
          300: 'var(--color-gray-4, #d1d5db)',
          400: 'var(--color-gray-5, #9ca3af)',
          500: 'var(--color-primary, #c21807)',
          600: 'var(--color-primary, #c21807)',
          700: 'var(--color-primary, #c21807)',
          800: 'var(--color-primary, #c21807)',
          900: 'var(--color-primary, #c21807)',
          950: 'var(--color-gray-9, #111827)',
          foreground: 'var(--text-inverse, #ffffff)',
        },
        // 次要色调 - 使用CSS变量
        secondary: {
          DEFAULT: 'var(--color-secondary, #6d28d9)',
          50: 'var(--color-gray-1, #f9fafb)',
          100: 'var(--color-gray-2, #f3f4f6)',
          200: 'var(--color-gray-3, #e5e7eb)',
          300: 'var(--color-gray-4, #d1d5db)',
          400: 'var(--color-gray-5, #9ca3af)',
          500: 'var(--color-secondary, #6d28d9)',
          600: 'var(--color-secondary, #6d28d9)',
          700: 'var(--color-secondary, #6d28d9)',
          800: 'var(--color-gray-8, #1f2937)',
          900: 'var(--color-gray-9, #111827)',
          950: 'var(--color-gray-9, #111827)',
          foreground: 'var(--text-primary, #111827)',
        },
        // 成功色调 - 使用CSS变量
        success: {
          DEFAULT: 'var(--color-success, #059669)',
          50: 'var(--bg-tertiary, #f3f4f6)',
          100: 'var(--bg-tertiary, #f3f4f6)',
          200: 'var(--bg-tertiary, #f3f4f6)',
          300: 'var(--border-primary, #e5e7eb)',
          400: 'var(--color-success, #059669)',
          500: 'var(--color-success, #059669)',
          600: 'var(--color-success, #059669)',
          700: 'var(--color-success, #059669)',
          800: 'var(--color-success, #059669)',
          900: 'var(--color-success, #059669)',
          950: 'var(--color-gray-9, #111827)',
          foreground: 'var(--text-inverse, #ffffff)',
        },
        // 警告色调 - 使用CSS变量
        warning: {
          DEFAULT: 'var(--color-warning, #d97706)',
          50: 'var(--bg-tertiary, #f3f4f6)',
          100: 'var(--bg-tertiary, #f3f4f6)',
          200: 'var(--bg-tertiary, #f3f4f6)',
          300: 'var(--border-primary, #e5e7eb)',
          400: 'var(--color-warning, #d97706)',
          500: 'var(--color-warning, #d97706)',
          600: 'var(--color-warning, #d97706)',
          700: 'var(--color-warning, #d97706)',
          800: 'var(--color-warning, #d97706)',
          900: 'var(--color-warning, #d97706)',
          950: 'var(--color-gray-9, #111827)',
          foreground: 'var(--text-inverse, #ffffff)',
        },
        // 错误/破坏性色调 - 使用CSS变量
        destructive: {
          DEFAULT: 'var(--color-error, #dc2626)',
          50: 'var(--bg-tertiary, #f3f4f6)',
          100: 'var(--bg-tertiary, #f3f4f6)',
          200: 'var(--bg-tertiary, #f3f4f6)',
          300: 'var(--border-primary, #e5e7eb)',
          400: 'var(--color-error, #dc2626)',
          500: 'var(--color-error, #dc2626)',
          600: 'var(--color-error, #dc2626)',
          700: 'var(--color-error, #dc2626)',
          800: 'var(--color-error, #dc2626)',
          900: 'var(--color-error, #dc2626)',
          950: 'var(--color-gray-9, #111827)',
          foreground: 'var(--text-inverse, #ffffff)',
        },
        // 信息色调 - 使用CSS变量
        info: {
          DEFAULT: 'var(--color-info, #3b82f6)',
          50: 'var(--bg-tertiary, #f3f4f6)',
          100: 'var(--bg-tertiary, #f3f4f6)',
          200: 'var(--bg-tertiary, #f3f4f6)',
          300: 'var(--border-primary, #e5e7eb)',
          400: 'var(--color-info, #3b82f6)',
          500: 'var(--color-info, #3b82f6)',
          600: 'var(--color-info, #3b82f6)',
          700: 'var(--color-info, #3b82f6)',
          800: 'var(--color-info, #3b82f6)',
          900: 'var(--color-info, #3b82f6)',
          950: 'var(--color-gray-9, #111827)',
          foreground: 'var(--text-inverse, #ffffff)',
        },
        // 品牌色调 - 使用CSS变量
        brand: {
          DEFAULT: 'var(--color-accent, #047857)',
          50: 'var(--bg-tertiary, #f3f4f6)',
          100: 'var(--bg-tertiary, #f3f4f6)',
          200: 'var(--bg-tertiary, #f3f4f6)',
          300: 'var(--border-primary, #e5e7eb)',
          400: 'var(--color-accent, #047857)',
          500: 'var(--color-accent, #047857)',
          600: 'var(--color-accent, #047857)',
          700: 'var(--color-accent, #047857)',
          800: 'var(--color-accent, #047857)',
          900: 'var(--color-accent, #047857)',
          950: 'var(--color-gray-9, #111827)',
          foreground: 'var(--text-inverse, #ffffff)',
        },
        // 强调色调 - 使用CSS变量
        accent: {
          DEFAULT: 'var(--color-accent, #047857)',
          50: 'var(--bg-tertiary, #f3f4f6)',
          100: 'var(--bg-tertiary, #f3f4f6)',
          200: 'var(--bg-tertiary, #f3f4f6)',
          300: 'var(--border-primary, #e5e7eb)',
          400: 'var(--color-accent, #047857)',
          500: 'var(--color-accent, #047857)',
          600: 'var(--color-accent, #047857)',
          700: 'var(--color-accent, #047857)',
          800: 'var(--color-accent, #047857)',
          900: 'var(--color-accent, #047857)',
          950: 'var(--color-gray-9, #111827)',
          foreground: 'var(--text-primary, #111827)',
        },
        // 静音/灰色色调 - 使用CSS变量
        muted: {
          DEFAULT: 'var(--bg-muted, #f5f5f5)',
          foreground: 'var(--text-muted, #9ca3af)',
        },
        // 背景色 - 使用CSS变量
        background: 'var(--bg-primary, #ffffff)',
        foreground: 'var(--text-primary, #111827)',
        // 卡片色 - 使用CSS变量
        card: {
          DEFAULT: 'var(--bg-secondary, #f9fafb)',
          foreground: 'var(--text-primary, #111827)',
        },
        // 弹窗色 - 使用CSS变量
        popover: {
          DEFAULT: 'var(--bg-secondary, #f9fafb)',
          foreground: 'var(--text-primary, #111827)',
        },
        // 边框色 - 使用CSS变量
        border: 'var(--border-primary, #e5e7eb)',
        input: 'var(--border-primary, #e5e7eb)',
        ring: 'var(--color-primary, #c21807)',
        // 津脉品牌色 - 使用CSS变量
        jinmai: {
          red: 'var(--color-primary, #C02C38)',
          'red-light': 'var(--color-primary, #D04550)',
          'red-dark': 'var(--color-primary, #A02430)',
          slate: 'var(--color-gray-8, #1E293B)',
          'slate-light': 'var(--color-gray-7, #334155)',
          'slate-dark': 'var(--color-gray-9, #0F172A)',
        }
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      boxShadow: {
        'card': 'var(--shadow-md, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06))',
        'card-hover': 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
        'primary': 'var(--shadow-lg, 0 4px 14px 0 rgba(192, 44, 56, 0.25))',
        'sm': 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
        'md': 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
        'lg': 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
        'xl': 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
      },
      backgroundColor: {
        skin: {
          base: 'var(--bg-primary, #ffffff)',
          secondary: 'var(--bg-secondary, #f9fafb)',
          tertiary: 'var(--bg-tertiary, #f3f4f6)',
          hover: 'var(--bg-hover, #e5e7eb)',
          active: 'var(--bg-active, #d1d5db)',
          muted: 'var(--bg-muted, #f5f5f5)',
        }
      },
      textColor: {
        skin: {
          base: 'var(--text-primary, #111827)',
          secondary: 'var(--text-secondary, #374151)',
          tertiary: 'var(--text-tertiary, #6b7280)',
          muted: 'var(--text-muted, #9ca3af)',
          inverse: 'var(--text-inverse, #ffffff)',
        }
      },
      borderColor: {
        skin: {
          base: 'var(--border-primary, #e5e7eb)',
          secondary: 'var(--border-secondary, #d1d5db)',
          tertiary: 'var(--border-tertiary, #9ca3af)',
          muted: 'var(--border-muted, #e5e7eb)',
        }
      }
    },
  },
  plugins: [],
};
