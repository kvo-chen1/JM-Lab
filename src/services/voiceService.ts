export async function transcribeAudio(file: File): Promise<string> {
  return new Promise((resolve) => {
    void file;
    setTimeout(() => {
      resolve('语音已转换为文本')
    }, 1200)
  })
}

import { apiClient } from '../lib/apiClient'

export async function synthesize(text: string, opts?: { voice?: string, speed?: number, pitch?: number, format?: 'mp3' | 'wav' }) {
  const body = {
    text,
    voice: opts?.voice,
    speed: opts?.speed,
    pitch: opts?.pitch,
    format: opts?.format || 'mp3',
  }
  try {
    const res = await apiClient.post<{ ok: boolean; audio_base64?: string; content_type?: string; error?: string }>(
      '/api/volc/tts/synthesize',
      body,
      { timeoutMs: 20000, retries: 0 }
    )
    if (!res.ok) throw new Error(res.error || 'TTS_FAILED')
    const b64 = (res.data as any)?.audio_base64 || ''
    if (!b64) throw new Error('NO_AUDIO')
    const contentType = (res.data as any)?.content_type || 'audio/mpeg'
    const audioUrl = `data:${contentType};base64,${b64}`
    return { audioUrl, contentType }
  } catch (e) {
    const dev = (import.meta as any).env?.DEV
    if (dev) {
      const sampleRate = 44100
      const duration = 1
      const frequency = 440
      const numSamples = sampleRate * duration
      const buffer = new Array<number>(44 + numSamples * 2)
      const writeStr = (str: string, offset: number) => { for (let i = 0; i < str.length; i++) buffer[offset + i] = str.charCodeAt(i) }
      const write16 = (val: number, offset: number) => { buffer[offset] = val & 0xff; buffer[offset + 1] = (val >> 8) & 0xff }
      const write32 = (val: number, offset: number) => { buffer[offset] = val & 0xff; buffer[offset + 1] = (val >> 8) & 0xff; buffer[offset + 2] = (val >> 16) & 0xff; buffer[offset + 3] = (val >> 24) & 0xff }
      writeStr('RIFF', 0)
      write32(36 + numSamples * 2, 4)
      writeStr('WAVE', 8)
      writeStr('fmt ', 12)
      write32(16, 16)
      write16(1, 20)
      write16(1, 22)
      write32(sampleRate, 24)
      write32(sampleRate * 2, 28)
      write16(2, 32)
      write16(16, 34)
      writeStr('data', 36)
      write32(numSamples * 2, 40)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const s = Math.sin(2 * Math.PI * frequency * t)
        const v = Math.max(-1, Math.min(1, s))
        const int = v < 0 ? v * 0x8000 : v * 0x7fff
        const idx = 44 + i * 2
        write16((int as number) & 0xffff, idx)
      }
      const bytes = new Uint8Array(buffer)
      const b64 = btoa(String.fromCharCode(...bytes))
      const audioUrl = `data:audio/wav;base64,${b64}`
      return { audioUrl, contentType: 'audio/wav' }
    }
    throw e
  }
}

export async function startListening(): Promise<{ text: string } | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ text: '示例语音输入内容' })
    }, 1500)
  })
}

export default { transcribeAudio, synthesize, startListening }
