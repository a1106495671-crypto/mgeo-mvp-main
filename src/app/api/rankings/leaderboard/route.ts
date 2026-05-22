import { NextResponse } from "next/server";

import { getLiveModelLeaderboard, type RankingPeriod } from "@/lib/model/live-rankings";

const periods = new Set<RankingPeriod>(["day", "week", "month", "trending"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "week";

  if (!periods.has(period as RankingPeriod)) {
    return NextResponse.json({ success: false, message: "时间范围不合法。" }, { status: 400 });
  }

  const data = await getLiveModelLeaderboard(period as RankingPeriod);

  if (!data) {
    return NextResponse.json({ success: false, message: "暂时无法获取模型排名。" }, { status: 502 });
  }

  return NextResponse.json({ success: true, data });
}
