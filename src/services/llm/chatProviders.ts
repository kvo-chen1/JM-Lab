import apiClient from '@/lib/apiClient'
import { handleSseStreamingResponse } from './streaming'
import type { Message } from '../llmService'

interface ChatCallParams {
  model: string
  messages: Message[]
  temperature?: number
  top_p?: number
  max_tokens?: number
  signal?: AbortSignal
  onDelta?: (chunk: string) => void
}

export async function callKimiChat(params: ChatCallParams): Promise<string> {
  if (params.onDelta) {
    const response = await fetch('/api/kimi/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: true,
        temperature: params.temperature,
        top_p: params.top_p,
        max_tokens: params.max_tokens,
      }),
      signal: params.signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Kimi API请求失败: ${response.status} ${response.statusText} - ${errorData.error || ''}`)
    }

    return handleSseStreamingResponse(response, params.onDelta)
  }

  const apiResponse = await apiClient.post<any>(
    '/api/kimi/chat/completions',
    {
      model: params.model,
      messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
      stream: false,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.max_tokens,
    },
    { timeoutMs: 30000, retries: 2 }
  )

  if (!apiResponse.ok) {
    throw new Error(`Kimi API请求失败: ${apiResponse.error || '未知错误'}`)
  }

  return apiResponse.data?.choices?.[0]?.message?.content || '未获取到响应'
}

export async function callDeepseekChat(params: ChatCallParams): Promise<string> {
  if (params.onDelta) {
    const response = await fetch('/api/deepseek/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: true,
        temperature: params.temperature,
        top_p: params.top_p,
        max_tokens: params.max_tokens,
      }),
      signal: params.signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`DeepSeek API请求失败: ${response.status} ${response.statusText} - ${errorData.error || ''}`)
    }

    return handleSseStreamingResponse(response, params.onDelta)
  }

  const apiResponse = await apiClient.post<any>(
    '/api/deepseek/chat/completions',
    {
      model: params.model,
      messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
      stream: false,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.max_tokens,
    },
    { timeoutMs: 30000, retries: 2 }
  )

  if (!apiResponse.ok) {
    throw new Error(`DeepSeek API请求失败: ${apiResponse.error || '未知错误'}`)
  }

  return apiResponse.data?.choices?.[0]?.message?.content || '未获取到响应'
}

export async function callQwenChat(params: ChatCallParams): Promise<string> {
  if (params.onDelta) {
    const response = await fetch('/api/qwen/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: true,
        temperature: params.temperature,
        top_p: params.top_p,
        max_tokens: params.max_tokens,
      }),
      signal: params.signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`通义千问API请求失败: ${response.status} ${response.statusText} - ${errorData.error || ''}`)
    }

    return handleSseStreamingResponse(response, params.onDelta)
  }

  const apiResponse = await apiClient.post<any>(
    '/api/qwen/chat/completions',
    {
      model: params.model,
      messages: params.messages.map(msg => ({ role: msg.role, content: msg.content })),
      stream: false,
      temperature: params.temperature,
      top_p: params.top_p,
      max_tokens: params.max_tokens,
    },
    { timeoutMs: 30000, retries: 2 }
  )

  if (!apiResponse.ok) {
    throw new Error(`通义千问API请求失败: ${apiResponse.error || '未知错误'}`)
  }

  const data = apiResponse.data
  return data.data?.output?.text || data.output?.text || '未获取到响应'
}

