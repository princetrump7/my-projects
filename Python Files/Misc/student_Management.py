import json
students = []

def add_student():
    name = input("Enter student name: ")
    marks = float(input("Enter marks: "))
    students.append({"name": name, "marks": marks})
    print("Student added")

def show_students():
    if not students:
        print("No students found")
    else:
        print("\nStudent List:")
        for i, s in enumerate(students):
            print(f"{i+1}. {s['name']} - {s['marks']}")

def search_student():
    name = input("Enter name to search: ")
    found = False
    for s in students:
        if s["name"].lower() == name.lower():
            print("Found:", s["name"], "-", s["marks"])
            found = True
    if not found:
        print("Student not found")

def save_students():
    with open("students.json", "w") as file:
        json.dump(students, file)

def load_students():
    try:
        with open("students.json", "r") as file:
            data = json.load(file)
        students.extend(data)
    except:
        pass

# Load previous data
load_students()

# Menu loop
while True:
    print("\n1. Add Student")
    print("2. View Students")
    print("3. Search Student")
    print("4. Exit")
    choice = input("Enter choice: ")
    if choice == "1":
        add_student()
    elif choice == "2":
        show_students()
    elif choice == "3":
        search_student()
    elif choice == "4":
        save_students()
        print("Data saved. Exiting...")
        break
    else:
        print("Invalid choice")