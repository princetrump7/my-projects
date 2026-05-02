import json
import os
import shutil
import smtplib
import schedule
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


class TaskBot:
    def __init__(self, config_path="config.json"):
        self.config = self._load_config(config_path)
        self.observer = None

    def _load_config(self, path):
        with open(path, "r") as f:
            return json.load(f)

    def backup_files(self, src=None, dst=None):
        src = src or self.config["backup"]["source"]
        dst = dst or self.config["backup"]["destination"]

        if not os.path.exists(src):
            print(f"Source directory does not exist: {src}")
            return False

        os.makedirs(dst, exist_ok=True)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        backup_dir = os.path.join(dst, f"backup_{timestamp}")
        shutil.copytree(src, backup_dir)
        print(f"Backup completed: {backup_dir}")
        return True

    def send_notification(self, subject, body):
        email_config = self.config["email"]
        msg = MIMEMultipart()
        msg["From"] = email_config["sender"]
        msg["To"] = email_config["recipient"]
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        try:
            with smtplib.SMTP(email_config["smtp_server"], email_config["smtp_port"]) as server:
                server.starttls()
                server.login(email_config["sender"], email_config["password"])
                server.send_message(msg)
            print(f"Notification sent: {subject}")
        except Exception as e:
            print(f"Failed to send notification: {e}")

    def watch_directory(self, path=None):
        path = path or self.config["watch"]["directory"]

        class Handler(FileSystemEventHandler):
            def on_any_event(self, event):
                print(f"File change detected: {event.event_type} - {event.src_path}")

        self.observer = Observer()
        self.observer.schedule(Handler(), path, recursive=True)
        self.observer.start()
        print(f"Watching directory: {path}")

    def run_scheduled(self):
        tasks = self.config.get("schedule", {})
        interval = tasks.get("backup_interval_minutes", 60)

        schedule.every(interval).minutes.do(self.backup_files)

        print(f"Scheduled tasks running (backup every {interval} minutes)")
        while True:
            schedule.run_pending()
            time.sleep(1)

    def run(self):
        print("TaskBot starting...")
        if self.config.get("watch", {}).get("enabled", False):
            self.watch_directory()
        self.run_scheduled()


if __name__ == "__main__":
    bot = TaskBot()
    bot.run()
