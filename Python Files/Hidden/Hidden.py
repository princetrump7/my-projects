from PIL import Image
import hashlib
import tkinter as tk
from tkinter import filedialog, messagebox

# ================== TEXT <-> BITS ==================

def text_to_bits(text):
    bits = []
    for char in text:
        bits.extend(int(b) for b in format(ord(char), "08b"))
    return bits

def bits_to_text(bits):
    text = ""
    for i in range(0, len(bits), 8):
        byte = bits[i:i+8]
        if len(byte) < 8:
            break
        text += chr(int("".join(map(str, byte)), 2))
    return text

# ================== PASSWORD ==================

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ================== HIDE MESSAGE ==================

def hide_message(input_image, output_image, message, password):
    img = Image.open(input_image).convert("RGB")
    pixels = list(img.getdata())

    password_hash = hash_password(password)
    full_message = password_hash + "|" + message
    message_bits = text_to_bits(full_message)

    # store message length in first 32 bits
    length_binary = format(len(message_bits), "032b")
    bits = [int(b) for b in length_binary] + message_bits

    if len(bits) > len(pixels):
        raise ValueError("Message is too large for this image.")

    new_pixels = []
    for i, pixel in enumerate(pixels):
        if i < len(bits):
            r, g, b = pixel
            r = (r & ~1) | bits[i]  # change only last bit
            new_pixels.append((r, g, b))
        else:
            new_pixels.append(pixel)

    img.putdata(new_pixels)
    img.save(output_image)

# ================== READ MESSAGE ==================

def read_message(image_path, password):
    try:
        img = Image.open(image_path).convert("RGB")
        pixels = list(img.getdata())

        # Read length (first 32 bits)
        length_bits = [p[0] & 1 for p in pixels[:32]]
        length_binary = "".join(str(b) for b in length_bits)
        length = int(length_binary, 2)

        if length <= 0 or length > len(pixels):
            return None

        # Read message bits
        bits = [p[0] & 1 for p in pixels[32:32 + length]]
        data = bits_to_text(bits)

        if "|" not in data:
            return None

        saved_hash, message = data.split("|", 1)

        if saved_hash == hash_password(password):
            return message
        else:
            return None

    except Exception:
        return None

# ================== GUI FUNCTIONS ==================

def gui_hide():
    inp = filedialog.askopenfilename(title="Select Image")
    if not inp:
        return

    out = filedialog.asksaveasfilename(
        title="Save Image",
        defaultextension=".png",
        filetypes=[("PNG Images", "*.png")]
    )
    if not out:
        return

    msg = message_entry.get()
    pwd = password_entry.get()

    if not msg or not pwd:
        messagebox.showerror("Error", "Message and password required.")
        return

    try:
        hide_message(inp, out, msg, pwd)
        messagebox.showinfo("Success", "Message hidden successfully!")
    except Exception as e:
        messagebox.showerror("Error", str(e))

def gui_read():
    img = filedialog.askopenfilename(title="Select Image")
    if not img:
        return

    pwd = password_entry.get()
    if not pwd:
        messagebox.showerror("Error", "Password required.")
        return

    result = read_message(img, pwd)

    if result is None:
        messagebox.showerror("Error", "Wrong password or no hidden message.")
    else:
        messagebox.showinfo("Hidden Message", result)

# ================== MAIN MENU ==================

print("Choose mode:")
print("1. Terminal")
print("2. GUI")

mode = input("Enter 1 or 2: ")

if mode == "1":
    print("\n1. Hide a message")
    print("2. Read a message")
    choice = input("Choose: ")

    if choice == "1":
        inp = input("Input image path: ")
        out = input("Output image path: ")
        msg = input("Message to hide: ")
        pwd = input("Password: ")
        try:
            hide_message(inp, out, msg, pwd)
            print("✅ Message hidden successfully!")
        except Exception as e:
            print("❌ Error:", e)

    elif choice == "2":
        img = input("Image path: ")
        pwd = input("Password: ")
        result = read_message(img, pwd)
        if result:
            print("🔓 Hidden message:", result)
        else:
            print("❌ Wrong password or no hidden message.")

else:
    app = tk.Tk()
    app.title("Secret Image Messenger")

    tk.Label(app, text="Message").pack()
    message_entry = tk.Entry(app, width=40)
    message_entry.pack()

    tk.Label(app, text="Password").pack()
    password_entry = tk.Entry(app, show="*", width=40)
    password_entry.pack()

    tk.Button(app, text="Hide Message", command=gui_hide).pack(pady=5)
    tk.Button(app, text="Read Message", command=gui_read).pack(pady=5)

    app.mainloop()
# ================== END ==================x