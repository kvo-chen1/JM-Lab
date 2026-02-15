export async function handleSseStreamingResponse(response: Response, onDelta: (chunk: string) => void): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流')
  }

  const decoder = new TextDecoder('utf-8')
  let fullResponse = ''
  let chunkCount = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine === '') continue
        
        // 处理标准SSE格式
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6)
          if (data === '[DONE]') continue

          try {
            const jsonData = JSON.parse(data)
            // 尝试多种可能的内容路径
            const content = 
              jsonData.choices?.[0]?.delta?.content || 
              jsonData.output?.text || 
              jsonData.text || 
              ''
            if (content) {
              fullResponse += content
              chunkCount++
              console.log(`[Streaming] Chunk ${chunkCount}, content: "${content.substring(0, 50)}...", total length: ${fullResponse.length}`)
              onDelta(content)
            }
          } catch (e) {
            console.log('[Streaming] Failed to parse SSE data:', trimmedLine.substring(0, 100))
            continue
          }
        }
        // 处理非SSE格式（直接的JSON响应）
        else if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
          try {
            const jsonData = JSON.parse(trimmedLine)
            // 尝试多种可能的内容路径
            const content = 
              jsonData.choices?.[0]?.message?.content || 
              jsonData.output?.text || 
              jsonData.text || 
              ''
            if (content) {
              fullResponse += content
              chunkCount++
              console.log(`[Streaming] JSON chunk ${chunkCount}, content: "${content.substring(0, 50)}...", total length: ${fullResponse.length}`)
              onDelta(content)
            }
          } catch (e) {
            console.log('[Streaming] Failed to parse JSON:', trimmedLine.substring(0, 100))
            continue
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  console.log(`[Streaming] Completed. Total chunks: ${chunkCount}, total length: ${fullResponse.length}`)

  // 如果fullResponse为空，返回一个默认的提示信息
  if (!fullResponse) {
    fullResponse = '<p>AI生成完成，但未获取到内容。请尝试调整生成参数或重新生成。</p>';
  }

  return fullResponse
}

