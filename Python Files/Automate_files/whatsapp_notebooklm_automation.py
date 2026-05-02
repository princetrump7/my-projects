"""
WhatsApp to NotebookLM Automation Script

This script monitors WhatsApp for new lecture slides and automatically uploads them to NotebookLM.

Dependencies:
- pywhatkit (for WhatsApp integration)
- requests (for API calls)
- pandas (optional for file processing)

Usage:
python whatsapp_notebooklm_automation.py

Configuration:
- WHATSAPP_PHONE: Your WhatsApp phone number with country code
- NOTEBOOKLM_API_KEY: Your NotebookLM API key
- NOTEBOOKLM_API_URL: NotebookLM API endpoint
- WHATSAPP_MONITOR_INTERVAL: Time in seconds to check for new messages
"""

import os
import time
import pywhatkit as kit
import pandas as pd
from datetime import datetime
import logging
import json
from pathlib import Path
import schedule
import threading
import notebooklm  # New library

# Configuration
WHATSAPP_PHONE = "+1234567890"  # Replace with your WhatsApp number (format: +1234567890)
NOTEBOOKLM_API_KEY = "YOUR_NOTEBOOKLM_API_KEY"  # Replace with your NotebookLM API key
NOTEBOOKLM_API_URL = "https://api.notebooklm.com/v1/upload"
WHATSAPP_MONITOR_INTERVAL = 60  # seconds

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_whatsapp_messages():
    """
    Get messages from WhatsApp
    Returns: list of messages with files
    """
    try:
        # Using pywhatkit to get messages from WhatsApp
        messages = kit.get_whatsapp_messages(WHATSAPP_PHONE)
        return messages
    except Exception as e:
        logger.error(f"Error getting WhatsApp messages: {e}")
        return []

def extract_file_from_whatsapp(message):
    """
    Extract file from WhatsApp message
    Returns: file path if successful, None otherwise
    """
    if message.get('has_file', False):
        file_path = message['file_path']
        if os.path.exists(file_path):
            return file_path
    return None

def check_new_files(messages):
    """
    Check if there are new files in WhatsApp messages
    Returns: list of new file paths
    """
    new_files = []
    for message in messages:
        extracted_file = extract_file_from_whatsapp(message)
        if extracted_file:
            new_files.append(extracted_file)
    return new_files

def upload_to_notebooklm(file_path):
    """
    Upload file to NotebookLM using notebooklm-py library
    Returns: True if successful, False otherwise
    """
    try:
        # Initialize notebooklm client
        client = notebooklm.Client(api_key=NOTEBOOKLM_API_KEY)
        
        # Upload the file as a source
        response = client.add_source(
            file_path=file_path,
            title=os.path.basename(file_path),
            description="Lecture slide from WhatsApp"
        )
        
        if response.status_code == 200:
            logger.info(f"Successfully uploaded {file_path} to NotebookLM")
            return True
        else:
            logger.error(f"Failed to upload {file_path}. Status: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error uploading {file_path}: {e}")
        return False

def handle_file_type(file_path):
    """
    Handle different file types and extract content if needed
    Returns: processed file content or None
    """
    try:
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext in ['.pdf', '.pptx', '.ppt', '.docx', '.doc']:
            # For document files, we can extract text content
            try:
                if file_ext in ['.pdf', '.docx', '.doc']:
                    text = pd.read_fwf(file_path).to_string()
                elif file_ext in ['.pptx', '.ppt']:
                    # For PowerPoint files, we'd need additional libraries
                    text = "PowerPoint content extracted"
                return text
            except Exception as e:
                logger.warning(f"Could not extract text from {file_path}: {e}")
                return None
                
        elif file_ext in ['.jpg', '.png', '.gif']:
            # For images, we can extract text using OCR
            try:
                # This would require additional libraries like pytesseract
                text = "Image content extracted"
                return text
            except Exception as e:
                logger.warning(f"Could not extract text from image {file_path}: {e}")
                return None
                
        else:
            # For other file types, we can just upload the file
            return None
            
    except Exception as e:
        logger.error(f"Error handling file type for {file_path}: {e}")
        return None

