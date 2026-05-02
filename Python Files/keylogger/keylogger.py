import tkinter as tk
from datetime import datetime

LOG_FILE = "captured_keys.txt"

def log_key(event):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        if event.keysym == "space":
            f.write(" ")
        elif event.keysym == "Return":
            f.write("\n[ENTER]\n")
        elif event.keysym == "BackSpace":
            f.write("[BACKSPACE]")
        else:
            f.write(event.char if event.char else f"[{event.keysym}]")

def clear_log():
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write(f"Log started: {datetime.now()}\n\n")

# ---- UI ----
root = tk.Tk()
root.title("Keyboard Input Logger (App Only)")
root.geometry("500x200")

label = tk.Label(
    root,
    text="Type inside this window.\nKeystrokes will be logged.",
    font=("Arial", 12)
)
label.pack(pady=20)

clear_button = tk.Button(root, text="Clear Log File", command=clear_log)
clear_button.pack()

root.bind("<Key>", log_key)

clear_log()
root.mainloop()
WVRRVBFSBFSBFSBSFBSFSFSSFBSB