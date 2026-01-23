// 粒子系统的主要逻辑
const state = {
  targetScale: 1.0,
  currentScale: 1.0,
  baseColor: new THREE.Color(0x00ffff),
  handsDetected: false,
  isLoaded: false,
  bloomStrength: 1.5,
  rotationSpeed: 1.0,
  mouseX: 0,
  mouseY: 0,
  isRainbowMode: false, // 新增：彩虹流光模式
  shockwave: 0.0 // 新增：冲击波强度
};

// 粒子系统相关全局变量
let particlesMesh;
let coreMesh;
let backgroundStars;
let material;
let currentShape = 'galaxy';

// 物理模拟相关数据 (CPU端计算)
let originalPositions; // 存储粒子原始位置
let velocities; // 存储粒子速度

// 交互相关
const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2();
const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Z=0 平面

// 后处理全局变量
let composer;
let bloomPass;

// 颜色主题配置 
const COLOR_THEMES = {
    'galaxy': { hex: '#00ffff', name: '宇宙青色' }, 
    'kite': { hex: '#ff4500', name: '烈焰红' },
    'shibajie_mahua': { hex: '#ffcc00', name: '金黄焦糖' },
    'clay_figure': { hex: '#a0522d', name: '陶土棕' },
    'goubuli_baozi': { hex: '#ccffcc', name: '嫩绿蒸汽' },
    'yangliuqing': { hex: '#4169e1', name: '宝蓝色' },
    'eryeyan_zhagao': { hex: '#ffc72c', name: '金黄琥珀' },
    'darentang': { hex: '#8b0000', name: '古朴朱红' }
};

// 形状配置常量
const SHAPE_CONFIG = {
    particlesCount: 12000, 
    size: 50
};

// DOM 元素
const canvas = document.getElementById('webgl-canvas');
const videoElement = document.getElementById('input-video');
const previewCanvas = document.getElementById('camera-preview');
const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;
const loadingScreen = document.getElementById('loading-screen');
const statusDot = document.getElementById('status-dot');
const statusPing = document.getElementById('status-ping');
const statusText = document.getElementById('status-text');
const scaleReadout = document.getElementById('scale-readout');
const shapeSelector = document.getElementById('shape-selector');
const colorPicker = document.getElementById('color-picker');
const colorPreview = document.getElementById('color-preview');
const generateReportBtn = document.getElementById('generate-report-btn');
const reportModal = document.getElementById('report-modal');
const closeReportBtn = document.getElementById('close-report-btn');
const reportContent = document.getElementById('report-content');
const reportOutput = document.getElementById('report-output');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const bloomSlider = document.getElementById('bloom-slider');
const bloomVal = document.getElementById('bloom-val');
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
// 新增 DOM 元素引用 (稍后在 HTML 中添加)
const rainbowToggle = document.getElementById('rainbow-toggle'); 
const snapshotBtn = document.getElementById('snapshot-btn');

// 检查必要的元素是否存在
if (!canvas || !previewCtx) {
  console.error('粒子系统初始化失败：缺少必要的DOM元素');
  if (loadingScreen) {
    loadingScreen.innerHTML = `
      <div class="text-red-500 text-2xl mb-4">⚠️</div>
      <h2 class="text-xl font-light tracking-widest text-red-400">初始化失败</h2>
      <p class="text-sm text-gray-500 mt-2">缺少必要的DOM元素，请检查页面结构</p>
    `;
  }
  throw new Error('粒子系统初始化失败：缺少必要的DOM元素');
}

/**
 * Three.js 场景初始化
 */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.001); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true, 
    alpha: true,
    preserveDrawingBuffer: true // 允许截图
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;

/**
 * 后处理初始化 (Post-Processing)
 */
function initPostProcessing() {
    const renderScene = new THREE.RenderPass(scene, camera);

    bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 
        1.5, 
        0.4, 
        0.85
    );
    bloomPass.threshold = 0.2;
    bloomPass.strength = state.bloomStrength;
    bloomPass.radius = 0.5;

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
}

