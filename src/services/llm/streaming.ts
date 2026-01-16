export async function handleSseStreamingResponse(response: Response, onDelta: (chunk: string) => void): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流')
  }

  const decoder = new TextDecoder('utf-8')
  let fullResponse = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine === '') continue
        if (!trimmedLine.startsWith('data: ')) continue

        const data = trimmedLine.slice(6)
        if (data === '[DONE]') continue

        try {
          const jsonData = JSON.parse(data)
          const content = jsonData.choices?.[0]?.delta?.content || ''
          if (content) {
            fullResponse += content
            onDelta(content)
          }
        } catch {
          continue
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullResponse
}

