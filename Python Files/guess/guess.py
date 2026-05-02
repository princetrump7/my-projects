import tkinter as tk
import random
from tkinter import messagebox
class GuessingGame:
    def __init__(self, master):
        self.master = master
        self.master.title("Number Guessing Game")
        
        self.secret_number = random.randint(1, 100)
        self.attempts = 0
        
        self.label = tk.Label(master, text="Guess a number between 1 and 100:")
        self.label.pack()
        
        self.entry = tk.Entry(master)
        self.entry.pack()
        
        self.guess_button = tk.Button(master, text="Guess", command=self.check_guess)
        self.guess_button.pack()
        
        self.result_label = tk.Label(master, text="")
        self.result_label.pack()
        
    def check_guess(self):
        try:
            guess = int(self.entry.get())
            self.attempts += 1
            
            if guess < 1 or guess > 100:
                raise ValueError("Guess out of bounds")
            
            if guess < self.secret_number:
                self.result_label.config(text="Too low! Try again.")
            elif guess > self.secret_number:
                self.result_label.config(text="Too high! Try again.")
            else:
                messagebox.showinfo("Congratulations!", f"You guessed it in {self.attempts} attempts!")
                self.reset_game()
        except ValueError:
            messagebox.showerror("Invalid Input", "Please enter a valid integer between 1 and 100.")
    
    def reset_game(self):
        self.secret_number = random.randint(1, 100)
        self.attempts = 0
        self.entry.delete(0, tk.END)
        self.result_label.config(text="")
if __name__ == "__main__":
    root = tk.Tk()
    game = GuessingGame(root)
    root.mainloop()
