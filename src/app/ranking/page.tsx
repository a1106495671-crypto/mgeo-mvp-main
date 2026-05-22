import type { Metadata } from "next";

import { SiteShell } from "@/components/marketing/SiteShell";
import { OpenRouterRankingsView } from "@/app/openrouter-rankings/rankings-view";

export const metadata: Metadata = {
  title: "AI模型排名 - 董逻辑MGEO",
  description: "基于 OpenRouter Rankings 样式的本地模型排名测试页。",
};

export default function RankingPage() {
  return (
    <SiteShell current="/ranking">
      <OpenRouterRankingsView showHeader={false} />
    </SiteShell>
  );
}
