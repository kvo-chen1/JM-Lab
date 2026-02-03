import React from 'react';

const TestError: React.FC = () => {
  // 故意触发错误
  const triggerError = () => {
    throw new Error('测试错误：这是一个故意触发的错误，用于测试错误页面的美化效果');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">测试错误页面</h1>
        <p className="mb-6 text-gray-600">点击下方按钮触发错误，查看美化后的错误页面效果</p>
        <button
          onClick={triggerError}
          className="px-6 py-3 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          触发错误
        </button>
      </div>
    </div>
  );
};

export default TestError;