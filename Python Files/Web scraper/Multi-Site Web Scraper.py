# --------------------------------------
# BEGINNER-FRIENDLY AUTOMATED WEB SCRAPER
# --------------------------------------

# Step 1: Import modules
import requests
from bs4 import BeautifulSoup
import csv
from datetime import datetime
import schedule
import time
import smtplib
from email.message import EmailMessage

# Step 2: List of websites to scrape
websites = [
    {"url": "https://example.com/news", "tag": "h2"},   # replace with real websites
    {"url": "https://example.com/updates", "tag": "h3"}
]

# CSV file to store scraped data
csv_file = "scraped_data.csv"

# Email settings (optional alerts)
send_email_alerts = True
your_email = "your_email@gmail.com"
your_app_password = "your_app_password"
alert_recipient = "admin@example.com"

# --------------------------------------
# Step 3: Function to send email alerts
# --------------------------------------
def send_email(subject, body):
    try:
        # Create email message
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = your_email
        msg['To'] = alert_recipient

        # Connect to Gmail and send
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(your_email, your_app_password)
            smtp.send_message(msg)

        print("Email alert sent successfully!")

    except Exception as e:
        print("Failed to send email:", e)

# --------------------------------------
# Step 4: Function to scrape websites
# --------------------------------------
def scrape_websites():
    # Step 4a: Load existing headlines to avoid duplicates
    existing = set()
    try:
        with open(csv_file, "r", encoding="utf-8") as file:
            reader = csv.reader(file)
            for row in reader:
                existing.add(row[1])  # headline is in column 1
    except FileNotFoundError:
        pass  # no CSV yet

    # Step 4b: Scrape each website
    new_items = []  # list to store new headlines
    for site in websites:
        try:
            # Get the webpage
            response = requests.get(site["url"])
            html = response.text

            # Parse HTML
            soup = BeautifulSoup(html, "html.parser")

            # Find all items using the specified tag
            items = soup.find_all(site["tag"])

            # Check for duplicates and add new items
            for item in items:
                text = item.text.strip()
                if text not in existing:
                    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    new_items.append([timestamp, text, site["url"]])
                    existing.add(text)

        except Exception as e:
            print(f"Failed to scrape {site['url']}: {e}")

    # Step 4c: Save new items to CSV
    if new_items:
        with open(csv_file, "a", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerows(new_items)
        print(f"{len(new_items)} new items added at {datetime.now()}")

        # Step 4d: Optional email alert
        if send_email_alerts:
            alert_text = ""
            for item in new_items:
                alert_text += f"{item[0]} | {item[1]}\n"
            send_email("New Scraper Items Found!", alert_text)

    else:
        print(f"No new items found at {datetime.now()}")

# --------------------------------------
# Step 5: Schedule scraper
# --------------------------------------
# Example: scrape every day at 08:00 AM
schedule.every().day.at("08:00").do(scrape_websites)

print("Automated web scraper running... Press Ctrl+C to stop.")

# Run scheduled tasks
while True:
    schedule.run_pending()
    time.sleep(1)
