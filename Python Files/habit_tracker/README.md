# Habit Tracker (CLI)

A simple command-line habit tracker to help you build and maintain good habits.

## Description

This Python script allows you to define a habit and track your progress over a specified number of days. It stores your habit information (the habit itself and the number of days to track) in a `habit_tracker.json` file, so your progress is saved between sessions.

The tracker provides a simple menu where you can:
1.  **Start Tracking Loop:** Go through each day, marking the habit as "Complete" or not.
2.  **Save Habit Info:** Save the current habit and tracking duration to the JSON file.
3.  **Quit:** Exit the application.

## Technologies Used

*   Python 3

## Setup

1.  Make sure you have Python installed on your system.
2.  Save the script as `habit_tracker.py`.

## Usage

Run the script from your terminal:

```bash
python habit_tracker.py
```

Upon first run, you'll be prompted to enter your habit and for how many days you want to track it. Subsequent runs will load the saved habit.

You can then choose from the menu options to start tracking or save your progress.

## Screenshot

![Screenshot of the script in action](https://via.placeholder.com/728x400.png?text=App+Screenshot)
