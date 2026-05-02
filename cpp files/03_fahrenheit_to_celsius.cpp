#include <iostream>
#include <iomanip>

int main() {
    double f = 0.0;
    std::cout << "Enter temperature in Fahrenheit: ";
    if (!(std::cin >> f)) {
        return 1;
    }
    double c = (f - 32.0) * 5.0 / 9.0;
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "Celsius: " << c << "\n";
    return 0;
}
