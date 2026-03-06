/**
 * 文件存储路由 - 替代 Supabase Storage
 * 使用本地文件存储
 */

import fs from 'fs'
import pathModule from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = pathModule.dirname(__filename)
const projectRoot = pathModule.resolve(__dirname, '../..')

// 存储配置
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || pathModule.join(projectRoot, 'public', 'uploads')

// 确保上传目录存在
function ensureUploadsDir() {
  if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
    fs.mkdirSync(LOCAL_STORAGE_PATH, { recursive: true })
    console.log('[Storage] 创建上传目录:', LOCAL_STORAGE_PATH)
  }
  
  // 创建子目录
  const subdirs = ['works', 'avatars', 'drafts', 'temp', 'patterns', 'knowledge']
  subdirs.forEach(dir => {
    const dirPath = pathModule.join(LOCAL_STORAGE_PATH, dir)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  })
}

ensureUploadsDir()

// 解析 multipart/form-data - 改进版
async function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks)
        const contentType = req.headers['content-type']
        
        if (!contentType || !contentType.includes('multipart/form-data')) {
          reject(new Error('Invalid content type'))
          return
        }
        
        const boundaryMatch = contentType.match(/boundary=([^;]+)/)
        if (!boundaryMatch) {
          reject(new Error('No boundary found'))
          return
        }
        
        // 处理 boundary，去除可能的引号
        let boundary = boundaryMatch[1].trim()
        if (boundary.startsWith('"') && boundary.endsWith('"')) {
          boundary = boundary.slice(1, -1)
        }
        
        const delimiter = `--${boundary}`
        const closeDelimiter = `--${boundary}--`
        
        // 将 buffer 转换为字符串来查找边界位置
        const bufferStr = buffer.toString('binary')
        
        // 找到所有部分
        const parts = []
        let startIndex = 0
        
        while (true) {
          const delimiterIndex = bufferStr.indexOf(delimiter, startIndex)
          if (delimiterIndex === -1) break
          
          const nextDelimiterIndex = bufferStr.indexOf(delimiter, delimiterIndex + delimiter.length)
          const endIndex = nextDelimiterIndex !== -1 ? nextDelimiterIndex : bufferStr.indexOf(closeDelimiter, delimiterIndex)
          
          if (endIndex === -1) break
          
          // 提取部分数据（不包括 delimiter）
          const partStart = delimiterIndex + delimiter.length + 2 // +2 for \r\n
          const partEnd = endIndex - 2 // -2 to remove \r\n before next delimiter
          
          if (partStart < partEnd) {
            const partBuffer = buffer.slice(partStart, partEnd)
            parts.push(partBuffer)
          }
          
          startIndex = endIndex
          
          if (endIndex === bufferStr.indexOf(closeDelimiter, delimiterIndex)) break
        }
        
        const files = []
        
        for (const partBuffer of parts) {
          const partStr = partBuffer.toString('utf8', 0, Math.min(partBuffer.length, 4096))
          
          // 查找 Content-Disposition
          const dispositionMatch = partStr.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i)
          
          if (dispositionMatch) {
            const fieldName = dispositionMatch[1]
            const filename = dispositionMatch[2]
            
            if (filename) {
              // 这是一个文件
              const contentTypeMatch = partStr.match(/Content-Type:\s*([^\r\n]+)/i)
              const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream'
              
              // 找到头部结束位置（双换行）
              const headerEndIndex = partBuffer.indexOf('\r\n\r\n')
              if (headerEndIndex !== -1) {
                const fileContent = partBuffer.slice(headerEndIndex + 4)
                
                files.push({
                  fieldName,
                  filename,
                  contentType,
                  buffer: fileContent
                })
              }
            }
          }
        }
        
        resolve(files)
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

