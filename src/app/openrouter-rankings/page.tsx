import type { Metadata } from "next";

import { OpenRouterRankingsView } from "./rankings-view";

export const metadata: Metadata = {
  title: "OpenRouter 模型榜单测试 - 董逻辑MGEO",
  description: "完整复刻 OpenRouter Rankings 栏目结构的本地学习测试页。",
};

export default function OpenRouterRankingsPage() {
  return <OpenRouterRankingsView />;
}
