import os
import json

filename = "habit_tracker.json"

if os.path.exists(filename):
    with open(filename, "r") as file:
        data = json.load(file)
        habit = data["habit"]
        days = data["days"]
    print(f"Welcome back! We are currently tracking: {habit}")
else:
    # Only ask these if the file doesn't exist
    habit = input("Enter your habit: ")
    days = int(input("For how many days do you want to track this habit? "))
    data = {"habit": habit, "days": days}


while True:
    print("\n--- MENU ---")
    print("1. Start Tracking Loop")
    print("2. Save Habit Info")
    print("3. Quit")
    
    choice = input("Enter your choice: ")
    
    if choice == "1":
        # The tracking loop
        for day in range(1, days + 1):
            status = input(f"Day {day}: Complete? (yes/no): ")
            if status.lower() == "yes":
                print("Well done!")
            else:
                print("Keep trying!")
        break 

    elif choice == "2":
        with open(filename, "w") as json_file:
            json.dump(data, json_file, indent=4)
        print("Habit info saved!")

    elif choice == "3":
        print("Exiting...")
        exit()