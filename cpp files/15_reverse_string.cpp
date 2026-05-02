#include <iostream>
#include <string>

int main() {
    std::string s;
    std::cout << "Enter a string: ";
    std::getline(std::cin, s);
    if (s.empty()) {
        std::getline(std::cin, s);
    }
    for (size_t i = 0, j = s.size(); i < j / 2; ++i) {
        std::swap(s[i], s[j - 1 - i]);
    }
    std::cout << "Reversed: " << s << "\n";
    return 0;
}
