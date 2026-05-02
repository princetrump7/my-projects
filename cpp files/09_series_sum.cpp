#include <iostream>
#include <iomanip>
#include <cmath>

int main() {
    int n = 0;
    std::cout << "Enter n: ";
    if (!(std::cin >> n) || n <= 0) {
        return 1;
    }
    double sum = 0.0;
    for (int i = 1; i <= n; ++i) {
        sum += 1.0 / std::pow(static_cast<double>(i), i);
    }
    std::cout << std::fixed << std::setprecision(6);
    std::cout << "Sum: " << sum << "\n";
    return 0;
}
