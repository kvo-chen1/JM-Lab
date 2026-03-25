import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Info, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThinkingStep, ThinkingStepStatus, AnalysisDetail } from '../types';

interface ThinkingProcessPanelProps {
  steps?: ThinkingStep[];
  analysisDetails?: AnalysisDetail[];
  isProcessing?: boolean;
}

const getStepIcon = (status: ThinkingStepStatus) => {
  switch (status) {
    case 'processing':
      return <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    default:
      return <Brain className="w-3.5 h-3.5 text-gray-400" />;
  }
};

const getSourceLabel = (source: AnalysisDetail['source']) => {
  switch (source) {
    case 'explicit':
      return { text: '用户明确说的', color: 'text-green-500', bg: 'bg-green-500/10' };
    case 'inferred':
      return { text: 'AI推断的', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    case 'imported':
      return { text: '从上下文导入', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    default:
      return { text: '未知', color: 'text-gray-400', bg: 'bg-gray-500/10' };
  }
};

const TypeLabel: React.FC<{ type: ThinkingStep['type'] }> = ({ type }) => {
  const labels: Record<ThinkingStep['type'], { text: string; color: string }> = {
    'intent-recognition': { text: '意图识别', color: 'text-purple-500' },
    'requirement-analysis': { text: '需求分析', color: 'text-blue-500' },
    'info-collection': { text: '信息收集', color: 'text-cyan-500' },
    'skill-execution': { text: '技能执行', color: 'text-orange-500' },
    'completed': { text: '完成', color: 'text-green-500' },
  };
  return <span className={`text-xs font-medium ${labels[type]?.color || 'text-gray-400'}`}>{labels[type]?.text || type}</span>;
};

const ThinkingStepItem: React.FC<{
  step: ThinkingStep;
  isLast?: boolean;
}> = ({ step, isLast }) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
          step.status === 'completed' ? 'bg-green-500/10' :
          step.status === 'processing' ? 'bg-purple-500/10' :
          step.status === 'error' ? 'bg-red-500/10' :
          'bg-gray-500/10'
        }`}>
          {getStepIcon(step.status)}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 my-1 ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`} />
        )}
      </div>

      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <TypeLabel type={step.type} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            {step.title}
          </span>
        </div>

        <div className={`text-xs rounded-lg px-2.5 py-2 ${
          isDark ? 'bg-gray-800/80 text-gray-300' : 'bg-gray-100 text-gray-600'
        }`}>
          <p className="whitespace-pre-wrap">{step.content}</p>
        </div>

        {step.details && Object.keys(step.details).length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`mt-1.5 flex items-center gap-1 text-xs ${
              isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isExpanded ? '收起详情' : '查看详情'}
          </button>
        )}

        <AnimatePresence>
          {isExpanded && step.details && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-2 p-2.5 rounded-lg text-xs font-mono overflow-hidden ${
                isDark ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}
            >
              <pre className="whitespace-pre-wrap break-all">
                {JSON.stringify(step.details, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AnalysisDetailItem: React.FC<{
  detail: AnalysisDetail;
  isCollected: boolean;
}> = ({ detail, isCollected }) => {
  const { isDark } = useTheme();
  const sourceInfo = getSourceLabel(detail.source);

  return (
    <div className={`flex items-start gap-2 py-1.5 px-2 rounded-lg ${
      isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
    }`}>
      {isCollected ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
      ) : (
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
          isDark ? 'bg-blue-400' : 'bg-blue-500'
        }`} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {detail.label}:
          </span>
          {detail.value && (
            <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {detail.value}
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${sourceInfo.bg} ${sourceInfo.color}`}>
            {sourceInfo.text}
          </span>
        </div>
        {detail.reasoning && (
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            💭 {detail.reasoning}
          </p>
        )}
      </div>
    </div>
  );
};

export const ThinkingProcessPanel: React.FC<ThinkingProcessPanelProps> = ({
  steps,
  analysisDetails,
  isProcessing = false,
}) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayedSteps, setDisplayedSteps] = useState<ThinkingStep[]>([]);

  useEffect(() => {
    if (steps && steps.length > 0) {
      setDisplayedSteps(steps);
    }
  }, [steps]);

  const hasContent = (steps && steps.length > 0) || (analysisDetails && analysisDetails.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div className={`mt-3 rounded-xl border overflow-hidden ${
      isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-white/50 border-gray-200/50'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-3 py-2.5 flex items-center justify-between transition-colors ${
          isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            思考过程
          </span>
          {isProcessing && (
            <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`border-t ${
              isDark ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}
          >
            <div className="p-3 space-y-3">
              {steps && steps.length > 0 && (
                <div className="space-y-1">
                  {steps.map((step, index) => (
                    <ThinkingStepItem
                      key={step.id}
                      step={step}
                      isLast={index === steps.length - 1}
                    />
                  ))}
                </div>
              )}

              {analysisDetails && analysisDetails.length > 0 && (
                <div>
                  <div className={`flex items-center gap-1.5 mb-2 text-xs ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <Info className="w-3.5 h-3.5" />
                    <span>需求分析详情</span>
                  </div>
                  <div className={`rounded-lg p-2 ${
                    isDark ? 'bg-gray-900/50' : 'bg-gray-50'
                  }`}>
                    {analysisDetails.map((detail, index) => {
                      const isCollected = !!detail.value && detail.value.trim() !== '';
                      return (
                        <AnalysisDetailItem
                          key={`${detail.field}-${index}`}
                          detail={detail}
                          isCollected={isCollected}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingProcessPanel;