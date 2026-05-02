import random

# Generate random number between 1 and 100
number = random.randint(1, 100)
attempts = 0
max_attempts = 10

print("Guess the number between 1 and 100")
print(f"You have {max_attempts} attempts")

while attempts < max_attempts:
    try:
        guess = int(input("Enter your guess: "))
    except ValueError:
        print("Please enter a valid number!")
        continue
    
    # Validate input range
    if guess < 1 or guess > 100:
        print("Please enter a number between 1 and 100!")
        continue
    
    attempts += 1
    remaining = max_attempts - attempts
    
    if guess < number:
        print("Too low!")
    elif guess > number:
        print("Too high!")
    else:
        print(f"Correct 🎉 You won in {attempts} attempts!")
        break
    
    if remaining > 0:
        print(f"Attempts remaining: {remaining}")

else:
    print(f"Game over! The number was {number}")
