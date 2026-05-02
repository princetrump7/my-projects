import itertools
import time
import string
import random

# Expanded charset for realistic pentests (lowercase, uppercase, digits, common symbols)
charset = string.ascii_lowercase + string.ascii_uppercase + string.digits + "!@#$%^&*"
print(f"Charset size: {len(charset)} characters")

user_password = input("Enter Your Password: ")
print(f"Target length: {len(user_password)}")

attempts = 0
start_time = time.time()

# Brute force all combinations up to target length (start with exact length for efficiency)
for length in range(1, len(user_password) + 1):
    print(f"\nTrying length {length}...")
    
    for candidate in itertools.product(charset, repeat=length):
        crack = ''.join(candidate)
        attempts += 1
        
        # Simulate network delay/rate limiting (common in real pentests)
        time.sleep(0.001)  # 1ms delay
        
        print(f"Attempt {attempts}: {crack}", end='\r')
        
        if crack == user_password:
            elapsed = time.time() - start_time
            print(f"\nPASSWORD CRACKED: {crack}")
            print(f"Attempts: {attempts}, Time: {elapsed:.2f}s")
            exit(0)

print("Password not in charset or too long!")