try {
    initPostProcessing();
} catch (e) {
    console.warn("Post-processing failed to initialize, falling back to standard renderer:", e);
    composer = null;
}

/**
 * 创建背景星空
 */
function createBackgroundStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const posArray = new Float32Array(starsCount * 3);
    const sizeArray = new Float32Array(starsCount);

    for(let i = 0; i < starsCount * 3; i+=3) {
        posArray[i] = (Math.random() - 0.5) * 200; 
        posArray[i+1] = (Math.random() - 0.5) * 200; 
        posArray[i+2] = (Math.random() - 0.5) * 100 - 50; 
        
        sizeArray[i/3] = Math.random() * 0.5;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });

    backgroundStars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(backgroundStars);
}

createBackgroundStars();

/**
 * 粒子形状生成函数
 */
function createParticleGeometry(shape) {
    const particlesCount = SHAPE_CONFIG.particlesCount;
    const posArray = new Float32Array(particlesCount * 3);
    const randomArray = new Float32Array(particlesCount);
    const colorArray = new Float32Array(particlesCount * 3);
    
    // 初始化物理数组
    originalPositions = new Float32Array(particlesCount * 3);
    velocities = new Float32Array(particlesCount * 3);
    
    const baseColorObj = new THREE.Color(state.baseColor);

    for(let i = 0; i < particlesCount; i++) {
        const index = i * 3;
        let x = 0, y = 0, z = 0;
        
        // --- 形状生成逻辑 (保持原有逻辑) ---
        if (shape === 'kite') {
            const scale = 15;
            const r = Math.random();
            const kiteThickness = 2.0;
            if (r < 0.15) { x = (Math.random()-0.5)*1; y = (Math.random()-0.5)*scale*1.5; z = (Math.random()-0.5)*kiteThickness; }
            else if (r < 0.3) { x = (Math.random()-0.5)*scale*2; y = (Math.random()-0.5)*1; z = (Math.random()-0.5)*kiteThickness; }
            else { x = (Math.random()-0.5)*scale*2; y = (Math.random()-0.5)*scale*1.5; z = (Math.random()-0.5)*kiteThickness; 
                if (Math.abs(x)/(scale*1.0) + Math.abs(y)/(scale*0.75) > 1.0) { x*=0.5; y*=0.5; } }
        } else if (shape === 'shibajie_mahua') {
            const R = 8; const r_cross = 2; const twist = 3; const t = Math.random() * Math.PI * 4; const u = Math.random() * Math.PI * 2;
            const base_x = R * Math.cos(t); const base_y = R * Math.sin(t); const base_z = t * 2; const twisted_u = u + t * twist * 0.1;
            x = base_x + r_cross * Math.cos(twisted_u); y = base_y + r_cross * Math.sin(twisted_u); z = base_z - 15;
        } else if (shape === 'clay_figure') {
            const radius = 12; const r = Math.pow(Math.random(), 1/3) * radius; const u = Math.random() * 2 * Math.PI; const v = Math.acos(Math.random() * 2 - 1);
            x = r * Math.sin(v) * Math.cos(u) * 0.8; y = r * Math.cos(v) * 1.5; z = r * Math.sin(v) * Math.sin(u) * 0.8; y = y - 5;
        } else if (shape === 'goubuli_baozi') {
            const radius = 10; const r = Math.pow(Math.random(), 1/3) * radius; const u = Math.random() * Math.PI * 2; let v = Math.acos(Math.random() * 2 - 1);
            if (Math.random() < 0.6) v = Math.acos(Math.random() * 0.5 + 0.5);
            x = r * Math.sin(v) * Math.cos(u); y = r * Math.sin(v) * Math.sin(u); z = r * Math.cos(v); if (z > 0) z *= 1.1;
        } else if (shape === 'yangliuqing') {
            const width = 20; const height = 15; const thickness = 4;
            x = (Math.random() - 0.5) * width; y = (Math.random() - 0.5) * height; z = (Math.random() - 0.5) * thickness;
        } else if (shape === 'eryeyan_zhagao') {
            const radius = 10; const r = Math.pow(Math.random(), 1/3) * radius; const u = Math.random() * 2 * Math.PI; const v = Math.acos(Math.random() * 2 - 1);
            x = r * Math.sin(v) * Math.cos(u); y = r * Math.cos(v) * 0.6; z = r * Math.sin(v) * Math.sin(u);
        } else if (shape === 'darentang') {
            const radius = 8; const r = Math.pow(Math.random(), 1/3) * radius; const u = Math.random() * 2 * Math.PI; const v = Math.acos(Math.random() * 2 - 1);
            x = r * Math.sin(v) * Math.cos(u); y = r * Math.cos(v); z = r * Math.sin(v) * Math.sin(u);
        } else {
            const distance = Math.pow(Math.random(), 3) * 25 + 5; const angle = Math.random() * Math.PI * 2; const armOffset = (Math.random() - 0.5) * 5;
            x = distance * Math.cos(angle) + armOffset; y = (Math.random() - 0.5) * 5; z = distance * Math.sin(angle);
            const spiralAngle = angle * 2; x += Math.cos(spiralAngle) * 2; z += Math.sin(spiralAngle) * 2;
        }
        // -----------------------

        posArray[index] = x;
        posArray[index + 1] = y;
        posArray[index + 2] = z;
        
        // 存储原始位置
        originalPositions[index] = x;
        originalPositions[index + 1] = y;
        originalPositions[index + 2] = z;
        
        // 初始化速度为0
        velocities[index] = 0;
        velocities[index + 1] = 0;
        velocities[index + 2] = 0;

        randomArray[i] = Math.random();

        const mixedColor = baseColorObj.clone();
        mixedColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
        colorArray[index] = mixedColor.r;
        colorArray[index+1] = mixedColor.g;
        colorArray[index+2] = mixedColor.b;
    }

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    newGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));
    newGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    return newGeometry;
}

