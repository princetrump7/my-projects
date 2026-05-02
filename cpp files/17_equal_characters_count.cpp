#include <iostream>
#include <string>

int main() {
    std::string s;
    char c1 = '\0', c2 = '\0';
    std::cout << "Enter a string: ";
    std::getline(std::cin, s);
    if (s.empty()) {
        std::getline(std::cin, s);
    }
    std::cout << "Enter two characters to compare: ";
    if (!(std::cin >> c1 >> c2)) {
        return 1;
    }
    int count1 = 0, count2 = 0;
    for (char ch : s) {
        if (ch == c1) ++count1;
        if (ch == c2) ++count2;
    }
    std::cout << (count1 == count2 ? "True" : "False") << "\n";
    return 0;
}
