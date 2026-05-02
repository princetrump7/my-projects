"""
Market data fetcher for Gold (GLD), SPY, and NASDAQ.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

ASSETS = {
    "GOLD": "GLD",
    "SPY": "SPY",
    "NASDAQ": "^IXIC"
}

# Reasonable price ranges for validation (updated for 2024-2026 prices)
PRICE_RANGES = {
    "GOLD": (350, 500),      # GLD typically trades around $350-$450
    "SPY": (500, 800),       # SPY typically trades around $550-$750
    "NASDAQ": (20000, 30000) # NASDAQ typically trades around 22000-28000
}


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
                # Validate price
                if name in PRICE_RANGES:
                    min_price, max_price = PRICE_RANGES[name]
                    if min_price <= price <= max_price:
                        logger.info("Using fast_info for %s: %s", name, price)
                        return price
        except Exception as e:
            logger.debug("fast_info not available for %s: %s", name, e)
        
        # Method 2: Try regular history with different periods
        try:
            hist = ticker.history(period="2d")
            if hist is not None and not hist.empty:
                current_price = float(hist['Close'].iloc[-1])
                if name in PRICE_RANGES:
                    min_price, max_price = PRICE_RANGES[name]
                    if min_price <= current_price <= max_price:
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
                if name in PRICE_RANGES:
                    min_price, max_price = PRICE_RANGES[name]
                    if min_price <= current_price <= max_price:
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
    
    if name in PRICE_RANGES:
        min_price, max_price = PRICE_RANGES[name]
        if price < min_price * 0.5 or price > max_price * 2:
            logger.warning(
                "Price %s for %s outside reasonable range (expected %.2f-%.2f, got %.2f)",
                name, min_price, max_price, price
            )
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

    for name, ticker_symbol in ASSETS.items():
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
