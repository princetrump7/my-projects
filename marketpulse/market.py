"""
Market data fetcher for configurable public-market watchlists.
"""

import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

ASSETS = {
    "GOLD": "XAUUSD",
    "SPY": "SPY",
    "NASDAQ": "^IXIC"
}

MIN_REASONABLE_PRICE = 0.01
MAX_REASONABLE_DAILY_CHANGE = 20.0


def _configured_assets() -> Dict[str, str]:
    """
    Parse MARKETPULSE_ASSETS from env.

    Format: GOLD=XAUUSD,SPY=SPY,NASDAQ=^IXIC,BTC=BTC-USD
    """
    raw_assets = os.getenv("MARKETPULSE_ASSETS", "").strip()
    if not raw_assets:
        return ASSETS

    assets: Dict[str, str] = {}
    for pair in raw_assets.split(","):
        if "=" not in pair:
            logger.warning("Skipping invalid asset config: %s", pair)
            continue
        name, ticker = pair.split("=", 1)
        name = name.strip().upper()
        ticker = ticker.strip()
        if name and ticker:
            assets[name] = ticker

    return assets or ASSETS


def _is_market_open() -> bool:
    """Check if US stock market is currently open."""
    now = datetime.now()
    # US market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
    if now.weekday() >= 5:  # Weekend
        return False
    if now.hour < 9 or now.hour >= 16:
        return False
    if now.hour == 9 and now.minute < 30:
        return False
    return True


def _get_yesterday_close(ticker: yf.Ticker) -> Optional[float]:
    """Get yesterday's closing price with robust logic."""
    try:
        # Try to get yesterday's close from history
        hist = ticker.history(period="5d")
        if hist is None or hist.empty:
            return None
        
        close_prices = hist['Close']
        if len(close_prices) < 2:
            return None
        
        # Get the second to last close (yesterday's close)
        yesterday_close = float(close_prices.iloc[-2])
        return yesterday_close
    except Exception as e:
        logger.warning("Failed to get yesterday close for %s: %s", ticker.ticker, e)
        return None


def _get_current_price(ticker: yf.Ticker, name: str) -> Optional[float]:
    """Get current price with fast_info and fallbacks."""
    try:
        # Method 1: Try fast_info (most reliable for current price)
        try:
            fast_info = ticker.fast_info
            # Try both 'lastPrice' and 'last_price' keys
            price = fast_info.get('lastPrice') or fast_info.get('last_price')
            if price:
                price = float(price)
                if _validate_price(price, name) is not None:
                    logger.info("Using fast_info for %s: %s", name, price)
                    return price
        except Exception as e:
            logger.debug("fast_info not available for %s: %s", name, e)
        
        # Method 2: Try regular history with different periods
        try:
            hist = ticker.history(period="2d")
            if hist is not None and not hist.empty:
                current_price = float(hist['Close'].iloc[-1])
                if _validate_price(current_price, name) is not None:
                    logger.info("Using history for %s: %s", name, current_price)
                    return current_price
        except Exception as e:
            logger.debug("history not available for %s: %s", name, e)
        
        # Method 3: Download with yfinance download function
        try:
            df = yf.download(
                ticker.ticker,
                period="5d",
                interval="1d",
                progress=False,
                threads=False
            )
            if df is not None and not df.empty:
                close_col = df["Close"]
                if isinstance(close_col, pd.DataFrame):
                    close_col = close_col.iloc[:, 0]
                current_price = float(close_col.iloc[-1])
                if _validate_price(current_price, name) is not None:
                    logger.info("Using download for %s: %s", name, current_price)
                    return current_price
        except Exception as e:
            logger.debug("download not available for %s: %s", name, e)
        
        return None
        
    except Exception as e:
        logger.error("Failed to get current price for %s: %s", name, e)
        return None


def _validate_price(price: Optional[float], name: str) -> Optional[float]:
    """Validate that price is within reasonable range."""
    if price is None:
        return None

    if price < MIN_REASONABLE_PRICE:
        logger.warning("Price for %s is not usable: %.4f", name, price)
        return None

    return price


def get_prices() -> Dict[str, Any]:
    """
    Fetch latest prices and daily changes for tracked assets.

    Returns
    -------
    dict
        Mapping of asset name -> {"price": float, "change": float}
    """
    data: Dict[str, Any] = {}
    market_open = _is_market_open()
    logger.info("Market is currently %s", "OPEN" if market_open else "CLOSED")

    for name, ticker_symbol in _configured_assets().items():
        try:
            ticker = yf.Ticker(ticker_symbol)
            
            # Get current price
            current_price = _get_current_price(ticker, name)
            if current_price is None:
                logger.warning("Could not fetch current price for %s", name)
                continue
            
            # Get yesterday's close
            yesterday_close = _get_yesterday_close(ticker)
            if yesterday_close is None:
                # Fallback: use current price if we can't get yesterday
                # and assume 0% change
                yesterday_close = current_price
                logger.warning("Using current price as yesterday close for %s", name)
            
            # Validate prices
            current_price = _validate_price(current_price, name)
            yesterday_close = _validate_price(yesterday_close, name)
            
            if current_price is None or yesterday_close is None or yesterday_close == 0:
                logger.warning("Invalid price data for %s", name)
                continue
            
            # Calculate percentage change
            change = ((current_price - yesterday_close) / yesterday_close) * 100
            if abs(change) > MAX_REASONABLE_DAILY_CHANGE:
                logger.warning(
                    "Skipping %s due to suspicious daily change: %.2f%%",
                    name, change
                )
                continue

            data[name] = {
                "price": round(current_price, 2),
                "change": round(change, 2)
            }

            logger.info(
                "%s: current=%.2f, yesterday=%.2f, change=%.2f%%",
                name, current_price, yesterday_close, change
            )

        except Exception as exc:
            logger.error("Failed to fetch %s (%s): %s", name, ticker_symbol, exc)

    if not data:
        logger.warning("No price data could be fetched for any asset")

    return data


if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    print(get_prices())
