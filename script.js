const place = document.getElementById('location');
const country = document.getElementById('country');
const dateTIme = document.getElementById('date-time');
const temp = document.getElementById('main-temperature');
const weatherIcon = document.getElementById('weather-icon');
const weatherType = document.getElementById('weather-main')
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feels-like');
const wind = document.getElementById('wind');
const uv = document.getElementById('uv');
const sunriseTime = document.getElementById('sunrise-time');
const sunsetTime = document.getElementById('sunset-time');

const searchInput = document.getElementById('search-bar');
const searchForm = document.getElementById('search-form');
const suggestionsList = document.getElementById('suggestions-list');
const unitToggleBtn = document.getElementById('unit-toggle');
const errorBanner = document.getElementById('error-banner');
const searchBox = document.querySelector('.search-box');
const searchBtn = document.getElementById('search-btn');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const todayContainer = document.getElementById('today-container');
const tomorrowContainer = document.getElementById('tomorrow-container');
const weekContainer = document.getElementById('week-container');

let debounceTimer;
let currentWeatherData = null; // Store fetched data in memory
let currentUnit = 'C';

//error message
function showError(msg){
  if(!errorBanner) return;

  errorBanner.textContent = msg;
  errorBanner.classList.remove('hidden');
}

function clearError(){
  if(!errorBanner) return;

  errorBanner.textContent = '';
  errorBanner.classList.add('hidden');
}

//skeleton loading
function showSkeleton(){
  if(todayContainer){
    todayContainer.innerHTML = Array(16)
    .fill('<div class="skeleton skeleton-card"></div>')
    .join('');
  }

  if(tomorrowContainer){
    tomorrowContainer.innerHTML = Array(16)
    .fill('<div class="skeleton skeleton-card"></div>')
    .join('');
  }

  if (weekContainer) {
    weekContainer.innerHTML = Array(5)
      .fill('<div class="skeleton skeleton-row"></div>')
      .join('');
  }
}

