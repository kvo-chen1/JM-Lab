// 语音服务 - 语音识别(STT)和语音合成(TTS)


// 语音识别配置
interface STTConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxDuration: number;
}

// 语音合成配置
interface TTSConfig {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

// 语音识别结果
export interface STTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  duration: number;
}

// 语音命令
export interface VoiceCommand {
  command: string;
  action: string;
  parameters: Record<string, any>;
  confidence: number;
}

// 默认配置
const DEFAULT_STT_CONFIG: STTConfig = {
  language: 'zh-CN',
  continuous: true,
  interimResults: true,
  maxDuration: 60000 // 最大60秒
};

const DEFAULT_TTS_CONFIG: TTSConfig = {
  voice: 'zh-CN-XiaoxiaoNeural',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0
};

// 语音命令模式
const VOICE_COMMANDS: { pattern: RegExp; command: string; action: string }[] = [
  { pattern: /^(开始|启动|创建|新建).*(设计|任务)/, command: 'create_design', action: 'start_design_task' },
  { pattern: /^(切换|换|选择).*(风格|样式)/, command: 'switch_style', action: 'switch_style' },
  { pattern: /^(生成|创建|做).*(图像|图片|设计)/, command: 'generate_image', action: 'generate_image' },
  { pattern: /^(确认|确定|好的|可以)/, command: 'confirm', action: 'confirm_action' },
  { pattern: /^(取消|停止|放弃|算了)/, command: 'cancel', action: 'cancel_action' },
  { pattern: /^(重新|再来|重做)/, command: 'restart', action: 'restart_task' },
  { pattern: /^(帮助|怎么|如何)/, command: 'help', action: 'show_help' },
  { pattern: /^(保存|存储|下载)/, command: 'save', action: 'save_output' },
  { pattern: /^(发送|提交|说完了)/, command: 'send', action: 'send_message' }
];

/**
 * 语音服务
 * 提供语音识别(STT)和语音合成(TTS)功能
 */
