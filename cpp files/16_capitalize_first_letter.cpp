#include <iostream>
#include <string>
#include <cctype>

int main() {
    std::string s;
    std::cout << "Enter a string: ";
    std::getline(std::cin, s);
    if (s.empty()) {
        std::getline(std::cin, s);
    }
    bool new_word = true;
    for (char &ch : s) {
        if (ch == ' ') {
            new_word = true;
        } else if (new_word) {
            ch = static_cast<char>(std::toupper(static_cast<unsigned char>(ch)));
            new_word = false;
        } else {
            new_word = false;
        }
    }
    std::cout << "Capitalized: " << s << "\n";
    return 0;
}
