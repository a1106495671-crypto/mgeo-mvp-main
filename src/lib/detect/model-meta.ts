import type { DetectChannel, ModelName } from "@/lib/detect/types";

export const MODEL_META: Record<ModelName, { label: string; platform: string; channel: DetectChannel }> = {
  openai: { label: "OpenAI", platform: "openai", channel: "web" },
  deepseek: { label: "DeepSeek", platform: "deepseek", channel: "web" },
  deepseek_mobile: { label: "DeepSeek 手机版", platform: "deepseek", channel: "mobile" },
  kimi: { label: "Kimi", platform: "kimi", channel: "web" },
  doubao: { label: "豆包", platform: "doubao", channel: "web" },
  doubao_mobile: { label: "豆包 手机版", platform: "doubao", channel: "mobile" },
  qianwen: { label: "通义千问", platform: "qianwen", channel: "web" },
  yuanbao: { label: "腾讯元宝", platform: "yuanbao", channel: "web" },
  wenxin: { label: "文心一言", platform: "wenxin", channel: "web" },
};

export const DEFAULT_MODELS: ModelName[] = [
  "deepseek",
  "deepseek_mobile",
  "kimi",
  "doubao",
  "doubao_mobile",
  "qianwen",
  "yuanbao",
  "wenxin",
];

export function resolveModelRuntime(model: string) {
  if ((MODEL_META as Record<string, { platform: string; channel: DetectChannel } | undefined>)[model]) {
    return (MODEL_META as Record<string, { platform: string; channel: DetectChannel }>)[model];
  }

  const channel: DetectChannel = model.endsWith("_mobile") ? "mobile" : "web";
  const platform = channel === "mobile" ? model.slice(0, -7) : model;
  return { platform, channel };
}
