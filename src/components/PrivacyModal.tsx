import { useTheme } from '@/hooks/useTheme'

interface PrivacyModalProps {
  open: boolean
  onAccept: () => void
  onClose: () => void
}

export default function PrivacyModal({ open, onAccept, onClose }: PrivacyModalProps) {
  const { isDark } = useTheme()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-lg ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
        <h3 className="text-lg font-bold mb-3">隐私协议</h3>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-6`}>我们将收集用于个性化推荐的基础信息，包含年龄与兴趣标签，遵循最小化原则并仅用于平台服务。</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 rounded-lg`}>取消</button>
          <button onClick={onAccept} className="bg-red-600 text-white px-4 py-2 rounded-lg">同意并继续</button>
        </div>
      </div>
    </div>
  )
}
