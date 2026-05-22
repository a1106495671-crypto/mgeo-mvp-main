export type TrendDirection = "up" | "down" | "flat";

export type OpenRouterRankItem = {
  rank: number;
  name: string;
  author: string;
  tokens: string;
  tokenValueT: number;
  change: number;
  direction: TrendDirection;
};

export type MarketShareItem = {
  rank: number;
  author: string;
  tokens: string;
  share: number;
  valueT: number;
  color: string;
};

export type BenchmarkItem = {
  rank: number;
  name: string;
  author: string;
  score: number;
  price: number;
  color: string;
};

export type FastestModelItem = {
  rank: number;
  name: string;
  provider: string;
  speed: number;
  price: number;
  color: string;
};

export type OpenRouterAppItem = {
  rank: number;
  name: string;
  author: string;
  tokens: string;
  tokenValueB: number;
  change: number;
  direction: TrendDirection;
};

export type OpenRouterMetricItem = {
  rank: number;
  name: string;
  author: string;
  metric: string;
  subMetric?: string;
  value: number;
  change: number;
  direction: TrendDirection;
  color?: string;
};

export const OPENROUTER_RANKING_SOURCE = "https://openrouter.ai/rankings?view=week";

export const authorColors: Record<string, string> = {
  deepseek: "#ff7a45",
  anthropic: "#f5b52e",
  google: "#1685f8",
  tencent: "#09bda5",
  openrouter: "#6b8e23",
  qwen: "#8acc2a",
  moonshotai: "#ee7f88",
  minimax: "#ff5eb3",
  openai: "#111827",
  nvidia: "#78c941",
  stepfun: "#4aa3df",
  zhipu: "#8b5cf6",
  meta: "#4f99dc",
  xiaomi: "#7b61ff",
  alibaba: "#f59e0b",
  mistral: "#d465cf",
  groq: "#39d6c8",
  cerebras: "#2dd4bf",
  inception: "#f7b731",
  xai: "#2f9b65",
  mistralai: "#d465cf",
  nousresearch: "#b9b9b9",
  openclaw: "#b9b9b9",
  kilocode: "#b9b9b9",
  css: "#b9b9b9",
  descript: "#b9b9b9",
  inflection: "#b9b9b9",
  janitorai: "#b9b9b9",
  isekai: "#b9b9b9",
  roocode: "#b9b9b9",
  others: "#b9b9b9",
};

export const topModelAuthors = ["tencent", "deepseek", "anthropic", "google", "openrouter", "moonshotai", "minimax", "qwen", "others"];

export const weekLabels = ["2025年5月26日", "7月7日", "8月18日", "9月29日", "11月10日", "12月22日", "2月2日", "3月16日", "4月27日"];

