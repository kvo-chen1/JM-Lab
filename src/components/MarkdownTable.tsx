import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind 类名合并工具
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Markdown 表格组件 Props
 */
interface MarkdownTableProps {
  /** 表格内容 - React children */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 是否启用斑马纹 */
  striped?: boolean;
  /** 是否启用悬停效果 */
  hoverable?: boolean;
  /** 是否启用边框 */
  bordered?: boolean;
  /** 表格大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 最大高度（启用表头固定） */
  maxHeight?: string;
}

/**
 * 带有 className 的子元素类型
 */
interface ElementWithClassName {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Markdown 表格渲染组件
 * 
 * 特性：
 * - 响应式横向滚动
 * - 斑马纹效果
 * - 悬停高亮
 * - 表头样式优化
 * - 暗色模式支持
 * - 可配置的尺寸和样式
 * 
 * @example
 * <MarkdownTable striped hoverable>
 *   <thead>
 *     <tr>
 *       <th>层级</th>
 *       <th>表现形式</th>
 *       <th>参与方式</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td>数据层</td>
 *       <td>AI模型学习</td>
 *       <td>上传图片</td>
 *     </tr>
 *   </tbody>
 * </MarkdownTable>
 */
export function MarkdownTable({
  children,
  className,
  striped = true,
  hoverable = true,
  bordered = true,
  size = 'md',
  maxHeight,
}: MarkdownTableProps) {
  const { isDark } = useTheme();

  // 尺寸配置
  const sizeConfig = {
    sm: {
      cell: 'px-2 py-1.5 text-xs',
      header: 'px-2 py-2 text-xs',
    },
    md: {
      cell: 'px-4 py-2.5 text-sm',
      header: 'px-4 py-3 text-sm',
    },
    lg: {
      cell: 'px-6 py-3 text-base',
      header: 'px-6 py-4 text-base',
    },
  };

  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-xl my-4',
        bordered && (isDark ? 'border border-gray-700' : 'border border-gray-200'),
        className
      )}
    >
      <div
        className={cn(
          'w-full overflow-x-auto',
          maxHeight && 'overflow-y-auto'
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table
          className={cn(
            'w-full border-collapse min-w-[500px]',
            isDark ? 'text-gray-200' : 'text-gray-800'
          )}
        >
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;

            // 处理 thead
            if (child.type === 'thead') {
              return (
                <thead
                  className={cn(
                    'sticky top-0 z-10',
                    isDark
                      ? 'bg-gradient-to-r from-gray-800 to-gray-750'
                      : 'bg-gradient-to-r from-indigo-50 to-purple-50'
                  )}
                >
                  {React.Children.map(
                    (child.props as { children?: React.ReactNode }).children,
                    (tr) => {
                      if (!React.isValidElement(tr)) return tr;
                      return (
                        <tr
                          className={cn(
                            bordered && (isDark ? 'border-b border-gray-700' : 'border-b border-gray-200')
                          )}
                        >
                          {React.Children.map(
                            (tr.props as { children?: React.ReactNode }).children,
                            (th) => {
                              if (!React.isValidElement(th)) return th;
                              const thProps = th.props as ElementWithClassName;
                              return (
                                <th
                                  className={cn(
                                    sizeConfig[size].header,
                                    'text-left font-semibold whitespace-nowrap',
                                    isDark
                                      ? 'text-indigo-300 border-gray-700'
                                      : 'text-indigo-700 border-gray-200',
                                    bordered && 'border-r last:border-r-0',
                                    thProps.className
                                  )}
                                >
                                  {thProps.children}
                                </th>
                              );
                            }
                          )}
                        </tr>
                      );
                    }
                  )}
                </thead>
              );
            }

            // 处理 tbody
            if (child.type === 'tbody') {
              return (
                <tbody
                  className={cn(
                    isDark ? 'divide-y divide-gray-700/50' : 'divide-y divide-gray-100'
                  )}
                >
                  {React.Children.map(
                    (child.props as { children?: React.ReactNode }).children,
                    (tr, rowIndex) => {
                      if (!React.isValidElement(tr)) return tr;
                      return (
                        <tr
                          className={cn(
                            striped && rowIndex % 2 === 1
                              ? isDark
                                ? 'bg-gray-800/30'
                                : 'bg-gray-50/50'
                              : isDark
                                ? 'bg-gray-900/20'
                                : 'bg-white',
                            hoverable && (
                              isDark
                                ? 'hover:bg-gray-800/60 transition-colors duration-150'
                                : 'hover:bg-indigo-50/40 transition-colors duration-150'
                            )
                          )}
                        >
                          {React.Children.map(
                            (tr.props as { children?: React.ReactNode }).children,
                            (td, cellIndex) => {
                              if (!React.isValidElement(td)) return td;
                              const tdProps = td.props as ElementWithClassName;
                              
                              // 判断是否是第一列（通常是标题列）
                              const isFirstColumn = cellIndex === 0;
                              
                              return (
                                <td
                                  className={cn(
                                    sizeConfig[size].cell,
                                    'leading-relaxed',
                                    isFirstColumn && 'font-medium',
                                    isDark
                                      ? isFirstColumn
                                        ? 'text-indigo-200'
                                        : 'text-gray-300'
                                      : isFirstColumn
                                        ? 'text-indigo-700'
                                        : 'text-gray-600',
                                    bordered && 'border-r last:border-r-0',
                                    tdProps.className
                                  )}
                                >
                                  {tdProps.children}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      );
                    }
                  )}
                </tbody>
              );
            }

            return child;
          })}
        </table>
      </div>
    </div>
  );
}

/**
 * 用于 react-markdown 的表格组件配置
 * 
 * 使用方法：
 * ```tsx
 * import ReactMarkdown from 'react-markdown';
 * import { markdownTableComponents } from '@/components/MarkdownTable';
 * 
 * <ReactMarkdown components={markdownTableComponents}>
 *   {markdownContent}
 * </ReactMarkdown>
 * ```
 */
export const markdownTableComponents = {
  table: ({ children }: { children: React.ReactNode }) => (
    <MarkdownTable striped hoverable bordered>
      {children}
    </MarkdownTable>
  ),
  thead: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  tbody: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  tr: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  th: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  td: ({ children }: { children: React.ReactNode }) => <>{children}</>,
};

/**
 * 获取完整的 react-markdown 组件配置（包含表格和其他常用元素）
 * 
 * @param isDark - 是否为暗色模式
 * @returns 组件配置对象
 */
export function getMarkdownComponents(isDark: boolean) {
  return {
    // 表格组件
    table: ({ children }: { children: React.ReactNode }) => (
      <MarkdownTable striped hoverable bordered>
        {children}
      </MarkdownTable>
    ),
    
    // 代码块
    code({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !String(children).includes('\n');
      
      return isInline ? (
        <code
          className={cn(
            'px-1.5 py-0.5 rounded-md text-xs font-mono',
            isDark ? 'bg-gray-700 text-blue-300' : 'bg-gray-100 text-blue-600'
          )}
          {...props}
        >
          {children}
        </code>
      ) : (
        <div className="relative group/code my-3">
          <div
            className={cn(
              'absolute top-0 right-0 px-2 py-1 text-xs rounded-bl-md rounded-tr-md',
              isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
            )}
          >
            {match ? match[1] : 'text'}
          </div>
          <pre
            className={cn(
              'p-3.5 rounded-xl overflow-x-auto text-xs font-mono',
              isDark
                ? 'bg-gray-900/80 border border-gray-700/50'
                : 'bg-gray-50 border border-gray-200/50'
            )}
          >
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    },
    
    // 链接
    a: ({ children, ...props }: { children: React.ReactNode }) => (
      <a
        className="text-blue-500 hover:underline font-medium transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    
    // 列表
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-outside ml-4 mb-3 space-y-1.5">
        {children}
      </ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-outside ml-4 mb-3 space-y-1.5">
        {children}
      </ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="mb-1 leading-relaxed">{children}</li>
    ),
    
    // 标题
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1
        className={cn(
          'text-lg font-bold mb-3 mt-4 pb-2 border-b',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}
      >
        {children}
      </h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2
        className={cn(
          'text-base font-bold mb-2 mt-3',
          isDark ? 'text-indigo-400' : 'text-indigo-600'
        )}
      >
        {children}
      </h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3
        className={cn(
          'text-sm font-bold mb-2 mt-2',
          isDark ? 'text-gray-300' : 'text-gray-700'
        )}
      >
        {children}
      </h3>
    ),
    
    // 段落
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
    ),
    
    // 引用块
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote
        className={cn(
          'border-l-4 pl-4 italic my-3 py-2 pr-3 rounded-r-lg',
          isDark
            ? 'border-indigo-500 text-gray-400 bg-gray-800/50'
            : 'border-indigo-400 text-gray-600 bg-gray-50/50'
        )}
      >
        {children}
      </blockquote>
    ),
    
    // 强调
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong
        className={cn(
          'font-semibold',
          isDark ? 'text-indigo-400' : 'text-indigo-600'
        )}
      >
        {children}
      </strong>
    ),
    
    // 水平线
    hr: () => (
      <hr
        className={cn(
          'my-4 border-t',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}
      />
    ),
  };
}

export default MarkdownTable;
