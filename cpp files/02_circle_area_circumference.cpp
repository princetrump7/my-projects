#include <iostream>  // This line includes the input/output library for cin and cout
#include <iomanip>   // This includes the library for formatting output, like setprecision

using namespace std;  // This allows us to use 'cout' and 'cin' without writing 'std::' every time

int main() {  // This is the main function where our program starts
    // We define pi as a constant because it doesn't change
    const double pi = 3.14159265358979323846;

    // We declare a variable to store the radius
    double radius = 0.0;

    // Ask the user to enter the radius
    cout << "Enter the radius of the circle: ";

    // Get the input from the user
    cin >> radius;

    // Check if the input is valid (not negative)
    if (radius < 0) {
        cout << "Radius cannot be negative. Please enter a positive number." << endl;
        return 1;  // Exit the program with an error code
    }

    // Calculate the area of the circle: area = pi * radius * radius
    double area = pi * radius * radius;

    // Calculate the circumference of the circle: circumference = 2 * pi * radius
    double circumference = 2 * pi * radius;

    // Set the output to show 2 decimal places for better readability
    cout << fixed << setprecision(2);

    // Display the results
    cout << "The area of the circle is: " << area << endl;
    cout << "The circumference of the circle is: " << circumference << endl;

    // Return 0 to indicate the program ran successfully
    return 0;
}