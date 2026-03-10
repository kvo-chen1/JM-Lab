/**
 * 方言服务模块 - 提供天津方言相关功能
 */

/**
 * 天津方言词库
 */
const tianjinDialectDictionary: Record<string, string> = {
  '嘛呀': '什么',
  '结界': '地方、区域',
  '倍儿好': '非常好、特别好',
  '介似嘛': '这是什么',
  '逗你玩儿': '开玩笑、逗乐',
  '嘛钱不钱，乐呵乐呵得了': '不要太在意金钱，开心最重要',
  '嘛钱不钱乐呵乐呵得了': '不要太在意金钱，开心最重要',
  '干嘛': '做什么',
  '嘛事儿': '什么事情',
  '就介意思': '就是这个意思',
  '介小子': '这个小伙子',
  '介闺女': '这个姑娘',
  '得嘞': '好的、没问题',
  '哏儿': '有趣、好玩',
  '真哏儿': '真有趣',
  '嘛都不懂': '什么都不懂',
  '嘛时候': '什么时候',
  '就嘛意思': '就是这个意思',
  '介地儿': '这个地方',
  '恁么了': '怎么了',
  '瞎掰': '胡说、撒谎',
  '逗闷子': '开玩笑、逗乐',
  '起腻': '纠缠、撒娇',
  '显摆': '炫耀',
  '得亏': '幸亏',
  '滋要是': '只要是',
  '嘛钱不钱乐呵乐呵': '不要太在意金钱，开心最重要',
  '结界儿': '地方、区域',
  '介似': '这是',
  '嘛玩应': '什么东西',
  '倍儿哏儿': '非常有趣',
  '倍儿棒': '非常棒',
  '介不扯呢吗': '这不是瞎扯吗',
  '嘛叫事儿': '什么叫事儿',
  '就介样儿': '就这样',
  '介不四儿': '这不是',
  '恁么着': '怎么着',
  '得啵得': '唠叨',
  '瞎咧咧': '胡说八道',
  '腻歪': '讨厌、烦',
  '揍性': '德性、样子',
  '嘛玩意儿': '什么东西',
  '介不四儿嘛': '这不就是嘛',
  '倍儿地道': '非常地道',
  '倍儿有面儿': '非常有面子',
  '嘛钱不钱乐呵乐呵得了啊': '不要太在意金钱，开心最重要啊',
  '逗你玩': '逗你玩',
  '介小子真哏儿': '这个小伙子真有趣',
  '介闺女真俊': '这个姑娘真漂亮',
  '嘛时候来的': '什么时候来的',
  '就介意思得了': '就是这个意思得了',
  '介地儿倍儿好': '这个地方非常好',
  '恁么了这是': '怎么了这是',
  '瞎掰嘛你': '你胡说什么呢',
  '逗闷子呢': '开玩笑呢',
  '别起腻': '别纠缠',
  '显摆嘛': '炫耀什么',
  '得亏你了': '幸亏有你',
  '滋要是你': '只要是你'
};

/**
 * 方言服务类
 */
class DialectService {
  /**
   * 将天津方言翻译为普通话
   * @param dialect 天津方言文本
   * @returns 翻译后的普通话文本
   */
  translateToMandarin(dialect: string): string {
    let translated = dialect;
    
    // 遍历词库，替换方言词汇
    Object.keys(tianjinDialectDictionary).forEach(dialectWord => {
      const mandarinWord = tianjinDialectDictionary[dialectWord];
      // 创建正则表达式，确保全词匹配
      const regex = new RegExp(`\\b${dialectWord}\\b`, 'gi');
      translated = translated.replace(regex, mandarinWord);
    });
    
    return translated;
  }
  
  /**
   * 检测文本中是否包含天津方言
   * @param text 输入文本
   * @returns 是否包含天津方言
   */
  containsTianjinDialect(text: string): boolean {
    // 检查是否包含任何方言词汇
    return Object.keys(tianjinDialectDictionary).some(dialectWord => 
      text.toLowerCase().includes(dialectWord.toLowerCase())
    );
  }
  
  /**
   * 获取文本中的天津方言词汇列表
   * @param text 输入文本
   * @returns 方言词汇列表
   */
  getDialectWordsInText(text: string): Array<{word: string, meaning: string}> {
    const result: Array<{word: string, meaning: string}> = [];
    
    // 查找文本中包含的所有方言词汇
    Object.keys(tianjinDialectDictionary).forEach(dialectWord => {
      if (text.toLowerCase().includes(dialectWord.toLowerCase())) {
        result.push({
          word: dialectWord,
          meaning: tianjinDialectDictionary[dialectWord]
        });
      }
    });
    
    return result;
  }
  
