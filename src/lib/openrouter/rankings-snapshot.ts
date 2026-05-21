export type OpenRouterRankItem = {
  rank: number;
  name: string;
  author: string;
  tokens: string;
  tokenValue: number;
  change: string;
};

export type OpenRouterAppItem = {
  rank: number;
  name: string;
  description: string;
  tokens: string;
  tokenValue: number;
};

export const OPENROUTER_RANKING_SOURCE = "https://openrouter.ai/rankings/translation?view=week";

export const openRouterWeeklySnapshot: OpenRouterRankItem[] = [
  { rank: 1, name: "Hy3 Preview", author: "tencent", tokens: "2.4T", tokenValue: 2.4, change: "526,637%" },
  { rank: 2, name: "Claude Opus 4.7", author: "anthropic", tokens: "1.56T", tokenValue: 1.56, change: "49%" },
  { rank: 3, name: "Claude Sonnet 4.6", author: "anthropic", tokens: "1.54T", tokenValue: 1.54, change: "12%" },
  { rank: 4, name: "Deepseek V4 Flash", author: "deepseek", tokens: "1.45T", tokenValue: 1.45, change: "57%" },
  { rank: 5, name: "Kimi K2.6", author: "moonshotai", tokens: "1.29T", tokenValue: 1.29, change: "28%" },
  { rank: 6, name: "Gemini 3 Flash Preview", author: "google", tokens: "1.12T", tokenValue: 1.12, change: "9%" },
  { rank: 7, name: "Deepseek V3.2", author: "deepseek", tokens: "971B", tokenValue: 0.971, change: "20%" },
  { rank: 8, name: "Deepseek V4 Pro", author: "deepseek", tokens: "881B", tokenValue: 0.881, change: "23%" },
  { rank: 9, name: "Minimax M2.7", author: "minimax", tokens: "772B", tokenValue: 0.772, change: "2%" },
  { rank: 10, name: "Owl Alpha", author: "openrouter", tokens: "621B", tokenValue: 0.621, change: "159%" },
];

export const openRouterTopAppsSnapshot: OpenRouterAppItem[] = [
  {
    rank: 1,
    name: "Hermes Agent",
    description: "Open-source, self-improving AI agent by Nous Research with memory, tools, automations and subagents.",
    tokens: "353B",
    tokenValue: 353,
  },
  {
    rank: 2,
    name: "OpenClaw",
    description: "Open-source AI agent that connects to messaging apps and can take actions across commands, files and email.",
    tokens: "195B",
    tokenValue: 195,
  },
  {
    rank: 3,
    name: "Kilo Code",
    description: "Open-source AI coding agent across VS Code, JetBrains and CLI for agentic engineering workflows.",
    tokens: "166B",
    tokenValue: 166,
  },
  {
    rank: 4,
    name: "Claude Code",
    description: "Anthropic's coding tool that reads a codebase, plans changes, edits files, runs tests and iterates.",
    tokens: "70.5B",
    tokenValue: 70.5,
  },
  {
    rank: 5,
    name: "CSS AI Pro",
    description: "Lead capture, nurture and booking workflow.",
    tokens: "66.7B",
    tokenValue: 66.7,
  },
  {
    rank: 6,
    name: "Descript",
    description: "AI video and podcast editor.",
    tokens: "62.7B",
    tokenValue: 62.7,
  },
  {
    rank: 7,
    name: "pi",
    description: "Personal coding agent experience.",
    tokens: "39.9B",
    tokenValue: 39.9,
  },
  {
    rank: 8,
    name: "Janitor AI",
    description: "Chatbot platform for custom AI characters, roleplay, storytelling and immersive fiction.",
    tokens: "27.7B",
    tokenValue: 27.7,
  },
  {
    rank: 9,
    name: "ISEKAI ZERO",
    description: "AI adventures with favorite characters.",
    tokens: "25B",
    tokenValue: 25,
  },
  {
    rank: 10,
    name: "Roo Code",
    description: "VS Code extension with specialized AI agents for coding, architecture, debugging and review.",
    tokens: "22.8B",
    tokenValue: 22.8,
  },
];
