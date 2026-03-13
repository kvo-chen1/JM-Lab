import React, { useState } from 'react';
import { similarityDetectionService } from '@/services/similarityDetectionService';
import type { SimilarityCheckRequest, SimilarityResult } from '@/types/similarity-detection';

interface SimilarityCheckerProps {
  workId: string;
  workType: 'image' | 'video' | 'audio' | 'text' | 'design' | 'other';
  imageUrl?: string;
  textContent?: string;
  title?: string;
  description?: string;
  onCheckComplete?: (results: SimilarityResult[]) => void;
}

const SimilarityChecker: React.FC<SimilarityCheckerProps> = ({
  workId,
  workType,
  imageUrl,
  textContent,
  title,
  description,
  onCheckComplete
}) => {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<SimilarityResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const runCheck = async () => {
    setChecking(true);
    try {
      const request: SimilarityCheckRequest = {
        workId,
        workType,
        imageUrl,
        textContent,
        title,
        description,
        creatorId: 'current-user'
      };

      const response = await similarityDetectionService.checkSimilarity(request);
      setResults(response.similarityResults);
      setShowResults(true);

      if (onCheckComplete) {
        onCheckComplete(response.similarityResults);
      }

      if (response.hasSimilarWorks) {
        alert(response.message);
      }
    } catch (error: any) {
      console.error('检测失败:', error);
      alert('检测失败: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.85) return 'text-red-600 bg-red-50';
    if (score >= 0.75) return 'text-orange-600 bg-orange-50';
    if (score >= 0.60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">原创性检测</h3>
          <p className="text-sm text-gray-500">检测作品是否存在相似内容</p>
        </div>
        <button
          onClick={runCheck}
          disabled={checking}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {checking ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              检测中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              开始检测
            </>
          )}
        </button>
      </div>

      {showResults && (
        <div className="mt-4">
          {results.length === 0 ? (
            <div className="text-center py-8 bg-green-50 rounded-lg">
              <span className="text-4xl mb-2 block">✅</span>
              <p className="text-green-700 font-medium">未检测到相似作品</p>
              <p className="text-sm text-green-600 mt-1">您的作品看起来是原创的</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-500">⚠️</span>
                <p className="text-gray-700">检测到 {results.length} 个相似作品</p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={result.id || index}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex gap-2">
                      {result.sourceWorkThumbnail && (
                        <img
                          src={result.sourceWorkThumbnail}
                          alt="当前作品"
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      {result.targetWorkThumbnail && (
                        <img
                          src={result.targetWorkThumbnail}
                          alt={result.targetWorkTitle}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {result.targetWorkTitle}
                      </p>
                      <p className="text-sm text-gray-500">
                        创作者: {result.targetCreatorName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${getSimilarityColor(result.similarityScore)}`}>
                          相似度: {(result.similarityScore * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-400">
                          {result.similarityType === 'image' ? '图片相似' : '文本相似'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.details.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">提示：</span>
                  如果您的作品确为原创，可以忽略此检测结果。如果存在引用或借鉴，建议注明出处或联系原作者。
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimilarityChecker;
