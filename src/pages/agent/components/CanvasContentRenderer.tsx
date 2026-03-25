import React from 'react';
import { motion } from 'framer-motion';
import { useAgentStore } from '../hooks/useAgentStore';
import { CanvasContent, AGENT_CONFIG } from '../types/agent';
import { X, Sparkles, Palette, Ruler, Package, Image as ImageIcon } from 'lucide-react';

interface CanvasContentRendererProps {
  content: CanvasContent;
  onClose?: () => void;
}

// 设计规范内容渲染
function DesignSpecContent({ content, isDark }: { content: any; isDark: boolean }) {
  return (
    <div className="space-y-6">
      {/* 标题 */}
      {content.title && (
        <div className={`pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {content.title}
          </h2>
        </div>
      )}

      {/* 内容区块 */}
      {content.sections?.map((section: any, index: number) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`rounded-xl p-5 ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          {/* 区块标题 */}
          {section.title && (
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-[#E85D75]' : 'text-[#C02C38]'}`}>
              <div className={`w-1.5 h-6 rounded-full ${isDark ? 'bg-[#E85D75]' : 'bg-[#C02C38]'}`} />
              {section.title}
            </h3>
          )}

          {/* 子区块 */}
          {section.subsections?.map((sub: any, subIndex: number) => (
            <div key={subIndex} className="mb-4 last:mb-0">
              {sub.title && (
                <h4 className={`text-base font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {sub.title}
                </h4>
              )}

              {/* 列表项 */}
              {sub.items && (
                <ul className="space-y-2">
                  {sub.items.map((item: string, itemIndex: number) => (
                    <li key={itemIndex} className={`flex items-start gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        {itemIndex + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* 表格 */}
              {sub.table && (
                <div className={`mt-3 overflow-hidden rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <table className="w-full text-sm">
                    <thead className={`${isDark ? 'bg-gray-700/50 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                      <tr>
                        {sub.table.headers.map((header: string, hIndex: number) => (
                          <th key={hIndex} className="px-4 py-2 text-left font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {sub.table.rows.map((row: string[], rIndex: number) => (
                        <tr key={rIndex} className={`${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                          {row.map((cell: string, cIndex: number) => (
                            <td key={cIndex} className={`px-4 py-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// 衍生品规格内容渲染
function DerivativesContent({ content, isDark }: { content: any; isDark: boolean }) {
  return (
    <div className="space-y-6">
      {/* 标题 */}
      {content.title && (
        <div className={`pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {content.title}
          </h2>
        </div>
      )}

      {/* 衍生品列表 */}
      <div className="grid grid-cols-1 gap-4">
        {content.items?.map((item: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-xl p-5 ${isDark ? 'bg-gray-800/50' : 'bg-white/80'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="flex items-start gap-4">
              {/* 图标 */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Package className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>

              {/* 内容 */}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.name}
                </h3>

                {/* 规格 */}
                {item.specs && (
                  <div className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.specs}
                  </div>
                )}

                {/* 设计要点 */}
                {item.designPoints && (
                  <ul className="space-y-1.5">
                    {item.designPoints.map((point: string, pIndex: number) => (
                      <li key={pIndex} className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#E85D75]' : 'bg-[#C02C38]'}`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}

                {/* 图示说明 */}
                {item.diagram && (
                  <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} font-mono text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {item.diagram}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// 图像内容渲染
function ImageContent({ content, isDark }: { content: any; isDark: boolean }) {
  return (
    <div className="space-y-4">
      {content.title && (
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {content.title}
        </h2>
      )}

      <div className="grid grid-cols-2 gap-4">
        {content.images?.map((image: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-xl overflow-hidden border-2 ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:border-[#C02C38] transition-colors`}
          >
            <img
              src={typeof image === 'string' ? image : image.url}
              alt={typeof image === 'string' ? `Image ${index + 1}` : image.name || `Image ${index + 1}`}
              className="w-full h-48 object-cover"
            />
            {typeof image !== 'string' && image.name && (
              <div className={`px-3 py-2 text-sm ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                {image.name}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// 通用内容渲染
function GenericContent({ content, isDark }: { content: any; isDark: boolean }) {
  return (
    <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
      {typeof content === 'string' ? (
        <div className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {content}
        </div>
      ) : (
        <pre className={`p-4 rounded-lg text-xs overflow-auto ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
          {JSON.stringify(content, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function CanvasContentRenderer({ content, onClose }: CanvasContentRendererProps) {
  const { isDark } = useAgentStore();

  // 空值检查
  if (!content) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className={`fixed right-0 top-0 h-full w-[480px] shadow-2xl z-50 flex items-center justify-center ${
          isDark ? 'bg-[#1E1E2E]' : 'bg-white'
        }`}
      >
        <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>暂无内容</p>
        </div>
      </motion.div>
    );
  }

  const agentConfig = content.metadata?.agentType
    ? AGENT_CONFIG[content.metadata.agentType as keyof typeof AGENT_CONFIG]
    : null;

  const getTypeIcon = () => {
    switch (content.type) {
      case 'design-spec':
        return <Palette className="w-5 h-5" />;
      case 'derivatives':
        return <Package className="w-5 h-5" />;
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'table':
        return <Ruler className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (content.type) {
      case 'design-spec':
        return '设计规范';
      case 'derivatives':
        return '衍生品规格';
      case 'image':
        return '图像';
      case 'table':
        return '表格';
      default:
        return '内容';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`h-full flex flex-col rounded-2xl overflow-hidden ${isDark ? 'bg-[#1E1E2E]' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-xl`}
    >
      {/* 头部 */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/80'}`}>
        <div className="flex items-center gap-3">
          {/* 类型图标 */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'} shadow-sm`}>
            {getTypeIcon()}
          </div>

          {/* 标题信息 */}
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {content.title || getTypeLabel()}
            </h3>
            {agentConfig && (
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                由 {agentConfig.name} 生成
              </p>
            )}
          </div>
        </div>

        {/* 关闭按钮 */}
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {content.type === 'design-spec' && <DesignSpecContent content={content.content} isDark={isDark} />}
        {content.type === 'derivatives' && <DerivativesContent content={content.content} isDark={isDark} />}
        {content.type === 'image' && <ImageContent content={content.content} isDark={isDark} />}
        {(content.type === 'table' || content.type === 'mixed') && <GenericContent content={content.content} isDark={isDark} />}
      </div>

      {/* 底部信息 */}
      {content.metadata?.timestamp && (
        <div className={`px-5 py-3 border-t text-xs ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
          生成时间: {new Date(content.metadata.timestamp).toLocaleString('zh-CN')}
        </div>
      )}
    </motion.div>
  );
}
