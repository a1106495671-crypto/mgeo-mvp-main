import type { DetectReport, ResultItem } from "@/lib/detect/types";

type DeliverySyncObservationResult = {
  ok: boolean;
  observationId?: string;
  opportunityId?: string | null;
  companyId?: string;
  error?: string;
};

export type DeliverySyncResult = {
  enabled: boolean;
  endpoint?: string;
  attempted: number;
  synced: number;
  failed: number;
  errors: string[];
};

function getDeliveryApiBaseUrl() {
  const configured = process.env.MGEO_DELIVERY_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:3001";
  }

  return "";
}

function normalizeDeliveryPlatform(item: ResultItem) {
  const rawModel = item.model.trim() || item.platform.trim() || "unknown";
  const normalizedModel = rawModel === "qianwen" ? "qwen" : rawModel;
  if (item.channel === "mobile" && !normalizedModel.endsWith("_mobile")) {
    return `${normalizedModel}_mobile`;
  }
  return normalizedModel;
}

function buildResponseText(item: ResultItem) {
  const parts = [
    item.raw?.coverageResponse,
    item.raw?.descriptionResponse,
    item.raw?.sourceResponse,
    item.rawText,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  return Array.from(new Set(parts)).join("\n\n");
}

function buildMentionedBrands(report: DetectReport, item: ResultItem) {
  const brands = [
    item.mentioned ? report.input.brandName : "",
    ...item.coverage.competitors,
  ];
  return Array.from(new Set(brands.map((brand) => brand.trim()).filter(Boolean)));
}

function buildCitations(item: ResultItem) {
  return item.authority.sourceNames
    .map((sourceName) => sourceName.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((sourceName) => ({
      title: sourceName,
      url: /^https?:\/\//i.test(sourceName) ? sourceName : "",
    }));
}

function buildObservationPayload(report: DetectReport, item: ResultItem) {
  return {
    coreKeyword: report.input.industry || report.input.query || "MGEO",
    brandName: report.input.brandName,
    promptText: report.input.query,
    platform: normalizeDeliveryPlatform(item),
    responseText: buildResponseText(item),
    brandMentioned: item.mentioned,
    brandPosition: item.coverage.mentionPosition,
    mentionedBrands: buildMentionedBrands(report, item),
    citations: buildCitations(item),
    scores: {
      coverage: item.scoreBreakdown.coverage,
      consistency: item.scoreBreakdown.consistency,
      authority: item.scoreBreakdown.authority,
      confidence:
        item.confidence.level === "high"
          ? 85
          : item.confidence.level === "medium"
            ? 65
            : 35,
    },
  };
}

async function postObservation(endpoint: string, payload: ReturnType<typeof buildObservationPayload>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mgeo-user-id": process.env.MGEO_DELIVERY_USER_ID?.trim() || process.env.MGEO_DEV_USER_ID?.trim() || "demo-user",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as DeliverySyncObservationResult;
    if (!response.ok || data.error) {
      throw new Error(data.error || `交付中心返回 ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncDetectReportToDeliveryCenter(report: DetectReport): Promise<DeliverySyncResult> {
  const baseUrl = getDeliveryApiBaseUrl();
  if (!baseUrl) {
    return {
      enabled: false,
      attempted: 0,
      synced: 0,
      failed: 0,
      errors: [],
    };
  }

  const endpoint = `${baseUrl}/api/observations`;
  const payloads = report.results
    .map((item) => buildObservationPayload(report, item))
    .filter((payload) => payload.promptText.trim() && payload.responseText.trim());

  let synced = 0;
  const errors: string[] = [];

  // Keep writes sequential so the delivery center resolves/creates one customer
  // workspace before the next platform observation is inserted.
  for (const payload of payloads) {
    try {
      await postObservation(endpoint, payload);
      synced += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "未知同步错误");
    }
  }

  return {
    enabled: true,
    endpoint,
    attempted: payloads.length,
    synced,
    failed: errors.length,
    errors,
  };
}
