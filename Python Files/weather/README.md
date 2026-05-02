# Python Weather App (CLI)

A simple command-line weather application that fetches and displays current weather conditions for any given city.

## Description

This Python script allows you to quickly check the current weather in any city around the world directly from your terminal. It leverages the free Open-Meteo API for both geocoding (converting city names to geographical coordinates) and retrieving real-time weather data. The application provides:

*   City name and country.
*   Current temperature in Celsius.
*   A concise description of the weather conditions, often accompanied by relevant emojis for quick understanding.

The script includes basic error handling for cases where a city cannot be found or there are network issues when fetching data.

## Technologies Used

*   Python 3
*   `requests` library: For making HTTP requests to the Open-Meteo API.
*   Open-Meteo API: For weather and geocoding data.

## Setup

1.  Make sure you have Python installed on your system.
2.  Install the `requests` library:
    ```bash
    pip install requests
    ```
3.  Save the script as `weather.py`.

## Usage

Run the script from your terminal:

```bash
python weather.py
```

The script will greet you and then prompt you to "Enter a city name:". Type the name of the city you want to check (e.g., "London", "New York", "Tokyo") and press Enter. The current weather information will then be displayed.

**Example:**

```
🌤️ Your Python Weather App!
Enter a city name: Paris

Weather in Paris, France:
Temperature: 10.5°C
Conditions: Partly cloudy ☁️
```

## Error Handling

*   If the city is not found, it will suggest checking the spelling or trying a bigger city.
*   Handles common network errors.

## Screenshot

![Screenshot of the script in action](https://via.placeholder.com/728x400.png?text=Weather+App+Screenshot)