export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isSpeaking = false;
  private sttConfig: STTConfig = DEFAULT_STT_CONFIG;
  private ttsConfig: TTSConfig = DEFAULT_TTS_CONFIG;
  private onResultCallback: ((result: STTResult) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化语音服务
   */
  private initialize(): void {
    // 检查浏览器支持
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.warn('[Voice] Speech recognition not supported');
    }

    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.warn('[Voice] Speech synthesis not supported');
    }
  }

  /**
   * 设置语音识别
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.sttConfig.continuous;
    this.recognition.interimResults = this.sttConfig.interimResults;
    this.recognition.lang = this.sttConfig.language;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal || this.sttConfig.interimResults) {
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;

        const result: STTResult = {
          transcript,
          confidence,
          isFinal: lastResult.isFinal,
          duration: Date.now() // 简化计算
        };

        this.onResultCallback?.(result);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Voice] Recognition error:', event.error);
      this.onErrorCallback?.(new Error(event.error));
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEndCallback?.();
    };
  }

  // ==================== 语音识别 (STT) ====================

  /**
   * 开始语音识别
   */
  startListening(options?: {
    onResult?: (result: STTResult) => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
  }): boolean {
    if (!this.recognition) {
      console.error('[Voice] Speech recognition not available');
      return false;
    }

    if (this.isListening) {
      console.warn('[Voice] Already listening');
      return false;
    }

    this.onResultCallback = options?.onResult || null;
    this.onEndCallback = options?.onEnd || null;
    this.onErrorCallback = options?.onError || null;

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('[Voice] Started listening');
      return true;
    } catch (error) {
      console.error('[Voice] Failed to start listening:', error);
      return false;
    }
  }

  /**
   * 停止语音识别
   */
  stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
      this.isListening = false;
      console.log('[Voice] Stopped listening');
    } catch (error) {
      console.error('[Voice] Failed to stop listening:', error);
    }
  }

  /**
   * 是否正在监听
   */
  isListeningActive(): boolean {
    return this.isListening;
  }

  // ==================== 语音合成 (TTS) ====================

  /**
   * 语音合成
   */
  async speak(text: string, options?: Partial<TTSConfig>): Promise<boolean> {
    if (!this.synthesis) {
      console.error('[Voice] Speech synthesis not available');
      return false;
    }

    // 停止当前播放
    this.stopSpeaking();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 配置
      utterance.lang = this.ttsConfig.voice.startsWith('zh') ? 'zh-CN' : 'en-US';
      utterance.rate = options?.rate || this.ttsConfig.rate;
      utterance.pitch = options?.pitch || this.ttsConfig.pitch;
      utterance.volume = options?.volume || this.ttsConfig.volume;

      // 选择声音
      const voices = this.synthesis!.getVoices();
      const voice = voices.find(v => v.lang.includes('zh')) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('[Voice] Started speaking');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        console.log('[Voice] Finished speaking');
        resolve(true);
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('[Voice] Speech error:', event.error);
        resolve(false);
      };

      this.synthesis!.speak(utterance);
    });
  }

  /**
   * 停止语音合成
   */
  stopSpeaking(): void {
    if (!this.synthesis) return;

    this.synthesis.cancel();
    this.isSpeaking = false;
    console.log('[Voice] Stopped speaking');
  }

  /**
   * 是否正在播放
   */
  isSpeakingActive(): boolean {
    return this.isSpeaking;
  }

  // ==================== 语音命令识别 ====================

  /**
   * 识别语音命令
   */
  recognizeCommand(transcript: string): VoiceCommand | null {
    const normalized = transcript.toLowerCase().trim();

    for (const cmd of VOICE_COMMANDS) {
      const match = normalized.match(cmd.pattern);
      if (match) {
        return {
          command: cmd.command,
          action: cmd.action,
          parameters: this.extractParameters(normalized, cmd.command),
          confidence: 0.85
        };
      }
    }

    // 如果没有匹配到命令，返回通用消息命令
    return {
      command: 'message',
      action: 'send_message',
      parameters: { text: transcript },
      confidence: 0.9
    };
  }

  /**
   * 提取命令参数
   */
  private extractParameters(transcript: string, command: string): Record<string, any> {
    const params: Record<string, any> = {};

    // 提取风格
    const styleMatch = transcript.match(/(温馨|可爱|简约|科技|复古|梦幻|手绘|现代)/);
    if (styleMatch) {
      params.style = styleMatch[1];
    }

    // 提取设计类型
    const typeMatch = transcript.match(/(IP|Logo|海报|包装|插画|品牌)/i);
    if (typeMatch) {
      params.designType = typeMatch[1];
    }

    // 提取完整文本
    params.text = transcript;

    return params;
  }

  // ==================== 高级功能 ====================

  /**
   * 语音转文字（完整流程）
   */
  async speechToText(maxDuration: number = 30000): Promise<STTResult | null> {
    return new Promise((resolve, reject) => {
      let finalResult: STTResult | null = null;
      const startTime = Date.now();

      const success = this.startListening({
        onResult: (result) => {
          if (result.isFinal) {
            finalResult = result;
          }
        },
        onEnd: () => {
          resolve(finalResult);
        },
        onError: (error) => {
          reject(error);
        }
      });

      if (!success) {
        reject(new Error('Failed to start listening'));
        return;
      }

      // 超时自动停止
      setTimeout(() => {
        this.stopListening();
      }, maxDuration);
    });
  }

  /**
   * 文字转语音（完整流程）
   */
  async textToSpeech(text: string, options?: Partial<TTSConfig>): Promise<boolean> {
    return this.speak(text, options);
  }

  /**
   * 语音对话（听+说）
   */
  async voiceDialog(
    onHeard: (text: string) => Promise<string>
  ): Promise<void> {
    // 听
    const result = await this.speechToText();
    if (!result) return;

    // 处理
    const response = await onHeard(result.transcript);

    // 说
    await this.speak(response);
  }

  // ==================== 配置 ====================

  /**
   * 配置STT
   */
  configureSTT(config: Partial<STTConfig>): void {
    this.sttConfig = { ...this.sttConfig, ...config };
    this.setupRecognition();
  }

  /**
   * 配置TTS
   */
  configureTTS(config: Partial<TTSConfig>): void {
    this.ttsConfig = { ...this.ttsConfig, ...config };
  }

  /**
   * 获取可用声音列表
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * 检查支持情况
   */
  getSupportStatus(): {
    stt: boolean;
    tts: boolean;
    isListening: boolean;
    isSpeaking: boolean;
  } {
    return {
      stt: !!this.recognition,
      tts: !!this.synthesis,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking
    };
  }
}

// 导出单例
let voiceServiceInstance: VoiceService | null = null;

export function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
}

export function resetVoiceService(): void {
  voiceServiceInstance = null;
}

// TypeScript 类型声明扩展
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
