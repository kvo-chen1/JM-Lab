/**
 * 联网搜索服务
 * 提供多种搜索 API 支持，包括 Tavily、SerpAPI、Bing Search 等
 */

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  publishedDate?: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  answer?: string;
  query: string;
  totalResults?: number;
}

// Tavily API 响应类型
interface TavilyResponse {
  answer?: string;
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    published_date?: string;
  }>;
}

// SerpAPI 响应类型
interface SerpApiResponse {
  organic_results?: Array<{
    title: string;
    link: string;
    snippet: string;
    source?: string;
    date?: string;
  }>;
}

// Bing Search API 响应类型
interface BingResponse {
  webPages?: {
    value: Array<{
      name: string;
      url: string;
      snippet: string;
      datePublished?: string;
    }>;
  };
}

/**
 * 使用 Tavily API 进行搜索（推荐）
 * 专为 AI 应用设计，返回结构化数据
 */
export const performTavilySearch = async (
  query: string,
  options?: { limit?: number; includeAnswer?: boolean; signal?: AbortSignal }
): Promise<WebSearchResponse> => {
  const apiKey = import.meta.env.VITE_TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('Tavily API Key 未配置，请在环境变量中设置 VITE_TAVILY_API_KEY');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: options?.limit || 5,
      include_answer: options?.includeAnswer ?? true,
      search_depth: 'basic',
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tavily API 错误: ${error}`);
  }

  const data: TavilyResponse = await response.json();

  return {
    query: data.query,
    answer: data.answer,
    results: data.results.map((r) => ({
      title: r.title,
      link: r.url,
      snippet: r.content,
      source: new URL(r.url).hostname,
      publishedDate: r.published_date,
    })),
  };
};

/**
 * 使用 SerpAPI 进行搜索
 */
export const performSerpApiSearch = async (
  query: string,
  options?: { limit?: number; signal?: AbortSignal }
): Promise<WebSearchResponse> => {
  const apiKey = import.meta.env.VITE_SERPAPI_KEY;

  if (!apiKey) {
    throw new Error('SerpAPI Key 未配置，请在环境变量中设置 VITE_SERPAPI_KEY');
  }

  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: apiKey,
    num: String(options?.limit || 5),
  });

  const response = await fetch(`https://serpapi.com/search?${params}`, {
    signal: options?.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SerpAPI 错误: ${error}`);
  }

  const data: SerpApiResponse = await response.json();

  return {
    query,
    results:
      data.organic_results?.map((r) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
        source: r.source || new URL(r.link).hostname,
        publishedDate: r.date,
      })) || [],
  };
};

/**
 * 使用 Bing Search API 进行搜索
 */
export const performBingSearch = async (
  query: string,
  options?: { limit?: number; signal?: AbortSignal }
): Promise<WebSearchResponse> => {
  const apiKey = import.meta.env.VITE_BING_SEARCH_API_KEY;

  if (!apiKey) {
    throw new Error('Bing Search API Key 未配置，请在环境变量中设置 VITE_BING_SEARCH_API_KEY');
  }

  const response = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${options?.limit || 5}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
      signal: options?.signal,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bing Search API 错误: ${error}`);
  }

  const data: BingResponse = await response.json();

  return {
    query,
    results:
      data.webPages?.value.map((r) => ({
        title: r.name,
        link: r.url,
        snippet: r.snippet,
        source: new URL(r.url).hostname,
        publishedDate: r.datePublished,
      })) || [],
  };
};

/**
 * 默认搜索函数 - 自动选择可用的搜索 API
 * 优先级：Tavily > SerpAPI > Bing Search
 */
export const performWebSearch = async (
  query: string,
  options?: { limit?: number; includeAnswer?: boolean; signal?: AbortSignal }
): Promise<WebSearchResponse> => {
  // 检查配置了哪个 API
  const tavilyKey = import.meta.env.VITE_TAVILY_API_KEY;
  const serpApiKey = import.meta.env.VITE_SERPAPI_KEY;
  const bingKey = import.meta.env.VITE_BING_SEARCH_API_KEY;

  if (tavilyKey) {
    console.log('[WebSearch] 使用 Tavily API');
    return performTavilySearch(query, options);
  }

  if (serpApiKey) {
    console.log('[WebSearch] 使用 SerpAPI');
    return performSerpApiSearch(query, options);
  }

  if (bingKey) {
    console.log('[WebSearch] 使用 Bing Search API');
    return performBingSearch(query, options);
  }

  // 如果没有配置任何 API，返回模拟数据（用于开发测试）
  console.warn('[WebSearch] 未配置任何搜索 API，返回模拟数据');
  return getMockSearchResults(query);
};

/**
 * 获取模拟搜索结果（用于开发和测试）
 */
const getMockSearchResults = (query: string): WebSearchResponse => {
  return {
    query,
    answer: `关于 "${query}" 的搜索结果（这是模拟数据，请配置搜索 API 以获取真实结果）`,
    results: [
      {
        title: `关于 ${query} 的相关信息`,
        link: 'https://example.com/result1',
        snippet: `这是关于 ${query} 的模拟搜索结果。在实际配置搜索 API 后，这里将显示真实的搜索结果。`,
        source: 'example.com',
      },
      {
        title: `${query} - 百度百科`,
        link: 'https://baike.baidu.com',
        snippet: `${query} 是一个热门话题，在这里可以找到详细的介绍和相关信息。`,
        source: 'baike.baidu.com',
      },
      {
        title: `${query} 的最新资讯`,
        link: 'https://news.example.com',
        snippet: `获取 ${query} 的最新动态和相关新闻报道。`,
        source: 'news.example.com',
      },
    ],
  };
};

/**
 * 格式化搜索结果为文本
 */
export const formatSearchResults = (response: WebSearchResponse): string => {
  const { results, answer } = response;

  let formatted = '';

  // 如果有 AI 生成的摘要，先显示
  if (answer) {
    formatted += `📋 **搜索摘要**\n\n${answer}\n\n---\n\n`;
  }

  // 显示搜索结果
  if (results.length > 0) {
    formatted += `🔍 **搜索结果**\n\n`;
    results.forEach((result, index) => {
      formatted += `${index + 1}. **${result.title}**\n`;
      formatted += `${result.snippet}\n`;
      formatted += `来源：[${result.source}](${result.link})\n\n`;
    });
  } else {
    formatted += '未找到相关搜索结果。';
  }

  return formatted.trim();
};

/**
 * 构建用于 LLM 的搜索上下文
 */
export const buildSearchContext = (response: WebSearchResponse): string => {
  const { results, answer } = response;

  let context = '';

  if (answer) {
    context += `搜索摘要：${answer}\n\n`;
  }

  if (results.length > 0) {
    context += '搜索结果：\n';
    results.forEach((result, index) => {
      context += `${index + 1}. ${result.title}\n`;
      context += `内容：${result.snippet}\n`;
      context += `来源：${result.source}\n\n`;
    });
  }

  return context.trim();
};

export default {
  performWebSearch,
  performTavilySearch,
  performSerpApiSearch,
  performBingSearch,
  formatSearchResults,
  buildSearchContext,
};
