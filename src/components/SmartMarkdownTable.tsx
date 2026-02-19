import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@/hooks/useTheme';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SmartMarkdownTableProps {
  content: string;
  className?: string;
}

/**
 * 智能Markdown表格组件
 * 自动检测和修复不规范的表格格式
 */
export const SmartMarkdownTable: React.FC<SmartMarkdownTableProps> = ({
  content,
  className
}) => {
  const { isDark } = useTheme();

  /**
   * 检测内容是否包含表格
   */
  const detectTable = (text: string): boolean => {
    // 标准Markdown表格：包含 | 和至少一个 --- 分隔行
    const hasPipe = text.includes('|');
    const hasSeparator = /\|[-:\s]+\|/.test(text);
    return hasPipe && hasSeparator;
  };

  /**
   * 解析表格内容
   */
  const parseTable = (text: string): { headers: string[]; rows: string[][] } | null => {
    const lines = text.split('\n').filter(line => line.trim());
    
    // 找到表格行（包含 | 的行）
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length < 2) return null;

    // 查找分隔行（包含 --- 的行）
    const separatorIndex = tableLines.findIndex(line => 
      /^\s*\|[-:\s|]+\|\s*$/.test(line)
    );

    if (separatorIndex === -1 || separatorIndex === 0) {
      // 没有分隔行，尝试智能识别
      return parseTableWithoutSeparator(tableLines);
    }

    // 标准Markdown表格解析
    const headerLine = tableLines[0];
    const dataLines = tableLines.slice(separatorIndex + 1);

    const headers = parseTableRow(headerLine);
    const rows = dataLines.map(line => parseTableRow(line));

    return { headers, rows };
  };

  /**
   * 解析没有分隔符的表格（智能识别）
   */
  const parseTableWithoutSeparator = (lines: string[]): { headers: string[]; rows: string[][] } | null => {
    if (lines.length < 2) return null;

    // 假设第一行是表头
    const headers = parseTableRow(lines[0]);
    const rows = lines.slice(1).map(line => parseTableRow(line));

    return { headers, rows };
  };

  /**
   * 解析单行表格数据
   */
  const parseTableRow = (line: string): string[] => {
    return line
      .split('|')
      .map(cell => cell.trim())
      .filter((cell, index, arr) => {
        // 过滤首尾空单元格（由 | 开头/结尾产生的）
        if (index === 0 && cell === '') return false;
        if (index === arr.length - 1 && cell === '') return false;
        return true;
      });
  };

  /**
   * 自动修复表格格式
   */
  const fixTableFormat = (text: string): string => {
    // 检测是否已经是标准Markdown表格
    if (detectTable(text)) {
      return text;
    }

    // 尝试识别并修复表格
    const lines = text.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // 检测表格开始
      if (line.includes('|') && !line.startsWith('    ') && !line.startsWith('\t')) {
        // 收集连续的行
        const tableLines: string[] = [line];
        let j = i + 1;
        
        while (j < lines.length && lines[j].includes('|')) {
          tableLines.push(lines[j]);
          j++;
        }

        // 尝试解析表格
        const table = parseTable(tableLines.join('\n'));
        
        if (table && table.headers.length > 0) {
          // 生成标准Markdown表格
          const colCount = table.headers.length;
          
          // 表头行
          result.push(`| ${table.headers.join(' | ')} |`);
          
          // 分隔行
          result.push(`| ${Array(colCount).fill('---').join(' | ')} |`);
          
          // 数据行
          table.rows.forEach(row => {
            // 补齐缺失的单元格
            const paddedRow = [...row];
            while (paddedRow.length < colCount) {
              paddedRow.push('');
            }
            result.push(`| ${paddedRow.slice(0, colCount).join(' | ')} |`);
          });
          
          i = j;
          continue;
        }
      }
      
      result.push(line);
      i++;
    }

    return result.join('\n');
  };

  /**
   * 渲染表格
   */
  const renderTable = (tableData: { headers: string[]; rows: string[][] }) => {
    const { headers, rows } = tableData;

    return (
      <div
        className={cn(
          'w-full overflow-x-auto rounded-xl my-4',
          'border',
          isDark ? 'border-gray-700' : 'border-gray-200',
          className
        )}
      >
        <table className={cn(
          'w-full border-collapse min-w-[400px]',
          isDark ? 'text-gray-200' : 'text-gray-800'
        )}>
          <thead>
            <tr className={cn(
              isDark
                ? 'bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700'
                : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200'
            )}>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-semibold whitespace-nowrap',
                    isDark
                      ? 'text-indigo-300 border-gray-700'
                      : 'text-indigo-700 border-gray-200',
                    'border-r last:border-r-0'
                  )}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span>{children}</span>,
                      strong: ({ children }) => <span className="font-bold">{children}</span>,
                      em: ({ children }) => <span className="italic">{children}</span>,
                    }}
                  >
                    {header}
                  </ReactMarkdown>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(
            isDark ? 'divide-y divide-gray-700/50' : 'divide-y divide-gray-100'
          )}>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  rowIndex % 2 === 1
                    ? isDark
                      ? 'bg-gray-800/30'
                      : 'bg-gray-50/50'
                    : isDark
                      ? 'bg-gray-900/20'
                      : 'bg-white',
                  isDark
                    ? 'hover:bg-gray-800/60 transition-colors duration-150'
                    : 'hover:bg-indigo-50/40 transition-colors duration-150'
                )}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      'px-4 py-2.5 text-sm leading-relaxed',
                      cellIndex === 0 && 'font-medium',
                      isDark
                        ? cellIndex === 0
                          ? 'text-indigo-200'
                          : 'text-gray-300'
                        : cellIndex === 0
                          ? 'text-indigo-700'
                          : 'text-gray-600',
                      'border-r last:border-r-0'
                    )}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <span>{children}</span>,
                        strong: ({ children }) => <strong className="font-bold text-indigo-600 dark:text-indigo-400">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => (
                          <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-pink-600 dark:text-pink-400 text-xs">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {cell}
                    </ReactMarkdown>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /**
   * 渲染Markdown文本（非表格内容）
   */
  const renderMarkdownText = (text: string) => {
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-indigo-600 dark:text-indigo-400">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 text-sm">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-400 dark:border-indigo-500 pl-4 my-3 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 pr-3 rounded-r-lg">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-indigo-600 dark:text-indigo-400">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>,
          hr: () => <hr className="my-4 border-gray-200 dark:border-gray-700" />,
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  /**
   * 渲染内容，自动识别并渲染表格
   */
  const renderContent = () => {
    const parts: React.ReactNode[] = [];
    const lines = content.split('\n');
    let currentText: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 检测表格开始
      if (line.includes('|') && !line.startsWith('    ') && !line.startsWith('\t')) {
        // 先输出累积的文本
        if (currentText.length > 0) {
          parts.push(
            <div key={`text-${i}`} className="mb-3">
              {renderMarkdownText(currentText.join('\n'))}
            </div>
          );
          currentText = [];
        }

        // 收集表格行
        const tableLines: string[] = [line];
        let j = i + 1;

        while (j < lines.length && lines[j].includes('|')) {
          tableLines.push(lines[j]);
          j++;
        }

        // 解析并渲染表格
        const table = parseTable(tableLines.join('\n'));
        if (table && table.headers.length > 0) {
          parts.push(
            <div key={`table-${i}`}>
              {renderTable(table)}
            </div>
          );
          i = j;
          continue;
        } else {
          // 不是有效表格，当作普通文本
          currentText.push(line);
        }
      } else {
        currentText.push(line);
      }

      i++;
    }

    // 输出剩余的文本
    if (currentText.length > 0) {
      parts.push(
        <div key="text-final">
          {renderMarkdownText(currentText.join('\n'))}
        </div>
      );
    }

    return parts;
  };

  return (
    <div className={cn(
      'text-sm leading-relaxed',
      isDark ? 'text-gray-200' : 'text-gray-800'
    )}>
      {renderContent()}
    </div>
  );
};

export default SmartMarkdownTable;