export const openRouterWeeklySnapshot: OpenRouterRankItem[] = [
  { rank: 1, name: "Hy3 preview", author: "tencent", tokens: "2.85T", tokenValueT: 2.85, change: 41, direction: "up" },
  { rank: 2, name: "DeepSeek V4 Flash", author: "deepseek", tokens: "2.76T", tokenValueT: 2.76, change: 102, direction: "up" },
  { rank: 3, name: "Claude Sonnet 4.6", author: "anthropic", tokens: "1.56T", tokenValueT: 1.56, change: 3, direction: "up" },
  { rank: 4, name: "Claude Opus 4.7", author: "anthropic", tokens: "1.41T", tokenValueT: 1.41, change: 8, direction: "down" },
  { rank: 5, name: "Owl Alpha", author: "openrouter", tokens: "1.21T", tokenValueT: 1.21, change: 115, direction: "up" },
  { rank: 6, name: "Gemini 3 Flash Preview", author: "google", tokens: "1.12T", tokenValueT: 1.12, change: 1, direction: "down" },
  { rank: 7, name: "DeepSeek V3.2", author: "deepseek", tokens: "1.12T", tokenValueT: 1.12, change: 20, direction: "up" },
  { rank: 8, name: "DeepSeek V4 Pro", author: "deepseek", tokens: "950B", tokenValueT: 0.95, change: 8, direction: "up" },
  { rank: 9, name: "Step 3.5 Flash", author: "stepfun", tokens: "790B", tokenValueT: 0.79, change: 43, direction: "up" },
  { rank: 10, name: "Kimi K2.6", author: "moonshotai", tokens: "782B", tokenValueT: 0.782, change: 4, direction: "down" },
  { rank: 11, name: "MiniMax M2.7", author: "minimax", tokens: "637B", tokenValueT: 0.637, change: 17, direction: "down" },
  { rank: 12, name: "Nemotron 3 Super (free)", author: "nvidia", tokens: "589B", tokenValueT: 0.589, change: 2, direction: "down" },
  { rank: 13, name: "Gemini 2.5 Flash", author: "google", tokens: "566B", tokenValueT: 0.566, change: 1, direction: "down" },
  { rank: 14, name: "Gemini 2.5 Flash Lite", author: "google", tokens: "550B", tokenValueT: 0.55, change: 8, direction: "down" },
  { rank: 15, name: "Claude Opus 4.6", author: "anthropic", tokens: "542B", tokenValueT: 0.542, change: 10, direction: "down" },
  { rank: 16, name: "Gemini 3.1 Pro Preview", author: "google", tokens: "502B", tokenValueT: 0.502, change: 73, direction: "up" },
  { rank: 17, name: "GPT-5.5", author: "openai", tokens: "478B", tokenValueT: 0.478, change: 5, direction: "up" },
  { rank: 18, name: "gpt-oss-120b", author: "openai", tokens: "440B", tokenValueT: 0.44, change: 14, direction: "up" },
  { rank: 19, name: "Gemini 3.1 Flash Lite Preview", author: "google", tokens: "385B", tokenValueT: 0.385, change: 17, direction: "up" },
  { rank: 20, name: "GLM 5.1", author: "zhipu", tokens: "381B", tokenValueT: 0.381, change: 6, direction: "up" },
];

export const marketShareSnapshot: MarketShareItem[] = [
  { rank: 1, author: "deepseek", tokens: "2.92T", valueT: 2.92, share: 19.1, color: authorColors.deepseek },
  { rank: 2, author: "anthropic", tokens: "2.38T", valueT: 2.38, share: 15.6, color: authorColors.anthropic },
  { rank: 3, author: "google", tokens: "2.37T", valueT: 2.37, share: 15.5, color: authorColors.google },
  { rank: 4, author: "tencent", tokens: "1.69T", valueT: 1.69, share: 11.1, color: authorColors.tencent },
  { rank: 5, author: "minimax", tokens: "732B", valueT: 0.732, share: 4.8, color: authorColors.minimax },
  { rank: 6, author: "openrouter", tokens: "652B", valueT: 0.652, share: 4.3, color: authorColors.openrouter },
  { rank: 7, author: "qwen", tokens: "600B", valueT: 0.6, share: 3.9, color: authorColors.qwen },
  { rank: 8, author: "moonshotai", tokens: "575B", valueT: 0.575, share: 3.8, color: authorColors.moonshotai },
  { rank: 9, author: "openai", tokens: "511B", valueT: 0.511, share: 3.3, color: authorColors.openai },
  { rank: 10, author: "nvidia", tokens: "500B", valueT: 0.5, share: 3.2, color: authorColors.nvidia },
];

export const benchmarkSnapshot: BenchmarkItem[] = [
  { rank: 1, name: "GPT-5.5 (xhigh)", author: "openai", score: 60.2, price: 5.0, color: "#2f9b65" },
  { rank: 2, name: "Claude Opus 4.7 (Adaptive)", author: "anthropic", score: 57.3, price: 5.0, color: "#ff8a5b" },
  { rank: 3, name: "MiMo-V2.5-Pro", author: "xiaomi", score: 53.8, price: 1.0, color: "#7b61ff" },
  { rank: 4, name: "Grok 4.3", author: "x-ai", score: 53.2, price: 1.25, color: "#dea21a" },
  { rank: 5, name: "Claude Sonnet 4.6", author: "anthropic", score: 44.4, price: 1.25, color: "#6aaa82" },
  { rank: 6, name: "Qwen3.6 35B A3B (Reasoning)", author: "qwen", score: 43.5, price: 0.15, color: "#8acc2a" },
  { rank: 7, name: "MiniMax-M2.1", author: "minimax", score: 39.4, price: 0.3, color: "#ff674f" },
  { rank: 8, name: "Mistral Medium 3.5", author: "mistralai", score: 39.2, price: 1.5, color: "#d465cf" },
  { rank: 9, name: "Grok 4.1 Fast (Reasoning)", author: "x-ai", score: 38.6, price: 0.25, color: "#e0a11b" },
  { rank: 10, name: "Gemini 3 Flash Preview", author: "google", score: 36.8, price: 0.25, color: "#4f99dc" },
];

