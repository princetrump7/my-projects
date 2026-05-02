#include <iostream>
using namespace std;


int main ()
{
  int num1,num2,result;
  char op;


  cout << "*********Calculator**********\n";
  cout << "Enter operator( + - * / %): ";
  cin >> op;
  cout << "Enter #1: ";
  cin >> num1;
  cout << "Enter #2: ";
  cin >> num2;

  switch (op){
    case '+':
      result =num1 + num2;
      cout << "result:" << result << '\n';
      break;
    case '-':
      result =num1 - num2;
      cout << "result:" << result << '\n';
      break;
    case '*':
      result =num1 * num2;
      cout << "result:" << result << '\n';
      break;
    case '/':
      result =num1 / num2;
      cout << "result:" << result << '\n';
      break;
    case '%':
       result = num1 % num2;
       cout << "result:" << result << '\n';
      break;
    default:
        cout << "invalid\n";
        break;
  }
  cout << "***************************";

  return 0;
}