function initializeParticles(shapeName) {
    if (particlesMesh) {
        scene.remove(particlesMesh);
        particlesMesh.geometry.dispose();
    }
    if (coreMesh) {
        scene.remove(coreMesh);
        coreMesh.geometry.dispose();
    }
    
    currentShape = shapeName;

    const theme = COLOR_THEMES[shapeName] || COLOR_THEMES['galaxy'];
    const newColor = new THREE.Color(theme.hex);
    state.baseColor.set(newColor);
    colorPicker.value = theme.hex;
    if (colorPreview) colorPreview.style.backgroundColor = theme.hex;
    
    const newGeometry = createParticleGeometry(shapeName);
    
    if (!material) {
        const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
        material = new THREE.PointsMaterial({
            size: 0.25,
            map: sprite,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.8
        });
    }

    particlesMesh = new THREE.Points(newGeometry, material);
    scene.add(particlesMesh);

    // 核心光球
    const coreRadius = (shapeName === 'galaxy' || shapeName === 'goubuli_baozi') ? 1 : (shapeName === 'darentang' ? 0.8 : 0.2);
    const coreMaterial = new THREE.MeshBasicMaterial({ 
        color: newColor,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const coreGeometry = new THREE.SphereGeometry(coreRadius, 32, 32);
    coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);
    
    // 相机位置调整 (保持原有逻辑)
    if (shapeName === 'shibajie_mahua') { camera.position.set(0, 0, 45); camera.rotation.x = 0; }
    else if (shapeName === 'kite') { camera.position.set(0, 0, 35); camera.rotation.x = -0.3; }
    else if (shapeName === 'yangliuqing') { camera.position.set(0, 0, 30); camera.rotation.x = -0.5; }
    else if (shapeName === 'eryeyan_zhagao') { camera.position.set(0, 0, 30); camera.rotation.x = -0.1; }
    else if (shapeName === 'darentang') { camera.position.set(0, 0, 25); camera.rotation.x = 0; }
    else { camera.position.set(0, 0, 30); camera.rotation.x = 0; }
    
    state.targetScale = 1.0;
    state.currentScale = 1.0;
    camera.fov = 75;
    camera.updateProjectionMatrix();
    particlesMesh.rotation.set(0, 0, 0);
}

// 初始化粒子系统
initializeParticles('galaxy');

/**
 * MediaPipe Hands 初始化与逻辑 (保持不变)
 */
function onResults(results) {
    previewCtx.save();
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(results.image, 0, 0, previewCanvas.width, previewCanvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        state.handsDetected = true;
        updateStatus(true);
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(previewCtx, landmarks, HAND_CONNECTIONS, {color: '#00ffff', lineWidth: 1});
            drawLandmarks(previewCtx, landmarks, {color: '#ff00ff', lineWidth: 1, radius: 2});
        }
        let newScale = 1.0;
        if (results.multiHandLandmarks.length === 2) {
            const hand1 = results.multiHandLandmarks[0][9]; const hand2 = results.multiHandLandmarks[1][9];
            const distance = Math.sqrt(Math.pow(hand1.x - hand2.x, 2) + Math.pow(hand1.y - hand2.y, 2));
            newScale = Math.max(0.5, Math.min(distance * 4, 5.0));
        } else if (results.multiHandLandmarks.length === 1) {
            const landmarks = results.multiHandLandmarks[0]; const thumbTip = landmarks[4]; const indexTip = landmarks[8];
            const pinchDistance = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2));
            newScale = Math.max(0.5, Math.min(3.0 - pinchDistance * 3.5, 3.0));
        }
        state.targetScale = newScale;
    } else {
        state.handsDetected = false;
        updateStatus(false);
        state.targetScale = 1.0 + Math.sin(Date.now() * 0.001) * 0.05;
    }
    previewCtx.restore();
}

