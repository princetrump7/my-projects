# Hidden - Image Steganography Tool

A Python tool that allows you to hide secret messages within image files and retrieve them, protected by a password. It features both a command-line interface (CLI) and a graphical user interface (GUI).

## Description

This project implements a steganography technique to embed text messages covertly within the pixels of an image. The message is hidden by altering the least significant bit (LSB) of the red color channel of each pixel. To ensure security, messages are protected with a password, which is hashed using SHA256 before embedding. The tool also stores the length of the hidden message and a hash of the password within the image itself, allowing for integrity checks upon retrieval.

Key features include:

*   **Message Encoding/Decoding**: Converts text messages to binary bits for embedding and back again.
*   **Password Protection**: Secures hidden messages with a user-defined password.
*   **LSB Steganography**: Utilizes the least significant bit of pixel data to conceal information.
*   **GUI (Tkinter)**: A user-friendly graphical interface for selecting images, entering messages, and managing passwords.
*   **CLI**: A command-line option for users who prefer terminal interaction for hiding and retrieving messages.

## Technologies Used

*   Python 3
*   Pillow (PIL Fork): For image manipulation.
*   `hashlib`: For cryptographic hashing of passwords (SHA256).
*   `tkinter`: For building the graphical user interface.

## Setup

1.  Make sure you have Python installed on your system (Python 3.x is recommended).
2.  Install the required Python libraries:
    ```bash
    pip install Pillow
    ```
3.  Save the script as `Hidden.py`.

## Usage

You can use the tool via either its Command-Line Interface (CLI) or its Graphical User Interface (GUI). When you run the script, you'll be prompted to choose your preferred mode.

### GUI Mode (Recommended for ease of use)

To run the GUI:

```bash
python Hidden.py
```

Choose option `2` for GUI. A window will appear with fields for your message and password, and buttons to "Hide Message" or "Read Message".

*   **Hide Message**: Select an input image, enter your secret message and a password, then choose an output file name for the steganographed image.
*   **Read Message**: Select an image containing a hidden message, enter the correct password, and the message will be displayed.

### CLI Mode

To run the CLI:

```bash
python Hidden.py
```

Choose option `1` for Terminal. You will then be prompted to choose between hiding or reading a message. Follow the on-screen instructions to provide image paths, messages, and passwords.

**Example (CLI - Hide Message):**

```
Choose mode:
1. Terminal
2. GUI
Enter 1 or 2: 1

1. Hide a message
2. Read a message
Choose: 1
Input image path: path/to/your/input.png
Output image path: path/to/your/output.png
Message to hide: This is my secret message!
Password: mysecretpassword123
✅ Message hidden successfully!
```

**Example (CLI - Read Message):**

```
Choose mode:
1. Terminal
2. GUI
Enter 1 or 2: 1

1. Hide a message
2. Read a message
Choose: 2
Image path: path/to/your/output.png
Password: mysecretpassword123
🔓 Hidden message: This is my secret message!
```

## How it Works (Technical Details)

The script uses the Least Significant Bit (LSB) steganography method. For each byte of the message (and the password hash + message length), it modifies the last bit of the red color component of a pixel in the image. Since changing the LSB causes a negligible change in color, the alteration is imperceptible to the human eye.

The message length (32 bits) and the SHA256 hash of the password are embedded first, allowing the tool to know how many bits to read and to verify the password before revealing the message.

## Screenshot

![GUI Screenshot](https://via.placeholder.com/728x400.png?text=GUI+Screenshot)
