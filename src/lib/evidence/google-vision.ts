import { buildResultItem } from "@/lib/detect/parser";
import { scoreResultItem } from "@/lib/detect/scoring";
import type { DetectEvidence, DetectInput, ResultItem } from "@/lib/detect/types";

export type RuntimeImageAsset = {
  base64: string;
  mimeType: string;
  name?: string;
};

export function hasGoogleVisionConfig() {
  return Boolean(process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_VISION_BEARER_TOKEN);
}

export function parseImageDataUrl(value: string): RuntimeImageAsset {
  const trimmed = value.trim();
  const match = trimmed.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("图片格式无效，请使用 data URL(base64) 格式上传。");
  }

  const mimeType = match[1]?.trim();
  const base64 = match[2]?.trim();
  if (!mimeType || !base64) {
    throw new Error("图片内容不完整，请重新上传。");
  }

  return {
    mimeType,
    base64,
  };
}

export async function runGoogleVisionEvidence(_asset: RuntimeImageAsset): Promise<DetectEvidence | null> {
  // MVP: 先返回可渲染的基础证据结构，后续再接真实 Vision 解析。
  return {
    summary: "已收到图片样本，当前版本使用基础证据结构输出。",
    riskSignals: ["当前环境未启用深度图像检索，仅提供基础证据结论"],
    matchedPageCount: 0,
    datedPageCount: 0,
    lowRiskPageCount: 0,
    bestGuessLabels: [],
    webEntities: [],
    matchingPages: [],
  };
}

export function buildEvidenceBackedResult(params: {
  input: DetectInput;
  model: string;
  evidence: DetectEvidence;
}): ResultItem {
  const sourceResponse = params.evidence.summary || "未发现明确可核验来源。";
  return scoreResultItem(
    buildResultItem({
      input: params.input,
      model: params.model,
      source: "real",
      coverageResponse: `基于图片样本的检测：${params.input.brandName}`,
      descriptionResponse: `已接收图片样本，待结合网页证据进一步完善品牌描述。`,
      sourceResponse,
      notes: ["图片证据路径已启用（MVP 基础模式）"],
    }),
    params.input
  );
}
