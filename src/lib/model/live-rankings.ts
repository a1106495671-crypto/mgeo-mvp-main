import { unstable_cache } from "next/cache";

import { authorColors, type MarketShareItem, type ModelAppItem, type ModelMetricItem, type ModelRankItem, type TrendDirection } from "@/lib/model/rankings-snapshot";

const UPSTREAM_RANKING_ORIGIN = `https://${["open", "router"].join("")}.ai`;
const RANKINGS_URL = `${UPSTREAM_RANKING_ORIGIN}/rankings`;
const MODELS_URL = `${UPSTREAM_RANKING_ORIGIN}/api/frontend/models?fmt=cards`;
const REVALIDATE_SECONDS = 5 * 60;

export type RankingPeriod = "day" | "week" | "month" | "trending";
export type AppRankingPeriod = "day" | "week" | "month";

const fallbackActionIds = {
  modelChart: "0090543b47a9a4932cb5b318306a0e541d13bfb427",
  modelLeaderboard: "40f9c1737045f5080a2f0df80bb985450bdd0f4367",
  authorTimeline: "004913682bac627c2dc0e3420f77f50d62a0dfefa2",
  appRankingsMap: "00c8cce6b22788f8dce2a0cc708348eb8a51abcda5",
  toolRankingsChart: "003897c3dd8b589c2ae23ce4bf1d8a861cbc2f4233",
  useCaseRankingsChart: "40b649b2cc6d44a360a3c410849222d446a6f535e9",
  contextLengthRankingsChart: "408f1336741488623ed4841adfd301358d1dd44def",
  naturalLanguageRankingsChart: "4021a2c75bc4eca05acbeb05a4a5c630514c89f588",
  programmingLanguageRankingsChart: "401bbddd135820823a1c80a973224f9f095c279ccf",
  imageRankingsChart: "00669b6c1308586c0f510dd4baea268bd0f16dce77",
  audioRankingsChart: "00ad4919fa3aba9e2842d93f8af3cd8bc2bd9f72e5",
};

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let cachedActionIds: typeof fallbackActionIds = { ...fallbackActionIds };
let lastRefreshAt = 0;
let refreshPromise: Promise<typeof cachedActionIds> | null = null;

async function getOrRefreshActionIds(): Promise<typeof cachedActionIds> {
  const now = Date.now();
  if (now - lastRefreshAt < REFRESH_INTERVAL_MS) return cachedActionIds;
  if (refreshPromise) return refreshPromise;

  refreshPromise = discoverActionIds()
    .then((ids) => { cachedActionIds = ids; lastRefreshAt = Date.now(); return ids; })
    .catch(() => cachedActionIds)
    .finally(() => { refreshPromise = null; });

  return refreshPromise;
}

async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit, attempts = 2) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

