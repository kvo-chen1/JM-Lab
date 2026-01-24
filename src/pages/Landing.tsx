import React from 'react';

const Landing = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4">津脉智坊</h1>
        <p className="mb-8 text-gray-300">连接传统与未来的数字共创生态</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all duration-300"
        >
          立即探索平台
        </a>
      </div>
    </div>
  );
};

export default Landing;