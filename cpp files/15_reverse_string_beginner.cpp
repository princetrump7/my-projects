#include <iostream>
// No string library needed - we'll use simple character array!

int main() {
    // Step 1: Create a box (array) to hold up to 100 characters
    char myString[101];  // 100 chars + 1 for null terminator '\0'
    
    // Step 2: Ask user for a string (words or sentence)
    std::cout << "Hello! Welcome to our Super Simple String Reverser!\n";
    std::cout << "Enter a string (max 100 chars): ";
    
    // Read the entire line into our array
    std::cin.getline(myString, 101);  // Safe way to read line with spaces
    
    // Step 3: Find the length of our string (count chars until '\0')
    int length = 0;
    while (myString[length] != '\0') {
        length++;  // Count each character
    }
    std::cout << "Your original string length: " << length << " characters.\n";
    
    // Step 4: Reverse the string! Swap characters from start and end
    // Example: "abc" -> swap a<->c -> "cba"
    std::cout << "Reversing...\n";
    for (int i = 0; i < length / 2; i++) {
        // Start: position i (left side)
        // End: position (length - 1 - i) (right side)
        char temp = myString[i];               // Save left char temporarily
        myString[i] = myString[length - 1 - i];  // Move right char to left
        myString[length - 1 - i] = temp;       // Move saved left to right
        std::cout << "Swapped position " << i << " with " << (length - 1 - i) << "\n";
    }
    
    // Step 5: Show the reversed string
    std::cout << "Reversed string: " << myString << "\n";
    std::cout << "Thanks for using our reverser! Goodbye!\n";
    
    return 0;  // Success!
}
