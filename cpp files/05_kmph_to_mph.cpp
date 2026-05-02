#include <iostream>
#include <iomanip>

int main() {
    double kmph = 0.0;
    std::cout << "Enter speed in km/h: ";
    if (!(std::cin >> kmph)) {
        return 1;
    }
    double mph = kmph * 0.621371;
    std::cout << std::fixed << std::setprecision(3);
    std::cout << "Speed in mph: " << mph << "\n";
    return 0;
}
