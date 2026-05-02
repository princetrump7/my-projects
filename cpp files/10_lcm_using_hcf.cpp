#include <iostream>

long long gcd_ll(long long a, long long b) {
    while (b != 0) {
        long long t = a % b;
        a = b;
        b = t;
    }
    return a < 0 ? -a : a;
}

int main() {
    long long a = 0, b = 0;
    std::cout << "Enter two numbers: ";
    if (!(std::cin >> a >> b)) {
        return 1;
    }
    long long hcf = gcd_ll(a, b);
    long long lcm = (a / hcf) * b;
    if (lcm < 0) lcm = -lcm;
    std::cout << "HCF: " << hcf << "\n";
    std::cout << "LCM: " << lcm << "\n";
    return 0;
}
