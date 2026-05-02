import csv
import os
import sys
from collections import defaultdict
from datetime import datetime


class ExpenseTracker:
    def __init__(self, filepath="data/expenses.csv"):
        self.filepath = filepath
        self.expenses = []
        self.load()

    def load(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        if not os.path.exists(self.filepath):
            return
        with open(self.filepath, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                row["id"] = int(row["id"])
                row["amount"] = float(row["amount"])
                self.expenses.append(row)

    def save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        fieldnames = ["id", "date", "amount", "category", "description"]
        with open(self.filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.expenses)

    def next_id(self):
        if not self.expenses:
            return 1
        return max(e["id"] for e in self.expenses) + 1

    def add_expense(self, amount, category, description, date=None):
        if amount <= 0:
            print("Amount must be positive.")
            return
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            print("Date must be in YYYY-MM-DD format.")
            return

        expense = {
            "id": self.next_id(),
            "date": date,
            "amount": amount,
            "category": category.strip(),
            "description": description.strip(),
        }
        self.expenses.append(expense)
        self.save()
        print(f"Added expense #{expense['id']}: ${amount:.2f} - {category}")

    def list_expenses(self, month=None):
        filtered = self.expenses
        if month:
            filtered = [e for e in self.expenses if e["date"].startswith(month)]

        if not filtered:
            print("No expenses found.")
            return

        print(f"{'ID':<6}{'Date':<12}{'Amount':<10}{'Category':<15}{'Description'}")
        print("-" * 60)
        for e in filtered:
            print(f"{e['id']:<6}{e['date']:<12}${e['amount']:<9.2f}{e['category']:<15}{e['description']}")

    def summary_by_category(self):
        totals = defaultdict(float)
        for e in self.expenses:
            totals[e["category"]] += e["amount"]

        if not totals:
            print("No expenses to summarize.")
            return

        print(f"\n{'Category':<20}{'Total':>10}")
        print("-" * 30)
        for cat in sorted(totals, key=totals.get, reverse=True):
            print(f"{cat:<20}${totals[cat]:>9.2f}")
        print("-" * 30)
        print(f"{'TOTAL':<20}${sum(totals.values()):>9.2f}")

    def export_csv(self, filename="export.csv"):
        fieldnames = ["id", "date", "amount", "category", "description"]
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.expenses)
        print(f"Exported {len(self.expenses)} expenses to {filename}")


def main():
    tracker = ExpenseTracker()

    while True:
        print("\n--- Expense Tracker ---")
        print("1. Add expense")
        print("2. List expenses")
        print("3. List by month")
        print("4. Summary by category")
        print("5. Export CSV")
        print("6. Exit")

        choice = input("\nChoose an option: ").strip()

        if choice == "1":
            try:
                amount = float(input("Amount: $"))
            except ValueError:
                print("Invalid amount.")
                continue
            category = input("Category: ")
            description = input("Description: ")
            date = input("Date (YYYY-MM-DD, leave blank for today): ").strip() or None
            tracker.add_expense(amount, category, description, date)
        elif choice == "2":
            tracker.list_expenses()
        elif choice == "3":
            month = input("Month (YYYY-MM): ").strip()
            tracker.list_expenses(month=month)
        elif choice == "4":
            tracker.summary_by_category()
        elif choice == "5":
            filename = input("Filename (default: export.csv): ").strip() or "export.csv"
            tracker.export_csv(filename)
        elif choice == "6":
            print("Goodbye!")
            sys.exit(0)
        else:
            print("Invalid option.")


if __name__ == "__main__":
    main()