export const fastestModelsSnapshot: FastestModelItem[] = [
  { rank: 1, name: "gpt-oss-safeguard-20b", provider: "Groq", speed: 645, price: 0.07, color: "#39d6c8" },
  { rank: 2, name: "gpt-oss-20b", provider: "Groq", speed: 634, price: 0.07, color: "#39d6c8" },
  { rank: 3, name: "gpt-oss-120b", provider: "Cerebras", speed: 626, price: 0.35, color: "#39d6c8" },
  { rank: 4, name: "Mercury 2", provider: "Inception", speed: 355, price: 0.25, color: "#f7b731" },
  { rank: 5, name: "Qwen3 32B", provider: "Cerebras", speed: 351, price: 0.29, color: "#f472b6" },
  { rank: 6, name: "GLM 4.7", provider: "Cerebras", speed: 302, price: 2.25, color: "#e0a11b" },
  { rank: 7, name: "MiniMax M2.5", provider: "Mara", speed: 261, price: 0.3, color: "#ff674f" },
  { rank: 8, name: "Llama 3.1 8B Instruct", provider: "Cerebras", speed: 230, price: 0.1, color: "#ff7a45" },
  { rank: 9, name: "Qwen3.6 35B A3B", provider: "WandB", speed: 165, price: 0.25, color: "#ff5eb3" },
  { rank: 10, name: "Nano Banana (Gemini 2.5)", provider: "Google", speed: 162, price: 0.35, color: "#72d9d1" },
];

export const openRouterTopAppsSnapshot: OpenRouterAppItem[] = [
  { rank: 1, name: "Hermes Agent", author: "nousresearch", tokens: "353B", tokenValueB: 353, change: 12, direction: "up" },
  { rank: 2, name: "OpenClaw", author: "openclaw", tokens: "195B", tokenValueB: 195, change: 3, direction: "up" },
  { rank: 3, name: "Kilo Code", author: "kilocode", tokens: "166B", tokenValueB: 166, change: 9, direction: "up" },
  { rank: 4, name: "Claude Code", author: "anthropic", tokens: "70.5B", tokenValueB: 70.5, change: 5, direction: "down" },
  { rank: 5, name: "CSS AI Pro", author: "css", tokens: "66.7B", tokenValueB: 66.7, change: 18, direction: "up" },
  { rank: 6, name: "Descript", author: "descript", tokens: "62.7B", tokenValueB: 62.7, change: 4, direction: "up" },
  { rank: 7, name: "pi", author: "inflection", tokens: "39.9B", tokenValueB: 39.9, change: 2, direction: "down" },
  { rank: 8, name: "Janitor AI", author: "janitorai", tokens: "27.7B", tokenValueB: 27.7, change: 7, direction: "up" },
  { rank: 9, name: "ISEKAI ZERO", author: "isekai", tokens: "25B", tokenValueB: 25, change: 1, direction: "flat" },
  { rank: 10, name: "Roo Code", author: "roocode", tokens: "22.8B", tokenValueB: 22.8, change: 11, direction: "up" },
];