// 处理存储路由
export default async function handleStorageRoute(req, res, path) {
  // 解析路径: /api/storage/:folder/:filename?
  const pathParts = path.replace('/api/storage/', '').split('/').filter(Boolean)
  
  if (pathParts.length === 0) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: '缺少文件夹参数' }))
    return
  }
  
  const folder = pathParts[0]
  const filename = pathParts[1]
  
  // POST /api/storage/:folder - 上传文件
  if (req.method === 'POST' && !filename) {
    try {
      const files = await parseMultipartFormData(req)
      
      if (files.length === 0) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: '没有上传文件' }))
        return
      }
      
      const file = files[0]
      
      // 验证文件类型
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'image/jpg',
        'video/mp4', 'video/webm', 'video/quicktime'
      ]
      
      // 也检查文件扩展名
      const ext = pathModule.extname(file.filename).toLowerCase()
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mov']
      
      if (!allowedTypes.includes(file.contentType) && !allowedExts.includes(ext)) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: `不支持的文件类型: ${file.contentType} (${ext})` }))
        return
      }
      
      // 确保目标目录存在
      const destDir = pathModule.join(LOCAL_STORAGE_PATH, folder)
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true })
      }
      
      // 生成唯一文件名
      const newExt = ext || '.jpg'
      const newFilename = `${Date.now()}-${randomUUID().slice(0, 8)}${newExt}`
      const filePath = pathModule.join(destDir, newFilename)
      
      // 保存文件
      fs.writeFileSync(filePath, file.buffer)
      
      // 验证文件是否成功写入
      const stats = fs.statSync(filePath)
      
      // 构建访问 URL
      const fileUrl = `/uploads/${folder}/${newFilename}`
      
      console.log('[Storage] 文件上传成功:', {
        folder,
        filename: newFilename,
        originalName: file.filename,
        size: stats.size,
        url: fileUrl
      })
      
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: true,
        data: {
          path: `${folder}/${newFilename}`,
          url: fileUrl,
          size: stats.size,
          mimetype: file.contentType
        }
      }))
    } catch (error) {
      console.error('[Storage] 上传失败:', error)
      res.statusCode = 500
      res.end(JSON.stringify({ error: '上传失败: ' + error.message }))
    }
    return
  }
  
  // GET /api/storage/:folder/:filename - 获取文件
  if (req.method === 'GET' && filename) {
    try {
      const filePath = pathModule.join(LOCAL_STORAGE_PATH, folder, filename)
      
      // 安全检查
      const resolvedPath = pathModule.resolve(filePath)
      const resolvedUploadsDir = pathModule.resolve(LOCAL_STORAGE_PATH)
      
      if (!resolvedPath.startsWith(resolvedUploadsDir)) {
        res.statusCode = 403
        res.end(JSON.stringify({ error: '访问被拒绝' }))
        return
      }
      
      if (!fs.existsSync(filePath)) {
        res.statusCode = 404
        res.end(JSON.stringify({ error: '文件不存在' }))
        return
      }
      
      const ext = pathModule.extname(filePath).toLowerCase()
      const contentTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime'
      }
      
      res.setHeader('Content-Type', contentTypeMap[ext] || 'application/octet-stream')
      res.setHeader('Cache-Control', 'public, max-age=31536000')
      
      const fileBuffer = fs.readFileSync(filePath)
      res.statusCode = 200
      res.end(fileBuffer)
    } catch (error) {
      console.error('[Storage] 获取文件失败:', error)
      res.statusCode = 500
      res.end(JSON.stringify({ error: '获取文件失败: ' + error.message }))
    }
    return
  }
  
  // DELETE /api/storage/:folder/:filename - 删除文件
  if (req.method === 'DELETE' && filename) {
    try {
      const filePath = pathModule.join(LOCAL_STORAGE_PATH, folder, filename)
      
      // 安全检查
      const resolvedPath = pathModule.resolve(filePath)
      const resolvedUploadsDir = pathModule.resolve(LOCAL_STORAGE_PATH)
      
      if (!resolvedPath.startsWith(resolvedUploadsDir)) {
        res.statusCode = 403
        res.end(JSON.stringify({ error: '访问被拒绝' }))
        return
      }
      
      if (!fs.existsSync(filePath)) {
        res.statusCode = 404
        res.end(JSON.stringify({ error: '文件不存在' }))
        return
      }
      
      fs.unlinkSync(filePath)
      
      console.log('[Storage] 文件删除成功:', { folder, filename })
      
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ success: true, message: '文件已删除' }))
    } catch (error) {
      console.error('[Storage] 删除失败:', error)
      res.statusCode = 500
      res.end(JSON.stringify({ error: '删除失败: ' + error.message }))
    }
    return
  }
  
  // HEAD /api/storage/:folder/:filename - 获取文件信息
  if (req.method === 'HEAD' && filename) {
    try {
      const filePath = pathModule.join(LOCAL_STORAGE_PATH, folder, filename)
      
      if (!fs.existsSync(filePath)) {
        res.statusCode = 404
        res.end()
        return
      }
      
      const stats = fs.statSync(filePath)
      res.setHeader('Content-Length', stats.size)
      res.setHeader('Last-Modified', stats.mtime.toUTCString())
      res.statusCode = 200
      res.end()
    } catch (error) {
      res.statusCode = 500
      res.end()
    }
    return
  }
  
  // 不支持的请求
  res.statusCode = 405
  res.end(JSON.stringify({ error: '不支持的请求方法' }))
}
