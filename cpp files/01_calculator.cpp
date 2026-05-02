#include <iostream>

int main() {
    double a, b;
    
    std::cout << "Enter first number: ";
    std::cin >> a;
    
    std::cout << "Enter second number: ";
    std::cin >> b;
    
    std::cout << "Add: " << (a + b) << "\n";
    std::cout << "Subtract: " << (a - b) << "\n";
    std::cout << "Multiply: " << (a * b) << "\n";
    
    if (b != 0) {
        std::cout << "Divide: " << (a / b) << "\n";
    } else {
        std::cout << "Cannot divide by zero\n";
    }
    
    return 0;
}