const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
hands.onResults(onResults);
const cameraUtils = new Camera(videoElement, { onFrame: async () => { await hands.send({image: videoElement}); }, width: 640, height: 480 });
cameraUtils.start().then(() => { loadingScreen.classList.add('opacity-0'); setTimeout(() => loadingScreen.remove(), 500); }).catch(err => { console.error("Camera error:", err); statusText.innerText = "SENSOR ERROR"; statusDot.classList.replace('bg-red-500', 'bg-gray-500'); statusPing.classList.add('hidden'); loadingScreen.classList.add('opacity-0'); setTimeout(() => loadingScreen.remove(), 500); });

/**
 * 动画循环 (核心物理逻辑)
 */
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    // 限制 deltaTime 防止卡顿时物理爆炸
    const deltaTime = Math.min(clock.getDelta(), 0.05);

    // 平滑更新尺度
    state.currentScale += (state.targetScale - state.currentScale) * 0.08;

    // 鼠标射线检测 - 获取鼠标在世界空间的射线
    mouseVector.set((state.mouseX * 2) - 1, -(state.mouseY * 2) + 1);
    raycaster.setFromCamera(mouseVector, camera);
    
    // 计算鼠标在 Z=0 平面的位置 (假设粒子中心大致在原点)
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(interactionPlane, intersectPoint);

    // 如果没有交点（鼠标移出屏幕），设为很远
    if (!intersectPoint) intersectPoint.set(1000, 1000, 1000);

    // 将冲击波衰减
    if (state.shockwave > 0) {
        state.shockwave -= deltaTime * 3.0; // 衰减速度
        if (state.shockwave < 0) state.shockwave = 0;
    }

    if (particlesMesh) {
        const positions = particlesMesh.geometry.attributes.position.array;
        const colors = particlesMesh.geometry.attributes.color.array;
        const count = SHAPE_CONFIG.particlesCount;
        
        // 旋转容器
        const rotSpeed = state.rotationSpeed;
        if (currentShape === 'shibajie_mahua') {
            particlesMesh.rotation.y = elapsedTime * 0.15 * rotSpeed;
            particlesMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2;
        } else {
            particlesMesh.rotation.y = elapsedTime * 0.05 * rotSpeed;
        }

        // 逆向计算鼠标在局部坐标系的位置 (抵消容器旋转)
        const localMouse = intersectPoint.clone();
        localMouse.applyMatrix4(particlesMesh.matrixWorld.clone().invert());

        // 粒子物理循环
        for(let i = 0; i < count; i++) {
            const px = positions[i*3];
            const py = positions[i*3+1];
            const pz = positions[i*3+2];

            const ox = originalPositions[i*3];
            const oy = originalPositions[i*3+1];
            const oz = originalPositions[i*3+2];

            let vx = velocities[i*3];
            let vy = velocities[i*3+1];
            let vz = velocities[i*3+2];

            // 1. 弹性复位力 (Spring force back to original position)
            // F = -k * displacement
            const k = 2.0; 
            vx += (ox - px) * k * deltaTime;
            vy += (oy - py) * k * deltaTime;
            vz += (oz - pz) * k * deltaTime;

            // 2. 鼠标扰动力 (Mouse repulsion/attraction)
            const dx = px - localMouse.x;
            const dy = py - localMouse.y;
            const dz = pz - localMouse.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            
            // 扰动半径
            if (distSq < 100) { 
                const dist = Math.sqrt(distSq);
                const force = (10 - dist) * 20.0; // 斥力强度
                if (dist > 0.1) {
                    vx += (dx / dist) * force * deltaTime;
                    vy += (dy / dist) * force * deltaTime;
                    vz += (dz / dist) * force * deltaTime;
                }
            }

            // 3. 冲击波 (Shockwave)
            if (state.shockwave > 0.1) {
                // 简单的球形爆炸：所有粒子向外飞
                // 或者基于每个粒子离中心的距离
                const shockDirX = px; // 假设中心是0,0,0
                const shockDirY = py;
                const shockDirZ = pz;
                const shockDist = Math.sqrt(shockDirX*shockDirX + shockDirY*shockDirY + shockDirZ*shockDirZ);
                
                if (shockDist > 0.1) {
                    const shockForce = state.shockwave * 50.0 * (1.0 / (shockDist + 0.1));
                    vx += (shockDirX / shockDist) * shockForce * deltaTime;
                    vy += (shockDirY / shockDist) * shockForce * deltaTime;
                    vz += (shockDirZ / shockDist) * shockForce * deltaTime;
                }
            }

            // 4. 阻尼 (Damping) - 防止无限震荡
            vx *= 0.90;
            vy *= 0.90;
            vz *= 0.90;

            // 更新位置
            positions[i*3] = px + vx * deltaTime;
            positions[i*3+1] = py + vy * deltaTime;
            positions[i*3+2] = pz + vz * deltaTime;

            // 更新速度缓存
            velocities[i*3] = vx;
            velocities[i*3+1] = vy;
            velocities[i*3+2] = vz;

            // 5. 彩虹流光模式 (Rainbow Flow)
            if (state.isRainbowMode) {
                const hue = (elapsedTime * 0.1 + px * 0.05) % 1.0;
                const color = new THREE.Color().setHSL(hue, 1.0, 0.6);
                colors[i*3] = color.r;
                colors[i*3+1] = color.g;
                colors[i*3+2] = color.b;
            } else {
                // 如果不是彩虹模式，且颜色被修改过，需要慢慢恢复到基准色吗？
                // 简化起见，我们暂不自动恢复，切换回单色时会由 initializeParticles 重置，
                // 或者在这里加一个恢复逻辑。为了性能，仅在切换瞬间重置比较好。
                // 这里为了简单，如果关闭彩虹模式，我们在下一帧统一重置颜色比较好，
                // 但为了避免在 animate 中做复杂的“状态切换检测”，我们让 UI 触发重置。
            }
        }

        particlesMesh.geometry.attributes.position.needsUpdate = true;
        if (state.isRainbowMode) {
            particlesMesh.geometry.attributes.color.needsUpdate = true;
        }
        
        // 应用整体缩放
        particlesMesh.scale.setScalar(state.currentScale);
    }
    
    // 材质透明度与大小更新
    if (material) {
        const scaleFactor = state.currentScale;
        material.size = 0.25 * (1 + (scaleFactor - 1) * 0.2); 
        material.opacity = Math.min(1.0, 0.5 + Math.max(0, (scaleFactor - 1.0)) * 1.0);
    }

    if (coreMesh && coreMesh.material) {
        coreMesh.material.opacity = Math.min(1.0, 0.3 + (state.currentScale - 1.0) * 1.0);
        coreMesh.scale.setScalar(state.currentScale * 0.8 * (1 + state.shockwave)); // 核心随冲击波膨胀
    }
    
    if (backgroundStars) {
        backgroundStars.rotation.y = elapsedTime * 0.01;
        backgroundStars.rotation.z = elapsedTime * 0.005;
    }

    const maxFovShift = 30;
    const fovInfluence = Math.pow(Math.max(0, state.currentScale - 1.0), 2);
    const targetFov = 75 + fovInfluence * maxFovShift + state.shockwave * 10; // 冲击波影响FOV
    camera.fov += (targetFov - camera.fov) * 0.1;
    camera.updateProjectionMatrix();
    
    scaleReadout.innerText = state.currentScale.toFixed(2);

    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