  /**
   * 将普通话转换为天津方言风格
   * 注意：这只是简单的示例转换，真实的方言转换需要更复杂的逻辑
   * @param mandarin 普通话文本
   * @returns 方言风格文本
   */
  convertToTianjinStyle(mandarin: string): string {
    let result = mandarin;
    
    // 简单的词汇替换
    const replacements: Record<string, string> = {
      '什么': '嘛',
      '这个地方': '介地儿',
      '非常好': '倍儿好',
      '开玩笑': '逗闷子',
      '怎么了': '恁么了',
      '没有问题': '得嘞',
      '炫耀': '显摆',
      '有趣': '哏儿',
      '只要': '滋要是',
      '幸亏': '得亏',
      '这个': '介',
      '这个是': '介似',
      '什么东西': '嘛玩应',
      '非常有趣': '倍儿哏儿',
      '非常棒': '倍儿棒',
      '这不是瞎扯吗': '介不扯呢吗',
      '什么叫事儿': '嘛叫事儿',
      '就这样': '就介样儿',
      '这不是': '介不四儿',
      '怎么着': '恁么着',
      '唠叨': '得啵得',
      '胡说八道': '瞎咧咧',
      '讨厌': '腻歪',
      '德性': '揍性',
      '非常地道': '倍儿地道',
      '非常有面子': '倍儿有面儿',
      '这个小伙子': '介小子',
      '这个姑娘': '介闺女',
      '真漂亮': '真俊',
      '什么时候来的': '嘛时候来的',
      '就是这个意思得了': '就介意思得了',
      '这个地方非常好': '介地儿倍儿好',
      '怎么了这是': '恁么了这是',
      '你胡说什么呢': '瞎掰嘛你',
      '开玩笑呢': '逗闷子呢',
      '别纠缠': '别起腻',
      '炫耀什么': '显摆嘛',
      '幸亏有你': '得亏你了',
      '只要是你': '滋要是你'
    };
    
    // 替换词汇
    Object.keys(replacements).forEach(mandarinWord => {
      const dialectWord = replacements[mandarinWord];
      const regex = new RegExp(`\\b${mandarinWord}\\b`, 'gi');
      result = result.replace(regex, dialectWord);
    });
    
    // 添加天津方言特有的语气词
    if (result.endsWith('。') || result.endsWith('！') || result.endsWith('？')) {
      result = result.slice(0, -1) + '啊';
    }
    
    return result;
  }

  /**
   * 语音合成 - 朗读天津方言
   * @param text 要朗读的文本
   * @param isDialect 是否为方言文本
   * @returns Promise<void>
   */
  async speakTianjinDialect(text: string, isDialect: boolean = true): Promise<void> {
    try {
      // 检查浏览器是否支持语音合成
      if (!('speechSynthesis' in window)) {
        throw new Error('浏览器不支持语音合成功能');
      }

      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置语音参数
      utterance.lang = 'zh-CN'; // 使用中文语音
      utterance.rate = 0.9; // 语速稍慢，更清晰
      utterance.pitch = 1.0; // 音调正常
      utterance.volume = 1.0; // 音量最大

      // 尝试使用天津方言语音（如果可用）
      // 通常浏览器会使用默认的中文语音，这里我们可以尝试选择合适的语音
      const voices = speechSynthesis.getVoices();
      const chineseVoices = voices.filter(voice => 
        voice.lang.includes('zh') || voice.name.includes('Chinese') || voice.name.includes('中文')
      );
      
      if (chineseVoices.length > 0) {
        // 选择第一个中文语音
        utterance.voice = chineseVoices[0];
      }

      // 开始语音合成
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('语音合成失败:', error);
      throw error;
    }
  }

  /**
   * 获取天津方言常用短语列表
   * @returns 常用短语列表
   */
  getCommonPhrases(): Array<{phrase: string, meaning: string}> {
    // 从词库中选择一些常用短语
    const commonPhrases = [
      { phrase: '嘛呀', meaning: '什么' },
      { phrase: '倍儿好', meaning: '非常好、特别好' },
      { phrase: '介似嘛', meaning: '这是什么' },
      { phrase: '逗你玩儿', meaning: '开玩笑、逗乐' },
      { phrase: '嘛钱不钱，乐呵乐呵得了', meaning: '不要太在意金钱，开心最重要' },
      { phrase: '干嘛', meaning: '做什么' },
      { phrase: '得嘞', meaning: '好的、没问题' },
      { phrase: '真哏儿', meaning: '真有趣' },
      { phrase: '介地儿', meaning: '这个地方' },
      { phrase: '恁么了', meaning: '怎么了' },
      { phrase: '逗闷子', meaning: '开玩笑、逗乐' },
      { phrase: '显摆', meaning: '炫耀' },
      { phrase: '得亏', meaning: '幸亏' },
      { phrase: '滋要是', meaning: '只要是' },
      { phrase: '倍儿地道', meaning: '非常地道' },
      { phrase: '倍儿有面儿', meaning: '非常有面子' },
      { phrase: '介不扯呢吗', meaning: '这不是瞎扯吗' },
      { phrase: '嘛叫事儿', meaning: '什么叫事儿' },
      { phrase: '就介样儿', meaning: '就这样' }
    ];
    
    return commonPhrases;
  }

  /**
   * 批量转换文本为天津方言
   * @param texts 要转换的文本数组
   * @returns 转换后的方言文本数组
   */
  batchConvertToTianjinStyle(texts: string[]): string[] {
    return texts.map(text => this.convertToTianjinStyle(text));
  }

  /**
   * 批量将天津方言翻译为普通话
   * @param dialects 要翻译的方言文本数组
   * @returns 翻译后的普通话文本数组
   */
  batchTranslateToMandarin(dialects: string[]): string[] {
    return dialects.map(dialect => this.translateToMandarin(dialect));
  }
}

// 导出单例实例
export default new DialectService();
