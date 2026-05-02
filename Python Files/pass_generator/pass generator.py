"""
This script generates a random password.
Usage: Run the script to print a randomly generated password.
"""

import random
import string

# Define what characters we can use
letters = string.ascii_letters  # a-z and A-Z
digits = string.digits  # 0-9
punctuation = string.punctuation  # !@#$%^&* etc

# Combine all characters
all_characters = letters + digits + punctuation

# Set password length
password_length = 16

# Create password by picking random characters
password = ""
for i in range(password_length):
    random_character = random.choice(all_characters)
    password = password + random_character

# Print the password
print(password)