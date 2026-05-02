#include <iostream>
#include <string>
using namespace std;

// Function to reverse a string
// Takes a string as input, reverses it, and returns the reversed string
string reverseString(string str) {
    // Initialize an empty string to store the reversed string
    string reversed = "";

    // Loop through the input string in reverse order
    for (int i = str.length() - 1; i >= 0; i--) {
        // Append each character to the reversed string
        reversed += str[i];
    }

    // Return the reversed string
    return reversed;
}

int main() {
    // Initialize an empty string to store the user input
    string input;

    // Prompt the user to enter a string
    cout << "CS101 String Reverser - Learning Basic Algorithms\n";
    cout << "Enter a string (with spaces OK): ";
    getline(cin, input);  // getline for full line including spaces

    // Print the original string
    cout << "Original: \"" << input << "\" (length: " << input.length() << ")\n";

    // Call the reverseString function and store the reversed string
    string reversed = reverseString(input);

    // Print the reversed string
    cout << "Reversed: \"" << reversed << "\"\n";
    cout << "Algorithm: Reverse each character of the input string.\n";

    return 0;
}