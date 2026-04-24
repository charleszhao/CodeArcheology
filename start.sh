#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing instances
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Clear old logs
> /tmp/codearcheology-backend.log
> /tmp/codearcheology-frontend.log

# Start backend
cd "$ROOT/codearcheology-backend"
npm start >> /tmp/codearcheology-backend.log 2>&1 &
BACKEND_PID=$!

# Start frontend
cd "$ROOT/codearcheology-frontend"
npm run dev >> /tmp/codearcheology-frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "  Backend  (PID $BACKEND_PID)  →  http://localhost:4000"
echo "  Frontend (PID $FRONTEND_PID) →  http://localhost:5173"
echo ""
echo "  Press Ctrl+C to stop both"
echo "  ─────────────────────────────────────────"

# Stop both on Ctrl+C
cleanup() {
  echo ""
  echo "  Stopping..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  kill $TAIL_B $TAIL_F 2>/dev/null
  echo "  Done."
  exit 0
}
trap cleanup INT TERM

# Stream both logs with color-coded prefixes
tail -f /tmp/codearcheology-backend.log \
  | awk '{print "\033[36m[backend] \033[0m" $0; fflush()}' &
TAIL_B=$!

tail -f /tmp/codearcheology-frontend.log \
  | awk '{print "\033[33m[frontend]\033[0m " $0; fflush()}' &
TAIL_F=$!

# Keep running until a process exits unexpectedly
wait $BACKEND_PID
echo ""
echo "  Backend exited. Check logs: /tmp/codearcheology-backend.log"
kill $FRONTEND_PID $TAIL_B $TAIL_F 2>/dev/null