//fetching data
async function getWeather(city){
  try{
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=7`);
    const data = await response.json();
    return data;
  }
  catch(e){
    console.log(e);
    return null;
  }
}

async function showWeather(city){
  clearError();
  showSkeleton();

  try{
    const data = await getWeather(city);
    if (!data || data.error) {
      showError(data?.error?.message ?? "Error: City not found. Please ty again.");
      return;
    }

    currentWeatherData = data; //store it so it can be used later
    const code = data.current?.condition?.code;
    const isDay = data.current?.is_day ?? 1;
    updateBackgroundTheme(code, isDay);
    
    updateMainWeatherUI(data);
    updateAstronomyUI(data);
    updateForecastUI(data);
  } 
  catch(e){
    console.error(e);
    showError("Error: Something went wrong while fetching weather data. Please try again.");
  }
}

function showDate(timezone){
  const now = new Date();
  return now.toLocaleDateString("en-US", {
  timeZone: timezone,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true
  }); //format: Sun, Aug 23, 2026, 07:20 PM 
}

//displaying data
function updateMainWeatherUI(data){
  const timezone = data.location?.tz_id;
  
  dateTIme.textContent = showDate(timezone);
  place.textContent = data.location?.name != null ? data.location.name : "N/A"; 
  country.textContent = data.location?.country != null ? data.location.country : "N/A";
  
  const tempVal = currentUnit === 'C' ? data.current?.temp_c : data.current?.temp_f;
  const feelsLikeVal = currentUnit === 'C' ? data.current?.feelslike_c : data.current?.feelslike_f;

  temp.textContent = tempVal != null ? `${Math.round(tempVal)} °${currentUnit}` : "N/A";
  feelsLike.textContent = feelsLikeVal != null ? `${Math.round(feelsLikeVal)} °${currentUnit}` : "N/A";

  if (data.current?.condition?.icon) {
    const iconUrl = data.current.condition.icon;
    weatherIcon.src = iconUrl.startsWith("//") ? `https:${iconUrl}` : iconUrl;
    weatherIcon.alt = data.current.condition.text ?? "Weather icon";
  }

  weatherType.textContent = data.current?.condition?.text ?? "N/A";
  humidity.textContent = data.current?.humidity != null ? `${data.current.humidity}%` : "N/A";
  wind.textContent = data.current?.wind_kph != null ? `${data.current.wind_kph} kph` : "N/A";
  uv.textContent = data.current?.uv != null ? data.current.uv : "N/A";
}

function updateAstronomyUI(data) {
  const astro = data.forecast?.forecastday?.[0]?.astro;
  if (!astro) return;

  sunriseTime.textContent = astro.sunrise ?? "--:--";
  sunsetTime.textContent = astro.sunset ?? "--:--";
}

function renderHourlyForecast(hourlyData, container){
  if(!container || !Array.isArray(hourlyData)) return;

  container.innerHTML = hourlyData.map(hour => {
    const dateObj = new Date(hour.time.replace(" ", "T"));
    const formattedTime = dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true
    });

    const iconUrl = hour.condition?.icon?.startsWith("//")
    ? `https:${hour.condition.icon}` 
    : hour.condition?.icon ?? "";
    const hourTemp = currentUnit === 'C' ? hour.temp_c : hour.temp_f;
    
    return `
      <div class="hourly-card">
        <span class="hourly-time">${formattedTime}</span>
        <img class="hourly-icon" src="${iconUrl}" alt="${hour.condition?.text ?? 'Weather icon'}" />
        <span class="hourly-temp">${Math.round(hourTemp)}°${currentUnit}</span>
        <span class="hourly-rain">🌧️ ${hour.chance_of_rain ?? 0}%</span>
      </div>
    `;
  }).join('');
}

function renderWeeklyForecast(dailyData, container){
  if(!container || !Array.isArray(dailyData)) return;

  container.innerHTML = dailyData.map(dayItem => {
    const dateObj = new Date(dayItem.date + "T00:00:00");
    const dayName = dateObj.toLocaleDateString("en-US" , {
      weekday: "short",
      month: "short",
      day: "numeric"
    });

    const iconUrl = dayItem.day?.condition?.icon?.startsWith('//')
    ? `https:${dayItem.day.condition.icon}`
    : dayItem.day?.condition?.icon ?? "";

    const weatherCondition = dayItem.day?.condition?.text ?? 'N/A'
    const maxTemp = currentUnit === 'C' ? dayItem.day?.maxtemp_c : dayItem.day?.maxtemp_f;
    const minTemp = currentUnit === 'C' ? dayItem.day?.mintemp_c : dayItem.day?.mintemp_f;
    
    return `
      <div class="daily-row">
        <span class="daily-date">${dayName}</span>
        <div class="daily-condition">
          <img src="${iconUrl}" alt="${dayItem.day?.condition?.text ?? 'Weather icon'}" />
          <span>${weatherCondition}</span>
        </div>
        <div class="daily-temp-range">
          <span class="temp-max">${Math.round(maxTemp ?? 0)}°</span> / 
          <span class="temp-min">${Math.round(minTemp ?? 0)}°${currentUnit}</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateForecastUI(data){
  if(!data?.forecast?.forecastday) return;

  const forecastDays = data.forecast.forecastday;

  if(forecastDays[0].hour){
    renderHourlyForecast(forecastDays[0].hour, todayContainer);
  }

  if(forecastDays[1].hour){
    renderHourlyForecast(forecastDays[1].hour, tomorrowContainer);
  }

  renderWeeklyForecast(forecastDays, weekContainer);
}

//search suggestions
async function getCitySuggestions(query) {
  try{
    const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data;
  }
  catch(e){
    console.error("Auto-complete error: " + e);
    return [];
  }
}

function renderSuggestions(cities){
  if(!cities.length){
    suggestionsList.innerHTML = '';
    return;
  }

  suggestionsList.innerHTML = cities.map(city => 
    `<li data-city="${city.name}">
      <strong>${city.name}</strong>, ${city.country}
    </li>`
  ).join('');
}

function clearSuggestions(){
  suggestionsList.innerHTML = '';
}

//search city
function searchCity(){
  const city = searchInput.value.trim().toLowerCase();
  if (!city) {
    searchInput.focus();
    return;
  }
  showWeather(city);
}

//get geolocation
function getUserLocation(){
  if(!navigator.geolocation){
    showWeather("auto:ip");
    return;
  }

  navigator.geolocation.getCurrentPosition(//function on succees
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const coordinates = `${lat},${lon}`;
      showWeather(coordinates);
    }, //now function on failure to get permission
    (error) => {
      console.warn("Geolocation denied/failed. Falling back to IP location:", error.message);
      showWeather("auto:ip");
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,           // Time out after 10 seconds
      maximumAge: 300000        // Accept a cached position if under 5 minutes old
    }
  );
}

//update body class based on WeatherAPI condition code and day/night state
function updateBackgroundTheme(conditionCode, isDay) {
  //Clear existing weather theme classes from body
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('weather-'))
    .join(' ');

  let themeClass = 'weather-sunny';

  // Sunny or Clear (Code 1000)
  if (conditionCode === 1000) {
    themeClass = isDay === 1 ? 'weather-sunny' : 'weather-night';
  } 
  // Cloudy / Partly Cloudy / Overcast (Codes 1003, 1006, 1009)
  else if ([1003, 1006, 1009].includes(conditionCode)) {
    themeClass = isDay === 1 ? 'weather-cloudy' : 'weather-night';
  } 
  // Mist / Fog / Freezing Fog (Codes 1030, 1135, 1147)
  else if ([1030, 1135, 1147].includes(conditionCode)) {
    themeClass = 'weather-foggy';
  } 
  // Rain / Drizzle / Showers (Codes 1063, 1150-1201, 1240-1246)
  else if (
    (conditionCode >= 1150 && conditionCode <= 1201) ||
    (conditionCode >= 1240 && conditionCode <= 1246) ||
    conditionCode === 1063
  ) {
    themeClass = 'weather-rainy';
  } 
  // Snow / Ice (Codes 1210-1237, 1249-1264 , 1066, 1069, 1072, 1114, 1117, )
  else if (
    (conditionCode >= 1210 && conditionCode <= 1237) ||
    (conditionCode >= 1249 && conditionCode <= 1264) ||
    [1066, 1069, 1072, 1114, 1117].includes(conditionCode)
  ) {
    themeClass = 'weather-snowy';
  } 
  // Thunderstorm (Codes 1087, 1273-1282)
  else if (conditionCode === 1087 || (conditionCode >= 1273 && conditionCode <= 1282)) {
    themeClass = 'weather-thunder';
  }

  document.body.classList.add(themeClass);
}

