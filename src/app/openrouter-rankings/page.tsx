import type { Metadata } from "next";

import { SiteShell } from "@/components/marketing/SiteShell";
import {
  OPENROUTER_RANKING_SOURCE,
  openRouterTopAppsSnapshot,
  openRouterWeeklySnapshot,
} from "@/lib/openrouter/rankings-snapshot";

export const metadata: Metadata = {
  title: "OpenRouter 模型榜单测试 - 董逻辑MGEO",
  description: "用于学习测试的 OpenRouter 模型排行与模型目录镜像页，数据来源注明为 OpenRouter。",
};

type OpenRouterModel = {
  id: string;
  name: string;
  created?: number;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
    tokenizer?: string;
  };
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  top_provider?: {
    max_completion_tokens?: number | null;
    is_moderated?: boolean;
  };
};

async function getOpenRouterModels() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 60 * 60 },
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as { data?: OpenRouterModel[] };
    return (data.data || []).slice(0, 80);
  } catch {
    return [];
  }
}

function formatUsdPerMillion(value?: string) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "Free";
  }

  return `$${(numeric * 1_000_000).toFixed(numeric * 1_000_000 >= 1 ? 2 : 4)}`;
}

function formatContext(value?: number) {
  if (!value) {
    return "-";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return String(value);
}

function getMarketShare() {
  const totals = openRouterWeeklySnapshot.reduce<Record<string, number>>((acc, item) => {
    acc[item.author] = (acc[item.author] || 0) + item.tokenValue;
    return acc;
  }, {});
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return Object.entries(totals)
    .map(([author, value]) => ({
      author,
      value,
      share: total ? Math.round((value / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export default async function OpenRouterRankingsPage() {
  const models = await getOpenRouterModels();
  const maxModelTokens = Math.max(...openRouterWeeklySnapshot.map((item) => item.tokenValue));
  const maxAppTokens = Math.max(...openRouterTopAppsSnapshot.map((item) => item.tokenValue));
  const marketShare = getMarketShare();
  const freeModels = models.filter((model) => model.pricing?.prompt === "0" && model.pricing?.completion === "0").length;
  const multimodalModels = models.filter((model) => model.architecture?.input_modalities?.some((item) => item !== "text")).length;

  return (
    <SiteShell current="/openrouter-rankings">
      <main style={styles.page}>
        <section style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>OpenRouter 数据学习页</div>
            <h1 style={styles.title}>AI Model Rankings</h1>
            <p style={styles.subtitle}>
              基于 OpenRouter 公开页面与公开模型 API 做的站内测试版。榜单为页面快照，模型目录来自实时 API。
            </p>
          </div>
          <a href={OPENROUTER_RANKING_SOURCE} target="_blank" rel="noreferrer" style={styles.sourceButton}>
            查看原始来源
          </a>
        </section>

        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>已读取模型</span>
            <strong style={styles.statValue}>{models.length || "-"}</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>免费模型</span>
            <strong style={styles.statValue}>{freeModels || "-"}</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>多模态模型</span>
            <strong style={styles.statValue}>{multimodalModels || "-"}</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>快照榜单</span>
            <strong style={styles.statValue}>{openRouterWeeklySnapshot.length}</strong>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <div>
              <h2 style={styles.sectionTitle}>Top Models</h2>
              <p style={styles.sectionText}>Weekly usage of models across OpenRouter</p>
            </div>
            <span style={styles.badge}>This Week</span>
          </div>
          <div style={styles.barChart}>
            {openRouterWeeklySnapshot.map((item) => (
              <div key={item.name} style={styles.barItem}>
                <div style={styles.barMeta}>
                  <span style={styles.barName}>{item.name}</span>
                  <span style={styles.barValue}>{item.tokens}</span>
                </div>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${Math.max((item.tokenValue / maxModelTokens) * 100, 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.twoCol}>
          <div style={styles.panel}>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>LLM Leaderboard</h2>
                <p style={styles.sectionText}>Compare the most popular models on OpenRouter</p>
              </div>
            </div>
            <div style={styles.leaderList}>
              {openRouterWeeklySnapshot.map((item) => (
                <div key={item.name} style={styles.rankRow}>
                  <span style={styles.rankNo}>{item.rank}</span>
                  <div style={styles.rankMain}>
                    <strong style={styles.rankName}>{item.name}</strong>
                    <span style={styles.rankAuthor}>by {item.author}</span>
                  </div>
                  <div style={styles.rankMetric}>
                    <strong>{item.tokens}</strong>
                    <span>{item.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.sectionTitle}>Market Share</h2>
                <p style={styles.sectionText}>Token share by model author in the snapshot</p>
              </div>
            </div>
            <div style={styles.shareList}>
              {marketShare.map((item) => (
                <div key={item.author} style={styles.shareItem}>
                  <div style={styles.shareTop}>
                    <span>{item.author}</span>
                    <strong>{item.share}%</strong>
                  </div>
                  <div style={styles.shareTrack}>
                    <div style={{ ...styles.shareFill, width: `${item.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <div>
              <h2 style={styles.sectionTitle}>Top Apps</h2>
              <p style={styles.sectionText}>Apps and agents opting into usage tracking</p>
            </div>
            <span style={styles.badge}>Today</span>
          </div>
          <div style={styles.appGrid}>
            {openRouterTopAppsSnapshot.map((item) => (
              <article key={item.name} style={styles.appCard}>
                <div style={styles.appTop}>
                  <span style={styles.rankNo}>{item.rank}</span>
                  <strong>{item.tokens}</strong>
                </div>
                <h3 style={styles.appTitle}>{item.name}</h3>
                <p style={styles.appText}>{item.description}</p>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.appFill, width: `${Math.max((item.tokenValue / maxAppTokens) * 100, 6)}%` }} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHead}>
            <div>
              <h2 style={styles.sectionTitle}>OpenRouter Model Catalog</h2>
              <p style={styles.sectionText}>实时读取 OpenRouter 公共模型 API，适合后续做筛选、对比和定价页。</p>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Model</th>
                  <th style={styles.th}>Modality</th>
                  <th style={styles.th}>Context</th>
                  <th style={styles.th}>Input / 1M</th>
                  <th style={styles.th}>Output / 1M</th>
                </tr>
              </thead>
              <tbody>
                {models.slice(0, 40).map((model) => (
                  <tr key={model.id}>
                    <td style={styles.td}>
                      <div style={styles.modelName}>{model.name}</div>
                      <div style={styles.modelId}>{model.id}</div>
                    </td>
                    <td style={styles.td}>{model.architecture?.modality || "-"}</td>
                    <td style={styles.td}>{formatContext(model.context_length)}</td>
                    <td style={styles.td}>{formatUsdPerMillion(model.pricing?.prompt)}</td>
                    <td style={styles.td}>{formatUsdPerMillion(model.pricing?.completion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p style={styles.notice}>
          数据来源：OpenRouter rankings 页面与 OpenRouter public models API。此页仅用于本地测试学习，未复制 OpenRouter 品牌视觉、Logo 或完整交互。
        </p>
      </main>
    </SiteShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "64px 24px 88px",
    display: "grid",
    gap: 24,
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 24,
    alignItems: "end",
  },
  eyebrow: {
    color: "#0a7c66",
    fontWeight: 800,
    fontSize: 14,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 46,
    lineHeight: 1.08,
    color: "#14161a",
    letterSpacing: 0,
  },
  subtitle: {
    margin: "14px 0 0",
    color: "#667085",
    lineHeight: 1.8,
    maxWidth: 720,
    fontSize: 17,
  },
  sourceButton: {
    color: "#fff",
    background: "#14161a",
    textDecoration: "none",
    padding: "11px 16px",
    borderRadius: 8,
    fontWeight: 800,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e6e9ef",
    borderRadius: 8,
    padding: 18,
  },
  statLabel: {
    display: "block",
    color: "#667085",
    fontSize: 13,
    fontWeight: 700,
  },
  statValue: {
    display: "block",
    marginTop: 8,
    color: "#14161a",
    fontSize: 30,
  },
  panel: {
    background: "#fff",
    border: "1px solid #e6e9ef",
    borderRadius: 8,
    padding: 24,
    boxShadow: "0 16px 34px rgba(15, 23, 42, 0.04)",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sectionTitle: {
    margin: 0,
    color: "#20242a",
    fontSize: 24,
    letterSpacing: 0,
  },
  sectionText: {
    margin: "6px 0 0",
    color: "#667085",
    lineHeight: 1.6,
  },
  badge: {
    border: "1px solid #d8dee8",
    borderRadius: 999,
    padding: "8px 12px",
    color: "#475467",
    fontWeight: 800,
    fontSize: 13,
  },
  barChart: {
    display: "grid",
    gap: 14,
  },
  barItem: {
    display: "grid",
    gap: 7,
  },
  barMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#344054",
    fontSize: 14,
    fontWeight: 800,
  },
  barName: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  barValue: {
    color: "#101828",
  },
  barTrack: {
    height: 10,
    background: "#eef2f6",
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #0fbc8c, #3578e5)",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 24,
  },
  leaderList: {
    display: "grid",
    gap: 12,
  },
  rankRow: {
    display: "grid",
    gridTemplateColumns: "34px 1fr auto",
    alignItems: "center",
    gap: 14,
    padding: "12px 0",
    borderBottom: "1px solid #eef2f6",
  },
  rankNo: {
    display: "inline-flex",
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#14161a",
    color: "#fff",
    fontWeight: 900,
  },
  rankMain: {
    display: "grid",
    gap: 3,
    minWidth: 0,
  },
  rankName: {
    color: "#20242a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  rankAuthor: {
    color: "#667085",
    fontSize: 13,
  },
  rankMetric: {
    display: "grid",
    justifyItems: "end",
    gap: 3,
    color: "#667085",
    fontSize: 13,
  },
  shareList: {
    display: "grid",
    gap: 16,
  },
  shareItem: {
    display: "grid",
    gap: 8,
  },
  shareTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    color: "#344054",
    fontWeight: 800,
  },
  shareTrack: {
    height: 11,
    borderRadius: 999,
    background: "#eef2f6",
    overflow: "hidden",
  },
  shareFill: {
    height: "100%",
    borderRadius: 999,
    background: "#ff6b35",
  },
  appGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  appCard: {
    border: "1px solid #edf1f5",
    borderRadius: 8,
    padding: 16,
    display: "grid",
    gap: 10,
  },
  appTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    color: "#0a7c66",
  },
  appTitle: {
    margin: 0,
    color: "#20242a",
    fontSize: 18,
  },
  appText: {
    margin: 0,
    color: "#667085",
    lineHeight: 1.7,
    minHeight: 58,
  },
  appFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #7c3aed, #db2777)",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 820,
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    color: "#667085",
    fontSize: 13,
    borderBottom: "1px solid #e6e9ef",
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #eef2f6",
    color: "#344054",
    verticalAlign: "top",
  },
  modelName: {
    color: "#20242a",
    fontWeight: 800,
  },
  modelId: {
    marginTop: 4,
    color: "#667085",
    fontSize: 12,
  },
  notice: {
    margin: 0,
    color: "#667085",
    lineHeight: 1.8,
    fontSize: 13,
  },
};
