import schedule
import time
from datetime import datetime

def greet():
    current_time = datetime.now().strftime("%H:%M:%S")
    print(f"Time to code, Prince! ({current_time})")

# You can add multiple schedules
schedule.every().day.at("09:00").do(greet)
schedule.every().day.at("14:00").do(greet)  # 2:00 PM
schedule.every().day.at("20:00").do(greet)  # 8:00 PM

# Or schedule at intervals
# schedule.every(2).hours.do(greet)

print("Daily coding reminder scheduler started!")
print("Scheduled reminders at: 09:00, 14:00, 20:00")
print("Program running... Press Ctrl+C to exit\n")

try:
    while True:
        schedule.run_pending()
        time.sleep(1)
except KeyboardInterrupt:
    print("\nScheduler stopped. Happy coding!")