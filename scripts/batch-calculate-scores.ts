import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量：VITE_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  console.error('请确保 .env 文件中包含这些变量');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 评分算法（直接内嵌，避免导入问题）
function calculateAuthenticityScore(title: string, description?: string): number {
  const fullText = `${title} ${description || ''}`.toLowerCase();
  let score = 50;

  const personalMarkers = [
    '我', '我的', '我们', '我觉得', '我认为', '我感受到',
    'i ', 'my ', 'me ', 'we ', 'our ',
    'experience', 'feel', 'think', 'believe'
  ];
  const personalCount = personalMarkers.reduce((count, marker) => {
    const regex = new RegExp(marker, 'gi');
    const matches = fullText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  score += Math.min(personalCount * 3, 25);

  const detailIndicators = ['。', '，', '.', ',', ';', '；'];
  const punctuationCount = detailIndicators.reduce((count, p) => {
    return count + (fullText.split(p).length - 1);
  }, 0);
  score += Math.min(punctuationCount * 2, 15);

  const aiPatterns = [
    'as an ai', 'i am an ai', 'language model', 'artificial intelligence',
    'ai assistant', 'i cannot', 'i\'m sorry, but i',
    '作为ai', '我是人工智能', '我是ai', '我无法'
  ];
  const aiPatternCount = aiPatterns.reduce((count, pattern) => {
    return fullText.includes(pattern) ? count + 1 : count;
  }, 0);
  score -= aiPatternCount * 30;

  return Math.max(0, Math.min(100, score));
}

function calculateAIRiskScore(title: string, description?: string): number {
  const fullText = `${title} ${description || ''}`.toLowerCase();
  let riskScore = 30;

  const aiPhrases = [
    'as an ai language model', 'i am an ai', 'as an artificial intelligence',
    'i don\'t have personal', 'i don\'t have feelings', 'i cannot experience',
    '我是ai', '我是人工智能', '作为语言模型', '我没有感情', '我无法体验'
  ];
  const aiPhraseCount = aiPhrases.reduce((count, phrase) => {
    return fullText.includes(phrase) ? count + 1 : count;
  }, 0);
  riskScore += aiPhraseCount * 25;

  const genericPatterns = [
    'in conclusion', 'to summarize', 'overall', 'in summary',
    '综上所述', '总的来说', '总而言之', '总结一下'
  ];
  const genericCount = genericPatterns.reduce((count, pattern) => {
    return fullText.includes(pattern) ? count + 1 : count;
  }, 0);
  riskScore += genericCount * 10;

  const repetitivePhrases = fullText.match(/\b(\w+)\s+\1\b/gi) || [];
  riskScore += Math.min(repetitivePhrases.length * 5, 20);

  return Math.max(0, Math.min(100, riskScore));
}

function calculateSpamScore(title: string, description?: string): number {
  const fullText = `${title} ${description || ''}`.toLowerCase();
  let spamScore = 10;

  const spamKeywords = [
    'click here', 'buy now', 'limited time', 'act now', 'order now',
    'free', 'winner', 'congratulations', 'urgent', 'exclusive offer',
    '立即购买', '限时优惠', '免费', '中奖', '恭喜您', '紧急', '独家优惠'
  ];
  const spamCount = spamKeywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'gi');
    const matches = fullText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  spamScore += spamCount * 15;

  const urlPattern = /(https?:\/\/|www\.)[^\s]+/gi;
  const urlCount = (fullText.match(urlPattern) || []).length;
  spamScore += urlCount * 10;

  const capsPattern = /[A-Z]{3,}/g;
  const capsCount = (fullText.match(capsPattern) || []).length;
  spamScore += capsCount * 5;

  return Math.max(0, Math.min(100, spamScore));
}

function detectCulturalElements(title: string, description?: string): string[] {
  const fullText = `${title} ${description || ''}`;
  const elements: string[] = [];

  const culturalKeywords: Record<string, string[]> = {
    '书法': ['书法', '毛笔', '楷书', '行书', '草书', '隶书', '篆书', 'calligraphy'],
    '绘画': ['国画', '水墨', '工笔', '写意', '山水画', '花鸟画', 'painting'],
    '剪纸': ['剪纸', '窗花', 'paper cutting'],
    '陶瓷': ['陶瓷', '瓷器', '青花瓷', 'pottery', 'porcelain'],
    '刺绣': ['刺绣', '苏绣', '湘绣', '蜀绣', '粤绣', 'embroidery'],
    '木雕': ['木雕', '根雕', 'wood carving'],
    '泥塑': ['泥塑', '面塑', 'clay sculpture'],
    '编织': ['编织', '竹编', '草编', 'weaving', 'basketry'],
    '皮影': ['皮影', 'shadow puppet'],
    '年画': ['年画', '门神', 'New Year painting'],
    '蜡染': ['蜡染', '扎染', 'batik'],
    '银饰': ['银饰', '银器', 'silverware'],
    '茶文化': ['茶', '茶道', '茶艺', 'tea ceremony'],
    '传统音乐': ['古琴', '古筝', '二胡', '笛子', '琵琶', 'traditional music'],
    '戏曲': ['京剧', '昆曲', '越剧', '黄梅戏', 'opera'],
    '武术': ['武术', '太极', '功夫', 'kung fu', 'martial arts'],
    '传统节日': ['春节', '中秋', '端午', '清明', '元宵', 'traditional festival'],
    '民俗': ['民俗', '民间', 'folk', 'custom']
  };

  for (const [element, keywords] of Object.entries(culturalKeywords)) {
    if (keywords.some(keyword => fullText.toLowerCase().includes(keyword.toLowerCase()))) {
      elements.push(element);
    }
  }

  return [...new Set(elements)];
}

function calculateScores(title: string, description?: string) {
  return {
    authenticity_score: calculateAuthenticityScore(title, description),
    ai_risk_score: calculateAIRiskScore(title, description),
    spam_score: calculateSpamScore(title, description),
    cultural_elements: detectCulturalElements(title, description)
  };
}

async function batchCalculateScores() {
  console.log('🚀 开始批量计算作品评分...\n');

  // 获取所有没有评分的作品
  const { data: works, error } = await supabaseAdmin
    .from('works')
    .select('id, title, description')
    .or('authenticity_score.is.null,authenticity_score.eq.0');

  if (error) {
    console.error('❌ 获取作品失败:', error);
    return;
  }

  if (!works || works.length === 0) {
    console.log('✅ 没有需要计算评分的作品');
    return;
  }

  console.log(`📊 找到 ${works.length} 个需要计算评分的作品\n`);

  let successCount = 0;
  let failCount = 0;

  for (const work of works) {
    try {
      const scores = calculateScores(
        work.title,
        work.description
      );

      const { error: updateError } = await supabaseAdmin
        .from('works')
        .update({
          authenticity_score: scores.authenticity_score,
          ai_risk_score: scores.ai_risk_score,
          spam_score: scores.spam_score,
          cultural_elements: scores.cultural_elements,
          scores_updated_at: new Date().toISOString()
        })
        .eq('id', work.id);

      if (updateError) {
        console.error(`❌ 更新作品 ${work.id} 失败:`, updateError);
        failCount++;
      } else {
        successCount++;
        const title = work.title?.substring(0, 30) || '无标题';
        console.log(`✓ "${title}${work.title?.length > 30 ? '...' : ''}"`);
        console.log(`  真实性: ${scores.authenticity_score} | AI风险: ${scores.ai_risk_score} | 垃圾内容: ${scores.spam_score}`);
        if (scores.cultural_elements.length > 0) {
          console.log(`  文化元素: ${scores.cultural_elements.join(', ')}`);
        }
        console.log('');
      }
    } catch (err) {
      console.error(`❌ 处理作品 ${work.id} 时出错:`, err);
      failCount++;
    }
  }

  console.log('========================================');
  console.log('🎉 批量计算完成！');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log('========================================');
}

batchCalculateScores();
