#include <iostream>

int main() {
    double a = 0.0, b = 0.0;
    std::cout << "Enter two angles of the triangle (in degrees): ";
    if (!(std::cin >> a >> b)) {
        return 1;
    }
    double c = 180.0 - (a + b);
    std::cout << "Third angle: " << c << "\n";
    return 0;
}
