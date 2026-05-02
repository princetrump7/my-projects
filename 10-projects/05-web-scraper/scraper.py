import csv
import time

import requests
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; WebScraper/1.0; +https://example.com)"
}


def fetch_page(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None


def parse_headlines(html):
    soup = BeautifulSoup(html, "lxml")
    headlines = []
    for item in soup.select(".titleline > a"):
        text = item.get_text(strip=True)
        link = item.get("href", "")
        headlines.append({"title": text, "link": link})
    return headlines


def save_to_csv(data, filename):
    if not data:
        print("No data to save.")
        return
    keys = data[0].keys()
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)
    print(f"Saved {len(data)} rows to {filename}")


def main():
    url = "https://news.ycombinator.com"
    print(f"Fetching {url}...")
    html = fetch_page(url)
    if html is None:
        return
    headlines = parse_headlines(html)
    save_to_csv(headlines, "headlines.csv")


if __name__ == "__main__":
    main()
