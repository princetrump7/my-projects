first_num = float(input("Enter the first number: "))    
second_num = float(input("Enter the second number: "))
operation = input("Enter the operation (+, -, *, /,**,%): ")
try:  
    if operation == "+":
        result = first_num + second_num
        print(f"The result of {first_num} + {second_num} is {result}")
    elif operation == "-":
        result = first_num - second_num
        print(f"The result of {first_num} - {second_num} is {result}")
    elif operation == "*":
        result = first_num * second_num
        print(f"The result of {first_num} * {second_num} is {result}")
    elif operation == "/":
        if second_num == 0:
            print("Error: Division by zero is not allowed.")
        else:
            result = first_num / second_num
            print(f"The result of {first_num} / {second_num} is {result}")
    elif operation == "**":
        result = first_num ** second_num
        print(f"The result of {first_num} ** {second_num} is {result}")
    elif operation == "%":
        if second_num == 0:
            print("Error: Division by zero is not allowed.")
        else:
            result = first_num % second_num
            print(f"The result of {first_num} % {second_num} is {result}")
except ZeroDivisionError:
    print("Error: Division by zero is not allowed.")