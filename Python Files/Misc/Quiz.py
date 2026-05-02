# Quiz Application
questions = [
    {
        "question": "What is the capital of India?",
        "options": ["A. Delhi", "B. Mumbai", "C. Kolkata", "D. Chennai"],
        "answer": "A"
    },
    {
        "question": "Which language is used for data analysis?",
        "options": ["A. HTML", "B. Python", "C. CSS", "D. Java"],
        "answer": "B"
    },
    {
        "question": "What is 2 + 2?",
        "options": ["A. 3", "B. 4", "C. 5", "D. 6"],
        "answer": "B"
    }
]
score = 0
for q in questions:
    print("\n" + q["question"])
    for option in q["options"]:
        print(option)
    user_answer = input("Enter your answer (A/B/C/D): ").upper()
    if user_answer == q["answer"]:
        print("Correct ✅")
        score += 1
    else:
        print("Wrong ❌")
print("\nFinal Score:", score, "/", len(questions))