export const toolCallsSnapshot: OpenRouterMetricItem[] = [
  { rank: 1, name: "Claude Sonnet 4.6", author: "anthropic", metric: "94.1B calls", subMetric: "tool usage", value: 94.1, change: 18, direction: "up" },
  { rank: 2, name: "GPT-5.5", author: "openai", metric: "88.5B calls", subMetric: "tool usage", value: 88.5, change: 12, direction: "up" },
  { rank: 3, name: "Gemini 3 Flash Preview", author: "google", metric: "76.4B calls", subMetric: "tool usage", value: 76.4, change: 9, direction: "up" },
  { rank: 4, name: "DeepSeek V4 Flash", author: "deepseek", metric: "70.2B calls", subMetric: "tool usage", value: 70.2, change: 6, direction: "up" },
  { rank: 5, name: "Qwen3.6 35B A3B", author: "qwen", metric: "62.9B calls", subMetric: "tool usage", value: 62.9, change: 5, direction: "down" },
  { rank: 6, name: "Claude Opus 4.7", author: "anthropic", metric: "58.6B calls", subMetric: "tool usage", value: 58.6, change: 7, direction: "down" },
  { rank: 7, name: "MiniMax M2.7", author: "minimax", metric: "50.2B calls", subMetric: "tool usage", value: 50.2, change: 14, direction: "up" },
  { rank: 8, name: "Kimi K2.6", author: "moonshotai", metric: "46.8B calls", subMetric: "tool usage", value: 46.8, change: 4, direction: "flat" },
  { rank: 9, name: "gpt-oss-120b", author: "openai", metric: "39.7B calls", subMetric: "tool usage", value: 39.7, change: 11, direction: "up" },
  { rank: 10, name: "GLM 5.1", author: "zhipu", metric: "34.9B calls", subMetric: "tool usage", value: 34.9, change: 3, direction: "up" },
];

export const contextLengthSnapshot: OpenRouterMetricItem[] = [
  { rank: 1, name: "Gemini 3 Flash Preview", author: "google", metric: "1M context", subMetric: "1.12T tokens", value: 100, change: 17, direction: "up" },
  { rank: 2, name: "Gemini 2.5 Flash", author: "google", metric: "1M context", subMetric: "566B tokens", value: 92, change: 1, direction: "down" },
  { rank: 3, name: "Claude Sonnet 4.6", author: "anthropic", metric: "200K context", subMetric: "1.56T tokens", value: 84, change: 3, direction: "up" },
  { rank: 4, name: "Claude Opus 4.7", author: "anthropic", metric: "200K context", subMetric: "1.41T tokens", value: 80, change: 8, direction: "down" },
  { rank: 5, name: "GPT-5.5", author: "openai", metric: "400K context", subMetric: "478B tokens", value: 74, change: 5, direction: "up" },
  { rank: 6, name: "Qwen3.6 35B A3B", author: "qwen", metric: "256K context", subMetric: "600B tokens", value: 68, change: 9, direction: "up" },
  { rank: 7, name: "DeepSeek V4 Pro", author: "deepseek", metric: "128K context", subMetric: "950B tokens", value: 61, change: 8, direction: "up" },
  { rank: 8, name: "MiniMax M2.7", author: "minimax", metric: "1M context", subMetric: "637B tokens", value: 58, change: 17, direction: "down" },
  { rank: 9, name: "Kimi K2.6", author: "moonshotai", metric: "256K context", subMetric: "782B tokens", value: 52, change: 4, direction: "down" },
  { rank: 10, name: "Nemotron 3 Super", author: "nvidia", metric: "128K context", subMetric: "589B tokens", value: 44, change: 2, direction: "down" },
];

