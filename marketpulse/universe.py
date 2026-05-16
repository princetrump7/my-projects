"""
Liquid ticker universe for MarketPulse screener.
"""

# A static list of highly liquid, well-known stocks for the MVP screener.
# Fetching data for 500+ stocks in real-time sequentially is too slow.
LIQUID_100 = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "BRK-B", "LLY", "TSM",
    "AVGO", "V", "JPM", "UNH", "WMT", "MA", "PG", "JNJ", "HD", "MRK",
    "COST", "ORCL", "ABBV", "CVX", "CRM", "BAC", "KO", "NFLX", "AMD", "PEP",
    "TMO", "LIN", "MCD", "ADBE", "DIS", "CSCO", "ABT", "INTC", "DHR", "INTU",
    "VZ", "PFE", "CMCSA", "IBM", "AMAT", "NOW", "CAT", "TXN", "BA", "GE",
    "HON", "SPGI", "UNP", "AMGN", "ISRG", "SYK", "LOW", "PGR", "RTX", "BKNG",
    "LMT", "MDT", "TJX", "VRTX", "GS", "COP", "BLK", "MDLZ", "C", "AXP",
    "ADI", "MMC", "REGN", "BMY", "CB", "CVS", "CI", "TMUS", "BSX", "ZTS",
    "KLAC", "GILD", "DE", "FI", "SNPS", "CSX", "CDNS", "WM", "SHW", "SLB",
    "MO", "FDX", "HCA", "FCX", "TGT", "EOG", "AON", "NEM", "OXY", "PLTR"
]
