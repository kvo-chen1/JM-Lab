import React from 'react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeTestPage() {
  const { theme, setTheme, toggleTheme, isDark, availableThemes } = useTheme();

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-primary, #ffffff)' }}>
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary, #111827)' }}>
        主题测试页面
      </h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary, #111827)' }}>
          当前主题: {availableThemes.find(t => t.value === theme)?.label || theme}
        </h2>
        <button
          onClick={toggleTheme}
          className="px-6 py-3 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: 'var(--color-primary, #c21807)',
            color: 'white',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          切换到下一个主题
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary, #111827)' }}>
          选择主题
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableThemes.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`p-4 rounded-lg border-2 transition-all ${theme === themeOption.value ? 'border-4' : ''}`}
              style={{
                backgroundColor: theme === themeOption.value ? 'var(--bg-secondary, #f9fafb)' : 'var(--bg-primary, #ffffff)',
                borderColor: theme === themeOption.value ? 'var(--color-primary, #c21807)' : 'var(--border-primary, #e5e7eb)',
                color: 'var(--text-primary, #111827)'
              }}
            >
              <i className={`${themeOption.icon} text-2xl mb-2`} style={{ color: 'var(--color-primary, #c21807)' }}></i>
              <div className="font-medium">{themeOption.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-xl" style={{ 
          backgroundColor: 'var(--bg-secondary, #f9fafb)',
          border: '1px solid var(--border-primary, #e5e7eb)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary, #111827)' }}>
            颜色预览
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'var(--color-primary, #c21807)' }}></div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text-primary, #111827)' }}>主色 (Primary)</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary, #374151)' }}>var(--color-primary)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'var(--color-secondary, #6d28d9)' }}></div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text-primary, #111827)' }}>次色 (Secondary)</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary, #374151)' }}>var(--color-secondary)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: 'var(--color-accent, #047857)' }}></div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text-primary, #111827)' }}>强调色 (Accent)</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary, #374151)' }}>var(--color-accent)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl" style={{ 
          backgroundColor: 'var(--bg-secondary, #f9fafb)',
          border: '1px solid var(--border-primary, #e5e7eb)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary, #111827)' }}>
            文字层级
          </h3>
          <div className="space-y-2">
            <h1 style={{ color: 'var(--text-primary, #111827)' }}>H1 主标题文字</h1>
            <h2 style={{ color: 'var(--text-secondary, #374151)' }}>H2 次标题文字</h2>
            <p style={{ color: 'var(--text-tertiary, #6b7280)' }}>正文文字 - 这是一段示例文字</p>
            <p style={{ color: 'var(--text-muted, #9ca3af)' }}>辅助文字 - 灰色文字</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary, #111827)' }}>
          按钮预览
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            className="px-6 py-3 rounded-lg font-medium"
            style={{
              backgroundColor: 'var(--color-primary, #c21807)',
              color: 'white',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            主按钮
          </button>
          <button
            className="px-6 py-3 rounded-lg font-medium"
            style={{
              backgroundColor: 'var(--color-secondary, #6d28d9)',
              color: 'white',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            次按钮
          </button>
          <button
            className="px-6 py-3 rounded-lg font-medium"
            style={{
              backgroundColor: 'var(--bg-primary, #ffffff)',
              color: 'var(--text-primary, #111827)',
              border: '2px solid var(--border-primary, #e5e7eb)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            边框按钮
          </button>
        </div>
      </div>

      <div className="mt-8 p-6 rounded-xl" style={{ 
        backgroundColor: 'var(--bg-secondary, #f9fafb)',
        border: '1px solid var(--border-primary, #e5e7eb)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary, #111827)' }}>
          调试信息
        </h3>
        <div className="space-y-2 text-sm font-mono" style={{ color: 'var(--text-secondary, #374151)' }}>
          <div>当前主题值: {theme}</div>
          <div>isDark: {isDark ? 'true' : 'false'}</div>
          <div>html 类名: {typeof document !== 'undefined' ? document.documentElement.className : '(服务器端)'}</div>
        </div>
      </div>
    </div>
  );
}
