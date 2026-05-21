#!/bin/zsh
set -u

PROJECT_DIR="/Users/jeon/Desktop/工作/mgeo-mvp-main"
LOCAL_NODE_BIN="$HOME/.local/codex-node/node-v22.13.1-darwin-arm64/bin"
DEFAULT_PORT=3000
MAX_PORT=3010
LOG_FILE="$PROJECT_DIR/.dev-server.log"
PID_FILE="$PROJECT_DIR/.dev-server.pid"
URL_FILE="$PROJECT_DIR/.dev-server.url"

cd "$PROJECT_DIR" || exit 1

if [ -d "$LOCAL_NODE_BIN" ]; then
  export PATH="$LOCAL_NODE_BIN:$PATH"
fi

is_port_busy() {
  lsof -tiTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

is_mgeo_frontend() {
  curl -s -L --max-time 3 "http://127.0.0.1:$1" | grep -q "董逻辑MGEO"
}

find_free_port() {
  local port="$DEFAULT_PORT"
  while [ "$port" -le "$MAX_PORT" ]; do
    if ! is_port_busy "$port"; then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
  done
  return 1
}

wait_until_ready() {
  local port="$1"
  local tries=0
  while [ "$tries" -lt 30 ]; do
    if is_mgeo_frontend "$port"; then
      return 0
    fi
    sleep 1
    tries=$((tries + 1))
  done
  return 1
}

if is_port_busy "$DEFAULT_PORT" && is_mgeo_frontend "$DEFAULT_PORT"; then
  PORT="$DEFAULT_PORT"
  echo "检测前端已经在 $PORT 端口运行。"
else
  PORT="$(find_free_port)"
  if [ -z "${PORT:-}" ]; then
    echo "3000-3010 端口都被占用了，请先关闭不用的本地服务。"
    exit 1
  fi

  if [ "$PORT" != "$DEFAULT_PORT" ]; then
    echo "3000 端口被占用，自动改用 $PORT 端口。"
  fi

  if command -v pnpm >/dev/null 2>&1; then
    nohup pnpm exec next dev -p "$PORT" > "$LOG_FILE" 2>&1 &
  elif command -v npm >/dev/null 2>&1; then
    nohup npx next dev -p "$PORT" > "$LOG_FILE" 2>&1 &
  else
    echo "未找到 pnpm/npm，请先安装 Node.js 依赖工具。"
    exit 1
  fi

  echo $! > "$PID_FILE"
  echo "正在启动检测前端服务，端口：$PORT"

  if ! wait_until_ready "$PORT"; then
    echo "服务启动超时，请查看日志：$LOG_FILE"
    exit 1
  fi
fi

URL="http://localhost:$PORT"
echo "$URL" > "$URL_FILE"
open "$URL"
echo "已打开检测前端：$URL"
