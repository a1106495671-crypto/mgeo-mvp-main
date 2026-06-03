"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  authorColors,
  audioRankingsSnapshot,
  benchmarkSnapshot,
  categoryRankingsSnapshot,
  contextLengthSnapshot,
  fastestModelsSnapshot,
  imageRankingsSnapshot,
  marketShareSnapshot,
  naturalLanguageSnapshot,
  modelTopAppsSnapshot,
  modelWeeklySnapshot,
  programmingLanguageSnapshot,
  topModelAuthors,
  toolCallsSnapshot,
  weekLabels,
  type BenchmarkItem,
  type FastestModelItem,
  type MarketShareItem,
  type ModelAppItem,
  type ModelMetricItem,
  type ModelRankItem,
  type TrendDirection,
} from "@/lib/model/rankings-snapshot";
import type { AppRankingPeriod, LiveModelRankings, MetricChartPoint, ModelUsagePoint, RankingPeriod } from "@/lib/model/live-rankings";

import styles from "./rankings-view.module.css";

const navItems = ["Models", "Fusion", "Chat", "Rankings", "Apps", "Enterprise", "Pricing", "Docs"];

const periodOptions: Array<{ value: RankingPeriod; label: string }> = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "trending", label: "Trending" },
];

const appPeriodOptions: Array<{ value: AppRankingPeriod; label: string }> = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

type BenchmarkMode = "intelligence" | "coding" | "agentic";

const benchmarkOptions: Array<{ value: BenchmarkMode; label: string }> = [
  { value: "intelligence", label: "Intelligence Index Score" },
  { value: "coding", label: "Coding Index Score" },
  { value: "agentic", label: "Agentic Index Score" },
];

const benchmarkScores: Record<BenchmarkMode, number[]> = {
  intelligence: [66.8, 64.9, 63.7, 61.4, 55.1, 51.7, 48.2, 45.6, 43.1, 40.5],
  coding: [68.2, 65.4, 57.1, 63.8, 59.5, 62.1, 49.8, 50.6, 54.2, 47.3],
  agentic: [59.4, 66.7, 52.6, 65.9, 46.9, 41.2, 43.4, 50.8, 38.7, 47.1],
};

const benchmarkPriceOffsets: Record<BenchmarkMode, number[]> = {
  intelligence: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  coding: [-0.4, -0.35, 0.2, 0.05, -0.2, 0.25, 0.1, -0.15, 0.35, 0.05],
  agentic: [-0.8, -1.2, -0.15, 0.8, -0.65, 0.45, -0.05, 0.25, 0.15, -0.1],
};

