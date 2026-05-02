def add(a, b):
    return a + b


def subtract(a, b):
    return a - b


def multiply(a, b):
    return a * b


def divide(a, b):
    if b == 0:
        print("Error: Division by zero.")
        return None
    return a / b


def get_number(prompt):
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("Invalid input. Please enter a number.")


def main():
    print("=== CLI Calculator ===")
    print("Operations: +, -, *, /")
    print("Type 'quit' to exit.\n")

    while True:
        operation = input("Enter operation (+, -, *, /) or 'quit': ").strip()

        if operation.lower() == "quit":
            print("Goodbye!")
            break

        if operation not in ("+", "-", "*", "/"):
            print("Invalid operation. Try again.")
            continue

        a = get_number("Enter first number: ")
        b = get_number("Enter second number: ")

        result = None

        if operation == "+":
            result = add(a, b)
        elif operation == "-":
            result = subtract(a, b)
        elif operation == "*":
            result = multiply(a, b)
        elif operation == "/":
            result = divide(a, b)

        if result is not None:
            print(f"Result: {result}\n")


if __name__ == "__main__":
    main()
