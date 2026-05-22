import { unstable_cache } from "next/cache";

import { authorColors, type MarketShareItem, type OpenRouterRankItem, type TrendDirection } from "@/lib/openrouter/rankings-snapshot";

const OPENROUTER_ORIGIN = "https://openrouter.ai";
const RANKINGS_URL = `${OPENROUTER_ORIGIN}/rankings`;
const MODELS_URL = `${OPENROUTER_ORIGIN}/api/frontend/models?fmt=cards`;
const REVALIDATE_SECONDS = 5 * 60;

const fallbackActionIds = {
  modelChart: "00cb194ad7c33c8f52f4d016107f812f3837aef7f1",
  modelLeaderboard: "40824635c5eb77626bdf6795ffbf382c0862b321e1",
  authorTimeline: "005f2bf115b07532c905beef624e64d0f24ca89445",
};

type OpenRouterModel = {
  slug: string;
  permaslug?: string | null;
  name: string;
  short_name?: string | null;
  author?: string | null;
};

type RawChartPoint = {
  x: string;
  ys: Record<string, number>;
};

type RawChartResponse = {
  data: RawChartPoint[];
  cachedAt?: number | string;
};

type RawLeaderboardRow = {
  date?: string;
  model_permaslug?: string;
  variant_permaslug: string;
  total_prompt_tokens?: number;
  total_completion_tokens?: number;
  total_native_tokens_reasoning?: number;
  total_native_tokens_cached?: number;
  change?: number | null;
};

export type OpenRouterUsagePart = {
  id: string;
  author: string;
  label: string;
  value: number;
  color: string;
};

export type OpenRouterUsagePoint = {
  date: string;
  total: number;
  parts: OpenRouterUsagePart[];
};