type UpstreamModel = {
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

type RawAppRankingRow = {
  app_id?: number;
  total_tokens?: string | number;
  rank?: number;
  app?: {
    title?: string | null;
    slug?: string | null;
    origin_url?: string | null;
  } | null;
};

type RawAppRankingsMap = Record<AppRankingPeriod, RawAppRankingRow[]>;

export type ModelUsagePart = {
  id: string;
  author: string;
  label: string;
  value: number;
  color: string;
};

export type ModelUsagePoint = {
  date: string;
  total: number;
  parts: ModelUsagePart[];
};

export type LiveModelRankings = {
  topModelsSeries: ModelUsagePoint[];
  leaderboard: ModelRankItem[];
  marketShareSeries: MarketShareItem[][];
  marketShareItems: MarketShareItem[];
  metricCharts: LiveMetricCharts;
  period: RankingPeriod;
  updatedAt: string | null;
};

export type MetricChartPoint = {
  date: string;
  parts: ModelMetricItem[];
};

export type LiveMetricChart = {
  series: MetricChartPoint[];
  items: ModelMetricItem[];
  updatedAt: string | null;
};

export type LiveMetricCharts = {
  tools?: LiveMetricChart;
  categories?: LiveMetricChart;
  contextLength?: LiveMetricChart;
  naturalLanguage?: LiveMetricChart;
  programmingLanguage?: LiveMetricChart;
  images?: LiveMetricChart;
  audio?: LiveMetricChart;
};

async function fetchText(url: string) {
  const response = await fetchWithRetry(url, {
    headers: {
      "user-agent": "DongLuoji-MGEO/1.0 (+https://www.dongluoji.com/ranking)",
      accept: "text/html,application/javascript,text/plain,*/*",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`upstream ranking request failed: ${response.status} ${url}`);
  }

  return response.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithRetry(url, {
    headers: {
      "user-agent": "DongLuoji-MGEO/1.0 (+https://www.dongluoji.com/ranking)",
      accept: "application/json",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`upstream ranking JSON request failed: ${response.status} ${url}`);
  }

  return response.json() as Promise<T>;
}

function extractChunkUrls(html: string) {
  return [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js\?dpl=[^"]+)"/g)].map((match) => `${UPSTREAM_RANKING_ORIGIN}${match[1]}`);
}

function extractActionId(chunk: string, actionName: string) {
  const nameIndex = chunk.indexOf(actionName);
  if (nameIndex === -1) return null;

  const nearby = chunk.slice(Math.max(0, nameIndex - 400), nameIndex + actionName.length + 120);
  return nearby.match(/createServerReference\)?\("([0-9a-f]+)"/)?.[1] || null;
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
    actionIds.appRankingsMap = extractActionId(chunk, "getAppRankingsMap") || actionIds.appRankingsMap;
    actionIds.toolRankingsChart = extractActionId(chunk, "getModelToolRankingsChartDataCached") || actionIds.toolRankingsChart;
    actionIds.useCaseRankingsChart = extractActionId(chunk, "getUseCaseCategoryRankingsChartDataCached") || actionIds.useCaseRankingsChart;
    actionIds.contextLengthRankingsChart = extractActionId(chunk, "getContextLengthRankingsChartDataCached") || actionIds.contextLengthRankingsChart;
    actionIds.naturalLanguageRankingsChart = extractActionId(chunk, "getNaturalLanguageRankingsChartDataCached") || actionIds.naturalLanguageRankingsChart;
    actionIds.programmingLanguageRankingsChart = extractActionId(chunk, "getProgrammingLanguageRankingsChartDataCached") || actionIds.programmingLanguageRankingsChart;
    actionIds.imageRankingsChart = extractActionId(chunk, "getModelImageRankingsChartDataCached") || actionIds.imageRankingsChart;
    actionIds.audioRankingsChart = extractActionId(chunk, "getModelAudioRankingsChartDataCached") || actionIds.audioRankingsChart;

    if (
      actionIds.modelChart !== fallbackActionIds.modelChart &&
      actionIds.modelLeaderboard !== fallbackActionIds.modelLeaderboard &&
      actionIds.authorTimeline !== fallbackActionIds.authorTimeline &&
      actionIds.appRankingsMap !== fallbackActionIds.appRankingsMap
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

  throw new Error("upstream ranking action response did not include parseable data");
}

function parseAppRankingsResponse(text: string): RawAppRankingsMap {
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\d+:(.+)$/);
    if (!match) continue;

    try {
      const parsed = JSON.parse(match[1]) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        "day" in parsed &&
        "week" in parsed &&
        "month" in parsed
      ) {
        return parsed as RawAppRankingsMap;
      }
    } catch {
      // Ignore Flight metadata lines.
    }
  }

  throw new Error("upstream app ranking response did not include parseable data");
}

async function callRankingAction<T>(actionId: string, args: unknown[]) {
  const response = await fetchWithRetry(RANKINGS_URL, {
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
    throw new Error(`upstream ranking action failed: ${response.status}`);
  }

  return parseActionResponse<T>(await response.text());
}

async function callAppRankingsAction(actionId: string) {
  const response = await fetchWithRetry(RANKINGS_URL, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      accept: "text/x-component",
      "next-action": actionId,
      "user-agent": "DongLuoji-MGEO/1.0 (+https://www.dongluoji.com/ranking)",
    },
    body: JSON.stringify([]),
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`upstream app ranking action failed: ${response.status}`);
  }

  return parseAppRankingsResponse(await response.text());
}