animate();

/**
 * LLM 异常报告生成器功能 (保持不变)
 */
function getCurrentHexColor() { return `#${state.baseColor.getHexString()}`; }
const apiKey = ""; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
async function fetchWithRetry(url, options, maxRetries = 5) { /*...*/ return fetch(url, options).then(res => res.json()); } // 简化占位，实际逻辑保持原样
// ... (generateAnomalyReport 保持不变，为节省篇幅省略，实际写入时请保留) ...
async function generateAnomalyReport() {
    // 重新复制之前的完整逻辑，防止覆盖
    generateReportBtn.disabled = true;
    generateReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> ANALYZING...';
    reportOutput.innerHTML = '<p class="text-cyan-400 text-center font-mono text-xs"><i class="fas fa-circle-notch fa-spin mr-2"></i> CONNECTING TO NEBULA CORE...</p>';
    reportModal.classList.remove('hidden');

    const scaleFactor = state.currentScale.toFixed(2);
    const colorHex = getCurrentHexColor();
    const shapeNameCn = shapeSelector.options[shapeSelector.selectedIndex].text;
    const systemInstruction = "你是一位专业的星际分析员，专注于编写简洁、正式、具有科幻风格的异常报告。你的报告必须基于提供的参数并严格遵守给定的JSON格式。";
    let scaleType;
    if (scaleFactor > 2.0) scaleType = "CRITICAL MASS (极度膨胀)";
    else if (scaleFactor > 1.2) scaleType = "UNSTABLE GROWTH (快速膨胀)";
    else if (scaleFactor < 0.7) scaleType = "IMPLOSION RISK (引力坍缩)";
    else scaleType = "STABLE (系统稳定)";

    const userQuery = `分析当前粒子系统的状态并生成异常报告。当前粒子形态: ${shapeNameCn}。当前尺度因子: ${scaleFactor}。粒子主要颜色: ${colorHex}。尺度类型: ${scaleType}。请根据这些参数，创建一个异常标题、一个不超过60字的中文描述，并确认威胁等级。`;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "anomaly_title_cn": { "type": "STRING", "description": "富有科幻感的中文异常标题" },
                    "anomaly_title_en": { "type": "STRING", "description": "对应的英文标题" },
                    "threat_level": { "type": "STRING", "description": "威胁等级，必须是：CRITICAL, HIGH, MEDIUM, 或 LOW" },
                    "description_cn": { "type": "STRING", "description": "基于参数的中文报告描述，不超过60字" }
                },
                "propertyOrdering": ["anomaly_title_cn", "anomaly_title_en", "threat_level", "description_cn"]
            }
        }
    };

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const report = JSON.parse(candidate.content.parts[0].text);
            let threatClass;
            switch (report.threat_level.toUpperCase()) {
                case 'CRITICAL': threatClass = 'text-red-500 shadow-[0_0_10px_#ef4444]'; break;
                case 'HIGH': threatClass = 'text-orange-400 shadow-[0_0_10px_#fb923c]'; break;
                case 'MEDIUM': threatClass = 'text-yellow-300'; break;
                case 'LOW': threatClass = 'text-blue-400'; break;
                default: threatClass = 'text-gray-400';
            }
            reportOutput.innerHTML = `
                <div class="space-y-2 font-mono">
                    <p class="text-[10px] text-cyan-500 uppercase tracking-widest">ANOMALY DETECTED</p>
                    <p class="text-xl font-bold text-white tracking-tight">${report.anomaly_title_cn}</p>
                    <p class="text-sm text-cyan-300/60 uppercase tracking-wider">${report.anomaly_title_en}</p>
                </div>
                <div class="grid grid-cols-2 gap-4 border-t border-b border-cyan-900/50 py-4 mt-4 text-xs font-mono bg-cyan-900/10 rounded-lg p-2">
                    <div class="text-gray-400">THREAT LEVEL</div>
                    <div class="${threatClass} font-bold text-right animate-pulse">${report.threat_level.toUpperCase()}</div>
                    <div class="text-gray-400">GEOMETRY</div>
                    <div class="text-cyan-100 text-right truncate">${shapeNameCn.split(' ')[1] || shapeNameCn}</div>
                    <div class="text-gray-400">SCALE FACTOR</div>
                    <div class="text-cyan-100 text-right">${scaleFactor}</div>
                </div>
                <div class="mt-4 relative p-3 border-l-2 border-cyan-500 bg-black/40">
                    <p class="text-[10px] text-gray-500 uppercase mb-1">LOG ENTRY #7734</p>
                    <p class="text-sm text-cyan-100 leading-relaxed">${report.description_cn}</p>
                </div>
            `;
        } else {
            reportOutput.innerHTML = '<p class="text-red-400 text-center"><i class="fas fa-bug mr-2"></i> DATA PARSING FAILED</p>';
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        reportOutput.innerHTML = `<p class="text-red-400 text-center"><i class="fas fa-times-circle mr-2"></i> CONNECTION LOST TO CORE</p>`;
    } finally {
        generateReportBtn.disabled = false;
        generateReportBtn.innerHTML = '<i class="fas fa-brain mr-2"></i> ANALYZE ANOMALY';
    }
}

