import type { DetectChannel, DetectInput, DetectPromptSet } from "@/lib/detect/types";

function buildChannelSimulationHint(channel: DetectChannel) {
  if (channel === "mobile") {
    return `
仿真上下文（mobile）：
- 当前在“手机端”场景，优先给出短答案与直接结论
- 推荐项尽量控制在 2-3 个
- 优先给可执行动作（入口、联系、下一步）
`.trim();
  }

  return `
仿真上下文（web）：
- 当前在“网页端”场景，可给更完整解释
- 推荐项可适当展开并补充对比理由
- 强调结构化表达与信息完整度
`.trim();
}

export function buildCoveragePrompt(query: string, _channel: DetectChannel = "web") {
  const channel = _channel;
  return `
请直接回答下面这个用户问题：

${query}

要求：
1. 直接按你的正常回答方式回答
2. 如涉及推荐，请尽量给出多个可选项
3. 不要解释你的回答过程
4. 不要刻意补充你不确定的信息
${buildChannelSimulationHint(channel)}
`.trim();
}

export function buildBrandDescriptionPrompt(brandName: string, _channel: DetectChannel = "web") {
  const channel = _channel;
  return `
请介绍一下「${brandName}」这个品牌或项目。

请按以下结构回答：
1. 你是否了解这个品牌
2. 如果了解，它是做什么的
3. 你对它的定位理解是什么
4. 如果不了解，请直接说明“我不了解该品牌”

要求：
- 不确定就直接说不了解
- 不要编造具体事实
- 不要补充没有把握的细节
${buildChannelSimulationHint(channel)}
`.trim();
}

export function buildSourcePrompt(query: string, _channel: DetectChannel = "web") {
  const channel = _channel;
  return `
请回答下面这个问题：

${query}

如果你的回答中使用了明确的信息来源，请在文末单独输出“参考链接”列表（1-3 条），每条必须是完整 URL（以 http:// 或 https:// 开头）。
如果没有明确来源，请明确写“参考链接：无”。

要求：
1. 不要虚构媒体、机构或报告名称
2. 不确定时不要写“据某些资料显示”这类模糊表述
3. 链接格式示例：
   - 参考链接：
     - https://example.com/a
     - https://example.com/b
${buildChannelSimulationHint(channel)}
`.trim();
}

export function buildPromptSet(input: DetectInput): DetectPromptSet {
  return {
    coverage: buildCoveragePrompt(input.query),
    description: buildBrandDescriptionPrompt(input.brandName),
    source: buildSourcePrompt(input.query),
  };
}

export function buildPromptSetForModel(input: DetectInput, channel: DetectChannel): DetectPromptSet {
  return {
    coverage: buildCoveragePrompt(input.query, channel),
    description: buildBrandDescriptionPrompt(input.brandName, channel),
    source: buildSourcePrompt(input.query, channel),
  };
}

export const buildDetectionPromptSet = buildPromptSet;