export type LiveOpenRouterRankings = {
  topModelsSeries: OpenRouterUsagePoint[];
  leaderboard: OpenRouterRankItem[];
  marketShareSeries: MarketShareItem[][];
  marketShareItems: MarketShareItem[];
  updatedAt: string | null;
};

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "DongLuoji-MGEO/1.0 (+https://www.dongluoji.com/ranking)",
      accept: "text/html,application/javascript,text/plain,*/*",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${url}`);
  }

  return response.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "DongLuoji-MGEO/1.0 (+https://www.dongluoji.com/ranking)",
      accept: "application/json",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`OpenRouter JSON request failed: ${response.status} ${url}`);
  }

  return response.json() as Promise<T>;
}

function extractChunkUrls(html: string) {
  return [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js\?dpl=[^"]+)"/g)].map((match) => `${OPENROUTER_ORIGIN}${match[1]}`);
}

function extractActionId(chunk: string, actionName: string) {
  const nameIndex = chunk.indexOf(actionName);
  if (nameIndex === -1) return null;

  const nearby = chunk.slice(Math.max(0, nameIndex - 320), nameIndex + actionName.length + 80);
  return nearby.match(/createServerReference\("([0-9a-f]+)"/)?.[1] || null;
}

async function discoverActionIds() {
  const html = await fetchText(RANKINGS_URL);
  const chunkUrls = extractChunkUrls(html);
  const actionIds = { ...fallbackActionIds };

  for (const chunkUrl of chunkUrls) {
    const chunk = await fetchText(chunkUrl);
    actionIds.modelChart = extractActionId(chunk, "getModelRankingsChartDataCached") || actionIds.modelChart;
    actionIds.modelLeaderboard = extractActionId(chunk, "getModelRankingsCached") || actionIds.modelLeaderboard;
    actionIds.authorTimeline = extractActionId(chunk, "getWeeklyAuthorTokenTimelineCached") || actionIds.authorTimeline;

    if (
      actionIds.modelChart !== fallbackActionIds.modelChart &&
      actionIds.modelLeaderboard !== fallbackActionIds.modelLeaderboard &&
      actionIds.authorTimeline !== fallbackActionIds.authorTimeline
    ) {
      break;
    }
  }

  return actionIds;
}

function parseActionResponse<T>(text: string): T {
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\d+:(.+)$/);
    if (!match) continue;

    try {
      const parsed = JSON.parse(match[1]) as unknown;
      if (Array.isArray(parsed)) return parsed as T;
      if (parsed && typeof parsed === "object" && ("data" in parsed || "cachedAt" in parsed)) return parsed as T;
    } catch {
      // Flight responses include non-JSON control lines. Ignore those.
    }
  }

  throw new Error("OpenRouter action response did not include parseable data");
}

async function callOpenRouterAction<T>(actionId: string, args: unknown[]) {
  const response = await fetch(RANKINGS_URL, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      accept: "text/x-component",
      "next-action": actionId,
      "user-agent": "DongLuoji-MGEO/1.0 (+https://www.dongluoji.com/ranking)",
    },
    body: JSON.stringify(args),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`OpenRouter action failed: ${response.status}`);
  }

  return parseActionResponse<T>(await response.text());
}

async function getModelMap() {
  const payload = await fetchJson<{ data: OpenRouterModel[] }>(MODELS_URL);
  const map = new Map<string, OpenRouterModel>();

  for (const model of payload.data) {
    map.set(model.slug, model);
    if (model.permaslug) map.set(model.permaslug, model);
  }

  return map;
}

function authorFromSlug(slug: string) {
  if (slug === "Others") return "others";
  return slug.split("/")[0] || "others";
}

function getModelDisplay(slug: string, modelMap: Map<string, OpenRouterModel>) {
  if (slug === "Others") {
    return { label: "Others", author: "others" };
  }

  const model = modelMap.get(slug);
  const author = model?.author || authorFromSlug(slug);
  const label = model?.short_name || model?.name?.replace(/^[^:]+:\s*/, "") || slug.split("/").at(-1) || slug;

  return { label, author };
}

function tokenFieldsTotal(row: RawLeaderboardRow) {
  return (
    (row.total_prompt_tokens || 0) +
    (row.total_completion_tokens || 0) +
    (row.total_native_tokens_reasoning || 0) +
    (row.total_native_tokens_cached || 0)
  );
}

function formatTokenCount(tokens: number) {
  if (tokens >= 1_000_000_000_000) {
    return `${(tokens / 1_000_000_000_000).toFixed(tokens >= 10_000_000_000_000 ? 1 : 2)}T`;
  }

  if (tokens >= 1_000_000_000) {
    return `${Math.round(tokens / 1_000_000_000)}B`;
  }

  return `${Math.round(tokens / 1_000_000)}M`;
}

function normalizeChange(value: number | null | undefined) {
  if (!Number.isFinite(value || 0) || !value) {
    return { change: 0, direction: "flat" as TrendDirection };
  }

  return {
    change: Math.round(Math.abs(value) <= 1 ? Math.abs(value) * 100 : Math.abs(value)),
    direction: value > 0 ? ("up" as TrendDirection) : ("down" as TrendDirection),
  };
}

function transformChartData(raw: RawChartResponse, modelMap: Map<string, OpenRouterModel>) {
  return raw.data.map((point) => {
    const parts = Object.entries(point.ys).map(([slug, tokens]) => {
      const { label, author } = getModelDisplay(slug, modelMap);
      return {
        id: slug,
        author,
        label,
        value: tokens / 1_000_000_000_000,
        color: authorColors[author] || authorColors.others,
      };
    });

    return {
      date: point.x,
      total: parts.reduce((sum, part) => sum + part.value, 0),
      parts,
    };
  });
}

function transformLeaderboard(rows: RawLeaderboardRow[], modelMap: Map<string, OpenRouterModel>) {
  return rows
    .map((row) => ({ row, total: tokenFieldsTotal(row) }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)
    .map((item, index) => {
      const slug = item.row.variant_permaslug || item.row.model_permaslug || "Others";
      const { label, author } = getModelDisplay(slug, modelMap);
      const trend = normalizeChange(item.row.change);

      return {
        rank: index + 1,
        name: label,
        author,
        tokens: formatTokenCount(item.total),
        tokenValueT: item.total / 1_000_000_000_000,
        change: trend.change,
        direction: trend.direction,
      };
    });
}

function transformAuthorTimeline(rows: RawChartPoint[]) {
  return rows.map((point) => {
    const total = Object.values(point.ys).reduce((sum, tokens) => sum + tokens, 0);

    return Object.entries(point.ys)
      .map(([author, tokens], index) => ({
        rank: index + 1,
        author,
        tokens: formatTokenCount(tokens),
        valueT: tokens / 1_000_000_000_000,
        share: total ? (tokens / total) * 100 : 0,
        color: authorColors[author] || authorColors.others,
      }))
      .sort((a, b) => b.share - a.share)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  });
}

async function fetchLiveOpenRouterRankings(): Promise<LiveOpenRouterRankings | null> {
  try {
    const [modelMap, actionIds] = await Promise.all([
      getModelMap(),
      discoverActionIds(),
    ]);

    const [chartData, leaderboardRows, authorTimeline] = await Promise.all([
      callOpenRouterAction<RawChartResponse>(actionIds.modelChart, []),
      callOpenRouterAction<RawLeaderboardRow[]>(actionIds.modelLeaderboard, ["week"]),
      callOpenRouterAction<RawChartPoint[]>(actionIds.authorTimeline, []),
    ]);
    const marketShareSeries = transformAuthorTimeline(authorTimeline);

    return {
      topModelsSeries: transformChartData(chartData, modelMap),
      leaderboard: transformLeaderboard(leaderboardRows, modelMap),
      marketShareSeries,
      marketShareItems: marketShareSeries.at(-1)?.slice(0, 10) || [],
      updatedAt: chartData.cachedAt ? new Date(chartData.cachedAt).toISOString() : null,
    };
  } catch (error) {
    console.error("Failed to fetch live OpenRouter rankings", error);
    return null;
  }
}

export const getLiveOpenRouterRankings = unstable_cache(fetchLiveOpenRouterRankings, ["openrouter-live-rankings"], {
  revalidate: REVALIDATE_SECONDS,
});
