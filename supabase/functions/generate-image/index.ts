// Supabase Edge Function: 后台图片生成
// 用户关闭页面后，此函数会继续执行生成任务

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// 千问 API 配置
const QWEN_API_KEY = Deno.env.get('QWEN_API_KEY') || ''
const QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1'

interface GenerationParams {
  prompt: string
  size?: string
  n?: number
  model?: string
  quality?: string
  style?: string
}

interface GenerationTask {
  id: string
  user_id: string
  type: 'image' | 'video'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  params: GenerationParams
  progress: number
}

// 处理 CORS 预检请求
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

// 验证请求
async function validateRequest(req: Request): Promise<{ userId: string; taskId: string } | Response> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json().catch(() => ({}))
    const taskId = body.taskId

    if (!taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing taskId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return { userId: user.id, taskId }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// 调用千问 API 生成图片
async function callQwenImageGeneration(params: GenerationParams): Promise<any> {
  const response = await fetch(`${QWEN_BASE_URL}/services/aigc/text2image/image-synthesis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`,
      'X-DashScope-Async': 'enable'
    },
    body: JSON.stringify({
      model: params.model || 'wanx2.1-t2i-turbo',
      input: {
        prompt: params.prompt
      },
      parameters: {
        size: params.size || '1024x1024',
        n: params.n || 1,
        style: params.style || '<auto>',
        quality: params.quality || 'standard'
      }
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API request failed: ${response.status}`)
  }

  return await response.json()
}

// 轮询检查任务状态
async function pollTaskStatus(taskId: string): Promise<any> {
  const maxAttempts = 60 // 最多轮询60次
  const interval = 5000 // 每5秒检查一次

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${QWEN_BASE_URL}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to check task status: ${response.status}`)
    }

    const result = await response.json()

    if (result.output?.task_status === 'SUCCEEDED') {
      return result.output.results
    } else if (result.output?.task_status === 'FAILED') {
      throw new Error(result.output?.message || 'Task failed')
    }

    // 等待后再次检查
    await new Promise(resolve => setTimeout(resolve, interval))
  }

  throw new Error('Task polling timeout')
}

// 主处理函数
Deno.serve(async (req) => {
  // 处理 CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  // 只接受 POST 请求
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // 验证请求
  const validation = await validateRequest(req)
  if (validation instanceof Response) return validation

  const { userId, taskId } = validation

  // 创建 Supabase 客户端
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  try {
    // 1. 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('generation_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 检查任务状态
    if (task.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Task is not in pending status', status: task.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. 更新任务状态为 processing
    await supabase
      .from('generation_tasks')
      .update({
        status: 'processing',
        progress: 10,
        started_at: new Date().toISOString()
      })
      .eq('id', taskId)

    // 3. 调用千问 API 提交生成任务
    const submitResult = await callQwenImageGeneration(task.params)
    const qwenTaskId = submitResult.output?.task_id

    if (!qwenTaskId) {
      throw new Error('Failed to get task ID from Qwen API')
    }

    // 4. 更新进度
    await supabase
      .from('generation_tasks')
      .update({ progress: 30 })
      .eq('id', taskId)

    // 5. 轮询等待生成完成
    const results = await pollTaskStatus(qwenTaskId)

    // 6. 更新任务为完成状态
    const { error: updateError } = await supabase
      .from('generation_tasks')
      .update({
        status: 'completed',
        progress: 100,
        result: {
          urls: results.map((r: any) => r.url),
          revisedPrompt: results[0]?.revised_prompt || task.params.prompt
        },
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        status: 'completed',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Generation failed:', error)

    // 更新任务为失败状态
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    let errorType = 'general'

    if (errorMessage.includes('content') || errorMessage.includes('policy')) {
      errorType = 'content_policy'
    } else if (errorMessage.includes('timeout')) {
      errorType = 'timeout'
    } else if (errorMessage.includes('auth') || errorMessage.includes('key')) {
      errorType = 'auth'
    } else if (errorMessage.includes('network')) {
      errorType = 'network'
    }

    await supabase
      .from('generation_tasks')
      .update({
        status: 'failed',
        error: errorMessage,
        error_type: errorType,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId)

    return new Response(
      JSON.stringify({
        success: false,
        taskId,
        status: 'failed',
        error: errorMessage,
        errorType
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
