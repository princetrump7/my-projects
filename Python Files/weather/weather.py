import requests

def get_weather(city):
    try:
        # First, get coordinates for the city (geocoding API – also free)
        geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en"
        geo_response = requests.get(geo_url, timeout=5)
        geo_data = geo_response.json()
        
        if not geo_data.get("results"):
            print("City not found! Try spelling or a bigger city.")
            return
        
        lat = geo_data["results"][0]["latitude"]
        lon = geo_data["results"][0]["longitude"]
        city_name = geo_data["results"][0]["name"]
        country = geo_data["results"][0]["country"]
        
        # Now get actual weather
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code"
        weather_response = requests.get(weather_url, timeout=5)
        weather_data = weather_response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        return
    except KeyError as e:
        print(f"Error parsing weather data: Missing key {e}")
        return
    
    temp = weather_data["current"]["temperature_2m"]
    code = weather_data["current"]["weather_code"]
    
    # Simple weather descriptions (you can add more!)
    descriptions = {
        0: "Clear sky ☀️",
        1: "Mainly clear ⛅",
        2: "Partly cloudy ☁️",
        3: "Overcast ☁️☁️",
        45: "Fog 🌫️",
        61: "Rain 🌧️",
        80: "Heavy rain 🌧️🌧️",
        95: "Thunderstorm ⛈️"
    }
    desc = descriptions.get(code, "Some weather stuff 🌤️")
    
    print(f"\nWeather in {city_name}, {country}:")
    print(f"Temperature: {temp}°C")
    print(f"Conditions: {desc}")

# Main part
print("🌤️ Your Python Weather App!")
city = input("Enter a city name: ")
get_weather(city)