//Event Listeners

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearSuggestions();
  searchCity();
  searchBox.classList.remove('active');
});

// typing events with Debounce (waits 300ms after user stops typing)
searchInput.addEventListener('input', ()=>{
  const query = searchInput.value.trim().toLowerCase();

  clearTimeout(debounceTimer);

  if(query.length < 2){
    clearSuggestions();
    return;
  }

  debounceTimer = setTimeout(async () => {
    const cities = await getCitySuggestions(query);
    renderSuggestions(cities);
  }, 300);
});

suggestionsList.addEventListener('click', (e) => {
  const target = e.target.closest('li');
  if(!target) return;

  const selectedCity = target.dataset.city;

  clearSuggestions();
  showWeather(selectedCity);
});

unitToggleBtn.addEventListener('click', () => {
  currentUnit = currentUnit === 'C' ? 'F' : 'C';
  unitToggleBtn.textContent = `°${currentUnit === 'C' ? 'F' : 'C'}`;

  if(currentWeatherData){
    updateMainWeatherUI(currentWeatherData);
    updateForecastUI(currentWeatherData);
  }
})

tabButtons.forEach(button => {
  button.addEventListener('click', ()=>{
    const targetTab = button.dataset.tab;

    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    button.classList.add('active');
    document.getElementById(`${targetTab}-tab`)?.classList.add('active');
  });
});

//Toggle search bar expansion
searchBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isActive = searchBox.classList.contains('active');
  const query = searchInput.value.trim();

  if (!isActive) {
    searchBox.classList.add('active');
    searchInput.focus();
  } else if (query !== '') {
    searchCity();
    clearSuggestions();
  } else {
    searchBox.classList.remove('active');
    clearSuggestions();
  }
});

document.addEventListener('click', (e) => {
  if (!searchForm.contains(e.target)) {
    searchBox.classList.remove('active');
    clearSuggestions();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  getUserLocation();
});