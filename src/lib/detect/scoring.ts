import type {
  AuthorityResult,
  BrandDescriptionResult,
  ConsistencyAssessment,
  CoverageResult,
  DetectInput,
  ResultItem,
  Score,
} from "@/lib/detect/types";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getLevel(total: number): Score["level"] {
  if (total < 40) return "L1";
  if (total < 60) return "L2";
  if (total < 80) return "L3";
  return "L4";
}

export function scoreCoverage(
  promptOrResult: string | CoverageResult,
  responseText = "",
  brandMentioned?: boolean
) {
  if (typeof promptOrResult !== "string") {
    return promptOrResult.isMentioned ? 26 : 0;
  }

  const prompt = promptOrResult;
  const promptTerms = prompt.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").length;
  const responseLength = responseText.replace(/\s/g, "").length;
  const intentTerms = [
    /是什么|介绍|类型|定位/,
    /优势|特色|亮点|价值/,
    /适合|人群|客户|对象/,
    /对比|相比|区别|竞品/,
    /价格|费用|地址|时间|联系|入口/,
    /风险|资质|可信|评价/,
    /流程|步骤|方案|方法/,
  ].filter((pattern) => pattern.test(prompt)).length;
  const densityBoost = Math.min(responseLength / 260, 1) * 42;
  const promptBoost = Math.min(promptTerms / 20, 1) * 18;
  const intentBoost = Math.min(intentTerms / 2, 1) * 14;
  const mentionBoost = brandMentioned ? 26 : 0;
  return clampScore(densityBoost + promptBoost + intentBoost + mentionBoost);
}

export function scoreConsistency(
  descriptionOrResponseText: BrandDescriptionResult | string,
  consistencyAssessmentOrStandardIntroduction: ConsistencyAssessment | string,
  serviceNarrative = ""
) {
  if (typeof descriptionOrResponseText !== "string") {
    const description = descriptionOrResponseText;
    const consistencyAssessment = consistencyAssessmentOrStandardIntroduction as ConsistencyAssessment;
    if (!description.knowsBrand) return 0;
    if (consistencyAssessment.hasMajorConflict) return 30;
    if (!consistencyAssessment.hitsCoreNarrative) return 60;
    return 80;
  }

  const responseText = descriptionOrResponseText;
  const standardIntroduction = String(consistencyAssessmentOrStandardIntroduction || "");
  const anchors = [standardIntroduction, serviceNarrative]
    .join(" ")
    .split(/[\s，。、“”‘’；;,.!！?？]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .slice(0, 12);

  if (anchors.length === 0) {
    const hasGrounding = /官方|来源|公开|资料|案例|数据|资质|流程|地址|价格|联系|适合|风险|对比/.test(responseText);
    const hasStructure = /一、|二、|1[.、)]|2[.、)]|首先|其次|建议|总结/.test(responseText);
    return clampScore(38 + (hasGrounding ? 28 : 0) + (hasStructure ? 14 : 0));
  }

  const hitCount = anchors.filter((anchor) => responseText.includes(anchor)).length;
  const sourceGrounding = /官方|来源|公开|资料|案例|数据|资质|根据|显示|链接|出处/.test(responseText) ? 16 : 0;
  return clampScore((hitCount / anchors.length) * 84 + sourceGrounding);
}

export function scoreAuthority(resultOrCitationCount: AuthorityResult | number, evidenceAssetCount = 0) {
  const citationCount =
    typeof resultOrCitationCount === "number" ? resultOrCitationCount : resultOrCitationCount.sourceNames.length;
  const evidenceCount =
    typeof resultOrCitationCount === "number"
      ? evidenceAssetCount
      : Math.max(evidenceAssetCount, resultOrCitationCount.sourceTypes.length);
  const citationScore = Math.min(citationCount / 3, 1) * 68;
  const evidenceBoost = Math.min(evidenceCount / 4, 1) * 24;
  const minimumEvidenceBoost = evidenceCount > 0 ? 8 : 0;
  return clampScore(citationScore + evidenceBoost + minimumEvidenceBoost);
}

export function scoreTotal(input: { consistency: number; coverage: number; authority: number }) {
  return Math.round((input.consistency + input.coverage + input.authority) / 3);
}

export function scoreResultItem(item: ResultItem, input?: DetectInput): ResultItem {
  const coverage = input
    ? scoreCoverage(input.query, item.raw?.coverageResponse || item.rawText || "", item.coverage.isMentioned)
    : scoreCoverage(item.coverage);
  const consistency = input
    ? scoreConsistency(
        item.description.rawResponse || item.rawText || "",
        input.brandNarrative?.oneLiner || input.businessSummary,
        `${input.brandName} ${input.industry} ${input.businessSummary}`
      )
    : scoreConsistency(item.description, item.consistencyAssessment);
  const authority = scoreAuthority(item.authority);
  const total = scoreTotal({ coverage, consistency, authority });

  return {
    ...item,
    scoreBreakdown: {
      coverage,
      consistency,
      authority,
      total,
    },
  };
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function scoreReport(_input: DetectInput, results: ResultItem[]): Score {
  const coverage = average(results.map((item) => item.scoreBreakdown.coverage));
  const consistency = average(results.map((item) => item.scoreBreakdown.consistency));
  const authority = average(results.map((item) => item.scoreBreakdown.authority));
  const total = scoreTotal({ coverage, consistency, authority });

  return {
    consistency,
    coverage,
    authority,
    total,
    level: getLevel(total),
  };
}
