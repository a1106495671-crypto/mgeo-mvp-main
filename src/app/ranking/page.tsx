import type { Metadata } from "next";

import { SiteShell } from "@/components/marketing/SiteShell";
import { ModelRankingsView } from "@/components/model-rankings/rankings-view";
import { getLiveModelRankings } from "@/lib/model/live-rankings";

export const metadata: Metadata = {
  title: "AI模型排名 - 董逻辑MGEO",
  description: "董逻辑MGEO AI模型排名，展示模型热度、能力与使用趋势。",
};

export default async function RankingPage() {
  const liveRankings = await getLiveModelRankings();

  return (
    <SiteShell current="/ranking">
      <ModelRankingsView showHeader={false} liveRankings={liveRankings} />
    </SiteShell>
  );
}
