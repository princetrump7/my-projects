#include <iostream>
using namespace std;  // This makes cout and cin shorter to type!

int main() {
    // Step 1: Create boxes (variables) to hold our two numbers
    int firstNumber;   // Box for the first number
    int secondNumber;  // Box for the second number
    
    // Step 2: Ask user for the first number
    cout << "Hello! Welcome to our Super Simple Calculator!\n";
    cout << "Please enter the FIRST number: ";
    cin >> firstNumber;  // This reads what user types into our box
    
    // Step 3: Ask user for the second number
    cout << "Great! Now enter the SECOND number: ";
    cin >> secondNumber;
    
    // Step 4: Do the math! We'll calculate each one step by step
    
    // Addition (adding numbers together)
    int additionResult = firstNumber + secondNumber;
    cout << "\nResults:\n";
    cout << "Addition (" << firstNumber << " + " << secondNumber << ") = " << additionResult << "\n";
    
    // Subtraction (taking one away from the other)
    int subtractionResult = firstNumber - secondNumber;
    cout << "Subtraction (" << firstNumber << " - " << secondNumber << ") = " << subtractionResult << "\n";
    
    // Multiplication (repeated addition)
    int multiplicationResult = firstNumber * secondNumber;
    cout << "Multiplication (" << firstNumber << " x " << secondNumber << ") = " << multiplicationResult << "\n";
    
    // Division (sharing equally) - but careful with zero!
    if (secondNumber != 0) {
        int divisionResult = firstNumber / secondNumber;  // Integer division (no decimals)
        cout << "Division (" << firstNumber << " / " << secondNumber << ") = " << divisionResult << "\n";
    } else {
        cout << "Cannot divide by zero! Division skipped.\n";
    }
    
    cout << "Thanks for using our calculator! Goodbye!\n";
    
    return 0;  // This tells the computer "everything worked fine!"
}
