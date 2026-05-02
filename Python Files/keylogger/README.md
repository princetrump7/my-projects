# Simple Keyboard Input Logger (Tkinter Application Focus Only)

**⚠️ IMPORTANT: ETHICAL AND LEGAL CONSIDERATIONS ⚠️**

This script is a basic demonstration of capturing keyboard input *only when its specific application window is in focus*. It is intended for educational purposes, personal debugging, or for legitimate parental control on *your own devices* where all users are fully aware and have consented.

**Using any keylogger for unauthorized surveillance, to access private information without consent, or for any illegal activity is strictly unethical and illegal. Always ensure you have explicit permission and comply with all applicable laws and regulations in your jurisdiction before deploying or using any form of keystroke logging software.**

## Description

This Python script implements a simple keyboard input logger with a graphical user interface (GUI) using Tkinter. Unlike system-wide keyloggers, this tool *only* records keystrokes that are typed directly into its own window while it is the active application. It is designed to be a transparent example of basic event capturing within a specific application context.

Captured keystrokes are saved to a file named `captured_keys.txt` in the same directory as the script. The application also provides a "Clear Log File" button to easily erase the contents of the log file.

## Features

* Logs keystrokes to `captured_keys.txt`.
* Records special keys like `Space`, `Enter`, and `Backspace`.
* Provides a Tkinter GUI for user interaction.
* Includes a button to clear the log file.
* **Crucially, it only logs input when its window is focused and active.**

## Technologies Used

* Python 3
* Tkinter (for the GUI)

## Setup

1.  Make sure you have Python installed on your system. Tkinter is usually included with Python.
2.  Save the script as `keylogger.py`.

## Usage

1.  **Read the ethical and legal considerations above carefully.**
2.  Run the script from your terminal:
    ```bash
    python keylogger.py
    ```
3.  A small Tkinter window will appear. Any keys you type *while this window is active and in focus* will be logged to `captured_keys.txt`.
4.  You can open `captured_keys.txt` with any text editor to view the logged keystrokes.
5.  Click the "Clear Log File" button to empty `captured_keys.txt`.
6.  Close the application window to stop the logger.

## Log File (`captured_keys.txt`)

The `captured_keys.txt` file will contain a timestamp when the log started, followed by the recorded keystrokes. Special keys are represented as:
*   ` ` (space)
*   `\n[ENTER]\n` (Enter key)
*   `[BACKSPACE]` (Backspace key)
*   `[KeyName]` (for other non-character keys like Shift, Ctrl, Alt, etc.)

## Disclaimer

This software is provided "as is", without warranty of any kind. The author and contributors are not responsible for any misuse or damage caused by this software. Users are solely responsible for complying with all applicable laws and ethical guidelines regarding its use.

## Screenshot

![Screenshot of the keylogger GUI](https://via.placeholder.com/728x400.png?text=Keylogger+App+Screenshot)
