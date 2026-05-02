"""
AI sentiment analysis engine using Google Gemini (google.genai SDK).
"""

import logging
import os
from typing import List

from google import genai

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    """Lazy-initialize Gemini client with env var validation."""
    global _client
    if _client is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError("GOOGLE_API_KEY not set in environment")
        _client = genai.Client(api_key=api_key)
    return _client


def analyze_sentiment(news_list: List[str]) -> str:
    """
    Analyze news headlines for trading sentiment signals using Gemini.

    Parameters
    ----------
    news_list : list of str
        Headlines to analyze.

    Returns
    -------
    str
        Structured analysis from the LLM.
    """
    if not news_list:
        logger.warning("No headlines provided for sentiment analysis")
        return "No headlines to analyze."

    headlines_text = "\n".join(f"- {h}" for h in news_list)

    prompt = f"""You are a professional trading signal engine.

Analyze the following financial news headlines and output a structured report in plain text format:
1. Overall sentiment (bullish / bearish / neutral)
2. Affected assets (gold, stocks, usd, etc.)
3. Early trend signal detected (yes / no)
4. Confidence score (0–100)

Headlines:
{headlines_text}
"""

    try:
        response = _get_client().models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        content = response.text if response.text else "No response content."
        logger.info("Sentiment analysis completed")
        return content

    except Exception as exc:
        logger.error("Sentiment analysis failed: %s", exc)
        return "Sentiment analysis failed due to an error."


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    from dotenv import load_dotenv

    load_dotenv()
    test_news = [
        "Gold prices surge amid inflation fears",
        "Fed signals potential rate cuts in 2024",
        "Stock markets reach new all-time highs"
    ]
    print(analyze_sentiment(test_news))
