import tkinter as tk
from tkinter import messagebox
import string, random

def generate():
    chars = string.ascii_letters + string.digits + string.punctuation
    password = "".join(random.choice(chars) for _ in range(12))
    entry.delete(0, tk.END)
    entry.insert(0, password)

app = tk.Tk()
app.title("Password Generator")

entry = tk.Entry(app, width=30)
entry.pack(padx=100, pady=100)

tk.Button(app, text="Generate Password", command=generate).pack(pady=5)

app.mainloop()
