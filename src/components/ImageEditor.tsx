import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filter, setFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(30);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setOriginalImage(img);
      drawImage(img);
    };
    img.onerror = () => {
      toast.error('无法加载图片');
    };
  }, [imageUrl]);

  const drawImage = (img: HTMLImageElement = originalImage!) => {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas dimensions to match image
    // For rotation, we might need to swap width/height if 90/270 degrees
    // But for simplicity, let's keep original dimensions and rotate content
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Apply filters
    let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (filter !== 'none') {
        // Apply preset filters
        if (filter === 'grayscale') filterString += ' grayscale(100%)';
        if (filter === 'sepia') filterString += ' sepia(100%)';
        if (filter === 'invert') filterString += ' invert(100%)';
        if (filter === 'blur') filterString += ' blur(5px)';
    }
    ctx.filter = filterString;

    // Clear and draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Draw Text
    if (text) {
        ctx.filter = 'none'; // Don't apply filters to text
        ctx.font = `bold ${textSize}px sans-serif`;
        ctx.fillStyle = textColor;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = textSize / 10;
        ctx.textAlign = 'center';
        
        // Scale position to canvas size
        const x = (textPosition.x / 100) * canvas.width;
        const y = (textPosition.y / 100) * canvas.height;
        
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    }
  };

  useEffect(() => {
    if (originalImage) {
        drawImage(originalImage);
    }
  }, [brightness, contrast, saturation, filter, rotation, text, textColor, textSize, textPosition]);

  const handleSave = () => {
    if (!canvasRef.current) return;
    try {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onSave(dataUrl);
        toast.success('图片已保存');
    } catch (e) {
        console.error(e);
        toast.error('保存失败，可能是跨域问题');
    }
  };

  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
    >
        <div className={`flex flex-col md:flex-row w-full max-w-6xl h-[90vh] rounded-xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Canvas Area */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-auto p-4 relative">
                <canvas 
                    ref={canvasRef} 
                    className="max-w-full max-h-full object-contain shadow-2xl border border-gray-700"
                />
            </div>

            {/* Controls */}
            <div className={`w-full md:w-80 p-6 overflow-y-auto ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} border-l ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">图片编辑</h3>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <h4 className="font-medium mb-3 text-sm uppercase tracking-wider opacity-70">滤镜</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {['none', 'grayscale', 'sepia', 'invert', 'blur'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2 py-2 text-xs rounded border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Adjustments */}
                <div className="mb-6 space-y-4">
                    <h4 className="font-medium mb-3 text-sm uppercase tracking-wider opacity-70">调整</h4>
                    <div>
                        <label className="flex justify-between text-xs mb-1">
                            <span>亮度</span>
                            <span>{brightness}%</span>
                        </label>
                        <input 
                            type="range" min="0" max="200" value={brightness} 
                            onChange={e => setBrightness(Number(e.target.value))}
                            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="flex justify-between text-xs mb-1">
                            <span>对比度</span>
                            <span>{contrast}%</span>
                        </label>
                        <input 
                            type="range" min="0" max="200" value={contrast} 
                            onChange={e => setContrast(Number(e.target.value))}
                            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label className="flex justify-between text-xs mb-1">
                            <span>饱和度</span>
                            <span>{saturation}%</span>
                        </label>
                        <input 
                            type="range" min="0" max="200" value={saturation} 
                            onChange={e => setSaturation(Number(e.target.value))}
                            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                     <div>
                        <label className="flex justify-between text-xs mb-1">
                            <span>旋转</span>
                            <span>{rotation}°</span>
                        </label>
                        <input 
                            type="range" min="0" max="360" value={rotation} 
                            onChange={e => setRotation(Number(e.target.value))}
                            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Text Overlay */}
                <div className="mb-6 space-y-3">
                    <h4 className="font-medium mb-3 text-sm uppercase tracking-wider opacity-70">文字贴图</h4>
                    <input 
                        type="text" 
                        value={text} 
                        onChange={e => setText(e.target.value)}
                        placeholder="输入文字..."
                        className={`w-full p-2 rounded border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                    <div className="flex gap-2">
                        <input 
                            type="color" 
                            value={textColor} 
                            onChange={e => setTextColor(e.target.value)}
                            className="h-8 w-8 rounded cursor-pointer"
                        />
                         <input 
                            type="range" min="10" max="200" value={textSize} 
                            onChange={e => setTextSize(Number(e.target.value))}
                            className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer self-center"
                        />
                    </div>
                    <div>
                        <label className="text-xs mb-1 block">位置 (X / Y)</label>
                         <div className="flex gap-2">
                             <input 
                                type="range" min="0" max="100" value={textPosition.x} 
                                onChange={e => setTextPosition({...textPosition, x: Number(e.target.value)})}
                                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                            />
                             <input 
                                type="range" min="0" max="100" value={textPosition.y} 
                                onChange={e => setTextPosition({...textPosition, y: Number(e.target.value)})}
                                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                            />
                         </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button 
                        onClick={onCancel}
                        className={`flex-1 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    </motion.div>
  );
}
