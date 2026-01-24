import React from 'react';

const Landing = () => {
  const handleExploreClick = () => {
    // 用户主动点击探索按钮，设置一个临时标志表示已经探索过
    // 这样用户下次访问时不会被重复重定向到landing.html
    localStorage.setItem('hasExplored', 'true');
    // 跳转到登录页，要求用户先登录/注册
    window.location.href = '/login';
  };

  return (
    <section id="hero" className="hero-section relative h-screen flex items-center justify-center overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 text-center max-w-5xl px-4 fade-in-section is-visible">
        <div className="inline-block px-3 py-1 mb-6 border border-accent/30 rounded-full bg-accent/5 backdrop-blur-sm">
          <span className="text-accent text-xs tracking-widest uppercase">AI × Intangible Cultural Heritage</span>
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-tight">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">传承天津文脉</span>
          <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-purpleAccent glow-text">AI 点亮创新</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300 font-light leading-relaxed">连接传统与未来的数字共创生态。津脉智坊致力于通过人工智能技术，为老字号品牌注入新生，构建非遗文化的赛博新纪元。</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleExploreClick} 
            className="relative px-8 py-4 bg-accent text-black font-bold rounded-full overflow-hidden group transition-all hover:shadow-[0_0_40px_rgba(0,240,255,0.4)] cursor-pointer inline-block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black smooth-scroll"
          >
            <span className="relative z-10 flex items-center justify-center">
              立即探索平台 
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
          <a 
            href="#culture" 
            className="px-8 py-4 rounded-full border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all text-gray-300 hover:text-white"
          >
            了解企业使命
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <i className="fas fa-chevron-down text-gray-500"></i>
      </div>
    </section>
  );
};

export default Landing;