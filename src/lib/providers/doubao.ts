import type { ModelName, ProviderResponse } from "@/lib/detect/types";

type RuntimeProvider = {
  name: ModelName;
  enabled: boolean;
  call: (prompt: string) => Promise<ProviderResponse>;
};

type DoubaoProviderOptions = {
  modelName?: ModelName;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
};

export function createDoubaoProvider(options: DoubaoProviderOptions = {}): RuntimeProvider {
  const modelName = options.modelName || "doubao";
  const baseUrl = options.baseUrl || process.env.DOUBAO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  const apiKey = options.apiKey || process.env.DOUBAO_API_KEY || "";
  const model = options.model || process.env.DOUBAO_MODEL || "";
  const enabled = Boolean(apiKey && model);

  return {
    name: modelName,
    enabled,
    async call(prompt: string) {
      if (!enabled) {
        return {
          model: modelName,
          success: false,
          rawText: "",
          latencyMs: 0,
          error: `${modelName} 未配置 API Key 或模型/接入点 ID`,
        };
      }

      const start = Date.now();

      try {
        const res = await fetch(`${baseUrl}/responses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        });

        if (!res.ok) {
          const message = await res.text();

          return {
            model: modelName,
            success: false,
            rawText: "",
            latencyMs: Date.now() - start,
            error: `HTTP ${res.status}: ${message}`,
          };
        }

        const data = await res.json();
        const rawText =
          data.output_text ||
          data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || []).map((item: { text?: string }) => item.text || "").join("\n") ||
          "";

        return {
          model: modelName,
          success: true,
          rawText,
          latencyMs: Date.now() - start,
        };
      } catch (error) {
        return {
          model: modelName,
          success: false,
          rawText: "",
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  };
}
