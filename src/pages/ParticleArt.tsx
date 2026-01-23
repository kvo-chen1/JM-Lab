import React, { useEffect, useRef } from 'react';

export default function ParticleArt() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 设置容器样式
    if (containerRef.current) {
      containerRef.current.style.position = 'relative';
      containerRef.current.style.width = '100%';
      containerRef.current.style.height = '100vh';
      containerRef.current.style.backgroundColor = '#050505';
      containerRef.current.style.margin = '0';
      containerRef.current.style.overflow = 'hidden';
      containerRef.current.style.fontFamily = 'Segoe UI, sans-serif';
      containerRef.current.innerHTML = `
        <!-- 加载遮罩层 -->
        <div id="loading-screen" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500">
          <div class="loader mb-4"></div>
          <h2 class="text-xl font-light tracking-widest text-blue-400">正在初始化神经系统...</h2>
          <p class="text-sm text-gray-500 mt-2">请允许摄像头权限以启用手势控制</p>
        </div>

        <!-- UI 控制层 -->
        <div class="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-6 overflow-hidden">
            
          <!-- 顶部 HUD 栏 -->
          <div class="pointer-events-auto flex justify-between items-start w-full">
              <!-- 左上角标题与状态 -->
              <div class="bg-black/20 backdrop-blur-md p-4 rounded-br-2xl border-l-4 border-b border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)] transform transition-all hover:bg-black/40">
                  <h1 class="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] font-sans italic">
                      星云 <span class="text-white text-2xl not-italic font-light">系统</span>
                  </h1>
                  <div class="flex items-center gap-3 mt-2">
                      <div class="relative">
                          <div id="status-dot" class="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
                          <div id="status-ping" class="absolute top-0 left-0 w-full h-full rounded-full bg-red-500 animate-ping opacity-75 hidden"></div>
                      </div>
                      <span id="status-text" class="text-[10px] text-cyan-300 uppercase tracking-[0.2em] font-mono">系统离线</span>
                  </div>
                  <div class="mt-2 h-px w-full bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                  <div class="flex justify-between items-end mt-2 font-mono text-xs">
                    <span class="text-gray-400">缩放倍率</span>
                    <span id="scale-readout" class="text-cyan-400 font-bold text-lg">1.00</span>
                  </div>
              </div>

              <!-- 右上角控制面板 -->
              <div class="flex flex-col gap-3 pointer-events-auto w-72">
                  <div class="bg-black/30 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 hover:border-cyan-500/30 group relative overflow-hidden">
                    <!-- 装饰背景 -->
                    <div class="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <!-- 粒子形状选择器 -->
                    <div class="mb-4">
                        <label class="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2 block flex justify-between">
                            <span>核心形态</span>
                            <i class="fas fa-cube text-cyan-500"></i>
                        </label>
                        <div class="relative">
                            <select id="shape-selector" class="w-full bg-black/50 text-cyan-100 text-xs py-2 pl-3 pr-8 rounded-lg cursor-pointer border border-white/10 hover:border-cyan-500/50 focus:border-cyan-500 focus:outline-none transition-colors appearance-none font-mono">
                                <option value="galaxy">🌌 星系漩涡</option>
                                <option value="shibajie_mahua">🥨 十八街麻花</option>
                                <option value="goubuli_baozi">🥟 狗不理包子</option>
                                <option value="eryeyan_zhagao">💎 耳朵眼炸糕</option>
                                <option value="darentang">💊 达仁堂制药</option>
                                <option value="yangliuqing">🖼️ 杨柳青年画</option>
                                <option value="kite">🪁 风筝魏</option>
                                <option value="clay_figure">🗿 泥人张彩塑</option>
                            </select>
                            <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-cyan-500">
                                <i class="fas fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 滑块控制组 -->
                    <div class="space-y-4 mb-4">
                        <!-- 辉光强度 -->
                        <div>
                            <div class="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                                <span>光晕强度</span>
                                <span id="bloom-val" class="text-cyan-300">1.5</span>
                            </div>
                            <input type="range" id="bloom-slider" min="0" max="3" step="0.1" value="1.5" 
                                class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400">
                        </div>
                        
                        <!-- 旋转速度 -->
                        <div>
                            <div class="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                                <span>旋转速率</span>
                                <span id="speed-val" class="text-purple-300">1.0</span>
                            </div>
                            <input type="range" id="speed-slider" min="0" max="3" step="0.1" value="1.0" 
                                class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400">
                        </div>
                    </div>

                    <!-- 颜色选择器 -->
                    <div class="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
                        <span class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Particle Hue</span>
                        <div class="relative group/color">
                            <input type="color" id="color-picker" value="#00ffff" class="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10">
                            <div id="color-preview" class="w-8 h-8 rounded-full bg-[#00ffff] border-2 border-white/20 shadow-[0_0_10px_rgba(0,255,255,0.3)] group-hover/color:scale-110 transition-transform"></div>
                        </div>
                    </div>

                    <!-- 彩虹模式开关 -->
                    <div class="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
                        <span class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Rainbow Flow</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="rainbow-toggle" class="sr-only peer">
                            <div class="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:via-pink-500 peer-checked:to-yellow-500"></div>
                        </label>
                    </div>
                  </div>

                  <!-- Gemini LLM 功能按钮 -->
                  <button id="generate-report-btn" class="group relative overflow-hidden flex items-center justify-center w-full py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 rounded-xl text-xs transition-all border border-purple-500/30 text-cyan-100 font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                      <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                      <i class="fas fa-brain mr-2 text-purple-400 group-hover:text-purple-300 transition-colors"></i> 
                      <span>智能分析</span>
                  </button>
              </div>
          </div>

          <!-- 底部控制栏 -->
          <div class="pointer-events-auto flex justify-between items-end w-full">
            <!-- 摄像头预览 -->
            <div class="relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-30 group-hover:opacity-70 blur transition duration-500"></div>
                <div class="relative bg-black rounded-xl overflow-hidden border border-white/10">
                    <video id="input-video" class="w-32 h-24 object-cover hidden"></video>
                    <canvas id="camera-preview" class="w-48 h-36 bg-black/80"></canvas>
                    <div class="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-sm px-2 py-1 flex justify-between items-center">
                        <span class="text-[10px] text-cyan-500 font-mono tracking-wider">视觉传感器</span>
                        <div class="flex gap-1">
                            <div class="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
                            <div class="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-75"></div>
                            <div class="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 全屏按钮 -->
            <button id="fullscreen-btn" class="mb-2 mr-2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 border border-white/10 text-white transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <i class="fas fa-expand"></i>
            </button>
          </div>
        </div>

        <!-- WebGL 画布 -->
        <canvas id="webgl-canvas" class="block w-full h-full"></canvas>

        <!-- 异常报告模态窗口 -->
        <div id="report-modal" class="hidden fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div id="report-content" class="anomaly-modal p-8 w-full max-w-xl rounded-xl text-sm transition-transform duration-300">
              <h3 class="text-xl font-bold mb-4 border-b border-blue-400/50 pb-2 flex justify-between items-center text-blue-300">
                  <i class="fas fa-exclamation-triangle mr-2"></i> 分析报告
              </h3>
              <div id="report-output" class="space-y-4">
                  <p class="text-gray-400 text-center"><i class="fas fa-circle-notch fa-spin mr-2"></i> 正在分析数据流...</p>
              </div>
              <button id="close-report-btn" class="mt-6 w-full py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-300 text-xs font-bold uppercase border border-red-500/30">
                  关闭
              </button>
          </div>
        </div>
      `;
    }

    // 加载外部样式
    const loadStyles = () => {
      // 加载Tailwind CSS
      const tailwindLink = document.createElement('link');
      tailwindLink.href = 'https://cdn.tailwindcss.com';
      tailwindLink.rel = 'stylesheet';
      document.head.appendChild(tailwindLink);

      // 加载Font Awesome
      const faLink = document.createElement('link');
      faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      faLink.rel = 'stylesheet';
      document.head.appendChild(faLink);

      // 添加自定义样式
      const style = document.createElement('style');
      style.textContent = `
        /* 摄像头预览窗口样式 */
        #camera-preview {
          transform: scaleX(-1); /* 镜像翻转，使手势更自然 */
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        /* 自定义颜色选择器样式 */
        input[type="color"] {
          -webkit-appearance: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
        }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; }

        /* 下拉选择器样式 */
        #shape-selector {
          appearance: none; /* 移除默认样式 */
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239CA3AF'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          padding-right: 2rem;
        }

        /* 加载动画 */
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* 模态窗口样式 - 突出科幻感 */
        .anomaly-modal {
          background-color: rgba(10, 25, 45, 0.9);
          border: 2px solid #3b82f6;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
        }
        /* 威胁等级颜色定义 */
        .threat-critical { color: #f87171; }
        .threat-high { color: #fbbf24; }
        .threat-medium { color: #34d399; }
        .threat-low { color: #60a5fa; }
      `;
      document.head.appendChild(style);
    };

    // 加载所需的外部库
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // 初始化函数
    const init = async () => {
      try {
        // 加载样式
        loadStyles();
        
        // 加载Three.js
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        
        // 加载MediaPipe相关库
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
        ]);
        
        // 加载本地粒子系统脚本
        await loadScript('/particle-system.js');
      } catch (error) {
        console.error('Failed to load libraries:', error);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.innerHTML = `
            <div class="text-red-500 text-2xl mb-4">⚠️</div>
            <h2 class="text-xl font-light tracking-widest text-red-400">加载失败</h2>
            <p class="text-sm text-gray-500 mt-2">无法加载必要的库文件，请检查网络连接</p>
          `;
        }
      }
    };

    // 调用初始化函数
    init();

    // 清理函数
    return () => {
      // 移除动态添加的样式和链接
      const links = document.querySelectorAll('link');
      links.forEach(link => {
        if (link.href.includes('tailwindcss.com') || link.href.includes('font-awesome')) {
          link.remove();
        }
      });
      
      const styles = document.querySelectorAll('style');
      styles.forEach(style => {
        if (style.textContent && style.textContent.includes('摄像头预览窗口样式')) {
          style.remove();
        }
      });
    };
  }, []);

  return <div ref={containerRef} className="w-full h-screen"></div>;
}
