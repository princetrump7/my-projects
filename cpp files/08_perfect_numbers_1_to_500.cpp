#include <iostream>

int main() {
    std::cout << "Perfect numbers between 1 and 500:\n";
    for (int n = 1; n <= 500; ++n) {
        int sum = 0;
        for (int d = 1; d <= n / 2; ++d) {
            if (n % d == 0) {
                sum += d;
            }
        }
        if (sum == n) {
            std::cout << n << "\n";
        }
    }
    return 0;
}