function getBenchmarkItems(mode: BenchmarkMode) {
  return benchmarkSnapshot
    .map((item, index) => ({
      ...item,
      score: benchmarkScores[mode][index] ?? item.score,
      price: Math.max(0.05, item.price + (benchmarkPriceOffsets[mode][index] ?? 0)),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

type LanguageMode = "zh" | "en";

const languageOptions: Array<{ value: LanguageMode; label: string }> = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

const chineseLanguageSnapshot: ModelMetricItem[] = [
  { rank: 1, name: "DeepSeek V4 Flash", author: "deepseek", metric: "2.38T tokens", subMetric: "中文", value: 92, change: 66, direction: "up" },
  { rank: 2, name: "Hy3 preview", author: "tencent", metric: "2.12T tokens", subMetric: "中文", value: 84, change: 38, direction: "up" },
  { rank: 3, name: "Qwen3.6 35B A3B", author: "qwen", metric: "1.76T tokens", subMetric: "中文", value: 76, change: 21, direction: "up" },
  { rank: 4, name: "Kimi K2.6", author: "moonshotai", metric: "1.42T tokens", subMetric: "中文", value: 66, change: 9, direction: "down" },
  { rank: 5, name: "GLM 5.1", author: "zhipu", metric: "1.08T tokens", subMetric: "中文", value: 57, change: 18, direction: "up" },
  { rank: 6, name: "MiniMax M2.7", author: "minimax", metric: "820B tokens", subMetric: "中文", value: 49, change: 7, direction: "down" },
  { rank: 7, name: "DeepSeek V3.2", author: "deepseek", metric: "790B tokens", subMetric: "中文", value: 44, change: 12, direction: "up" },
  { rank: 8, name: "Claude Sonnet 4.6", author: "anthropic", metric: "520B tokens", subMetric: "中文", value: 36, change: 4, direction: "up" },
  { rank: 9, name: "Gemini 3 Flash Preview", author: "google", metric: "470B tokens", subMetric: "中文", value: 31, change: 3, direction: "down" },
  { rank: 10, name: "GPT-5.5", author: "openai", metric: "390B tokens", subMetric: "中文", value: 26, change: 5, direction: "flat" },
];

function getLanguageItems(mode: LanguageMode) {
  return mode === "zh" ? chineseLanguageSnapshot : naturalLanguageSnapshot;
}

function formatTrend(direction: TrendDirection, value: number) {
  if (direction === "flat") return `${value}%`;
  return `${direction === "up" ? "↑" : "↓"}${value}%`;
}

function trendClass(direction: TrendDirection) {
  if (direction === "down") return styles.trendDown;
  if (direction === "up") return styles.trendUp;
  return styles.trendFlat;
}

function chunk<T>(items: T[]) {
  const midpoint = Math.ceil(items.length / 2);
  return [items.slice(0, midpoint), items.slice(midpoint)];
}

function formatAuthor(author: string) {
  if (author === "mgeo") return "MGEO";
  return author.replace("xai", "x-ai");
}

function formatCompactValue(value: number, suffix: string) {
  if (value >= 1) return `${value.toFixed(value >= 10 ? 1 : 2)}${suffix}`;
  return `${Math.round(value * 1000)}B`;
}

function formatShare(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function getWeekLabel(index: number, total: number) {
  const labelIndex = Math.round((index / Math.max(1, total - 1)) * (weekLabels.length - 1));
  return weekLabels[labelIndex] || weekLabels[0];
}

function formatChartDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

function getTooltipX(x: number, barWidth: number, tooltipWidth: number, chartWidth: number, rightPadding: number) {
  // Place tooltip to the LEFT of the bar when there's space, similar to OpenRouter
  const preferredLeft = x - tooltipWidth - 8;
  if (preferredLeft >= 0) return preferredLeft;

  // Fallback: right of bar, clamped to chart bounds
  const rightOfBar = x + barWidth + 8;
  if (rightOfBar + tooltipWidth <= chartWidth - rightPadding) return rightOfBar;

  // Last resort: clamp inside chart
  return Math.min(Math.max(0, x + barWidth / 2 - tooltipWidth / 2), chartWidth - tooltipWidth - rightPadding);
}

function UsageTooltip({
  week,
  index,
  x,
  y,
  barWidth,
  width,
  chartWidth,
}: {
  week: ModelUsagePoint;
  index: number;
  x: number;
  y: number;
  barWidth: number;
  width: number;
  chartWidth: number;
}) {
  const rows = [...week.parts]
    .map((part) => ({
      ...part,
      share: (part.value / week.total) * 100,
      label: part.label || formatAuthor(part.author),
      color: authorColors[part.author] || authorColors.others,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <foreignObject
      x={getTooltipX(x, barWidth, width, chartWidth, 6)}
      y={Math.max(0, y)}
      width={width}
      height={292}
      className={styles.chartTooltipObject}
    >
      <div className={styles.chartTooltip}>
        <div className={styles.tooltipDate}>{week.date ? formatChartDate(week.date) : getWeekLabel(index, 54)}</div>
        <div className={styles.tooltipRows}>
          {rows.map((row) => (
            <div className={styles.tooltipRow} key={row.id}>
              <span className={styles.tooltipSwatch} style={{ background: row.color }} />
              <span className={styles.tooltipName}>{row.label}</span>
              <span className={styles.tooltipValue}>
                {formatCompactValue(row.value, "T")} · {formatShare(row.share)}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.tooltipTotal}>
          <span>Total</span>
          <span>{formatCompactValue(week.total, "T")}</span>
        </div>
      </div>
    </foreignObject>
  );
}

function ShareTooltip({
  rows,
  date,
  index,
  x,
  y,
  barWidth,
  width,
  chartWidth,
}: {
  rows: Array<{ id: string; label: string; value: number; share: number; color: string }>;
  date?: string;
  index: number;
  x: number;
  y: number;
  barWidth: number;
  width: number;
  chartWidth: number;
}) {
  return (
    <foreignObject
      x={getTooltipX(x, barWidth, width, chartWidth, 6)}
      y={Math.max(0, y)}
      width={width}
      height={292}
      className={styles.chartTooltipObject}
    >
      <div className={styles.chartTooltip}>
        <div className={styles.tooltipDate}>{date ? formatChartDate(date) : getWeekLabel(index, 54)}</div>
        <div className={styles.tooltipRows}>
          {rows
            .slice()
            .sort((a, b) => b.share - a.share)
            .map((row) => (
              <div className={styles.tooltipRow} key={row.id}>
                <span className={styles.tooltipSwatch} style={{ background: row.color }} />
                <span className={styles.tooltipName}>{row.label}</span>
                <span className={styles.tooltipValue}>{formatShare(row.share)}</span>
              </div>
            ))}
        </div>
        <div className={styles.tooltipTotal}>
          <span>Total</span>
          <span>100%</span>
        </div>
      </div>
    </foreignObject>
  );
}

function buildUsageSeries() {
  return Array.from({ length: 54 }, (_, index): ModelUsagePoint => {
    const progress = index / 53;
    const ramp = 1.4 + progress * 5.6 + Math.max(0, progress - 0.64) * 44;
    const pulse = Math.sin(index * 0.61) * 0.7 + Math.cos(index * 0.17) * 0.45;
    const total = Math.max(1.2, Math.min(29.7, ramp + pulse));
    const shares = topModelAuthors.map((author, authorIndex) => {
      const base = author === "tencent" ? 0.28 + progress * 0.2 : 0.06 + ((authorIndex * 7 + index * 3) % 13) / 100;
      const wave = Math.max(0.02, base + Math.sin(index * 0.25 + authorIndex) * 0.035);
      return { author, value: wave };
    });
    const totalShare = shares.reduce((sum, item) => sum + item.value, 0);

    return {
      total,
      parts: shares.map((item) => ({
        id: item.author,
        author: item.author,
        label: formatAuthor(item.author),
        value: (item.value / totalShare) * total,
        color: authorColors[item.author] || authorColors.others,
      })),
      date: "",
    };
  });
}

function buildAxisLabels(series: ModelUsagePoint[]) {
  if (!series.some((item) => item.date)) return buildReadableAxisLabels(weekLabels);

  return buildReadableAxisLabels(weekLabels.map((_, index) => {
    const seriesIndex = Math.round((index / Math.max(1, weekLabels.length - 1)) * (series.length - 1));
    const date = series[seriesIndex]?.date;
    return date ? formatChartDate(date).replace(/^\d+年/, index === 0 ? "$&" : "") : "";
  }));
}

function buildMetricAxisLabels(series: MetricChartPoint[]) {
  if (!series.some((item) => item.date)) return buildReadableAxisLabels(weekLabels);

  return buildReadableAxisLabels(weekLabels.map((_, index) => {
    const seriesIndex = Math.round((index / Math.max(1, weekLabels.length - 1)) * (series.length - 1));
    const date = series[seriesIndex]?.date;
    return date ? formatChartDate(date).replace(/^\d+年/, index === 0 ? "$&" : "") : "";
  }));
}

function getMarketPointDate(point: MarketShareItem[]) {
  return (point[0] as MarketShareItem & { date?: string } | undefined)?.date || "";
}

function buildMarketAxisLabels(series: MarketShareItem[][]) {
  if (!series.some((item) => getMarketPointDate(item))) return buildReadableAxisLabels(weekLabels);

  return buildReadableAxisLabels(weekLabels.map((_, index) => {
    const seriesIndex = Math.round((index / Math.max(1, weekLabels.length - 1)) * (series.length - 1));
    const date = getMarketPointDate(series[seriesIndex] || []);
    return date ? formatChartDate(date).replace(/^\d+年/, index === 0 ? "$&" : "") : "";
  }));
}

function buildReadableAxisLabels(labels: string[]) {
  return labels.map((label, index) => (index === 1 && /^\d+年/.test(labels[0] || "") ? "" : label));
}

function buildMarketSeries() {
  return Array.from({ length: 54 }, (_, index) => {
    const progress = index / 53;
    const parts = marketShareSnapshot.map((item, itemIndex) => {
      const wave = Math.sin(index * 0.22 + itemIndex * 0.9) * 2.8 + Math.cos(index * 0.07 + itemIndex) * 1.4;
      const earlyBias = item.author === "google" ? (1 - progress) * 15 : item.author === "anthropic" ? (1 - progress) * 7 : 0;
      const lateBias = item.author === "deepseek" ? progress * 7 : item.author === "tencent" ? progress * 5 : 0;
      return {
        ...item,
        share: Math.max(1.6, item.share + wave + earlyBias + lateBias),
      };
    });
    const total = parts.reduce((sum, item) => sum + item.share, 0);
    return parts.map((item) => ({ ...item, share: (item.share / total) * 100 }));
  });
}

function buildMetricSeries(items: ModelMetricItem[]) {
  const chartItems = items.slice(0, 8);

  return Array.from({ length: 54 }, (_, index): MetricChartPoint => {
    const progress = index / 53;
    const total = 32 + progress * 52 + Math.max(0, progress - 0.66) * 42 + Math.sin(index * 0.33) * 4;
    const parts = chartItems.map((item, itemIndex) => {
      const wave = Math.sin(index * 0.18 + itemIndex * 0.74) * 6 + Math.cos(index * 0.11 + itemIndex) * 3;
      return {
        ...item,
        value: Math.max(2, item.value + wave + progress * (itemIndex < 3 ? 8 : 2)),
      };
    });
    const sum = parts.reduce((acc, item) => acc + item.value, 0);

    return {
      date: "",
      parts: parts.map((item) => ({
        ...item,
        value: (item.value / sum) * Math.min(100, Math.max(18, total)),
      })),
    };
  });
}

function ModelRankingsHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} />
          <span>Model Rankings</span>
        </Link>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>
          <span>Search</span>
          <kbd>/</kbd>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <a
              key={item}
              href={item === "Rankings" ? "/ranking" : "#"}
              className={item === "Rankings" ? styles.navActive : undefined}
            >
              {item}
            </a>
          ))}
        </nav>
        <Link className={styles.signup} href="/ranking">
          MGEO
        </Link>
      </div>
    </header>
  );
}

type MiniIconType = "bars" | "cup" | "chart" | "flask" | "bolt" | "apps" | "tool" | "context" | "tag" | "language" | "code" | "image" | "audio";

function MiniIcon({ type }: { type: MiniIconType }) {
  const paths = {
    bars: (
      <>
        <path d="M5 20V11M12 20V5M19 20v-8" />
        <path d="M3 20h18" />
      </>
    ),
    cup: (
      <>
        <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
        <path d="M17 6h3a3 3 0 0 1-3 3M7 6H4a3 3 0 0 0 3 3M12 12v5M8 20h8" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5h16v14H4Z" />
        <path d="M8 15l3-4 3 2 3-6" />
      </>
    ),
    flask: (
      <>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" />
        <path d="M7.5 16h9" />
      </>
    ),
    bolt: <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />,
    apps: <path d="M5 5h6v6H5V5ZM13 5h6v6h-6V5ZM5 13h6v6H5v-6ZM13 13h6v6h-6v-6Z" />,
    tool: (
      <>
        <path d="M14.7 6.3a4 4 0 0 0-5.1 5.1l-5.3 5.3a2 2 0 0 0 2.8 2.8l5.3-5.3a4 4 0 0 0 5.1-5.1" />
        <path d="m15 4 5 5-3 3-5-5 3-3Z" />
      </>
    ),
    context: (
      <>
        <path d="M4 5h16v14H4V5Z" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </>
    ),
    tag: (
      <>
        <path d="M20 12 12 20 4 12V4h8l8 8Z" />
        <path d="M8.5 8.5h.01" />
      </>
    ),
    language: (
      <>
        <path d="M4 5h9M8.5 5v3M11 19l4-10 4 10M12.5 16h5" />
        <path d="M5 9c1 3 3 5 6 6M11 9c-1 3-3 5-6 6" />
      </>
    ),
    code: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />,
    image: (
      <>
        <path d="M4 5h16v14H4V5Z" />
        <path d="m7 16 4-4 3 3 2-2 3 3" />
        <path d="M8.5 8.5h.01" />
      </>
    ),
    audio: (
      <>
        <path d="M12 18a5 5 0 0 0 5-5v-2M12 18a5 5 0 0 1-5-5v-2M12 18v3M9 21h6" />
        <path d="M9 5a3 3 0 0 1 6 0v8a3 3 0 0 1-6 0V5Z" />
      </>
    ),
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>;
}

function SectionHeading({
  icon,
  title,
  description,
  control,
}: {
  icon: MiniIconType;
  title: string;
  description: string;
  control?: ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <div className={styles.sectionTitleRow}>
          <span className={styles.iconWrap}>
            <MiniIcon type={icon} />
          </span>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      {control ? (
        <div className={styles.headingControl}>
          {typeof control === "string" ? <span className={styles.staticBadge}>{control}</span> : control}
        </div>
      ) : null}
    </div>
  );
}

function PeriodSelect({
  value,
  loading,
  onChange,
}: {
  value: RankingPeriod;
  loading: boolean;
  onChange: (period: RankingPeriod) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLabel = periodOptions.find((option) => option.value === value)?.label || "This Week";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={styles.periodSelect} ref={rootRef}>
      <button
        className={styles.periodButton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading}
        onClick={() => setOpen((state) => !state)}
      >
        <span>{loading ? "Loading" : currentLabel}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className={styles.periodMenu} role="listbox">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              className={option.value === value ? styles.periodOptionActive : styles.periodOption}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                setOpen(false);
                onChange(option.value);
              }}
            >
              <span>{option.label}</span>
              {option.value === value ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AppPeriodSelect({
  value,
  loading,
  onChange,
}: {
  value: AppRankingPeriod;
  loading: boolean;
  onChange: (period: AppRankingPeriod) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLabel = appPeriodOptions.find((option) => option.value === value)?.label || "Today";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={styles.periodSelect} ref={rootRef}>
      <button
        className={styles.periodButton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading}
        onClick={() => setOpen((state) => !state)}
      >
        <span>{loading ? "Loading" : currentLabel}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className={styles.periodMenu} role="listbox">
          {appPeriodOptions.map((option) => (
            <button
              key={option.value}
              className={option.value === value ? styles.periodOptionActive : styles.periodOption}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                setOpen(false);
                onChange(option.value);
              }}
            >
              <span>{option.label}</span>
              {option.value === value ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BenchmarkSelect({
  value,
  onChange,
}: {
  value: BenchmarkMode;
  onChange: (mode: BenchmarkMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLabel = benchmarkOptions.find((option) => option.value === value)?.label || benchmarkOptions[0].label;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={styles.periodSelect} ref={rootRef}>
      <button
        className={styles.benchmarkButton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((state) => !state)}
      >
        <span>{currentLabel}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className={`${styles.periodMenu} ${styles.benchmarkMenu}`} role="listbox">
          <div className={styles.menuGroupLabel}>Artificial Analysis</div>
          {benchmarkOptions.map((option) => (
            <button
              key={option.value}
              className={option.value === value ? styles.periodOptionActive : styles.periodOption}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                setOpen(false);
                onChange(option.value);
              }}
            >
              <span>{option.label}</span>
              {option.value === value ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LanguageSelect({
  value,
  onChange,
}: {
  value: LanguageMode;
  onChange: (mode: LanguageMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLabel = languageOptions.find((option) => option.value === value)?.label || languageOptions[0].label;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className={styles.periodSelect} ref={rootRef}>
      <button
        className={styles.periodButton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((state) => !state)}
      >
        <span>{currentLabel}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div className={styles.periodMenu} role="listbox">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              className={option.value === value ? styles.periodOptionActive : styles.periodOption}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                setOpen(false);
                onChange(option.value);
              }}
            >
              <span>{option.label}</span>
              {option.value === value ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MetricStackedChart({ items, series: liveSeries }: { items: ModelMetricItem[]; series?: MetricChartPoint[] }) {
  const series = liveSeries?.length ? liveSeries : buildMetricSeries(items);
  const axisLabels = buildMetricAxisLabels(series);
  const width = 1120;
  const height = 360;
  const left = 52;
  const right = 16;
  const top = 12;
  const bottom = 46;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const barGap = 3;
  const barWidth = plotWidth / series.length - barGap;

  return (
    <div className={styles.chartScroller}>
      <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Ranking stacked chart">
        {[100, 60, 30].map((tick) => {
          const y = top + (1 - tick / 100) * plotHeight;
          return (
            <g key={tick}>
              <text x={0} y={y + 5} className={styles.axisText}>{tick}%</text>
              <line x1={left} x2={width - right} y1={y} y2={y} className={styles.gridLineDashed} />
            </g>
          );
        })}
        {series.map((week, index) => {
          const x = left + index * (barWidth + barGap);
          let yCursor = top + plotHeight;
          return (
            <g key={index}>
              {week.parts.map((part) => {
                const h = Math.max(1, (part.value / 100) * plotHeight);
                yCursor -= h;
                return (
                  <rect
                    key={`${index}-${part.name}`}
                    x={x}
                    y={yCursor}
                    width={barWidth}
                    height={h}
                    fill={part.color || authorColors[part.author] || authorColors.others}
                  />
                );
              })}
            </g>
          );
        })}
        {axisLabels.map((label, index) => {
          const x = left + (plotWidth / (axisLabels.length - 1)) * index;
          return <text key={`${index}-${label}`} x={x} y={height - 9} textAnchor={index === 0 ? "start" : "middle"} className={styles.axisText}>{label}</text>;
        })}
        {series.map((week, index) => {
          const x = left + index * (barWidth + barGap);
          const tooltipRows = week.parts.map((part) => ({
            id: `${part.rank}-${part.name}`,
            label: part.name,
            value: part.value,
            share: part.value,
            color: part.color || authorColors[part.author] || authorColors.others,
          }));

          return (
            <g key={`tooltip-${index}`} className={styles.barGroup}>
              <rect x={x} y={top} width={barWidth} height={plotHeight} className={styles.hoverTarget} />
              <ShareTooltip
                rows={tooltipRows}
                date={week.date}
                index={index}
                x={x}
                y={top + 28}
                barWidth={barWidth}
                width={286}
                chartWidth={width}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TopModelsChart({ series: liveSeries }: { series?: ModelUsagePoint[] }) {
  const series = liveSeries?.length ? liveSeries : buildUsageSeries();
  const width = 1120;
  const height = 360;
  const left = 52;
  const right = 16;
  const top = 12;
  const bottom = 46;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const barGap = 3;
  const barWidth = plotWidth / series.length - barGap;
  const maxY = Math.max(30, Math.ceil(Math.max(...series.map((item) => item.total)) / 5) * 5);
  const yTicks = [maxY, maxY * 0.75, maxY * 0.5, maxY * 0.25];
  const axisLabels = buildAxisLabels(series);

  return (
    <div className={styles.chartScroller}>
      <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weekly usage stacked bar chart">
        {yTicks.map((tick) => {
          const y = top + (1 - tick / maxY) * plotHeight;
          return (
            <g key={tick}>
              <text x={0} y={y + 5} className={styles.axisText}>{tick === maxY ? `${maxY}T` : `${Number(tick.toFixed(1))}T`}</text>
              <line x1={left} x2={width - right} y1={y} y2={y} className={styles.gridLine} />
            </g>
          );
        })}
        {series.map((week, index) => {
          const x = left + index * (barWidth + barGap);
          let yCursor = top + plotHeight;
          return (
            <g key={index}>
              {week.parts.map((part) => {
                const h = Math.max(1, (part.value / maxY) * plotHeight);
                yCursor -= h;
                return (
                  <rect
                    key={`${index}-${part.id}`}
                    x={x}
                    y={yCursor}
                    width={barWidth}
                    height={h}
                    fill={part.color || authorColors[part.author] || authorColors.others}
                  />
                );
              })}
            </g>
          );
        })}
        {axisLabels.map((label, index) => {
          const x = left + (plotWidth / (axisLabels.length - 1)) * index;
          return <text key={label} x={x} y={height - 9} textAnchor={index === 0 ? "start" : "middle"} className={styles.axisText}>{label}</text>;
        })}
        {series.map((week, index) => {
          const x = left + index * (barWidth + barGap);

          return (
            <g key={`tooltip-${index}`} className={styles.barGroup}>
              <rect x={x} y={top} width={barWidth} height={plotHeight} className={styles.hoverTarget} />
              <UsageTooltip
                week={week}
                index={index}
                x={x}
                y={top + 18}
                barWidth={barWidth}
                width={286}
                chartWidth={width}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MarketShareChart({ series: liveSeries }: { series?: MarketShareItem[][] }) {
  const series = liveSeries?.length ? liveSeries : buildMarketSeries();
  const axisLabels = buildMarketAxisLabels(series);
  const width = 1120;
  const height = 392;
  const left = 52;
  const right = 52;
  const top = 12;
  const bottom = 74;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const barGap = 3;
  const barWidth = plotWidth / series.length - barGap;

  return (
    <div className={styles.chartScroller}>
      <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Market share stacked chart">
        {[100, 60, 30].map((tick) => {
          const y = top + (1 - tick / 100) * plotHeight;
          return (
            <g key={tick}>
              <text x={0} y={y + 5} className={styles.axisText}>{tick}%</text>
              <line x1={left} x2={width - right} y1={y} y2={y} className={styles.gridLineDashed} />
            </g>
          );
        })}
        {series.map((week, index) => {
          const x = left + index * (barWidth + barGap);
          let yCursor = top + plotHeight;
          return (
            <g key={index}>
              {week.map((part) => {
                const h = Math.max(1, (part.share / 100) * plotHeight);
                yCursor -= h;
                return <rect key={`${index}-${part.author}`} x={x} y={yCursor} width={barWidth} height={h} fill={part.color} />;
              })}
            </g>
          );
        })}
        {axisLabels.map((label, index) => {
          const x = left + (plotWidth / (axisLabels.length - 1)) * index;
          const textAnchor = index === 0 ? "start" : index === axisLabels.length - 1 ? "end" : "middle";
          return <text key={`${index}-${label}`} x={x} y={height - 28} textAnchor={textAnchor} className={styles.axisText}>{label}</text>;
        })}
        {series.map((week, index) => {
          const x = left + index * (barWidth + barGap);
          const tooltipRows = week.map((part) => ({
            id: part.author,
            label: formatAuthor(part.author),
            value: part.share,
            share: part.share,
            color: part.color,
          }));

          return (
            <g key={`tooltip-${index}`} className={styles.barGroup}>
              <rect x={x} y={top} width={barWidth} height={plotHeight} className={styles.hoverTarget} />
              <ShareTooltip
                rows={tooltipRows}
                date={getMarketPointDate(week)}
                index={index}
                x={x}
                y={top + 28}
                barWidth={barWidth}
                width={286}
                chartWidth={width}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ScatterChart({
  points,
  xMax,
  yMax,
  yMin,
  xTicks,
  yTicks,
  xFormatter,
  yFormatter,
}: {
  points: Array<{ name: string; x: number; y: number; color: string; size?: number }>;
  xMax: number;
  yMax: number;
  yMin: number;
  xTicks: number[];
  yTicks: number[];
  xFormatter: (value: number) => string;
  yFormatter: (value: number) => string;
}) {
  const width = 1120;
  const height = 360;
  const left = 92;
  const right = 46;
  const top = 28;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  return (
    <div className={styles.chartScroller}>
      <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scatter chart">
        {yTicks.map((tick) => {
          const y = top + (1 - (tick - yMin) / (yMax - yMin)) * plotHeight;
          return (
            <g key={tick}>
              <text x={0} y={y + 5} className={styles.axisText}>{yFormatter(tick)}</text>
              <line x1={left} x2={width - right} y1={y} y2={y} className={styles.gridLineDashed} />
            </g>
          );
        })}
        {xTicks.map((tick) => {
          const x = left + (tick / xMax) * plotWidth;
          return (
            <g key={tick}>
              <text x={x} y={height - 8} textAnchor="middle" className={styles.axisText}>{xFormatter(tick)}</text>
              <line x1={x} x2={x} y1={top} y2={top + plotHeight} className={styles.gridLineDashed} />
            </g>
          );
        })}
        <line x1={left} x2={left} y1={top} y2={top + plotHeight} className={styles.axisLine} />
        <line x1={left} x2={width - right} y1={top + plotHeight} y2={top + plotHeight} className={styles.axisLine} />
        {points.map((point) => {
          const x = left + (point.x / xMax) * plotWidth;
          const y = top + (1 - (point.y - yMin) / (yMax - yMin)) * plotHeight;
          return (
            <g
              className={styles.scatterPoint}
              key={point.name}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <circle r={point.size || 12} fill={point.color} opacity={0.78} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MetricRankingRows({ items }: { items: ModelMetricItem[] }) {
  const [left, right] = chunk(items);
  return (
    <div className={styles.rowsGrid}>
      {[left, right].map((column, columnIndex) => (
        <div className={styles.rowColumn} key={columnIndex}>
          {column.map((item) => (
            <div className={styles.metricRow} key={`${item.rank}-${item.name}`}>
              <div className={styles.rankNo}>{item.rank}.</div>
              <span className={styles.legendDot} style={{ background: item.color || authorColors[item.author] || authorColors.others }} />
              <div className={styles.rankIdentity}>
                <div className={styles.rankName}>{item.name}</div>
                <div className={styles.byline}>by <span>{formatAuthor(item.author)}</span>{item.subMetric ? ` · ${item.subMetric}` : ""}</div>
              </div>
              <div className={styles.metric}>
                <div>{item.metric}</div>
                <div className={trendClass(item.direction)}>{formatTrend(item.direction, item.change)}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function RankingRows({ items }: { items: ModelRankItem[] }) {
  const [left, right] = chunk(items);
  return (
    <div className={styles.rowsGrid}>
      {[left, right].map((column, columnIndex) => (
        <div className={styles.rowColumn} key={columnIndex}>
          {column.map((item) => (
            <div className={styles.rankRow} key={item.rank}>
              <div className={styles.rankNo}>{item.rank}.</div>
              <span className={styles.authorDot} style={{ background: authorColors[item.author] || authorColors.others }} />
              <div className={styles.rankIdentity}>
                <div className={styles.rankName}>{item.name}</div>
                <div className={styles.byline}>by <span>{formatAuthor(item.author)}</span></div>
              </div>
              <div className={styles.metric}>
                <div>{item.tokens} tokens</div>
                {item.change ? <div className={trendClass(item.direction)}>{formatTrend(item.direction, item.change)}</div> : null}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MarketRows({ items }: { items: MarketShareItem[] }) {
  const [left, right] = chunk(items);
  return (
    <div className={styles.rowsGrid}>
      {[left, right].map((column, columnIndex) => (
        <div className={styles.rowColumn} key={columnIndex}>
          {column.map((item) => (
            <div className={styles.legendRow} key={item.rank}>
              <div className={styles.rankNo}>{item.rank}.</div>
              <span className={styles.legendDot} style={{ background: item.color }} />
              <div className={styles.legendName}>{formatAuthor(item.author)}</div>
              <div className={styles.metric}>
                <div>{item.tokens}</div>
                <div>{formatShare(item.share)}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MetricRows({ items, kind }: { items: Array<BenchmarkItem | FastestModelItem>; kind: "benchmark" | "speed" }) {
  const [left, right] = chunk(items);
  return (
    <div className={styles.rowsGrid}>
      {[left, right].map((column, columnIndex) => (
        <div className={styles.rowColumn} key={columnIndex}>
          {column.map((item) => {
            const subtitle = kind === "benchmark" ? `by ${(item as BenchmarkItem).author}` : `fastest on ${(item as FastestModelItem).provider}`;
            const value = kind === "benchmark" ? (item as BenchmarkItem).score.toFixed(1) : `${(item as FastestModelItem).speed} tok/s`;
            const subValue = kind === "speed" ? `$${(item as FastestModelItem).price.toFixed(2)}/M` : "";
            return (
              <div className={styles.metricRow} key={item.rank}>
                <div className={styles.rankNo}>{item.rank}.</div>
                <span className={styles.legendDot} style={{ background: item.color }} />
                <div className={styles.rankIdentity}>
                  <div className={styles.rankName}>{item.name}</div>
                  <div className={styles.byline}>{subtitle}</div>
                </div>
                <div className={styles.metric}>
                  <div>{value}</div>
                  {subValue ? <div>{subValue}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AppRows({ items }: { items: ModelAppItem[] }) {
  const [left, right] = chunk(items);
  return (
    <div className={styles.rowsGrid}>
      {[left, right].map((column, columnIndex) => (
        <div className={styles.rowColumn} key={columnIndex}>
          {column.map((item) => (
            <div className={styles.rankRow} key={item.rank}>
              <div className={styles.rankNo}>{item.rank}.</div>
              <span className={styles.authorDot} style={{ background: authorColors[item.author] || authorColors.others }} />
              <div className={styles.rankIdentity}>
                <div className={styles.rankName}>{item.name}</div>
                <div className={styles.byline}>by <span>{item.author}</span></div>
              </div>
              <div className={styles.metric}>
                <div>{item.tokens} tokens</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ModelRankingsView({
  showHeader = true,
  liveRankings,
}: {
  showHeader?: boolean;
  liveRankings?: LiveModelRankings | null;
}) {
  const topModelsSeries = liveRankings?.topModelsSeries;
  const initialLeaderboardItems = liveRankings?.leaderboard?.length ? liveRankings.leaderboard : modelWeeklySnapshot;
  const marketSeries = liveRankings?.marketShareSeries?.length ? liveRankings.marketShareSeries : undefined;
  const marketItems = liveRankings?.marketShareItems?.length ? liveRankings.marketShareItems : marketShareSnapshot;
  const metricCharts = liveRankings?.metricCharts || {};
  const toolItems = metricCharts.tools?.items?.length ? metricCharts.tools.items : toolCallsSnapshot;
  const categoryItems = metricCharts.categories?.items?.length ? metricCharts.categories.items : categoryRankingsSnapshot;
  const contextItems = metricCharts.contextLength?.items?.length ? metricCharts.contextLength.items : contextLengthSnapshot;
  const naturalLanguageItems = metricCharts.naturalLanguage?.items?.length ? metricCharts.naturalLanguage.items : naturalLanguageSnapshot;
  const programmingLanguageItems = metricCharts.programmingLanguage?.items?.length ? metricCharts.programmingLanguage.items : programmingLanguageSnapshot;
  const imageItems = metricCharts.images?.items?.length ? metricCharts.images.items : imageRankingsSnapshot;
  const audioItems = metricCharts.audio?.items?.length ? metricCharts.audio.items : audioRankingsSnapshot;
  const [leaderboardItems, setLeaderboardItems] = useState<ModelRankItem[]>(initialLeaderboardItems);
  const [period, setPeriod] = useState<RankingPeriod>(liveRankings?.period || "week");
  const [isPeriodLoading, setIsPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState("");
  const [benchmarkMode, setBenchmarkMode] = useState<BenchmarkMode>("intelligence");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("zh");
  const [appPeriod, setAppPeriod] = useState<AppRankingPeriod>("day");
  const [appItems, setAppItems] = useState<ModelAppItem[]>(modelTopAppsSnapshot);
  const [isAppPeriodLoading, setIsAppPeriodLoading] = useState(false);
  const [appPeriodError, setAppPeriodError] = useState("");
  const benchmarkItems = getBenchmarkItems(benchmarkMode);
  const languageItems = languageMode === "zh" ? (metricCharts.naturalLanguage?.items?.length ? metricCharts.naturalLanguage.items : chineseLanguageSnapshot) : naturalLanguageItems;
  const languageSeries = languageMode === "zh" ? metricCharts.naturalLanguage?.series : undefined;

  useEffect(() => {
    setLeaderboardItems(initialLeaderboardItems);
    setPeriod(liveRankings?.period || "week");
  }, [initialLeaderboardItems, liveRankings?.period]);

  async function handlePeriodChange(nextPeriod: RankingPeriod) {
    if (nextPeriod === period || isPeriodLoading) return;

    const previousPeriod = period;
    setPeriod(nextPeriod);
    setIsPeriodLoading(true);
    setPeriodError("");

    try {
      const response = await fetch(`/api/rankings/leaderboard?period=${nextPeriod}`, {
        headers: { accept: "application/json" },
      });
      const payload = await response.json() as {
        success?: boolean;
        data?: { leaderboard?: ModelRankItem[]; period?: RankingPeriod };
        message?: string;
      };

      if (!response.ok || !payload.success || !payload.data?.leaderboard?.length) {
        throw new Error(payload.message || "暂时无法获取模型排名。");
      }

      setLeaderboardItems(payload.data.leaderboard);
      setPeriod(payload.data.period || nextPeriod);
    } catch (error) {
      setPeriod(previousPeriod);
      setPeriodError(error instanceof Error ? error.message : "暂时无法获取模型排名。");
    } finally {
      setIsPeriodLoading(false);
    }
  }

  async function handleAppPeriodChange(nextPeriod: AppRankingPeriod) {
    if (nextPeriod === appPeriod && appItems !== modelTopAppsSnapshot) return;
    if (isAppPeriodLoading) return;

    const previousPeriod = appPeriod;
    setAppPeriod(nextPeriod);
    setIsAppPeriodLoading(true);
    setAppPeriodError("");

    try {
      const response = await fetch(`/api/rankings/apps?period=${nextPeriod}`, {
        headers: { accept: "application/json" },
      });
      const payload = await response.json() as {
        success?: boolean;
        data?: { apps?: ModelAppItem[]; period?: AppRankingPeriod };
        message?: string;
      };

      if (!response.ok || !payload.success || !payload.data?.apps?.length) {
        throw new Error(payload.message || "暂时无法获取应用排名。");
      }

      setAppItems(payload.data.apps);
      setAppPeriod(payload.data.period || nextPeriod);
    } catch (error) {
      setAppPeriod(previousPeriod);
      setAppPeriodError(error instanceof Error ? error.message : "暂时无法获取应用排名。");
    } finally {
      setIsAppPeriodLoading(false);
    }
  }

  useEffect(() => {
    void handleAppPeriodChange("day");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {showHeader ? <ModelRankingsHeader /> : null}
      <main className={styles.page}>
        <section className={styles.hero}>
          <h1>AI Model Rankings</h1>
          <p>基于模型热度、真实调用趋势与能力指标，追踪主流 AI 模型的市场表现。</p>
        </section>

        <section className={styles.module} id="top-models">
          <SectionHeading icon="bars" title="Top Models" description="主流模型每周使用趋势" />
          <TopModelsChart series={topModelsSeries} />
        </section>

        <section className={styles.module} id="leaderboard">
          <SectionHeading
            icon="cup"
            title="LLM Leaderboard"
            description="按时间范围查询不同模型的调用量"
            control={<PeriodSelect value={period} loading={isPeriodLoading} onChange={handlePeriodChange} />}
          />
          {periodError ? <p className={styles.inlineError}>{periodError}</p> : null}
          <RankingRows items={leaderboardItems} />
        </section>

        <section className={styles.module} id="market-share">
          <SectionHeading icon="chart" title="Market Share" description="按模型厂商对比 token 份额" />
          <MarketShareChart series={marketSeries} />
          <MarketRows items={marketItems} />
        </section>

        <section className={styles.module} id="tools">
          <SectionHeading icon="tool" title="Tool Calls" description="对比不同模型的工具调用使用量" />
          <MetricStackedChart items={toolItems} series={metricCharts.tools?.series} />
          <MetricRankingRows items={toolItems} />
        </section>

        <section className={styles.module} id="benchmarks">
          <SectionHeading
            icon="flask"
            title="Benchmarks"
            description="按综合能力指标对比模型表现"
            control={<BenchmarkSelect value={benchmarkMode} onChange={setBenchmarkMode} />}
          />
          <div className={styles.benchmarkStage}>
            <ScatterChart
              points={benchmarkItems.map((item) => ({ name: item.name, x: item.price, y: item.score, color: item.color, size: item.rank <= 2 ? 16 : 12 }))}
              xMax={5.25}
              yMin={32}
              yMax={80}
              xTicks={[2, 4, 5.25]}
              yTicks={[80, 62, 47, 32]}
              xFormatter={(value) => `$${value.toFixed(2)}`}
              yFormatter={(value) => String(value)}
            />
            <MetricRows items={benchmarkItems} kind="benchmark" />
          </div>
        </section>

        <section className={styles.module} id="performance">
          <SectionHeading icon="bolt" title="Fastest models" description="对比不同服务商下的模型吞吐表现" control="Highest throughput" />
          <ScatterChart
            points={fastestModelsSnapshot.map((item) => ({ name: item.name, x: item.price, y: item.speed, color: item.color, size: item.rank <= 3 ? 14 : 10 }))}
            xMax={2.36}
            yMin={0}
            yMax={680}
            xTicks={[0.6, 1.2, 1.8, 2.36]}
            yTicks={[677, 600, 400, 200, 0]}
            xFormatter={(value) => `$${value.toFixed(2)}/M`}
            yFormatter={(value) => `${value} tok/s`}
          />
          <MetricRows items={fastestModelsSnapshot} kind="speed" />
        </section>

        <section className={styles.module} id="context-length">
          <SectionHeading icon="context" title="Context Length" description="按上下文窗口对比模型使用情况" control="10K" />
          <MetricStackedChart items={contextItems} series={metricCharts.contextLength?.series} />
          <MetricRankingRows items={contextItems} />
        </section>

        <section className={styles.module} id="categories">
          <SectionHeading icon="tag" title="Categories" description="按使用场景对比模型表现" control="Programming" />
          <MetricStackedChart items={categoryItems} series={metricCharts.categories?.series} />
          <MetricRankingRows items={categoryItems} />
        </section>

        <section className={styles.module} id="natural-languages">
          <SectionHeading
            icon="language"
            title="Languages"
            description="按自然语言使用量对比模型表现"
            control={<LanguageSelect value={languageMode} onChange={setLanguageMode} />}
          />
          <MetricStackedChart items={languageItems} series={languageSeries} />
          <MetricRankingRows items={languageItems} />
        </section>

        <section className={styles.module} id="programming-languages">
          <SectionHeading icon="code" title="Programming" description="按编程语言使用量对比模型表现" control="Python" />
          <MetricStackedChart items={programmingLanguageItems} series={metricCharts.programmingLanguage?.series} />
          <MetricRankingRows items={programmingLanguageItems} />
        </section>

        <section className={styles.module} id="images">
          <SectionHeading icon="image" title="Images" description="模型处理图像任务的累计趋势" />
          <MetricStackedChart items={imageItems} series={metricCharts.images?.series} />
          <MetricRankingRows items={imageItems} />
        </section>

        <section className={styles.module} id="audio">
          <SectionHeading icon="audio" title="Audio Input" description="模型处理音频输入的累计趋势" />
          <MetricStackedChart items={audioItems} series={metricCharts.audio?.series} />
          <MetricRankingRows items={audioItems} />
        </section>

        <section className={styles.module} id="apps">
          <SectionHeading
            icon="apps"
            title="Top Apps"
            description="按应用与 Agent 场景观察模型采用情况"
            control={<AppPeriodSelect value={appPeriod} loading={isAppPeriodLoading} onChange={handleAppPeriodChange} />}
          />
          {appPeriodError ? <p className={styles.inlineError}>{appPeriodError}</p> : null}
          <AppRows items={appItems} />
        </section>
      </main>
    </>
  );
}
