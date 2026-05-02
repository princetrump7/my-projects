# Simple Password Cracker (Educational/Demonstration Purposes Only)

**⚠️ IMPORTANT: ETHICAL, LEGAL, AND SECURITY WARNING ⚠️**

This script is a *very basic* demonstration of a brute-force password guessing technique. It is provided for **educational and theoretical understanding only**.

**DO NOT USE THIS SCRIPT FOR ANY MALICIOUS OR UNAUTHORIZED PURPOSES.**

Using password cracking tools against systems or accounts you do not own or have explicit, written permission to test is illegal and unethical. Unauthorized access to computer systems is a crime. By using this script, you acknowledge and agree that you are solely responsible for adhering to all applicable laws, regulations, and ethical guidelines. The author and contributors are not responsible for any misuse or damage caused by this software.

## Description

This Python script implements a rudimentary "password cracker" that attempts to guess a target password. It works by generating random combinations of lowercase English letters (a-z) until it matches the password provided by the user. This is a simple example of a brute-force attack, illustrating how such techniques operate, albeit inefficiently for complex passwords.

**Limitations:**

*   **Extremely Basic:** Only uses lowercase English letters.
*   **Inefficient:** It uses a purely random guessing approach, which is highly inefficient for anything but the shortest, simplest passwords. It does not employ any advanced cracking techniques (e.g., dictionary attacks, intelligent permutations, optimized algorithms).
*   **No Hashing:** It compares plain text passwords, not hashed ones, making it unsuitable for real-world password security analysis.

## Technologies Used

*   Python 3

## Setup

1.  Make sure you have Python installed on your system.
2.  Save the script as `password_cracker.py`.

## Usage

1.  **Read and understand the "IMPORTANT: ETHICAL, LEGAL, AND SECURITY WARNING" section above.**
2.  Run the script from your terminal:
    ```bash
    python password_cracker.py
    ```
3.  The script will prompt you to "Enter Your Password:". **For demonstration purposes, enter a very short password consisting only of lowercase English letters (e.g., "hi", "cat").**
4.  The script will then continuously print random letter combinations as it attempts to "crack" the password until it finds a match.

**Example:**

```
Enter Your Password: hi
aq
px
... (many random guesses) ...
hi
```

## Disclaimer

This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Demos

**Local Brute Force Demo** (Educational):
```bash
python tempCodeRunnerFile_fixed.py
```
Enter short password (≤6 chars). Uses tqdm progress bar, no spam.

**Web Pentest Tool** (Ethical testing only):
```bash
python password_cracker.py -u http://testphp.vulnweb.com/login.php -U admin -t 20 -l 5
```

## Files
| Script | Purpose | Status |
|--------|---------|--------|
| `tempCodeRunnerFile_fixed.py` | Local demo cracker w/ progress | ✅ Fixed |
| `password_cracker.py` | Threaded HTTP bruteforcer | ✅ Imports fixed, ready |
| `password_strength_checker.py` | Password analyzer | ✅ Working |

**⚠️ Kill running `tempCodeRunnerFile.py` in terminal (Ctrl+C). Use fixed version.**

## Screenshot

![Screenshot of the script in action](https://via.placeholder.com/728x400.png?text=Password+Cracker+Demo)
