import type { Metadata } from "next";

import { SiteShell } from "@/components/marketing/SiteShell";
import { OpenRouterRankingsView } from "@/components/openrouter-rankings/rankings-view";
import { getLiveOpenRouterRankings } from "@/lib/openrouter/live-rankings";

export const metadata: Metadata = {
  title: "AI模型排名 - 董逻辑MGEO",
  description: "基于 OpenRouter Rankings 样式的本地模型排名测试页。",
};

export default async function RankingPage() {
  const liveRankings = await getLiveOpenRouterRankings();

  return (
    <SiteShell current="/ranking">
      <OpenRouterRankingsView showHeader={false} liveRankings={liveRankings} />
    </SiteShell>
  );
}
