import { useRef, useState, useCallback } from 'react'
import { useTheme } from '@/hooks/useTheme'

type Variant = 'image' | 'audio' | 'file'

interface UploadBoxProps {
  accept: string
  onFile: (file: File | File[]) => void
  title?: string
  description?: string
  previewUrl?: string | string[]
  variant?: Variant
  className?: string
  multiple?: boolean
  maxSize?: number // in bytes
  onError?: (error: string) => void
}

export default function UploadBox({ accept, onFile, title, description, previewUrl, variant = 'file', className, multiple = false, maxSize, onError }: UploadBoxProps) {
  const { isDark } = useTheme()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [localPreviews, setLocalPreviews] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // 验证文件类型
  const validateFileType = (file: File): boolean => {
    if (!accept) return true
    
    const acceptedTypes = accept.split(',').map(type => type.trim())
    for (const type of acceptedTypes) {
      if (type.endsWith('/*')) {
        // 处理通配符类型，如 image/*
        const baseType = type.slice(0, -2)
        if (file.type.startsWith(baseType)) {
          return true
        }
      } else if (file.type === type) {
        // 处理具体类型，如 image/jpeg
        return true
      } else if (type.startsWith('.')) {
        // 处理文件扩展名，如 .jpg
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext && type.slice(1).toLowerCase() === ext) {
          return true
        }
      }
    }
    return false
  }

  const handleFile = useCallback((files: File[] | File | null) => {
    if (!files) return
    
    const fileArray = Array.isArray(files) ? files : [files]
    const validFiles: File[] = []
    
    for (const file of fileArray) {
      // 文件类型验证
      if (!validateFileType(file)) {
        onError?.(`文件类型不支持：${file.name}`)
        continue
      }
      
      // 文件大小验证
      if (maxSize && file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2)
        onError?.(`文件大小超过限制：${file.name}，最大支持 ${maxSizeMB}MB`)
        continue
      }
      
      validFiles.push(file)
    }
    
    if (validFiles.length === 0) return
    
    // 处理预览
    if (variant === 'image' || variant === 'audio') {
      const newPreviews = validFiles.map(file => {
        try {
          return URL.createObjectURL(file)
        } catch {
          return ''
        }
      }).filter(url => url !== '')
      
      setLocalPreviews(prev => [...prev, ...newPreviews])
    }
    
    // 模拟上传进度
    setUploading(true)
    setUploadProgress(0)
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          onFile(multiple ? validFiles : validFiles[0])
          return 100
        }
        return prev + 5
      })
    }, 100)
  }, [onFile, variant, multiple, accept, maxSize, onError])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFile(files)
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) {
      handleFile(files)
    }
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  // 合并外部预览和本地预览
  const allPreviews: string[] = []
  if (previewUrl) {
    allPreviews.push(...(Array.isArray(previewUrl) ? previewUrl : [previewUrl]))
  }
  allPreviews.push(...localPreviews)
  
  const icon = variant === 'image' ? 'far fa-image' : variant === 'audio' ? 'fas fa-music' : 'fas fa-file-import'
  const accent = isDark ? 'ring-red-500/40 hover:ring-red-500/60' : 'ring-red-600/40 hover:ring-red-600/60'

  return (
    <div className={className}>
      {title && <div className="mb-2 text-sm font-medium">{title}</div>}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${isDark 
          ? `${dragOver ? 'border-red-500 bg-red-900/10' : 'border-gray-600 bg-gray-800'} hover:border-gray-500` 
          : `${dragOver ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'} hover:border-gray-400`} 
        p-4 ${dragOver ? 'ring-2 ring-red-500/30' : 'ring-0'} cursor-pointer shadow-sm hover:shadow-md`}
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="上传文件"
      >
        <div className="flex flex-col items-center md:items-start gap-4 py-2 text-center md:text-left">
          <div className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl transition-all duration-300 ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} shadow-sm`}>
            <i className={`${icon} text-lg md:text-xl`}></i>
          </div>
          <div className="flex-1 w-full">
            <div className="text-sm font-medium">{description || '拖拽文件到此，或点击选择'}</div>
            <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{accept}</div>
          </div>
          <button
            type="button"
            className="w-full md:w-auto ml-0 md:ml-4 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium whitespace-nowrap transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            disabled={uploading}
          >
            {uploading ? '上传中...' : '选择文件'}
          </button>
        </div>

        {/* 图片预览 */}
        {variant === 'image' && allPreviews.length > 0 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {allPreviews.map((preview, index) => (
              <div key={index} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border">
                <img 
                  src={preview} 
                  alt={`预览 ${index + 1}`} 
                  className="w-full h-full object-cover"
                  loading="lazy" 
                  decoding="async" 
                />
              </div>
            ))}
          </div>
        )}
        
        {/* 音频预览 */}
        {variant === 'audio' && allPreviews.length > 0 && (
          <div className="mt-4 space-y-3">
            {allPreviews.map((preview, index) => (
              <div key={index} className="relative p-3 rounded-lg border bg-gray-50 dark:bg-gray-700">
                <audio controls src={preview} className="w-full" />
              </div>
            ))}
          </div>
        )}
        
        {/* 上传进度条 */}
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">上传中...</span>
              <span className="text-gray-500 dark:text-gray-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-red-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      <input 
        ref={inputRef} 
        type="file" 
        accept={accept} 
        className="hidden" 
        onChange={onChange} 
        multiple={multiple}
        disabled={uploading}
      />
    </div>
  )
}

