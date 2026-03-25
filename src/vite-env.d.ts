/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TAVILY_API_KEY: string
  readonly VITE_SERPAPI_KEY: string
  readonly VITE_BING_SEARCH_API_KEY: string
  readonly VITE_QWEN_API_KEY: string
  readonly VITE_KIMI_API_KEY: string
  readonly VITE_DEEPSEEK_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
