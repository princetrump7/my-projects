#include <iostream>
using namespace std;

 int main(){
    int circumference, area, radius,pi;
    circumference = 2*pi*radius;
    area = pi *radius*radius;

    cout << "enter the radius of the circle";
    cin >> radius;
    cout << "take pi to be";
    cin >> pi;
    cout << "the circumference of the circle is\n" << circumference;
    cout << "the area of the circle is\n" << area;
 

}   