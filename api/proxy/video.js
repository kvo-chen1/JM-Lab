// api/proxy/video.js - Vercel serverless function for video proxy

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract the video URL from query parameters
    const url = new URL(req.url, `http://localhost:3000`);
    const videoUrl = url.searchParams.get('url') || '';

    // Validate the video URL
    if (!videoUrl) {
      return res.status(400).json({
        error: 'URL_NOT_PROVIDED',
        message: 'Video URL is required'
      });
    }

    // Check if the URL is from an allowed domain
    // 支持常见的视频托管服务
    const allowedDomains = [
      'volces.com',           // 火山引擎
      'tos-cn-beijing',       // 字节跳动对象存储
      'supabase.co',          // Supabase 存储
      'amazonaws.com',        // AWS S3
      'cloudinary.com',       // Cloudinary
      'googleapis.com',       // Google Cloud Storage
      'azureedge.net',        // Azure CDN
      'aliyuncs.com',         // 阿里云 OSS
      'qcloud.com',           // 腾讯云 COS
      'bilibili.com',         // Bilibili
      'youku.com',            // 优酷
      'iqiyi.com',            // 爱奇艺
      'localhost',            // 本地开发
      '127.0.0.1',            // 本地开发
    ];
    const isAllowed = allowedDomains.some(domain => videoUrl.includes(domain));
    
    // 在开发环境下允许所有域名
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log('Development mode: allowing all video domains');
    }

    if (!isAllowed && !isDevelopment) {
      console.warn('Video URL not in allowed domains:', videoUrl);
      return res.status(400).json({
        error: 'URL_NOT_ALLOWED',
        message: 'Video URL is not from an allowed domain',
        allowedDomains: allowedDomains
      });
    }

    // Forward the request to the video URL
    const response = await fetch(videoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'video/*, */*'
      }
    });

    // Set the response status code
    res.status(response.status);

    // Set the content type from the response
    const contentType = response.headers.get('content-type') || 'video/mp4';
    res.setHeader('Content-Type', contentType);

    // Set other important headers for video streaming
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) {
      res.setHeader('Accept-Ranges', acceptRanges);
    }

    // Return the video binary data
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error('Video proxy error:', error);
    return res.status(500).json({
      error: 'VIDEO_PROXY_ERROR',
      message: error.message || 'Failed to proxy video'
    });
  }
}