def process_whatsapp_messages():
    """
    Process WhatsApp messages and upload files to NotebookLM
    """
    logger.info("Starting WhatsApp processing...")
    
    messages = get_whatsapp_messages()
    
    if not messages:
        logger.info("No messages found")
        return
    
    new_files = check_new_files(messages)
    
    if new_files:
        logger.info(f"Found {len(new_files)} new files to process")
        
        for file_path in new_files:
            logger.info(f"Processing file: {file_path}")
            processed_content = handle_file_type(file_path)
            
            if processed_content:
                # For text content, we can send directly to NotebookLM
                upload_to_notebooklm(file_path)
            else:
                # For other file types, we upload the file itself
                upload_to_notebooklm(file_path)
    
    logger.info("WhatsApp processing complete")

def main():
    """
    Main function to run the automation
    """
    logger.info("Starting WhatsApp to NotebookLM automation...")
    
    # Schedule the process to run every 60 seconds
    schedule.every(WHATSAPP_MONITOR_INTERVAL).seconds.do(process_whatsapp_messages)
    
    # Start a thread to run the scheduler
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(1)
    
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.daemon = True
    scheduler_thread.start()
    
    # Keep the main thread alive
    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()

import os
import time
import requests
import pywhatkit as kit
import pandas as pd
from datetime import datetime
import logging
import json
from pathlib import Path

# Configuration
WHATSAPP_PHONE = "+1234567890"  # Replace with your WhatsApp number
NOTEBOOKLM_API_KEY = "YOUR_NOTEBOOKLM_API_KEY"  # Replace with your NotebookLM API key
NOTEBOOKLM_API_URL = "https://api.notebooklm.com/v1/upload"
WHATSAPP_MONITOR_INTERVAL = 60  # seconds

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_whatsapp_messages():
    """
    Get messages from WhatsApp
    Returns: list of messages with files
    """
    try:
        # Using pywhatkit to get messages from WhatsApp
        messages = kit.get_whatsapp_messages(WHATSAPP_PHONE)
        return messages
    except Exception as e:
        logger.error(f"Error getting WhatsApp messages: {e}")
        return []

def check_new_files(messages):
    """
    Check if there are new files in WhatsApp messages
    Returns: list of new file paths
    """
    new_files = []
    for message in messages:
        if message.get('has_file', False):
            file_path = message['file_path']
            if not os.path.exists(file_path):
                new_files.append(file_path)
    return new_files

def upload_to_notebooklm(file_path):
    """
    Upload file to NotebookLM
    Returns: True if successful, False otherwise
    """
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f)}
            headers = {
                'Authorization': f'Bearer {NOTEBOOKLM_API_KEY}',
                'Content-Type': 'multipart/form-data'
            }
            response = requests.post(NOTEBOOKLM_API_URL, files=files, headers=headers)
            
            if response.status_code == 200:
                logger.info(f"Successfully uploaded {file_path} to NotebookLM")
                return True
            else:
                logger.error(f"Failed to upload {file_path}. Status: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
    except Exception as e:
        logger.error(f"Error uploading {file_path}: {e}")
        return False

def main():
    """
    Main function to run the automation
    """
    logger.info("Starting WhatsApp to NotebookLM automation...")
    
    while True:
        logger.info("Checking for new WhatsApp messages...")
        messages = get_whatsapp_messages()
        
        if not messages:
            logger.info("No messages found")
            time.sleep(WHATSAPP_MONITOR_INTERVAL)
            continue
        
        new_files = check_new_files(messages)
        
        if new_files:
            logger.info(f"Found {len(new_files)} new files to process")
            
            for file_path in new_files:
                logger.info(f"Processing file: {file_path}")
                upload_to_notebooklm(file_path)
        
        time.sleep(WHATSAPP_MONITOR_INTERVAL)

if __name__ == "__main__":
    main()