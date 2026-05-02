# --------------------------------------
# BEGINNER-FRIENDLY LOG ANALYZER
# --------------------------------------

# Step 1: Import necessary modules
import smtplib
from email.message import EmailMessage
import time

# Step 2: List of log files to check
log_files = ["app.log", "server.log"]  # you can add more files here

# Step 3: Function to send email alerts
def send_email(subject, body, to_email):
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = "your_email@gmail.com"  # replace with your email
        msg['To'] = to_email

        # Connect to Gmail and send email
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login("your_email@gmail.com", "your_app_password")
            smtp.send_message(msg)

        print("Email sent successfully!")

    except Exception as e:
        print("Could not send email:", e)

# Step 4: Function to check one log file
def check_log_file(file_path):
    try:
        # Open the log file
        with open(file_path, "r") as f:
            lines = f.readlines()

        # Look for errors and warnings
        alerts = []
        for line in lines:
            if "ERROR" in line or "WARNING" in line:
                alerts.append(line.strip())

        # Show alerts in console
        if alerts:
            print(f"\nAlerts found in {file_path}:")
            for alert in alerts:
                print(alert)

            # Send email
            send_email(f"Log Alert: {file_path}", "\n".join(alerts), "admin@example.com")
        else:
            print(f"No alerts in {file_path}")

    except FileNotFoundError:
        print(f"File {file_path} not found!")

# Step 5: Main loop to check all files every 5 minutes
print("Starting log analyzer... Press Ctrl+C to stop.")

while True:
    for log_file in log_files:
        check_log_file(log_file)  # check each file
    print("Waiting 5 minutes before next check...\n")
    time.sleep(300)  # wait 300 seconds (5 minutes)
