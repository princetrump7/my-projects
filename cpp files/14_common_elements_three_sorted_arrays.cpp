#include <iostream>
#include <vector>

int main() {
    int n1 = 0, n2 = 0, n3 = 0;
    std::cout << "Enter sizes of three sorted arrays: ";
    if (!(std::cin >> n1 >> n2 >> n3) || n1 <= 0 || n2 <= 0 || n3 <= 0) {
        return 1;
    }
    std::vector<int> a(n1), b(n2), c(n3);
    std::cout << "Enter elements of first array: ";
    for (int i = 0; i < n1; ++i) std::cin >> a[i];
    std::cout << "Enter elements of second array: ";
    for (int i = 0; i < n2; ++i) std::cin >> b[i];
    std::cout << "Enter elements of third array: ";
    for (int i = 0; i < n3; ++i) std::cin >> c[i];

    int i = 0, j = 0, k = 0;
    std::vector<int> common;
    while (i < n1 && j < n2 && k < n3) {
        if (a[i] == b[j] && b[j] == c[k]) {
            if (common.empty() || common.back() != a[i]) {
                common.push_back(a[i]);
            }
            ++i; ++j; ++k;
        } else {
            int mn = std::min(a[i], std::min(b[j], c[k]));
            if (a[i] == mn) ++i;
            if (b[j] == mn) ++j;
            if (c[k] == mn) ++k;
        }
    }

    std::cout << "Common elements: ";
    if (common.empty()) {
        std::cout << "None\n";
    } else {
        for (size_t idx = 0; idx < common.size(); ++idx) {
            std::cout << common[idx] << (idx + 1 == common.size() ? '\n' : ' ');
        }
    }
    return 0;
}
