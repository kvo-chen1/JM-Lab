import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import voiceService from '@/services/voiceService'
import UploadBox from '@/components/UploadBox'

export default function InputHub() {
  const { isDark } = useTheme()
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [preview, setPreview] = useState('')
  const [loadingVoice, setLoadingVoice] = useState(false)
  const templates = ['把麻花做成赛博朋克风', '融合杨柳青年画纹样', '适配小红书潮流配色']
  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setImage(url)
  }
  const onAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setLoadingVoice(true)
    const t = await voiceService.transcribeAudio(f)
    setText(t)
    setLoadingVoice(false)
  }
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">用户输入</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <div className="mb-2">文字输入</div>
            <textarea
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 500) setText(e.target.value)
                setPreview(e.target.value)
              }}
              className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} w-full h-40 px-4 py-3 rounded-lg border`}
            />
            <div className="text-xs opacity-60 mt-1">500字限制</div>
            <div className="mt-4">模板</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {templates.map(t => (
                <button key={t} onClick={() => { setText(t); setPreview(t) }} className={`px-3 py-1 rounded-full text-sm border ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <div className="mb-2">语音与图片</div>
            <UploadBox
              accept="audio/*"
              variant="audio"
              title="上传语音"
              description="支持拖拽与点击选择，自动转文字"
              onFile={async (file) => { setLoadingVoice(true); const audioFile = Array.isArray(file) ? file[0] : file; const t = await voiceService.transcribeAudio(audioFile); setText(t); setLoadingVoice(false) }}
              className="mb-3"
            />
            <UploadBox
              accept="image/*"
              variant="image"
              title="上传图片"
              description="支持拖拽与点击选择，自动显示预览"
              previewUrl={image || undefined}
              onFile={(file) => { const imageFile = Array.isArray(file) ? file[0] : file; const url = URL.createObjectURL(imageFile); setImage(url) }}
            />
            {loadingVoice && <div className="text-sm mt-2">语音转文字中...</div>}
          </div>
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-6`}>
            <div className="mb-2">实时预览</div>
            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 h-48`}>{preview || '输入后实时预览将显示在此'}</div>
            <motion.button whileHover={{ scale: 1.03 }} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg">继续生成</motion.button>
          </div>
        </div>
      </main>
    </div>
  )
}
