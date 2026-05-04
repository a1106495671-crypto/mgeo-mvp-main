#!/bin/zsh
set -u

PROJECT_DIR="/Users/binbin/Desktop/工作/mgeo-mvp-main"
LOG_FILE="$PROJECT_DIR/.dev-server.log"
PID_FILE="$PROJECT_DIR/.dev-server.pid"
PORT_CANDIDATES=(3000 3001 3002 3003 3004 3005 3010 3011 3012)
READY_TIMEOUT=120

cd "$PROJECT_DIR" || {
  echo "项目目录不存在：$PROJECT_DIR"
  read -k 1 -s -r "?按任意键退出..."
  exit 1
}

if ! command -v pnpm >/dev/null 2>&1; then
  echo "未检测到 pnpm，请先安装 pnpm。"
  read -k 1 -s -r "?按任意键退出..."
  exit 1
fi

export PATH="$PROJECT_DIR/.codex-bin:$PATH"
export NPM_CONFIG_REGISTRY="${NPM_CONFIG_REGISTRY:-https://registry.npmjs.org/}"
# 兼容 GUI 双击启动时 PATH 丢失，确保能找到 node/pnpm
if [ -x "/Applications/Codex.app/Contents/Resources/node" ]; then
  export PATH="/Applications/Codex.app/Contents/Resources:$PATH"
fi
for NODE_BIN in /opt/homebrew/bin /usr/local/bin; do
  if [ -d "$NODE_BIN" ]; then
    export PATH="$NODE_BIN:$PATH"
  fi
done

if ! command -v node >/dev/null 2>&1; then
  echo "未检测到 node，请先安装 Node.js（建议 18+）。"
  read -k 1 -s -r "?按任意键退出..."
  exit 1
fi

if [ ! -d "$PROJECT_DIR/node_modules" ]; then
  echo "首次运行，正在安装依赖..."
  pnpm install || {
    echo "依赖安装失败。"
    read -k 1 -s -r "?按任意键退出..."
    exit 1
  }
fi

is_listening() {
  local p="$1"
  lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
}

is_http_ready() {
  local p="$1"
  curl -fsS "http://127.0.0.1:$p" >/dev/null 2>&1 || curl -fsS "http://127.0.0.1:$p/detect" >/dev/null 2>&1
}

find_running_mgeo_server() {
  local p
  for p in "${PORT_CANDIDATES[@]}"; do
    if is_listening "$p" && is_http_ready "$p"; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

find_free_port() {
  local p
  for p in "${PORT_CANDIDATES[@]}"; do
    if ! is_listening "$p"; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

RUNNING_PORT="$(find_running_mgeo_server || true)"
if [ -n "$RUNNING_PORT" ]; then
  echo "检测到服务已运行：http://127.0.0.1:$RUNNING_PORT"
  open "http://127.0.0.1:$RUNNING_PORT/detect"
  exit 0
fi

PORT="$(find_free_port || true)"
if [ -z "$PORT" ]; then
  echo "候选端口都被占用：${PORT_CANDIDATES[*]}"
  echo "请先释放一个端口后重试。"
  read -k 1 -s -r "?按任意键退出..."
  exit 1
fi

if [ -f "$PID_FILE" ]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" >/dev/null 2>&1; then
    kill "$OLD_PID" >/dev/null 2>&1 || true
    sleep 1
  fi
fi

: > "$LOG_FILE"
echo "正在启动前台检测站..."
echo "使用端口：$PORT"
echo "日志文件：$LOG_FILE"

nohup pnpm dev --port "$PORT" > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

START_TS=$(date +%s)
while true; do
  if is_http_ready "$PORT"; then
    echo "启动成功：http://127.0.0.1:$PORT/detect"
    open "http://127.0.0.1:$PORT/detect"
    exit 0
  fi

  NOW_TS=$(date +%s)
  ELAPSED=$((NOW_TS - START_TS))
  if [ "$ELAPSED" -ge "$READY_TIMEOUT" ]; then
    echo "启动超时（${READY_TIMEOUT}s）。"
    echo "最近日志："
    tail -n 80 "$LOG_FILE" || true
    read -k 1 -s -r "?按任意键退出..."
    exit 1
  fi

  if ! kill -0 "$NEW_PID" >/dev/null 2>&1; then
    echo "启动进程已退出，最近日志："
    tail -n 80 "$LOG_FILE" || true
    read -k 1 -s -r "?按任意键退出..."
    exit 1
  fi

  sleep 1
done
