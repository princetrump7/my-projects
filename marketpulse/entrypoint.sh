#!/bin/bash
# Start the bot in background
python main.py &

# Start the web server (HF Spaces needs a visible web server on port 7860)
cd web
exec uvicorn app:app --host 0.0.0.0 --port 7860
