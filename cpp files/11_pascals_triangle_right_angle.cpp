#include <iostream>
#include <vector>

int main() {
    int rows = 0;
    std::cout << "Enter number of rows: ";
    if (!(std::cin >> rows) || rows <= 0) {
        return 1;
    }
    std::vector<long long> prev;
    for (int i = 0; i < rows; ++i) {
        std::vector<long long> cur(i + 1, 1);
        for (int j = 1; j < i; ++j) {
            cur[j] = prev[j - 1] + prev[j];
        }
        for (int j = 0; j <= i; ++j) {
            std::cout << cur[j] << (j == i ? '\n' : ' ');
        }
        prev = cur;
    }
    return 0;
}
