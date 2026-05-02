import re

def check_password_strength(password):
    score = 0
    feedback = []
    
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Use at least 8 characters")
    
    if re.search(r"[a-z]", password):
        score += 1
    else:
        feedback.append("Add lowercase letters")
    
    if re.search(r"[A-Z]", password):
        score += 1
    else:
        feedback.append("Add uppercase letters")
    
    if re.search(r"[0-9]", password):
        score += 1
    else:
        feedback.append("Add numbers")
    
    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        score += 1
    else:
        feedback.append("Add special characters (!@#$%^&*)")
    
    strength = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][min(score, 4)]
    
    return score, strength, feedback

password = input("Enter a password to check: ")
score, strength, feedback = check_password_strength(password)

print(f"\nStrength: {strength}")
print(f"Score: {score}/5")

if feedback:
    print("\nSuggestions to improve:")
    for f in feedback:
        print(f"  - {f}")