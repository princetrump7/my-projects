# MarketPulse Bot

AI-powered market intelligence agent for Telegram.

## Deploy on Hugging Face Spaces

1. Push this repo to GitHub
2. Go to [huggingface.co/spaces](https://huggingface.co/spaces) → Create new Space
3. Select **Docker** as the Space SDK
4. Set Environment Secrets (Settings → Repository Secrets):
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `OPENROUTER_API_KEY`
   - `GOOGLE_API_KEY`
   - `GEMINI_MODEL` = `gemini-3.5-flash`
5. Deploy — done in ~3 minutes
