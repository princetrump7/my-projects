#!/bin/bash
set -e

# Change into the marketpulse source directory
cd "$(dirname "$0")/marketpulse"

# Start bot in background
python main.py &

# Start web server in background
cd web
uvicorn app:app --host 0.0.0.0 --port 7860 &
WEB_PID=$!

# Keep-alive loop: ping self every 5 min so HF Spaces doesn't sleep
while true; do
  curl -s -o /dev/null http://localhost:7860/ 2>/dev/null || true
  sleep 300
done
