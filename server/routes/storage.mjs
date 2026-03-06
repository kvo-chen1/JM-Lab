/**
 * 文件存储路由 - 替代 Supabase Storage
 * 支持本地文件存储和 S3 兼容存储
 */

import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import multer from 'multer'

const router = Router()

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

// 存储配置
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local' // 'local' 或 's3'
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || path.join(projectRoot, 'public', 'uploads')
const STORAGE_BASE_URL = process.env.STORAGE_BASE_URL || '/uploads'

// 确保上传目录存在
if (STORAGE_TYPE === 'local') {
  const uploadsDir = LOCAL_STORAGE_PATH
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log('[Storage] 创建上传目录:', uploadsDir)
  }
  
  // 创建子目录
  const subdirs = ['works', 'avatars', 'drafts', 'temp', 'patterns', 'knowledge']
  subdirs.forEach(dir => {
    const dirPath = path.join(uploadsDir, dir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  })
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.params.folder || 'temp'
    const destPath = path.join(LOCAL_STORAGE_PATH, folder)
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true })
    }
    cb(null, destPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
    cb(null, filename)
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 允许的图片和视频类型
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime'
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`), false)
    }
  }
})

/**
 * 上传文件
 * POST /api/storage/:folder
 */
router.post('/:folder', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const folder = req.params.folder
    const filename = req.file.filename
    
    // 构建访问 URL
    const fileUrl = `${STORAGE_BASE_URL}/${folder}/${filename}`
    
    console.log('[Storage] 文件上传成功:', {
      folder,
      filename,
      size: req.file.size,
      url: fileUrl
    })

    res.json({
      success: true,
      data: {
        path: `${folder}/${filename}`,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    })
  } catch (error) {
    console.error('[Storage] 上传失败:', error)
    res.status(500).json({ error: '上传失败: ' + error.message })
  }
})

/**
 * 获取文件
 * GET /api/storage/:folder/:filename
 */
router.get('/:folder/:filename', async (req, res) => {
  try {
    const { folder, filename } = req.params
    const filePath = path.join(LOCAL_STORAGE_PATH, folder, filename)
    
    // 安全检查：确保文件路径在允许的目录内
    const resolvedPath = path.resolve(filePath)
    const resolvedUploadsDir = path.resolve(LOCAL_STORAGE_PATH)
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(403).json({ error: '访问被拒绝' })
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' })
    }
    
    // 设置缓存头
    res.setHeader('Cache-Control', 'public, max-age=31536000') // 1年缓存
    
    // 发送文件
    res.sendFile(filePath)
  } catch (error) {
    console.error('[Storage] 获取文件失败:', error)
    res.status(500).json({ error: '获取文件失败: ' + error.message })
  }
})

/**
 * 删除文件
 * DELETE /api/storage/:folder/:filename
 */
router.delete('/:folder/:filename', async (req, res) => {
  try {
    const { folder, filename } = req.params
    const filePath = path.join(LOCAL_STORAGE_PATH, folder, filename)
    
    // 安全检查
    const resolvedPath = path.resolve(filePath)
    const resolvedUploadsDir = path.resolve(LOCAL_STORAGE_PATH)
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(403).json({ error: '访问被拒绝' })
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' })
    }
    
    fs.unlinkSync(filePath)
    
    console.log('[Storage] 文件删除成功:', { folder, filename })
    
    res.json({ success: true, message: '文件已删除' })
  } catch (error) {
    console.error('[Storage] 删除失败:', error)
    res.status(500).json({ error: '删除失败: ' + error.message })
  }
})

/**
 * 获取文件信息
 * HEAD /api/storage/:folder/:filename
 */
router.head('/:folder/:filename', async (req, res) => {
  try {
    const { folder, filename } = req.params
    const filePath = path.join(LOCAL_STORAGE_PATH, folder, filename)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).end()
    }
    
    const stats = fs.statSync(filePath)
    res.setHeader('Content-Length', stats.size)
    res.setHeader('Last-Modified', stats.mtime.toUTCString())
    res.end()
  } catch (error) {
    res.status(500).end()
  }
})

export default router
