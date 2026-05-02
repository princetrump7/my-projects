import itertools
import time
import string
from tqdm import tqdm

# Expanded charset
charset = string.ascii_lowercase + string.ascii_uppercase + string.digits + "!@#$%^&*"
print(f"Charset size: {len(charset)} characters")

user_password = input("Enter Your Password (keep ≤6 chars for demo): ")
target_len = len(user_password)
print(f"Target length: {target_len}")

attempts = 0
start_time = time.time()

def crack_password(length):
    global attempts
    total_combos = len(charset) ** length
    print(f"\nTrying {total_combos:,} combinations of length {length}...")
    
    with tqdm(total=total_combos, desc=f"Length {length}", unit="attempt") as pbar:
        for candidate in itertools.product(charset, repeat=length):
            crack = ''.join(candidate)
            attempts += 1
            pbar.update(1)
            pbar.set_postfix({'attempt': crack[-4:]})  # Show last 4 chars
            
            time.sleep(0.0001)  # Minimal delay
            
            if crack == user_password:
                elapsed = time.time() - start_time
                print(f"\n✅ PASSWORD CRACKED: {crack}")
                print(f"Attempts: {attempts:,}, Time: {elapsed:.2f}s")
                return True
    return False

# Try exact length first (most efficient)
if crack_password(target_len):
    exit(0)

# Fallback shorter lengths
for length in range(1, target_len):
    if crack_password(length):
        exit(0)

print("❌ Password not found in charset!")
print(f"Tried {attempts:,} attempts in {time.time() - start_time:.2f}s")
