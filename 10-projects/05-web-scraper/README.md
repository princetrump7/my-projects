# 05 - Web Scraper

A Python script that scrapes web content (headlines, tables) and exports data to CSV files.

## Skills

- HTTP requests with `requests`
- HTML parsing with BeautifulSoup
- CSV export and formatting
- Rate limiting and polite scraping
- Data cleaning and normalization

## Setup

```bash
pip install -r requirements.txt && python scraper.py
```

## Checklist

- [ ] Fetch HTML from a target URL
- [ ] Parse headline titles and links
- [ ] Parse table data into structured rows
- [ ] Export scraped data to CSV
- [ ] Handle pagination across multiple pages
- [ ] Implement rate limiting between requests
- [ ] Clean and normalize text (strip whitespace, decode entities)
- [ ] Handle errors gracefully (timeouts, missing elements)
- [ ] Log scraping progress to console
- [ ] Add command-line arguments for target URL and output file
