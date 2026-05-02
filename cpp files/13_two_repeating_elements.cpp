#include <iostream>
#include <vector>
#include <unordered_map>

int main() {
    int n = 0;
    std::cout << "Enter number of elements: ";
    if (!(std::cin >> n) || n <= 0) {
        return 1;
    }
    std::vector<int> a(n);
    std::cout << "Enter elements: ";
    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
    }

    std::unordered_map<int, int> freq;
    std::vector<int> repeating;
    for (int v : a) {
        int f = ++freq[v];
        if (f == 2) {
            repeating.push_back(v);
        }
    }

    std::cout << "Repeating elements: ";
    if (repeating.empty()) {
        std::cout << "None\n";
    } else {
        for (size_t i = 0; i < repeating.size(); ++i) {
            std::cout << repeating[i] << (i + 1 == repeating.size() ? '\n' : ' ');
        }
    }
    return 0;
}
