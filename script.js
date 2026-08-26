const cityInput = document.getElementById('search-bar');
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
const searchForm = document.getElementById('search-form');
const suggestionsList = document.getElementById('suggestions-list');
let debounceTimer;

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const todayContainer = document.getElementById('today-container');
const tomorrowContainer = document.getElementById('tomorrow-container');
const weekContainer = document.getElementById('week-container');

async function getWeather(city){
  try{
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=7`);
    const data = await response.json();
    return data;
  }
  catch(e){
    console.log(e);
  }
}

async function showWeather(city){
  try{
    const data = await getWeather(city);
    if (!data || data.error) {
      alert(data?.error?.message ?? "City not found");
      return;
    }

    const timezone = data.location?.tz_id;
    
    dateTIme.textContent = showDate(timezone);
    place.textContent = data.location?.name != null ? data.location.name : "N/A"; 
    country.textContent = data.location?.country != null ? data.location.country : "N/A";
    temp.textContent = data.current?.temp_c != null ? data.current.temp_c : "N/A";
    
    if (data.current?.condition?.icon) {
      const iconUrl = data.current.condition.icon;
      weatherIcon.src = iconUrl.startsWith("//") ? `https:${iconUrl}` : iconUrl;
      weatherIcon.alt = data.current.condition.text ?? "Weather icon";
    }

    weatherType.textContent = data.current?.condition?.text ?? "N/A";
    humidity.textContent = data.current?.humidity != null ? `${data.current.humidity}%` : "N/A";
    feelsLike.textContent = data.current?.feelslike_c != null ? `${data.current.feelslike_c} C` : "N/A";
    wind.textContent = data.current?.wind_kph != null ? `${data.current.wind_kph} kph` : "N/A";
    uv.textContent = data.current?.uv != null ? data.current.uv : "N/A";

    updateForecastUI(data);
  } 
  catch(e){
    alert("Something went wrong, please try again later");
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
    
    return `
      <div class="hourly-card">
        <span class="hourly-time">${formattedTime}</span>
        <img class="hourly-icon" src="${iconUrl}" alt="${hour.condition?.text ?? 'Weather icon'}" />
        <span class="hourly-temp">${Math.round(hour.temp_c)}°C</span>
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
    const maxTemp = Math.round(dayItem.day?.maxtemp_c ?? 0);
    const minTemp = Math.round(dayItem.day?.mintemp_c ?? 0); 

    return `
      <div class="daily-row">
        <span class="daily-date">${dayName}</span>
        <div class="daily-condition">
          <img src="${iconUrl}" alt="${dayItem.day?.condition?.text ?? 'Weather icon'}" />
          <span>${weatherCondition}</span>
        </div>
        <div class="daily-temp-range">
          <span class="temp-max">${maxTemp}°</span> / <span class="temp-min">${minTemp}°C</span>
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

function searchCity(){
  const city = cityInput.value.trim().toLowerCase();

  if (!city) {
    cityInput.focus();
    return;
  }

  showWeather(city);
}

function getUserLocation(){
  if(!navigator.geolocation){
    alert('Your browser does not support geolocation. Enter city manually.');
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
      console.error("Geolocation Error:", error.message);
      console.warn("Unable to retrieve location. Please search for a city manually.");
      showWeather("auto:ip");
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,           // Time out after 10 seconds
      maximumAge: 300000        // Accept a cached position if under 5 minutes old
    }
  );
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  searchCity();
});

// typing events with Debounce (waits 300ms after user stops typing)
cityInput.addEventListener('input', ()=>{
  const query = cityInput.value.trim().toLowerCase();

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
  cityInput.value = selectedCity;
  clearSuggestions();

  showWeather(selectedCity);
});

document.addEventListener('click', (e) => {
  if(!searchForm.contains(e.target)){
    clearSuggestions();
  }
});

tabButtons.forEach(button => {
  button.addEventListener('click', ()=>{
    const targetTab = button.dataset.tab;

    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    button.classList.add('active');
    document.getElementById(`${targetTab}-tab`)?.classList.add('active');
  });
});

window.addEventListener("DOMContentLoaded", () => {
  getUserLocation();
});