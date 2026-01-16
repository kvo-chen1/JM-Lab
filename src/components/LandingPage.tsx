import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const loaderRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // 初始化Three.js粒子背景
  const initThreeJS = () => {
    if (!canvasContainerRef.current) return;

    // 动态加载Three.js库
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      const THREE = (window as any).THREE;
      if (!THREE) return;

      const container = canvasContainerRef.current;
      if (!container) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x030308, 0.002);

      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 50;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      // Create Particles
      const geometry = new THREE.BufferGeometry();
      const particlesCount = 4000;
      const posArray = new Float32Array(particlesCount * 3);

      for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 250;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      // Material - Cyan/Blue glow
      const material = new THREE.PointsMaterial({
        size: 0.3,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });

      const particlesMesh = new THREE.Points(geometry, material);
      scene.add(particlesMesh);

      // Secondary Particles - Purple
      const geometry2 = new THREE.BufferGeometry();
      const particlesCount2 = 2000;
      const posArray2 = new Float32Array(particlesCount2 * 3);
      for(let i = 0; i < particlesCount2 * 3; i++) {
        posArray2[i] = (Math.random() - 0.5) * 200;
      }
      geometry2.setAttribute('position', new THREE.BufferAttribute(posArray2, 3));
      const material2 = new THREE.PointsMaterial({
        size: 0.4,
        color: 0x7000ff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      });
      const particlesMesh2 = new THREE.Points(geometry2, material2);
      scene.add(particlesMesh2);

      // Mouse interaction
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;
      
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;

      document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
      });

      // Animation Loop
      const animate = () => {
        requestAnimationFrame(animate);

        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        // Rotate the entire particle system slowly
        particlesMesh.rotation.y += 0.001;
        particlesMesh.rotation.x += 0.0005;
        
        particlesMesh2.rotation.y -= 0.0015;
        particlesMesh2.rotation.x -= 0.0005;

        // React to mouse
        particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
        particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

        renderer.render(scene, camera);
      };

      animate();

      // Handle Resize
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    };
    document.body.appendChild(script);
  };

  // UI Logic
  useEffect(() => {
    // Remove Loader
    setTimeout(() => {
      if (loaderRef.current) {
        loaderRef.current.style.opacity = '0';
        setTimeout(() => {
          if (loaderRef.current) {
            loaderRef.current.style.display = 'none';
          }
          initThreeJS(); // Start visuals after load
        }, 500);
      }
    }, 1000);

    // Navbar Blur Effect on Scroll
    const handleScroll = () => {
      if (navbarRef.current) {
        if (window.scrollY > 50) {
          navbarRef.current.classList.add('bg-deep/80', 'backdrop-blur-md', 'shadow-lg');
        } else {
          navbarRef.current.classList.remove('bg-deep/80', 'backdrop-blur-md', 'shadow-lg');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Mobile Menu Toggle
    const toggleMobileMenu = () => {
      if (mobileMenuRef.current) {
        mobileMenuRef.current.classList.toggle('hidden');
      }
    };

    if (mobileMenuBtnRef.current) {
      mobileMenuBtnRef.current.addEventListener('click', toggleMobileMenu);
    }

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(section => {
      observer.observe(section);
    });

    // Number Counter Animation
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = +((entry.target as HTMLElement).getAttribute('data-target') ?? 0);
          const duration = 2000; // ms
          const increment = target / (duration / 16); 
          
          let current = 0;
          const updateCounter = () => {
            current += increment;
            if (current < target) {
              (entry.target as HTMLElement).innerText = Math.ceil(current).toLocaleString();
              requestAnimationFrame(updateCounter);
            } else {
              (entry.target as HTMLElement).innerText = target.toLocaleString() + (target === 100 ? '%' : '+');
            }
          };
          updateCounter();
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(counter => {
      counterObserver.observe(counter);
    });

    // 清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mobileMenuBtnRef.current) {
        mobileMenuBtnRef.current.removeEventListener('click', toggleMobileMenu);
      }
    };
  }, []);

  // 点击立即探索平台按钮，导航到首页
  const handleExplorePlatform = () => {
    navigate('/');
  };

  return (
    <div className="bg-deep text-white overflow-x-hidden">
      {/* Global Styles are handled in separate CSS files */}

      {/* Loading Screen */}
      <div ref={loaderRef} className="loader-overlay" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <span className="loader"></span>
          <p className="text-sm tracking-[0.3em] text-gray-400">JINMAI LAB</p>
          <span className="sr-only">加载中，请稍候...</span>
        </div>
      </div>

      {/* 3D Particle Background */}
      <div ref={canvasContainerRef} id="canvas-container"></div>

      {/* Navigation */}
      <nav ref={navbarRef} className="fixed w-full z-50 top-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
              <span className="text-2xl font-bold tracking-tighter text-white">
                津脉<span className="text-accent">智坊</span>
              </span>
              <span className="block text-[10px] tracking-[0.2em] text-gray-400">JINMAI LAB</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#about" className="hover:text-accent transition-colors px-3 py-2 text-sm font-medium">关于我们</a>
                <a href="#culture" className="hover:text-accent transition-colors px-3 py-2 text-sm font-medium">企业文化</a>
                <a href="#achievements" className="hover:text-accent transition-colors px-3 py-2 text-sm font-medium">创新成就</a>
                <a href="#contact" className="hover:text-accent transition-colors px-3 py-2 text-sm font-medium">联系我们</a>
              </div>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button className="text-gray-400 hover:text-white text-xs font-semibold">EN / <span className="text-white">CN</span></button>
              <button 
                onClick={handleExplorePlatform}
                className="bg-white/10 hover:bg-accent hover:text-black border border-white/20 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 backdrop-blur-sm group"
              >
                进入平台 <i className="fas fa-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button ref={mobileMenuBtnRef} id="mobile-menu-btn" className="text-white hover:text-accent focus:outline-none">
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Panel */}
        <div ref={mobileMenuRef} className="md:hidden hidden bg-deep/95 backdrop-blur-xl absolute w-full border-b border-white/10" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#about" className="block hover:bg-white/5 px-3 py-2 rounded-md text-base font-medium">关于我们</a>
            <a href="#culture" className="block hover:bg-white/5 px-3 py-2 rounded-md text-base font-medium">企业文化</a>
            <button 
              onClick={handleExplorePlatform}
              className="block text-accent px-3 py-2 font-bold mt-4"
            >
              进入实验室平台 &rarr;
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 text-center max-w-5xl px-4 fade-in-section">
          <div className="inline-block px-3 py-1 mb-6 border border-accent/30 rounded-full bg-accent/5 backdrop-blur-sm">
            <span className="text-accent text-xs tracking-widest uppercase">AI × Intangible Cultural Heritage</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">传承天津文脉</span>
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-purpleAccent glow-text">AI 点亮创新</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300 font-light leading-relaxed">
            连接传统与未来的数字共创生态。津脉智坊致力于通过人工智能技术，
            为老字号品牌注入新生，构建非遗文化的赛博新纪元。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleExplorePlatform}
              className="relative px-8 py-4 bg-accent text-black font-bold rounded-full overflow-hidden group transition-all hover:shadow-[0_0_40px_rgba(0,240,255,0.4)] cursor-pointer inline-block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black"
            >
              <span className="relative z-10 flex items-center justify-center">
                立即探索平台
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
            <a href="#culture" className="px-8 py-4 rounded-full border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all text-gray-300 hover:text-white">
              了解企业使命
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <i className="fas fa-chevron-down text-gray-500"></i>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="fade-in-section">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">关于<span className="text-accent">津脉智坊</span></h2>
              <div className="w-20 h-1 bg-gradient-to-r from-accent to-transparent mb-8"></div>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                津脉智坊（Jinmai Lab）是植根于天津的先锋科技文化企业。我们不只是一个展示平台，更是一座连接过去与未来的桥梁。
              </p>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                面对数字化浪潮，我们思考如何让“狗不理”、“达仁堂”这些百年符号在Z世代心中重生。通过自研的AI生成算法与NEBULA FLOW粒子交互技术，我们将传统纹样、口味、历史转化为可感知的数字艺术，赋能品牌年轻化转型。
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-bold text-xl mb-1">使命</h3>
                  <p className="text-sm text-gray-500">用AI复兴城市文化记忆</p>
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-1">愿景</h3>
                  <p className="text-sm text-gray-500">打造全球最大的非遗数字资产库</p>
                </div>
              </div>
            </div>
            {/* Visual Decoration (Abstract Code/Art) */}
            <div className="relative fade-in-section delay-200">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purpleAccent rounded-2xl blur opacity-30"></div>
              <div className="relative glass-card rounded-2xl p-8 h-[400px] flex items-center justify-center overflow-hidden">
                <div className="text-center">
                  <i className="fas fa-network-wired text-6xl text-white/20 mb-4 animate-pulse"></i>
                  <div className="text-4xl font-bold text-white mb-2">AI × TIANJIN</div>
                  <div className="text-sm text-gray-500 tracking-widest">DIGITAL HERITAGE LAB</div>
                  
                  {/* Animated lines decoration */}
                  <div className="mt-8 flex justify-center gap-2">
                    <div className="w-1 h-12 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1 h-20 bg-purpleAccent/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-16 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section id="culture" className="py-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-900/10 blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 fade-in-section">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">文化与精神</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">以天津为原点，以技术为半径，绘制文化创新的无限可能</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="glass-card p-8 rounded-2xl fade-in-section">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-6 text-accent">
                <i className="fas fa-landmark text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">非遗溯源</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                深入挖掘“泥人张”的色彩逻辑与“风筝魏”的结构美学。我们将非遗技艺解构为数据模型，建立数字化基因库，确保传承的严谨性与纯正度。
              </p>
              <div className="h-32 bg-black/40 rounded-lg relative overflow-hidden group">
                   {/* Abstract representation of Clay Figurine */}
                   <div className="absolute inset-0 flex items-center justify-center text-gray-700 group-hover:text-accent transition-colors">
                    <i className="fas fa-palette text-4xl"></i>
                   </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card p-8 rounded-2xl fade-in-section" style={{ transitionDelay: '100ms' }}>
              <div className="w-14 h-14 rounded-full bg-purpleAccent/10 flex items-center justify-center mb-6 text-purpleAccent">
                <i className="fas fa-brain text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">AI 共创</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                打破传统边界。利用 Generative Art 技术，让“十八街麻花”的纹理变成流动的星云。我们鼓励创作者使用我们的 AI 工具，重新定义国潮视觉。
              </p>
              <div className="h-32 bg-black/40 rounded-lg relative overflow-hidden group">
                {/* Abstract representation of AI processing */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-700 group-hover:text-purpleAccent transition-colors">
                   <i className="fas fa-wave-square text-4xl"></i>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-card p-8 rounded-2xl fade-in-section" style={{ transitionDelay: '200ms' }}>
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-6 text-white">
                <i className="fas fa-users text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">开源社区</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                文化不应被束之高阁。津脉智坊汇聚了全球 12,000+ 设计师与开发者。我们开放部分数据集，旨在构建一个开放、共享的非遗元宇宙生态。
              </p>
              <div className="h-32 bg-black/40 rounded-lg relative overflow-hidden group">
                {/* Abstract representation of Community */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-700 group-hover:text-white transition-colors">
                   <i className="fas fa-globe-asia text-4xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section id="achievements" className="py-20 border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center fade-in-section">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 counter" data-target="12536">0</div>
              <div className="text-sm text-accent mt-2 tracking-widest uppercase">活跃创作者</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 counter" data-target="86">0</div>
              <div className="text-sm text-purpleAccent mt-2 tracking-widest uppercase">合作品牌</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 counter" data-target="3400">0</div>
              <div className="text-sm text-blue-400 mt-2 tracking-widest uppercase">AI 生成作品</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 counter" data-target="100">0</div>
              <div className="text-sm text-gray-400 mt-2 tracking-widest uppercase">非遗数字化率%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <section className="py-24 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none"></div>
        <div className="text-center px-4 fade-in-section">
          <h2 className="text-4xl font-bold mb-6">准备好体验数字非遗了吗？</h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">探索我们的 NEBULA FLOW 粒子实验，亲手触摸数据化的天津脉搏。</p>
          <button
            onClick={handleExplorePlatform}
            className="inline-block px-10 py-5 bg-white text-black font-bold text-lg rounded-full hover:bg-accent transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.6)]"
          >
            进入 Jinmai Lab 平台
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-black/80 backdrop-blur-md py-12 border-t border-white/10 text-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <span className="text-2xl font-bold text-white block mb-4">津脉<span className="text-accent">智坊</span></span>
              <p className="text-gray-500 max-w-xs">
                天津市 · AI文化创新实验室<br/>
                致力于将中国传统文化推向数字未来。
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider">探索</h4>
              <ul className="space-y-2 text-gray-500">
                <li><a href="#about" className="hover:text-accent transition-colors">关于我们</a></li>
                <li><a href="#culture" className="hover:text-accent transition-colors">企业文化</a></li>
                <li><button onClick={handleExplorePlatform} className="hover:text-accent transition-colors text-left w-full">实验平台</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider">联系</h4>
              <ul className="space-y-2 text-gray-500">
                <li>contact@jinmai-lab.tech</li>
                <li>天津市和平区创新大厦A座</li>
                <li className="flex gap-4 mt-4 text-lg">
                  <a href="#" className="hover:text-accent"><i className="fab fa-weixin"></i></a>
                  <a href="#" className="hover:text-accent"><i className="fab fa-weibo"></i></a>
                  <a href="#" className="hover:text-accent"><i className="fab fa-github"></i></a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between text-gray-600">
            <p>&copy; 2024 Jinmai Lab. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">隐私政策</a>
              <a href="#" className="hover:text-white">服务条款</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;