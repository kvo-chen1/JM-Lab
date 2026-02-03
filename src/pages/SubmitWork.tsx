
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventService } from '@/hooks/useEventService';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { ArrowLeft, Upload, FileText, Image as ImageIcon, Video, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubmitWork() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { getEvent, submitEventWork } = useEventService();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const data = await getEvent(id);
        setEvent(data);
      } catch (error) {
        toast.error('无法加载活动信息');
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, getEvent, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('请输入作品标题');
      return;
    }
    
    setSubmitting(true);
    try {
      // 模拟文件上传和数据提交
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 构建提交数据
      const workData = {
        title,
        description,
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
        submittedAt: new Date()
      };

      await submitEventWork(id!, workData);
      
      toast.success('作品提交成功！');
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        navigate(`/events/${id}`);
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-200 text-gray-600'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl shadow-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">提交作品</h1>
            <p className="opacity-90 flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded text-sm">活动</span>
              {event?.title || '未知活动'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">
                作品标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给你的作品起个响亮的名字"
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">
                作品描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="介绍一下你的创作灵感..."
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">
                上传附件
              </label>
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDark 
                  ? 'border-gray-600 hover:border-gray-500 bg-gray-700/30' 
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="font-semibold text-red-600 hover:underline">点击上传</span>
                    <span className="opacity-60"> 或拖拽文件到此处</span>
                  </div>
                  <p className="text-xs opacity-50">支持 JPG, PNG, MP4, PDF 等格式</p>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        {file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-blue-500" /> :
                         file.type.startsWith('video/') ? <Video className="w-5 h-5 text-purple-500" /> :
                         <FileText className="w-5 h-5 text-gray-500" />}
                        <span className="truncate text-sm">{file.name}</span>
                        <span className="text-xs opacity-50">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 hover:shadow-red-600/30'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>提交中...</span>
                  </div>
                ) : (
                  '确认提交'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
