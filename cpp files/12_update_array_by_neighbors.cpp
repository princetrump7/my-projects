#include <iostream>
#include <vector>

int main() {
    int n = 0;
    std::cout << "Enter number of elements: ";
    if (!(std::cin >> n) || n <= 1) {
        return 1;
    }
    std::vector<long long> a(n);
    std::cout << "Enter elements: ";
    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
    }
    std::vector<long long> updated(n);
    updated[0] = a[0] * a[1];
    for (int i = 1; i < n - 1; ++i) {
        updated[i] = a[i - 1] * a[i + 1];
    }
    updated[n - 1] = a[n - 2] * a[n - 1];

    std::cout << "Updated array: ";
    for (int i = 0; i < n; ++i) {
        std::cout << updated[i] << (i + 1 == n ? '\n' : ' ');
    }
    return 0;
}
