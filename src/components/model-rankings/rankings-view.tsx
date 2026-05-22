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
import type { LiveModelRankings, ModelUsagePoint, RankingPeriod } from "@/lib/model/live-rankings";

import styles from "./rankings-view.module.css";

const navItems = ["Models", "Fusion", "Chat", "Rankings", "Apps", "Enterprise", "Pricing", "Docs"];

const periodOptions: Array<{ value: RankingPeriod; label: string }> = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "trending", label: "Trending" },
];

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
  index,
  x,
  y,
  barWidth,
  width,
  chartWidth,
}: {
  rows: Array<{ id: string; label: string; value: number; share: number; color: string }>;
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
        <div className={styles.tooltipDate}>{getWeekLabel(index, 54)}</div>
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

  return Array.from({ length: 54 }, (_, index) => {
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

    return parts.map((item) => ({
      ...item,
      value: (item.value / sum) * Math.min(100, Math.max(18, total)),
    }));
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

function MetricStackedChart({ items }: { items: ModelMetricItem[] }) {
  const series = buildMetricSeries(items);
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
              {week.map((part) => {
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
        {buildReadableAxisLabels(weekLabels).map((label, index) => {
          const x = left + (plotWidth / (weekLabels.length - 1)) * index;
          return <text key={`${index}-${label}`} x={x} y={height - 9} textAnchor={index === 0 ? "start" : "middle"} className={styles.axisText}>{label}</text>;
        })}
        {series.map((week, index) => {
          const x = left + index * (barWidth + barGap);
          const tooltipRows = week.map((part) => ({
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
        {buildReadableAxisLabels(weekLabels).map((label, index) => {
          const x = left + (plotWidth / (weekLabels.length - 1)) * index;
          const textAnchor = index === 0 ? "start" : index === weekLabels.length - 1 ? "end" : "middle";
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
          return <circle key={point.name} cx={x} cy={y} r={point.size || 12} fill={point.color} opacity={0.78} />;
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
                <div className={trendClass(item.direction)}>{formatTrend(item.direction, item.change)}</div>
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
                <div>{item.share}%</div>
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
                <div className={trendClass(item.direction)}>{formatTrend(item.direction, item.change)}</div>
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
  const [leaderboardItems, setLeaderboardItems] = useState<ModelRankItem[]>(initialLeaderboardItems);
  const [period, setPeriod] = useState<RankingPeriod>(liveRankings?.period || "week");
  const [isPeriodLoading, setIsPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState("");

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
          <MetricStackedChart items={toolCallsSnapshot} />
          <MetricRankingRows items={toolCallsSnapshot} />
        </section>

        <section className={styles.module} id="benchmarks">
          <SectionHeading
            icon="flask"
            title="Benchmarks"
            description="按综合能力指标对比模型表现"
            control="Intelligence Index Score"
          />
          <ScatterChart
            points={benchmarkSnapshot.map((item) => ({ name: item.name, x: item.price, y: item.score, color: item.color, size: item.rank <= 2 ? 16 : 12 }))}
            xMax={5.25}
            yMin={28}
            yMax={64}
            xTicks={[2, 4, 5.25]}
            yTicks={[64, 58, 48, 38, 28]}
            xFormatter={(value) => `$${value.toFixed(2)}`}
            yFormatter={(value) => String(value)}
          />
          <MetricRows items={benchmarkSnapshot} kind="benchmark" />
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
          <MetricStackedChart items={contextLengthSnapshot} />
          <MetricRankingRows items={contextLengthSnapshot} />
        </section>

        <section className={styles.module} id="categories">
          <SectionHeading icon="tag" title="Categories" description="按使用场景对比模型表现" control="Programming" />
          <MetricStackedChart items={categoryRankingsSnapshot} />
          <MetricRankingRows items={categoryRankingsSnapshot} />
        </section>

        <section className={styles.module} id="natural-languages">
          <SectionHeading icon="language" title="Languages" description="按自然语言使用量对比模型表现" control="English" />
          <MetricStackedChart items={naturalLanguageSnapshot} />
          <MetricRankingRows items={naturalLanguageSnapshot} />
        </section>

        <section className={styles.module} id="programming-languages">
          <SectionHeading icon="code" title="Programming" description="按编程语言使用量对比模型表现" control="Python" />
          <MetricStackedChart items={programmingLanguageSnapshot} />
          <MetricRankingRows items={programmingLanguageSnapshot} />
        </section>

        <section className={styles.module} id="images">
          <SectionHeading icon="image" title="Images" description="模型处理图像任务的累计趋势" />
          <MetricStackedChart items={imageRankingsSnapshot} />
          <MetricRankingRows items={imageRankingsSnapshot} />
        </section>

        <section className={styles.module} id="audio">
          <SectionHeading icon="audio" title="Audio Input" description="模型处理音频输入的累计趋势" />
          <MetricStackedChart items={audioRankingsSnapshot} />
          <MetricRankingRows items={audioRankingsSnapshot} />
        </section>

        <section className={styles.module} id="apps">
          <SectionHeading icon="apps" title="Top Apps" description="按应用与 Agent 场景观察模型采用情况" control="Today" />
          <AppRows items={modelTopAppsSnapshot} />
        </section>

        <p className={styles.sourceNote}>
          数据优先使用实时抓取结果；当实时数据不可用时，自动回退到本地快照。
        </p>
      </main>
    </>
  );
}
