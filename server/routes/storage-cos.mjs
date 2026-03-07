/**
 * 文件存储路由 - 支持腾讯云 COS
 * 替代本地存储，使用腾讯云对象存储
 */

import { Router } from 'express'
import multer from 'multer'
import { uploadToCOS, deleteFromCOS, extractKeyFromUrl, isCOSConfigured } from '../services/cosService.mjs'

const router = Router()

// 使用内存存储，因为文件要上传到 COS
const upload = multer({
  storage: multer.memoryStorage(),
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
 * 上传文件到 COS
 * POST /api/storage/:folder
 */
router.post('/:folder', upload.single('file'), async (req, res) => {
  try {
    // 检查 COS 配置
    if (!isCOSConfigured()) {
      return res.status(500).json({ 
        error: 'COS 未配置，请检查环境变量' 
      })
    }

    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const folder = req.params.folder || 'uploads'
    
    console.log('[Storage COS] 开始上传:', {
      folder,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    })

    // 上传到 COS
    const result = await uploadToCOS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    )

    console.log('[Storage COS] 上传成功:', {
      url: result.url,
      key: result.key
    })

    res.json({
      success: true,
      data: {
        path: result.key,
        url: result.url,
        size: result.size,
        mimetype: result.mimeType
      }
    })
  } catch (error) {
    console.error('[Storage COS] 上传失败:', error)
    res.status(500).json({ error: '上传失败: ' + error.message })
  }
})

/**
 * 删除文件
 * DELETE /api/storage/*
 */
router.delete('/*', async (req, res) => {
  try {
    if (!isCOSConfigured()) {
      return res.status(500).json({ 
        error: 'COS 未配置' 
      })
    }

    // 从 URL 中提取 key
    const url = req.params[0]
    const key = extractKeyFromUrl(url)
    
    if (!key) {
      return res.status(400).json({ error: '无效的文件 URL' })
    }

    const success = await deleteFromCOS(key)
    
    if (success) {
      res.json({ success: true, message: '文件已删除' })
    } else {
      res.status(500).json({ error: '删除失败' })
    }
  } catch (error) {
    console.error('[Storage COS] 删除失败:', error)
    res.status(500).json({ error: '删除失败: ' + error.message })
  }
})

/**
 * 获取文件信息（COS 文件直接返回 URL）
 * HEAD /api/storage/*
 */
router.head('/*', async (req, res) => {
  // COS 文件直接返回 200，实际文件信息在 COS 端
  res.status(200).end()
})

export default router