/**
 * 事件监听与 UI 交互
 */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    if (bloomPass) bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});

// 鼠标交互
document.addEventListener('mousemove', (e) => {
    state.mouseX = e.clientX / window.innerWidth;
    state.mouseY = e.clientY / window.innerHeight;
});

// 点击触发冲击波
document.addEventListener('click', (e) => {
    // 忽略点击 UI 元素的情况
    if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
    
    // 触发冲击波
    state.shockwave = 1.0; // 设为最大，随时间衰减
    
    // 播放音效? (暂不)
});

if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
        state.isRainbowMode = false; // 手动选色时关闭彩虹模式
        if (rainbowToggle) rainbowToggle.checked = false;
        
        const color = new THREE.Color(e.target.value);
        state.baseColor.set(color);
        // 恢复单色
        if (particlesMesh) {
            const colors = particlesMesh.geometry.attributes.color.array;
            for(let i=0; i<SHAPE_CONFIG.particlesCount; i++) {
                const mixedColor = color.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
                colors[i*3] = mixedColor.r;
                colors[i*3+1] = mixedColor.g;
                colors[i*3+2] = mixedColor.b;
            }
            particlesMesh.geometry.attributes.color.needsUpdate = true;
        }
        if (colorPreview) colorPreview.style.backgroundColor = e.target.value;
        if (coreMesh && coreMesh.material) coreMesh.material.color.set(color);
    });
}

