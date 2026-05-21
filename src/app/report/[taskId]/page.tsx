"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { generateReportHtml } from "@/lib/report/export-html";
import { getScoreStyle } from "@/lib/report/score-colors";
import type { DetectReport, ResultItem, Score } from "@/lib/detect/types";

function getLevelText(level: Score["level"]) {
  if (level === "L1") return "基础级";
  if (level === "L2") return "优化级";
  if (level === "L3") return "稳定级";
  return "增长级";
}

function getMentionCount(results: ResultItem[]) {
  return results.filter((item) => item.mentioned).length;
}

function getConfidenceLabel(level?: DetectReport["confidence"]["level"]) {
  if (level === "high") return "高";
  if (level === "medium") return "中";
  return "低";
}

function formatReportTime(value?: string | null) {
  const parsed = value ? new Date(value) : new Date();
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function formatEvidenceDate(value?: string) {
  if (!value) return "未提取到";
  return formatReportTime(value).slice(0, 10);
}

function getRecommendationText(signal: ResultItem["recommendationSignal"]) {
  if (signal === "high") return "推荐倾向强";
  if (signal === "medium") return "有一定推荐倾向";
  if (signal === "low") return "推荐倾向弱";
  return "暂无推荐倾向";
}

function getModelDisplayName(model: string) {
  const labels: Record<string, string> = {
    deepseek: "DeepSeek",
    deepseek_mobile: "DeepSeek 手机版",
    kimi: "Kimi",
    doubao: "豆包",
    doubao_mobile: "豆包 手机版",
    qianwen: "通义千问",
    yuanbao: "腾讯元宝",
    wenxin: "文心一言",
    openai: "OpenAI",
  };
  return labels[model] || model;
}

function getPlatformResponse(item: ResultItem) {
  return item.raw?.coverageResponse?.trim() || item.rawText || "暂无返回内容";
}

function getDynamicFlag(label: string, ok: boolean) {
  return {
    label,
    style: ok ? styles.flagGood : styles.flagNeutral,
  };
}

function getAuthorityLabel(item: ResultItem) {
  if (item.scoreBreakdown.authority >= 70) return "权威性强";
  if (item.scoreBreakdown.authority >= 45) return "权威性较好";
  if (item.authoritySignal) return "有信源线索";
  return "权威性待补强";
}

function getAuthorityAction(item: ResultItem) {
  if (item.scoreBreakdown.authority < 45) return "信源待补强";
  if (item.scoreBreakdown.coverage < 50) return "覆盖待补强";
  if (item.scoreBreakdown.consistency < 50) return "表述待校准";
  return "可继续扩写";
}

function getResultSummary(item: ResultItem) {
  if (!item.mentioned) {
    return "当前平台回答中还没有稳定出现品牌信息。";
  }

  const strengths = [
    item.scoreBreakdown.coverage >= 65 ? "提及覆盖较好" : "已有基础提及",
    item.scoreBreakdown.consistency >= 65 ? "定位表述较稳定" : "定位表述仍可细化",
    item.scoreBreakdown.authority >= 65 ? "信源支撑较强" : "信源支撑需要继续补强",
  ];

  return strengths.join("，") + "。";
}

function getScoreAdvice(key: string) {
  if (key === "Authority") return "品牌信源的权威性不足，建议补充行业报告引用、专家背书和权威媒体报道等高可信内容。";
  if (key === "Consistency") return "品牌描述基本一致，可进一步细化不同平台的表述层次，让推荐话术更稳定。";
  return "覆盖面已经建立，下一步适合针对薄弱平台补强内容与推荐位表现。";
}

const INDUSTRY_AVERAGES: Record<string, number> = {
  新茶饮: 68,
  餐饮连锁: 72,
  教培: 60,
  家政服务: 48,
  美妆护肤: 65,
  企业服务: 63,
};

export default function ReportDetailPage() {
  const params = useParams<{ taskId: string }>();
  const [report, setReport] = useState<DetectReport | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleExportPdf() {
    if (!report) return;

    const reportHtml = generateReportHtml(report, params.taskId);
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");

    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function handleDownloadReport() {
    if (!report) return;

    const fileName = `${report.input.brandName || "fakecheck-report"}-${params.taskId}.html`;
    const blob = new Blob([generateReportHtml(report, params.taskId)], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/report/${params.taskId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "报告加载失败");
        }

        setReport(data.data.report);
        setCreatedAt(data.data.meta?.createdAt || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "报告加载失败");
      } finally {
        setLoading(false);
      }
    }

    if (params?.taskId) {
      void loadReport();
    }
  }, [params?.taskId]);

  const mentionCount = useMemo(() => {
    if (!report) return 0;
    return getMentionCount(report.results);
  }, [report]);
  const effectiveScores = report ? report.scores || report.score : null;
  const effectiveLevel = report ? report.score.level : null;
  const effectiveSummary = report ? report.structuredSummary?.headline || report.summary : "";
  const effectiveNextAction = report?.structuredSummary?.nextAction || "";
  const effectiveExecutedAt = report?.meta?.executedAt || createdAt;
  const executionMode = report?.debug?.mode || "mock";
  const industryAverage = report ? INDUSTRY_AVERAGES[report.input.industry] ?? 64 : 64;
  const averageDiff = report && effectiveScores ? effectiveScores.total - industryAverage : 0;
  const scoreCards = report
    ? [
        { key: "Consistency", label: "资料一致性", value: effectiveScores?.consistency || 0, desc: "按品牌标准表述、服务叙事和来源锚点命中度评分" },
        { key: "Coverage", label: "提及覆盖度", value: effectiveScores?.coverage || 0, desc: "按问题意图、回答密度和品牌是否被提及综合评分" },
        { key: "Authority", label: "来源可信度", value: effectiveScores?.authority || 0, desc: "按引用来源数量与证据资产强度综合评分" },
      ]
    : [];
  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.statusCard}>核验报告加载中...</div>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.statusCard}>
            <h1 style={styles.statusTitle}>暂时无法读取报告</h1>
            <p style={styles.statusText}>{error || "请稍后重试。"}</p>
            <div style={styles.buttonRow}>
              <Link href="/#detector" style={styles.primaryButton}>
                重新核验
              </Link>
              <Link href="/" style={styles.secondaryButton}>
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div>
            <div style={styles.heroMeta}>检测时间：{formatReportTime(effectiveExecutedAt)}</div>
            {executionMode !== "real" ? (
              <div style={styles.modeAlert}>
                {executionMode === "mock"
                  ? "当前报告为 MOCK 模式，仅用于流程演示，不代表真实线上检测结论。"
                  : "当前报告为 HYBRID 模式，包含部分 mock 回退，请谨慎用于对外决策。"}
              </div>
            ) : null}
            <h1 style={styles.heroTitle}>
              {report.input.brandName} 的 AI 可见性检测报告
            </h1>
            <p style={styles.heroText}>{effectiveSummary}</p>
            <div style={styles.heroTags}>
              <span style={styles.tag}>场景：{report.input.industry}</span>
              <span style={styles.tag}>命中引擎：{mentionCount} / {report.results.length}</span>
              <span style={styles.tag}>等级：{effectiveLevel || report.score.level} {getLevelText(effectiveLevel || report.score.level)}</span>
              <span style={styles.tag}>置信度：{getConfidenceLabel(report.confidence?.level)}</span>
              {report.meta?.provider ? <span style={styles.tag}>Provider：{report.meta.provider}</span> : null}
            </div>
            <div style={styles.exportRow} className="no-print">
              <button type="button" onClick={handleExportPdf} style={styles.primaryButton}>
                导出 PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                style={styles.secondaryActionButton}
              >
                下载 HTML 报告
              </button>
            </div>
          </div>

          <div style={styles.scoreCard}>
            <div style={styles.scoreValue}>{effectiveScores?.total || report.score.total}</div>
            <div style={styles.scoreLabel}>MGEO Score</div>
            <div style={styles.scoreLevel}>
              {(effectiveLevel || report.score.level)} · {getLevelText(effectiveLevel || report.score.level)}
            </div>
            <div style={styles.scoreBenchmark}>
              <div style={styles.scoreBenchmarkLine}>场景均分：{industryAverage}</div>
              <div
                style={{
                  ...styles.scoreBenchmarkDiff,
                  color: averageDiff >= 0 ? "#86efac" : "#fca5a5",
                }}
              >
                {averageDiff >= 0 ? `高于场景均分 ${averageDiff} 分` : `低于场景均分 ${Math.abs(averageDiff)} 分`}
              </div>
            </div>
          </div>
        </section>

        <section style={styles.gridThree}>
          {scoreCards.map((item) => {
            const scoreStyle = getScoreStyle(item.value);
            return (
              <article
                key={item.key}
                style={{
                  ...styles.metricCard,
                  borderLeft: `4px solid ${scoreStyle.barColor}`,
                }}
              >
                <div style={{ ...styles.metricName, color: scoreStyle.color }}>{item.key}</div>
                <div style={styles.metricSub}>{item.label}</div>
                <div style={{ ...styles.metricValue, color: scoreStyle.color }}>{item.value}</div>
                <span
                  style={{
                    ...styles.metricPill,
                    background: scoreStyle.bgColor,
                    color: scoreStyle.textColor,
                  }}
                >
                  {scoreStyle.level}
                </span>
                <div style={styles.metricDesc}>{item.desc}</div>
              </article>
            );
          })}
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>模型结果明细</h2>
          </div>
          <div style={styles.resultList}>
            {report.results.map((item) => (
              <article key={`${item.model}-${item.channel}`} style={styles.resultCard}>
                <div style={styles.resultTop}>
                  <div style={styles.resultTitleWrap}>
                    <h3 style={styles.resultModel}>{getModelDisplayName(item.model)}</h3>
                    <p style={styles.resultSummary}>{getResultSummary(item)}</p>
                  </div>
                  <span style={{ ...styles.resultToneBadge, background: "#dbeafe", color: "#1e40af" }}>
                    {getAuthorityAction(item)}
                  </span>
                </div>

                <div style={styles.resultBody}>
                  <div>
                    <div style={styles.resultFlags}>
                      {[
                        getDynamicFlag(item.mentioned ? "已提及" : "未提及", item.mentioned),
                        getDynamicFlag(item.positioningMatch ? "定位匹配" : "定位偏离", item.positioningMatch),
                        getDynamicFlag(item.descriptionConsistent ? "描述一致" : "描述不一致", item.descriptionConsistent),
                        getDynamicFlag(getAuthorityLabel(item), item.scoreBreakdown.authority >= 45),
                        getDynamicFlag(getRecommendationText(item.recommendationSignal), item.recommendationSignal !== "none"),
                      ].map((flag) => (
                        <span key={flag.label} style={flag.style}>{flag.label}</span>
                      ))}
                    </div>
                    <div style={styles.rawLabel}>平台返回内容</div>
                    <div style={styles.rawBox}>{getPlatformResponse(item)}</div>
                  </div>

                  <div style={styles.resultInsightBox}>
                    <div style={styles.resultInsightTitle}>诊断摘要</div>
                    <div style={styles.resultInsightLine}>
                      <span>品牌提及</span>
                      <strong>{item.mentioned ? `已建立${item.coverage.mentionPosition ? `，第 ${item.coverage.mentionPosition} 位` : ""}` : "未建立"}</strong>
                    </div>
                    <div style={styles.resultInsightLine}>
                      <span>定位一致性</span>
                      <strong>{item.scoreBreakdown.consistency >= 70 ? "稳定" : item.positioningMatch ? "较稳定" : "需修正"}</strong>
                    </div>
                    <div style={styles.resultInsightLine}>
                      <span>推荐倾向</span>
                      <strong>{getRecommendationText(item.recommendationSignal)}</strong>
                    </div>
                    <div style={styles.resultInsightLine}>
                      <span>结果置信度</span>
                      <strong>{getConfidenceLabel(item.confidence?.level)}</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={styles.noticePanel}>
          <div style={styles.noticeTitle}>结果摘要</div>
          <div style={styles.noticeText}>
            {report.disclaimer || "本次评分为启发式评分，不代表平台官方排名或官方权威判断。"}
          </div>
          {effectiveNextAction ? (
            <div style={styles.noticeNextAction}>下一步建议：{effectiveNextAction}</div>
          ) : null}
          {report.confidence?.reasons?.length ? (
            <div style={styles.noticeReasons}>
              {report.confidence.reasons.map((reason, index) => (
                <span key={index} style={styles.noticeReason}>
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {report.evidence ? (
          <section style={styles.panel}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>图源证据面板</h2>
            </div>

            <div style={styles.evidenceSummaryCard}>
              <div style={styles.evidenceSummaryTitle}>{report.evidence.summary}</div>
              {report.evidence.riskSignals.length ? (
                <div style={styles.noticeReasons}>
                  {report.evidence.riskSignals.map((reason, index) => (
                    <span key={index} style={styles.noticeReason}>
                      {reason}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div style={styles.snapshotGrid}>
              <article style={styles.snapshotCard}>
                <div style={styles.snapshotLabel}>命中页面</div>
                <div style={styles.snapshotValue}>{report.evidence.matchedPageCount}</div>
                <div style={styles.snapshotText}>公开网页里找到的相似图来源数量。</div>
              </article>
              <article style={styles.snapshotCard}>
                <div style={styles.snapshotLabel}>最早发布时间</div>
                <div style={styles.snapshotValue}>{report.evidence.datedPageCount}</div>
                <div style={styles.snapshotText}>
                  {formatEvidenceDate(report.evidence.earliestPublishedAt)}
                </div>
              </article>
              <article style={styles.snapshotCard}>
                <div style={styles.snapshotLabel}>低风险域名</div>
                <div style={styles.snapshotValue}>{report.evidence.lowRiskPageCount}</div>
                <div style={styles.snapshotText}>低风险来源越多，证据越稳定。</div>
              </article>
            </div>

            {(report.evidence.bestGuessLabels.length || report.evidence.webEntities.length) ? (
              <div style={styles.evidenceTagWrap}>
                {report.evidence.bestGuessLabels.map((item) => (
                  <span key={item} style={styles.evidenceTag}>
                    标签：{item}
                  </span>
                ))}
                {report.evidence.webEntities.map((item) => (
                  <span key={item} style={styles.evidenceTagMuted}>
                    实体：{item}
                  </span>
                ))}
              </div>
            ) : null}

            {report.evidence.extractedText ? (
              <div style={styles.evidenceTextBox}>
                <div style={styles.rawLabel}>OCR 文本</div>
                <div style={styles.rawBox}>{report.evidence.extractedText}</div>
              </div>
            ) : null}

            {report.evidence.matchingPages.length ? (
              <div style={styles.evidencePageList}>
                {report.evidence.matchingPages.map((page) => (
                  <article key={page.url} style={styles.evidencePageCard}>
                    <div style={styles.evidencePageHead}>
                      <div style={styles.evidencePageDomain}>{page.domain || page.url}</div>
                      <span
                        style={
                          page.riskTier === "low"
                            ? styles.evidenceRiskLow
                            : page.riskTier === "medium"
                              ? styles.evidenceRiskMedium
                              : styles.evidenceRiskHigh
                        }
                      >
                        {page.riskLabel}
                      </span>
                    </div>
                    <a href={page.url} target="_blank" rel="noreferrer" style={styles.evidencePageLink}>
                      {page.title || page.url}
                    </a>
                    <div style={styles.evidencePageMeta}>
                      完整匹配 {page.fullMatchCount} · 局部匹配 {page.partialMatchCount}
                      {page.publishedAt ? ` · 发布时间 ${formatEvidenceDate(page.publishedAt)}` : ""}
                    </div>
                    <div style={styles.evidencePageReason}>{page.riskReason}</div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>本次输入</h2>
          </div>
          <div style={styles.infoList}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>对方昵称</span>
              <span style={styles.infoValue}>{report.input.brandName}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>内容场景</span>
              <span style={styles.infoValue}>{report.input.industry}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>样本描述</span>
              <span style={styles.infoValue}>
                {report.input.brandNarrative?.oneLiner || report.input.businessSummary}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>关注问题</span>
              <span style={styles.infoValue}>{report.input.query}</span>
            </div>
          </div>
        </section>

        <section style={styles.advicePanel}>
          <div style={styles.adviceHead}>
            <h2 style={styles.sectionTitle}>诊断建议</h2>
            <p style={styles.ctaText}>根据本次检测结果，你的品牌当前最需要优先解决的问题是：</p>
          </div>
          <div style={styles.adviceList}>
            {scoreCards
              .slice()
              .sort((a, b) => a.value - b.value)
              .map((item, index) => {
                const scoreStyle = getScoreStyle(item.value);
                return (
                  <article
                    key={item.key}
                    style={{
                      ...styles.adviceItem,
                      borderLeft: `4px solid ${scoreStyle.barColor}`,
                    }}
                  >
                    <div style={styles.adviceTop}>
                      <div style={{ ...styles.adviceTitle, color: scoreStyle.color }}>
                        {item.label}（{item.key}）
                      </div>
                      <div style={styles.adviceMeta}>
                        <span style={{ ...styles.adviceScore, color: scoreStyle.color }}>当前 {item.value} 分</span>
                        <span
                          style={{
                            ...styles.advicePill,
                            background: scoreStyle.bgColor,
                            color: scoreStyle.textColor,
                          }}
                        >
                          {scoreStyle.level}
                        </span>
                        {index === 0 ? <span style={styles.priorityPill}>最优先</span> : null}
                      </div>
                    </div>
                    <div style={styles.adviceText}>{getScoreAdvice(item.key)}</div>
                  </article>
                );
              })}
          </div>
          <div style={styles.adviceDivider} />
          <div style={styles.adviceCtaArea}>
            <p style={styles.adviceCtaTitle}>需要更多证据的话，可以补充样本再跑一轮。</p>
            <div style={styles.buttonRow}>
              <Link href="/#detector" style={styles.ctaPrimaryButton}>
                再做一次核验
              </Link>
              <Link href="/" style={styles.secondaryButton}>
                返回首页
              </Link>
              <Link href="/#contact" style={styles.ghostButton}>
                提交企业接入需求
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: "#f6f7fb",
    minHeight: "100vh",
    padding: "44px 20px 88px",
  },
  container: {
    maxWidth: 1240,
    margin: "0 auto",
    display: "grid",
    gap: 26,
  },
  hero: {
    background: "#ffffff",
    border: "1px solid #dfe5ee",
    borderRadius: 24,
    padding: "36px 34px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: 44,
    alignItems: "center",
  },
  heroMeta: {
    color: "#008c80",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: 0,
    marginBottom: 14,
  },
  heroTitle: {
    margin: 0,
    fontSize: 42,
    lineHeight: 1.18,
    color: "#101827",
    fontFamily: "inherit",
    fontWeight: 900,
  },
  modeAlert: {
    display: "inline-flex",
    marginBottom: 14,
    fontSize: 12,
    lineHeight: 1.4,
    color: "#9a5a00",
    background: "#fff7e8",
    border: "1px solid #f5d392",
    borderRadius: 999,
    padding: "7px 12px",
    fontWeight: 700,
  },
  heroText: {
    margin: "20px 0 0",
    fontSize: 18,
    lineHeight: 1.8,
    color: "#667085",
    maxWidth: 760,
  },
  heroTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 26,
  },
  exportRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 26,
  },
  tag: {
    padding: "10px 16px",
    borderRadius: 999,
    background: "#eaf8f4",
    color: "#008c80",
    fontSize: 15,
    fontWeight: 800,
  },
  scoreCard: {
    background: "#111827",
    color: "#ffffff",
    borderRadius: 26,
    padding: "38px 30px",
    minHeight: 240,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    width: "100%",
    justifySelf: "end",
  },
  scoreValue: {
    fontSize: 78,
    lineHeight: 1,
    fontWeight: 900,
  },
  scoreLabel: {
    marginTop: 18,
    fontSize: 18,
    opacity: 0.88,
    fontFamily: "inherit",
    fontWeight: 700,
  },
  scoreLevel: {
    marginTop: 10,
    fontSize: 15,
    opacity: 0.75,
    fontWeight: 700,
  },
  scoreBenchmark: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid rgba(255,255,255,0.16)",
    width: "100%",
  },
  scoreBenchmarkLine: {
    fontSize: 14,
    opacity: 0.72,
    fontWeight: 700,
  },
  scoreBenchmarkDiff: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 800,
  },
  gridThree: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 20,
  },
  metricCard: {
    background: "#ffffff",
    border: "1px solid #dfe5ee",
    borderRadius: 20,
    padding: "28px 28px 28px 24px",
    minHeight: 190,
  },
  metricName: {
    fontSize: 17,
    fontWeight: 800,
  },
  metricSub: {
    marginTop: 4,
    color: "#98a2b3",
    fontSize: 12,
  },
  metricValue: {
    marginTop: 22,
    fontSize: 50,
    lineHeight: 1,
    fontWeight: 900,
  },
  metricPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  metricDesc: {
    marginTop: 14,
    fontSize: 16,
    color: "#667085",
    lineHeight: 1.55,
  },
  snapshotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
  },
  snapshotCard: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 20,
    padding: 22,
    boxShadow: "var(--shadow-ring)",
  },
  snapshotLabel: {
    color: "var(--muted-2)",
    fontSize: 12,
    fontWeight: 500,
  },
  snapshotValue: {
    marginTop: 12,
    fontSize: 30,
    lineHeight: 1.1,
    color: "var(--text)",
    fontFamily: "var(--font-serif)",
    fontWeight: 500,
  },
  snapshotText: {
    marginTop: 10,
    color: "var(--muted)",
    fontSize: 14,
    lineHeight: 1.8,
  },
  noticePanel: {
    background: "#faf3eb",
    border: "1px solid #eadccf",
    borderRadius: 20,
    padding: 20,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#8a4b08",
  },
  noticeText: {
    marginTop: 8,
    color: "var(--text-soft)",
    fontSize: 14,
    lineHeight: 1.7,
  },
  noticeNextAction: {
    marginTop: 12,
    color: "var(--brand)",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  noticeReasons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  noticeReason: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "var(--surface-warm)",
    color: "var(--text-soft)",
    fontSize: 12,
    fontWeight: 600,
  },
  evidenceSummaryCard: {
    padding: "18px 20px",
    borderRadius: 20,
    background: "#faf3eb",
    border: "1px solid #eadccf",
    marginBottom: 18,
  },
  evidenceSummaryTitle: {
    color: "var(--text-soft)",
    fontSize: 16,
    lineHeight: 1.8,
    fontWeight: 500,
    fontFamily: "var(--font-serif)",
  },
  evidenceTagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  evidenceTag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "var(--brand-soft)",
    color: "var(--text-soft)",
    fontSize: 13,
    fontWeight: 700,
  },
  evidenceTagMuted: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    background: "var(--surface-warm)",
    color: "var(--muted)",
    fontSize: 13,
    fontWeight: 600,
  },
  evidenceTextBox: {
    marginTop: 18,
  },
  evidencePageList: {
    display: "grid",
    gap: 14,
    marginTop: 18,
  },
  evidencePageCard: {
    padding: "16px 18px",
    borderRadius: 18,
    border: "1px solid var(--line)",
    background: "var(--surface-strong)",
  },
  evidencePageHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  evidencePageDomain: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--brand)",
  },
  evidenceRiskLow: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#e8f7ef",
    color: "#156b43",
    fontSize: 12,
    fontWeight: 700,
  },
  evidenceRiskMedium: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fff2df",
    color: "#8a4b08",
    fontSize: 12,
    fontWeight: 700,
  },
  evidenceRiskHigh: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fde8e8",
    color: "#9b1c1c",
    fontSize: 12,
    fontWeight: 700,
  },
  evidencePageLink: {
    display: "inline-block",
    marginTop: 8,
    color: "var(--text)",
    fontSize: 16,
    lineHeight: 1.7,
    fontWeight: 700,
    textDecoration: "none",
  },
  evidencePageMeta: {
    marginTop: 8,
    color: "var(--muted)",
    fontSize: 14,
  },
  evidencePageReason: {
    marginTop: 8,
    color: "var(--muted)",
    fontSize: 14,
    lineHeight: 1.7,
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #dfe5ee",
    borderRadius: 24,
    padding: 30,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 30,
    color: "#101827",
    fontFamily: "inherit",
    fontWeight: 900,
  },
  infoList: {
    display: "grid",
    gap: 14,
  },
  infoItem: {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: 16,
    paddingBottom: 14,
    borderBottom: "1px solid var(--line)",
  },
  infoLabel: {
    color: "var(--muted-2)",
    fontSize: 15,
  },
  infoValue: {
    color: "var(--text)",
    fontSize: 16,
    lineHeight: 1.7,
  },
  resultList: {
    display: "grid",
    gap: 20,
  },
  resultCard: {
    border: "1px solid #dfe5ee",
    borderLeft: "4px solid #2f80ed",
    borderRadius: 22,
    padding: "24px 24px 24px 22px",
    background: "#ffffff",
  },
  resultTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  resultTitleWrap: {
    display: "grid",
    gap: 8,
  },
  resultModel: {
    margin: 0,
    fontSize: 24,
    color: "#101827",
    fontFamily: "inherit",
    fontWeight: 900,
  },
  resultSummary: {
    margin: 0,
    color: "#667085",
    fontSize: 15,
    lineHeight: 1.7,
  },
  resultToneBadge: {
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  resultBody: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.35fr) minmax(260px, 0.65fr)",
    gap: 18,
    alignItems: "start",
  },
  goodBadge: {
    borderRadius: 999,
    padding: "6px 12px",
    background: "#efe7d8",
    color: "var(--text-soft)",
    fontSize: 13,
    fontWeight: 700,
  },
  weakBadge: {
    borderRadius: 999,
    padding: "6px 12px",
    background: "var(--surface-warm)",
    color: "var(--muted)",
    fontSize: 13,
    fontWeight: 700,
  },
  resultFlags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  flagGood: {
    borderRadius: 999,
    padding: "6px 12px",
    background: "#efe7d8",
    color: "var(--text-soft)",
    fontSize: 13,
    fontWeight: 600,
  },
  flagNeutral: {
    borderRadius: 999,
    padding: "6px 12px",
    background: "var(--surface-warm)",
    color: "var(--muted)",
    fontSize: 13,
    fontWeight: 600,
  },
  rawBox: {
    padding: 16,
    borderRadius: 16,
    background: "var(--surface-strong)",
    color: "var(--text-soft)",
    fontSize: 15,
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
  rawLabel: {
    marginBottom: 10,
    color: "var(--muted-2)",
    fontSize: 13,
    fontWeight: 700,
  },
  resultInsightBox: {
    borderRadius: 16,
    border: "1px solid var(--line)",
    padding: 16,
    display: "grid",
    gap: 12,
  },
  resultInsightTitle: {
    fontSize: 14,
    color: "var(--text)",
    fontFamily: "var(--font-serif)",
    fontWeight: 500,
  },
  resultInsightLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    color: "var(--muted)",
    fontSize: 13,
    paddingTop: 10,
    borderTop: "1px solid var(--line)",
  },
  notes: {
    display: "grid",
    gap: 8,
    marginTop: 14,
  },
  noteItem: {
    color: "#b53333",
    fontSize: 14,
  },
  advicePanel: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 24,
    padding: 28,
    display: "grid",
    gap: 22,
  },
  adviceHead: {
    display: "grid",
    gap: 10,
  },
  adviceList: {
    display: "grid",
    gap: 16,
  },
  adviceItem: {
    background: "var(--surface-strong)",
    border: "1px solid var(--line)",
    borderRadius: 18,
    padding: "18px 18px 18px 20px",
  },
  adviceTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 500,
    fontFamily: "var(--font-serif)",
  },
  adviceMeta: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  adviceScore: {
    fontSize: 12,
    fontWeight: 700,
  },
  advicePill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },
  priorityPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    color: "#791F1F",
    background: "#FCEBEB",
  },
  adviceText: {
    marginTop: 10,
    color: "var(--muted)",
    fontSize: 14,
    lineHeight: 1.8,
  },
  adviceDivider: {
    height: 1,
    background: "var(--line)",
  },
  adviceCtaArea: {
    display: "grid",
    justifyItems: "center",
    gap: 16,
    textAlign: "center",
  },
  adviceCtaTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 500,
    fontFamily: "var(--font-serif)",
  },
  ctaText: {
    margin: 0,
    color: "var(--muted)",
    fontSize: 17,
    lineHeight: 1.75,
    maxWidth: 720,
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    padding: "0 26px",
    borderRadius: 12,
    background: "#111827",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 900,
    textDecoration: "none",
    border: "1px solid #111827",
    boxShadow: "0 2px 0 rgba(17,24,39,0.35)",
  },
  ctaPrimaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    padding: "0 22px",
    borderRadius: 12,
    background: "var(--dark)",
    color: "var(--surface)",
    fontSize: 15,
    fontWeight: 700,
    textDecoration: "none",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    padding: "0 26px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #cfd8e3",
    color: "#101827",
    fontSize: 16,
    fontWeight: 900,
    textDecoration: "none",
  },
  ghostButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    padding: "0 22px",
    borderRadius: 12,
    background: "var(--surface-strong)",
    border: "1px solid var(--line)",
    color: "var(--muted)",
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
  },
  secondaryActionButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    padding: "0 26px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #cfd8e3",
    color: "#101827",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  statusCard: {
    background: "#ffffff",
    border: "1px solid #e7ebf0",
    borderRadius: 24,
    padding: 32,
    textAlign: "center",
  },
  statusTitle: {
    margin: 0,
    fontSize: 30,
    color: "#111827",
  },
  statusText: {
    margin: "12px 0 0",
    fontSize: 16,
    color: "#667085",
    lineHeight: 1.7,
  },
};
