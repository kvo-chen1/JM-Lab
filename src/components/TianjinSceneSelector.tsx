import { useState, useEffect } from 'react';
import { Sun, Sparkles, Moon } from 'lucide-react';

type SceneMode = 'daily' | 'festival' | 'night';

export function TianjinSceneSelector() {
  const [sceneMode, setSceneMode] = useState<SceneMode>('daily');

  // 应用场景模式
  useEffect(() => {
    // 清除所有场景类
    document.documentElement.classList.remove('festival', 'night');
    
    // 添加当前场景类
    if (sceneMode !== 'daily') {
      document.documentElement.classList.add(sceneMode);
    }
    
    // 保存用户偏好
    localStorage.setItem('tianjinSceneMode', sceneMode);
  }, [sceneMode]);

  // 加载保存的场景模式
  useEffect(() => {
    const savedMode = localStorage.getItem('tianjinSceneMode') as SceneMode;
    if (savedMode && ['daily', 'festival', 'night'].includes(savedMode)) {
      setSceneMode(savedMode);
    }
  }, []);

  const scenes = [
    {
      id: 'daily' as SceneMode,
      label: '日常模式',
      icon: Sun,
      description: '标准界面',
      color: 'from-[#1E5F8E] to-[#4A90B8]',
      bgColor: 'bg-[#F8F6F3]'
    },
    {
      id: 'festival' as SceneMode,
      label: '节日模式',
      icon: Sparkles,
      description: '喜庆氛围',
      color: 'from-[#D4A84B] to-[#C68E17]',
      bgColor: 'bg-[#FFF8E7]'
    },
    {
      id: 'night' as SceneMode,
      label: '夜间模式',
      icon: Moon,
      description: '深色护眼',
      color: 'from-[#2C2A28] to-[#1A1918]',
      bgColor: 'bg-[#1A1918]'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {scenes.map((scene) => {
        const Icon = scene.icon;
        const isActive = sceneMode === scene.id;
        
        return (
          <button
            key={scene.id}
            onClick={() => setSceneMode(scene.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-300
              flex flex-col items-center gap-2
              ${isActive 
                ? `border-[#1E5F8E] bg-gradient-to-br ${scene.color} text-white shadow-lg` 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#1E5F8E]/50'
              }
            `}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-[#1E5F8E]'}`} />
            <div className="text-center">
              <div className="font-medium text-sm">{scene.label}</div>
              <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                {scene.description}
              </div>
            </div>
            
            {/* 选中指示器 */}
            {isActive && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#1E5F8E] rounded-full" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TianjinSceneSelector;