export const categoryRankingsSnapshot: OpenRouterMetricItem[] = [
  { rank: 1, name: "DeepSeek V4 Flash", author: "deepseek", metric: "2.1T tokens", subMetric: "Programming", value: 92, change: 102, direction: "up" },
  { rank: 2, name: "Claude Sonnet 4.6", author: "anthropic", metric: "1.4T tokens", subMetric: "Programming", value: 78, change: 3, direction: "up" },
  { rank: 3, name: "GPT-5.5", author: "openai", metric: "920B tokens", subMetric: "Programming", value: 69, change: 5, direction: "up" },
  { rank: 4, name: "Gemini 3 Flash Preview", author: "google", metric: "870B tokens", subMetric: "Programming", value: 64, change: 1, direction: "down" },
  { rank: 5, name: "Qwen3.6 35B A3B", author: "qwen", metric: "760B tokens", subMetric: "Programming", value: 56, change: 19, direction: "up" },
  { rank: 6, name: "Kimi K2.6", author: "moonshotai", metric: "610B tokens", subMetric: "Programming", value: 49, change: 4, direction: "down" },
  { rank: 7, name: "gpt-oss-120b", author: "openai", metric: "440B tokens", subMetric: "Programming", value: 42, change: 14, direction: "up" },
  { rank: 8, name: "GLM 5.1", author: "zhipu", metric: "381B tokens", subMetric: "Programming", value: 37, change: 6, direction: "up" },
  { rank: 9, name: "Mistral Medium 3.5", author: "mistralai", metric: "300B tokens", subMetric: "Programming", value: 31, change: 2, direction: "flat" },
  { rank: 10, name: "Llama 3.1 8B Instruct", author: "meta", metric: "230B tokens", subMetric: "Programming", value: 26, change: 8, direction: "down" },
];

export const naturalLanguageSnapshot: OpenRouterMetricItem[] = [
  { rank: 1, name: "Hy3 preview", author: "tencent", metric: "2.85T tokens", subMetric: "English", value: 88, change: 41, direction: "up" },
  { rank: 2, name: "Claude Opus 4.7", author: "anthropic", metric: "1.41T tokens", subMetric: "English", value: 74, change: 8, direction: "down" },
  { rank: 3, name: "Gemini 3 Flash Preview", author: "google", metric: "1.12T tokens", subMetric: "English", value: 68, change: 1, direction: "down" },
  { rank: 4, name: "DeepSeek V3.2", author: "deepseek", metric: "1.12T tokens", subMetric: "English", value: 63, change: 20, direction: "up" },
  { rank: 5, name: "Kimi K2.6", author: "moonshotai", metric: "782B tokens", subMetric: "English", value: 52, change: 4, direction: "down" },
  { rank: 6, name: "MiniMax M2.7", author: "minimax", metric: "637B tokens", subMetric: "English", value: 48, change: 17, direction: "down" },
  { rank: 7, name: "Qwen3.6 35B A3B", author: "qwen", metric: "600B tokens", subMetric: "English", value: 45, change: 12, direction: "up" },
  { rank: 8, name: "GPT-5.5", author: "openai", metric: "478B tokens", subMetric: "English", value: 38, change: 5, direction: "up" },
  { rank: 9, name: "GLM 5.1", author: "zhipu", metric: "381B tokens", subMetric: "English", value: 31, change: 6, direction: "up" },
  { rank: 10, name: "Mistral Medium 3.5", author: "mistralai", metric: "292B tokens", subMetric: "English", value: 27, change: 2, direction: "flat" },
];

export const programmingLanguageSnapshot: OpenRouterMetricItem[] = [
  { rank: 1, name: "Claude Sonnet 4.6", author: "anthropic", metric: "1.18T tokens", subMetric: "Python", value: 84, change: 3, direction: "up" },
  { rank: 2, name: "DeepSeek V4 Flash", author: "deepseek", metric: "1.06T tokens", subMetric: "Python", value: 79, change: 102, direction: "up" },
  { rank: 3, name: "GPT-5.5", author: "openai", metric: "620B tokens", subMetric: "Python", value: 62, change: 5, direction: "up" },
  { rank: 4, name: "Qwen3.6 35B A3B", author: "qwen", metric: "540B tokens", subMetric: "Python", value: 56, change: 19, direction: "up" },
  { rank: 5, name: "Gemini 3 Flash Preview", author: "google", metric: "502B tokens", subMetric: "Python", value: 50, change: 1, direction: "down" },
  { rank: 6, name: "Kimi K2.6", author: "moonshotai", metric: "440B tokens", subMetric: "Python", value: 43, change: 4, direction: "down" },
  { rank: 7, name: "DeepSeek V4 Pro", author: "deepseek", metric: "390B tokens", subMetric: "Python", value: 39, change: 8, direction: "up" },
  { rank: 8, name: "gpt-oss-120b", author: "openai", metric: "360B tokens", subMetric: "Python", value: 35, change: 14, direction: "up" },
  { rank: 9, name: "GLM 5.1", author: "zhipu", metric: "306B tokens", subMetric: "Python", value: 29, change: 6, direction: "up" },
  { rank: 10, name: "Mistral Medium 3.5", author: "mistralai", metric: "240B tokens", subMetric: "Python", value: 24, change: 2, direction: "flat" },
];

