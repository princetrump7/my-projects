"""
One-shot end-to-end test cycle for MarketPulse.
"""

import logging
from dotenv import load_dotenv

from market import get_prices
from news import get_news
from sentiment import analyze_sentiment
from notifier import send_alert

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)

load_dotenv()

print("=" * 50)
print("Running one full MarketPulse cycle...")
print("=" * 50)

# 1. Market data
prices = get_prices()
print(f"\n📊 Prices: {prices}")

# 2. News
news = get_news()
print(f"\n📰 Headlines: {len(news)} fetched")
for h in news[:3]:
    print(f"  • {h}")

# 3. Sentiment
sentiment = analyze_sentiment(news)
print(f"\n🧠 Sentiment:\n{sentiment}")

# 4. Alert
message = f"""📊 *MarketPulse Update*

💰 *Prices*
{' '.join(f"{'🟢' if v['change'] >= 0 else '🔴'} *{k}*: `${v['price']:,.2f}` ({v['change']:+.2f}%)" for k, v in prices.items())}

🧠 *Sentiment Analysis*
{sentiment}
"""

print("\n📲 Sending Telegram alert...")
send_alert(message)

print("\n✅ Full cycle test completed!")