if (shapeSelector) {
    shapeSelector.addEventListener('change', (e) => {
        initializeParticles(e.target.value);
    });
}

if (bloomSlider) {
    bloomSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.bloomStrength = val;
        if (bloomPass) bloomPass.strength = val;
        if (bloomVal) bloomVal.innerText = val.toFixed(1);
    });
}

if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.rotationSpeed = val;
        if (speedVal) speedVal.innerText = val.toFixed(1);
    });
}

// 绑定新增的 UI 元素 (需要等 React 渲染完 DOM)
// 由于 script 是在 React useEffect 中加载的，DOM 应该已经存在
const bindExtraControls = () => {
    const rToggle = document.getElementById('rainbow-toggle');
    if (rToggle) {
        rToggle.addEventListener('change', (e) => {
            state.isRainbowMode = e.target.checked;
            if (!state.isRainbowMode) {
                // 关闭时恢复基准色
                const color = state.baseColor;
                if (particlesMesh) {
                    const colors = particlesMesh.geometry.attributes.color.array;
                    for(let i=0; i<SHAPE_CONFIG.particlesCount; i++) {
                        const mixedColor = color.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
                        colors[i*3] = mixedColor.r;
                        colors[i*3+1] = mixedColor.g;
                        colors[i*3+2] = mixedColor.b;
                    }
                    particlesMesh.geometry.attributes.color.needsUpdate = true;
                }
            }
        });
    }

    const sBtn = document.getElementById('snapshot-btn');
    if (sBtn) {
        sBtn.addEventListener('click', () => {
            // 截图逻辑
            renderer.render(scene, camera); // 确保缓冲区有最新的一帧
            // 如果用了 composer，需要 render composer
            if (composer) composer.render();
            
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `nebula-artifact-${Date.now()}.png`;
            link.href = dataURL;
            link.click();
            
            // 简单的闪光反馈
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.backgroundColor = 'white';
            flash.style.opacity = '0.8';
            flash.style.zIndex = '100';
            flash.style.transition = 'opacity 0.5s';
            document.body.appendChild(flash);
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 500);
            }, 50);
        });
    }
};

