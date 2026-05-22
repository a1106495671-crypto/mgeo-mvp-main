import { NextResponse } from "next/server";

import { getLiveAppRankings, type AppRankingPeriod } from "@/lib/model/live-rankings";

const periods = new Set<AppRankingPeriod>(["day", "week", "month"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "day";

  if (!periods.has(period as AppRankingPeriod)) {
    return NextResponse.json({ success: false, message: "时间范围不合法。" }, { status: 400 });
  }

  const data = await getLiveAppRankings(period as AppRankingPeriod);

  if (!data) {
    return NextResponse.json({ success: false, message: "暂时无法获取应用排名。" }, { status: 502 });
  }

  return NextResponse.json({ success: true, data });
}
