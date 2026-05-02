#include <iostream>
#include <iomanip>

int main() {
    double a = 0.0, b = 0.0, c = 0.0, d = 0.0;
    std::cout << "Enter four numbers: ";
    if (!(std::cin >> a >> b >> c >> d)) {
        return 1;
    }
    double total = a + b + c + d;
    double average = total / 4.0;
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "Total: " << total << "\n";
    std::cout << "Average: " << average << "\n";
    return 0;
}
