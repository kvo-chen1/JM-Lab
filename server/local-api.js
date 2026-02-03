// Minimal local proxy server for Ark Doubao APIs
// Runs at http://localhost:3001 and exposes /api/doubao/* endpoints

import http from 'node:http'
import { URL } from 'node:url'

const PORT = 3001
const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = process.env.DOUBAO_API_KEY || ''
const MODEL_ID = process.env.DOUBAO_MODEL_ID || 'doubao-seedance-1-0-pro-250528'
const ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) }
    })
  })
}

async function proxyFetch(path, method, body) {
  const resp = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

const server = http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }
  const u = new URL(req.url, `http://localhost:${PORT}`)
  const path = u.pathname

  if (!API_KEY) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }

  try {
    if (req.method === 'POST' && path === '/api/doubao/images/generate') {
      const b = await readBody(req)
      const payload = {
        model: b.model || MODEL_ID,
        prompt: b.prompt,
        size: b.size || '1024x1024',
        n: b.n || 1,
        seed: b.seed,
        guidance_scale: b.guidance_scale,
        response_format: b.response_format || 'url',
        watermark: b.watermark,
      }
      const r = await proxyFetch('/images/generations', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/chat/completions') {
      const b = await readBody(req)
      const payload = { model: b.model || MODEL_ID, messages: b.messages, max_tokens: b.max_tokens, temperature: b.temperature, top_p: b.top_p, stream: b.stream }
      const r = await proxyFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/videos/tasks') {
      const b = await readBody(req)
      const content = Array.isArray(b.content) ? b.content.map((it) => {
        if (it?.type === 'text') return { type: 'text', text: String(it.text || '').replace(/`/g, '').trim() }
        if (it?.type === 'image_url') return { type: 'image_url', image_url: { url: String(it?.image_url?.url || '').replace(/`/g, '').trim() } }
        return it
      }) : []
      const payload = { model: b.model || MODEL_ID, content }
      const r = await proxyFetch('/contents/generations/tasks', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'GET' && path.startsWith('/api/doubao/videos/tasks/')) {
      const id = path.split('/').pop() || ''
      const r = await proxyFetch(`/contents/generations/tasks/${id}`, 'GET')
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    sendJson(res, 404, { error: 'NOT_FOUND' })
  } catch (e) {
    sendJson(res, 500, { error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
})

server.listen(PORT, () => {
  console.log(`Local API server listening on http://localhost:${PORT}`)
})