// 尝试绑定，如果失败则等待
setTimeout(bindExtraControls, 1000);

if (generateReportBtn) {
    generateReportBtn.addEventListener('click', generateAnomalyReport);
}

if (closeReportBtn) {
    closeReportBtn.addEventListener('click', () => {
        reportModal.classList.add('hidden');
    });
}

if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .then(() => {
                    fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                })
                .catch(err => {
                    console.warn("当前环境禁止全屏 API:", err);
                });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                    .then(() => {
                        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                    })
                    .catch(err => console.warn("退出全屏失败:", err));
            }
        }
    });
}

function updateStatus(isDetected) {
    if (isDetected) {
        statusDot.classList.replace('bg-red-500', 'bg-cyan-500');
        statusDot.classList.replace('shadow-[#ef4444]', 'shadow-[#06b6d4]');
        if (statusPing) {
            statusPing.classList.remove('hidden', 'bg-red-500');
            statusPing.classList.add('bg-cyan-500');
        }
        statusText.innerText = "SYSTEM ONLINE";
        statusText.classList.replace('text-red-500', 'text-cyan-300');
    } else {
        statusDot.classList.replace('bg-cyan-500', 'bg-red-500');
        statusDot.classList.replace('shadow-[#06b6d4]', 'shadow-[#ef4444]');
        if (statusPing) {
            statusPing.classList.add('hidden');
            statusPing.classList.remove('bg-cyan-500');
            statusPing.classList.add('bg-red-500');
        }
        statusText.innerText = "SEARCHING...";
        statusText.classList.replace('text-cyan-300', 'text-red-500');
    }
}

previewCanvas.width = 320;
previewCanvas.height = 240;