export const imageRankingsSnapshot: OpenRouterMetricItem[] = [
  { rank: 1, name: "Nano Banana (Gemini 2.5)", author: "google", metric: "48.2M images", subMetric: "image processing", value: 78, change: 22, direction: "up" },
  { rank: 2, name: "Gemini 2.5 Flash Image", author: "google", metric: "41.8M images", subMetric: "image processing", value: 68, change: 13, direction: "up" },
  { rank: 3, name: "GPT Image 1", author: "openai", metric: "30.6M images", subMetric: "image processing", value: 55, change: 6, direction: "up" },
  { rank: 4, name: "Claude Sonnet 4.6", author: "anthropic", metric: "24.7M images", subMetric: "image input", value: 47, change: 3, direction: "up" },
  { rank: 5, name: "Qwen Image", author: "qwen", metric: "21.9M images", subMetric: "image processing", value: 42, change: 11, direction: "up" },
  { rank: 6, name: "MiniMax M2.7", author: "minimax", metric: "17.1M images", subMetric: "image input", value: 36, change: 4, direction: "down" },
  { rank: 7, name: "Gemini 3 Flash Preview", author: "google", metric: "15.8M images", subMetric: "image input", value: 31, change: 1, direction: "down" },
  { rank: 8, name: "Mistral Medium 3.5", author: "mistralai", metric: "13.2M images", subMetric: "image input", value: 27, change: 2, direction: "flat" },
  { rank: 9, name: "GLM 5.1", author: "zhipu", metric: "10.9M images", subMetric: "image input", value: 22, change: 6, direction: "up" },
  { rank: 10, name: "DeepSeek V4 Pro", author: "deepseek", metric: "8.6M images", subMetric: "image input", value: 18, change: 8, direction: "up" },
];

export const audioRankingsSnapshot: OpenRouterMetricItem[] = [
  { rank: 1, name: "GPT-4o Transcribe", author: "openai", metric: "26.4M prompts", subMetric: "audio input", value: 74, change: 16, direction: "up" },
  { rank: 2, name: "Gemini 2.5 Flash", author: "google", metric: "21.9M prompts", subMetric: "audio input", value: 66, change: 1, direction: "down" },
  { rank: 3, name: "Whisper Large V3", author: "openai", metric: "18.2M prompts", subMetric: "audio input", value: 55, change: 4, direction: "down" },
  { rank: 4, name: "MiniMax Speech 2.5", author: "minimax", metric: "14.7M prompts", subMetric: "audio input", value: 48, change: 12, direction: "up" },
  { rank: 5, name: "Gemini 3 Flash Preview", author: "google", metric: "12.6M prompts", subMetric: "audio input", value: 42, change: 7, direction: "up" },
  { rank: 6, name: "Claude Sonnet 4.6", author: "anthropic", metric: "10.1M prompts", subMetric: "audio input", value: 36, change: 3, direction: "up" },
  { rank: 7, name: "Qwen Audio", author: "qwen", metric: "8.8M prompts", subMetric: "audio input", value: 31, change: 9, direction: "up" },
  { rank: 8, name: "Mistral Voxtral", author: "mistralai", metric: "7.4M prompts", subMetric: "audio input", value: 26, change: 2, direction: "flat" },
  { rank: 9, name: "GLM Audio", author: "zhipu", metric: "5.9M prompts", subMetric: "audio input", value: 22, change: 5, direction: "up" },
  { rank: 10, name: "Llama 3.1 Audio", author: "meta", metric: "4.8M prompts", subMetric: "audio input", value: 18, change: 6, direction: "down" },
];
