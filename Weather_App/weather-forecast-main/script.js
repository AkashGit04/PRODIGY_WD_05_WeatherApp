const API_KEY = '526f85084d508409e3c8fd6d19180390';  // OpenWeatherMap API key
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

// DOM Elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const currentLocationBtn = document.getElementById('current-location-btn');
const weatherDisplay = document.querySelector('.weather-display');
const locationName = document.getElementById('location-name');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weather-description');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');

// Event Listeners
searchBtn.addEventListener('click', searchWeather);
currentLocationBtn.addEventListener('click', getWeatherByCurrentLocation);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Create loading spinner
const loadingSpinner = document.createElement('div');
loadingSpinner.className = 'loading-spinner';
loadingSpinner.style.display = 'none';
document.querySelector('.weather-app').appendChild(loadingSpinner);

async function searchWeather() {
    const location = locationInput.value.trim();
    if (!location) {
        showError(new Error('Please enter a location'));
        return;
    }
    
    try {
        showLoader(true);
        const coordinates = await getCoordinates(location);
        if (coordinates) {
            const weatherData = await fetchWeatherData(coordinates.lat, coordinates.lon);
            if (weatherData) {
                displayWeather(weatherData, coordinates.name);
            }
        }
    } catch (error) {
        console.error('Search Weather Error:', error);
        showError(error);
        weatherDisplay.style.display = 'none';
    } finally {
        showLoader(false);
    }
}

async function getCoordinates(location) {
    try {
        const response = await fetch(`${GEO_URL}?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Location not found');
        }

        if (!data || data.length === 0) {
            throw new Error('Location not found. Please check the city name and try again.');
        }

        const place = data[0];
        return {
            lat: place.lat,
            lon: place.lon,
            name: `${place.name}, ${place.country}`
        };
    } catch (error) {
        console.error('Get Coordinates Error:', error);
        throw new Error('Failed to find location. Please check the city name and try again.');
    }
}

async function getWeatherByCurrentLocation() {
    if (!navigator.geolocation) {
        showError(new Error('Geolocation is not supported by your browser'));
        return;
    }

    try {
        showLoader(true);
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, 
                (error) => reject(new Error('Unable to get your location. Please allow location access.')),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
        
        const weatherData = await fetchWeatherData(
            position.coords.latitude,
            position.coords.longitude
        );
        if (weatherData) {
            displayWeather(weatherData);
        }
    } catch (error) {
        console.error('Current Location Error:', error);
        showError(error);
        weatherDisplay.style.display = 'none';
    } finally {
        showLoader(false);
    }
}

async function fetchWeatherData(lat, lon) {
    try {
        const response = await fetch(
            `${WEATHER_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch weather data');
        }

        if (!data || !data.main || !data.weather || !data.weather[0]) {
            throw new Error('Invalid weather data received');
        }

        return data;
    } catch (error) {
        console.error('Fetch Weather Error:', error);
        if (error.name === 'TypeError') {
            throw new Error('Network error. Please check your internet connection.');
        }
        throw error;
    }
}

function displayWeather(data, customLocationName = null) {
    try {
        weatherDisplay.style.display = 'block';
        
        // Location name
        locationName.textContent = customLocationName || `${data.name}, ${data.sys.country}`;
        
        // Temperature with one decimal place
        const temp = Math.round(data.main.temp * 10) / 10;
        temperature.textContent = `${temp}°C`;
        
        // Weather description
        const desc = data.weather[0].description;
        weatherDescription.textContent = desc.charAt(0).toUpperCase() + desc.slice(1);
        
        // Weather details
        humidity.textContent = `${data.main.humidity}%`;
        windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
        pressure.textContent = `${data.main.pressure} hPa`;
        
        // Weather icon
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
        weatherIcon.onerror = () => {
            weatherIcon.src = 'https://openweathermap.org/img/wn/02d@2x.png';
        };
        weatherIcon.src = iconUrl;
        weatherIcon.alt = desc;
        
    } catch (error) {
        console.error('Display Weather Error:', error);
        showError(new Error('Error displaying weather data'));
        weatherDisplay.style.display = 'none';
    }
}

function showError(error) {
    console.error('Error:', error);
    alert(`${error.message}`);
}

function showLoader(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    searchBtn.disabled = show;
    currentLocationBtn.disabled = show;
    locationInput.disabled = show;
}