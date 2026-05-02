import json
library = []

def add_book():
    global library
    title = input("Enter book title: ").strip()
    if not title:
        print("Title cannot be empty!")
        return
    author = input("Enter book author: ").strip()
    library.append({"title": title, "author": author, "issued": False})
    print("Book added")

def show_books():
    global library
    if not library:
        print("No books available")
    else:
        print("\nLibrary Books:")
        for i, book in enumerate(library):
            status = "Issued" if book["issued"] else "Available"
            author = book.get("author", "Unknown")
            print(f"{i+1}. {book['title']} by {author} - {status}")

def issue_book():
    global library
    show_books()
    try:
        index = int(input("Enter book number to issue: ")) - 1
        if 0 <= index < len(library):
            if not library[index]["issued"]:
                library[index]["issued"] = True
                print("Book issued")
            else:
                print("Book already issued")
        else:
            print("Invalid choice")
    except ValueError:
        print("Enter valid number")

def return_book():
    global library
    show_books()
    try:
        index = int(input("Enter book number to return: ")) - 1
        if 0 <= index < len(library):
            if library[index]["issued"]:
                library[index]["issued"] = False
                print("Book returned")
            else:
                print("Book was not issued")
        else:
            print("Invalid choice")
    except ValueError:
        print("Enter valid number")

def save_data():
    global library
    with open("library.json", "w") as file:
        json.dump(library, file)

def load_data():
    global library
    try:
        with open("library.json", "r") as file:
            data = json.load(file)
        library.extend(data)
    except FileNotFoundError:
        pass
    except json.JSONDecodeError:
        print("Error loading data: Invalid JSON in file")

# Load existing data
load_data()

# Menu loop
while True:
    print("\n1. Add Book")
    print("2. View Books")
    print("3. Issue Book")
    print("4. Return Book")
    print("5. Exit")
    choice = input("Enter choice: ")
    if choice == "1":
        add_book()
    elif choice == "2":
        show_books()
    elif choice == "3":
        issue_book()
    elif choice == "4":
        return_book()
    elif choice == "5":
        save_data()
        print("Data saved. Exiting...")
        break
    else:
        print("Invalid choice")
