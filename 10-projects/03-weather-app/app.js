const API_KEY = "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const cityName = document.getElementById("city-name");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const message = document.getElementById("message");
const forecastContainer = document.getElementById("forecast-container");

async function getWeather(city) {
    try {
        message.textContent = "Loading...";
        const response = await fetch(
            `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            throw new Error("City not found.");
        }

        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        message.textContent = `Error: ${error.message}`;
        clearWeather();
    }
}

function displayWeather(data) {
    message.textContent = "";
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `Temperature: ${Math.round(data.main.temp)}\u00B0C`;
    description.textContent = `Conditions: ${data.weather[0].description}`;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    wind.textContent = `Wind: ${data.wind.speed} m/s`;
}

function clearWeather() {
    cityName.textContent = "";
    temperature.textContent = "";
    description.textContent = "";
    humidity.textContent = "";
    wind.textContent = "";
    forecastContainer.innerHTML = "";
}

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) {
            getWeather(city);
        }
    }
});