async function getModelMap() {
  const payload = await fetchJson<{ data: UpstreamModel[] }>(MODELS_URL);
  const map = new Map<string, UpstreamModel>();

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

function normalizeAuthor(author: string) {
  return author.toLowerCase() === ["open", "router"].join("") ? "mgeo" : author;
}

function getModelDisplay(slug: string, modelMap: Map<string, UpstreamModel>) {
  if (slug === "Others") {
    return { label: "Others", author: "others" };
  }

  const model = modelMap.get(slug);
  const author = normalizeAuthor(model?.author || authorFromSlug(slug));
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

function formatAppTokenCount(tokens: number) {
  if (tokens >= 1_000_000_000_000) {
    return `${(tokens / 1_000_000_000_000).toFixed(tokens >= 10_000_000_000_000 ? 1 : 2)}T`;
  }

  if (tokens >= 1_000_000_000) {
    const value = tokens / 1_000_000_000;
    return `${value >= 100 ? Math.round(value) : value.toFixed(1)}B`;
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

function transformChartData(raw: RawChartResponse, modelMap: Map<string, UpstreamModel>) {
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

function transformLeaderboard(rows: RawLeaderboardRow[], modelMap: Map<string, UpstreamModel>) {
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
      .map(([rawAuthor, tokens], index) => {
        const author = normalizeAuthor(rawAuthor);
        return {
          rank: index + 1,
          date: point.x,
          author,
          tokens: formatTokenCount(tokens),
          valueT: tokens / 1_000_000_000_000,
          share: total ? (tokens / total) * 100 : 0,
          color: authorColors[author] || authorColors.others,
        };
      })
      .sort((a, b) => b.share - a.share)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  });
}

function transformModelAuthorTimeline(rows: RawChartPoint[], modelMap: Map<string, UpstreamModel>) {
  return rows.map((point) => {
    const authorTotals = new Map<string, number>();

    for (const [slug, tokens] of Object.entries(point.ys)) {
      const { author } = getModelDisplay(slug, modelMap);
      authorTotals.set(author, (authorTotals.get(author) || 0) + tokens);
    }

    const total = [...authorTotals.values()].reduce((sum, tokens) => sum + tokens, 0);

    return [...authorTotals.entries()]
      .map(([author, tokens]) => ({
        rank: 0,
        date: point.x,
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

function formatMetricValue(value: number, unit: "tokens" | "calls" | "requests") {
  const suffix = unit === "calls" ? "calls" : unit;
  return `${formatAppTokenCount(value)} ${suffix}`;
}

function transformMetricChart(rows: RawChartPoint[], modelMap: Map<string, UpstreamModel>, unit: "tokens" | "calls" | "requests"): LiveMetricChart {
  const series = rows.map((point): MetricChartPoint => {
    const total = Object.values(point.ys).reduce((sum, value) => sum + value, 0);
    const parts = Object.entries(point.ys)
      .map(([slug, value], index): ModelMetricItem => {
        const { label, author } = getModelDisplay(slug, modelMap);
        return {
          rank: index + 1,
          name: label,
          author,
          metric: formatMetricValue(value, unit),
          subMetric: unit === "calls" ? "tool usage" : undefined,
          value: total ? (value / total) * 100 : 0,
          change: 0,
          direction: "flat",
          color: authorColors[author] || authorColors.others,
        };
      })
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return { date: point.x, parts };
  });
  const latest = series.at(-1);
  const previous = series.at(-2);
  const previousByName = new Map(previous?.parts.map((item) => [item.name, item.value]) || []);

  const items = (latest?.parts || []).slice(0, 10).map((item, index) => {
    const previousShare = previousByName.get(item.name);
    const delta = previousShare ? ((item.value - previousShare) / previousShare) * 100 : 0;

    return {
      ...item,
      rank: index + 1,
      change: Math.round(Math.abs(delta)),
      direction: delta > 0 ? ("up" as TrendDirection) : delta < 0 ? ("down" as TrendDirection) : ("flat" as TrendDirection),
    };
  });

  return {
    series,
    items,
    updatedAt: latest?.date || null,
  };
}

async function callMetricChart(actionId: string, args: unknown[], modelMap: Map<string, UpstreamModel>, unit: "tokens" | "calls" | "requests") {
  const rows = await callRankingAction<RawChartPoint[]>(actionId, args);
  return transformMetricChart(rows, modelMap, unit);
}

function getAppAuthor(row: RawAppRankingRow) {
  const slug = row.app?.slug?.toLowerCase() || "";
  const title = row.app?.title?.toLowerCase() || "";
  const origin = row.app?.origin_url || "";

  if (slug.includes("hermes")) return "nousresearch";
  if (slug.includes("openclaw")) return "openclaw";
  if (slug.includes("kilo")) return "kilocode";
  if (slug.includes("claude")) return "anthropic";
  if (slug.includes("css")) return "css";
  if (slug.includes("descript")) return "descript";
  if (slug === "pi" || title === "pi") return "inflection";
  if (slug.includes("janitor")) return "janitorai";
  if (slug.includes("isekai")) return "isekai";
  if (slug.includes("roo")) return "roocode";
  if (slug.includes("cline")) return "cline";
  if (slug.includes("pioneer")) return "pioneer";

  try {
    return new URL(origin).hostname.replace(/^www\./, "").split(".")[0] || "others";
  } catch {
    return "others";
  }
}

function transformAppRankings(rows: RawAppRankingRow[]) {
  return rows
    .map((row) => {
      const tokens = Number(row.total_tokens || 0);
      return { row, tokens };
    })
    .filter((item) => item.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10)
    .map((item, index): ModelAppItem => {
      const author = getAppAuthor(item.row);
      return {
        rank: index + 1,
        name: item.row.app?.title || item.row.app?.slug || `App ${item.row.app_id || index + 1}`,
        author,
        tokens: formatAppTokenCount(item.tokens),
        tokenValueB: item.tokens / 1_000_000_000,
        change: 0,
        direction: "flat",
      };
    });
}

async function fetchLiveModelRankings(period: RankingPeriod = "week"): Promise<LiveModelRankings | null> {
  try {
    const [modelMap, actionIds] = await Promise.all([
      getModelMap(),
      getOrRefreshActionIds(),
    ]);

    const [chartData, leaderboardRows] = await Promise.all([
      callRankingAction<RawChartResponse>(actionIds.modelChart, []),
      callRankingAction<RawLeaderboardRow[]>(actionIds.modelLeaderboard, [period]),
    ]);
    const metricResults = await Promise.allSettled([
      callMetricChart(actionIds.toolRankingsChart, [], modelMap, "calls"),
      callMetricChart(actionIds.useCaseRankingsChart, ["programming"], modelMap, "tokens"),
      callMetricChart(actionIds.contextLengthRankingsChart, ["10K"], modelMap, "requests"),
      callMetricChart(actionIds.naturalLanguageRankingsChart, ["Chinese (Simplified)"], modelMap, "tokens"),
      callMetricChart(actionIds.programmingLanguageRankingsChart, ["Python"], modelMap, "tokens"),
      callMetricChart(actionIds.imageRankingsChart, [], modelMap, "requests"),
      callMetricChart(actionIds.audioRankingsChart, [], modelMap, "requests"),
    ]);
    const marketShareSeries = transformModelAuthorTimeline(chartData.data, modelMap);
    const metricCharts: LiveMetricCharts = {
      tools: metricResults[0].status === "fulfilled" ? metricResults[0].value : undefined,
      categories: metricResults[1].status === "fulfilled" ? metricResults[1].value : undefined,
      contextLength: metricResults[2].status === "fulfilled" ? metricResults[2].value : undefined,
      naturalLanguage: metricResults[3].status === "fulfilled" ? metricResults[3].value : undefined,
      programmingLanguage: metricResults[4].status === "fulfilled" ? metricResults[4].value : undefined,
      images: metricResults[5].status === "fulfilled" ? metricResults[5].value : undefined,
      audio: metricResults[6].status === "fulfilled" ? metricResults[6].value : undefined,
    };

    return {
      topModelsSeries: transformChartData(chartData, modelMap),
      leaderboard: transformLeaderboard(leaderboardRows, modelMap),
      marketShareSeries,
      marketShareItems: marketShareSeries.at(-1)?.slice(0, 10) || [],
      metricCharts,
      period,
      updatedAt: chartData.cachedAt ? new Date(chartData.cachedAt).toISOString() : null,
    };
  } catch (error) {
    console.error("Failed to fetch live model rankings", error);
    return null;
  }
}

export const getLiveModelRankings = unstable_cache(fetchLiveModelRankings, ["mgeo-live-rankings-v4"], {
  revalidate: REVALIDATE_SECONDS,
});

async function fetchLiveModelLeaderboard(period: RankingPeriod) {
  try {
    const [modelMap, leaderboardRows] = await Promise.all([
      getModelMap(),
      callRankingAction<RawLeaderboardRow[]>(fallbackActionIds.modelLeaderboard, [period]).catch(async () => {
        const actionIds = await discoverActionIds();
        return callRankingAction<RawLeaderboardRow[]>(actionIds.modelLeaderboard, [period]);
      }),
    ]);

    return {
      period,
      leaderboard: transformLeaderboard(leaderboardRows, modelMap),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch live model leaderboard", error);
    return null;
  }
}

export const getLiveModelLeaderboard = unstable_cache(fetchLiveModelLeaderboard, ["mgeo-live-leaderboard-v1"], {
  revalidate: REVALIDATE_SECONDS,
});

async function fetchLiveAppRankings(period: AppRankingPeriod) {
  try {
    const rankingsMap = await callAppRankingsAction(fallbackActionIds.appRankingsMap).catch(async () => {
      const actionIds = await discoverActionIds();
      return callAppRankingsAction(actionIds.appRankingsMap);
    });

    return {
      period,
      apps: transformAppRankings(rankingsMap[period] || []),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch live app rankings", error);
    return null;
  }
}

export const getLiveAppRankings = unstable_cache(fetchLiveAppRankings, ["mgeo-live-app-rankings-v1"], {
  revalidate: REVALIDATE_SECONDS,
});
