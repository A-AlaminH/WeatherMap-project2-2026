"use strict";

const WEATHER_API_KEY = "a935d9eeea07a0e4f1cb8898e442f299";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const GEOCODING_URL = "https://nominatim.openstreetmap.org/search";
const FAVORITES_KEY = "weathermap-favorites";
const MAX_FAVORITES = 8;

const form = document.querySelector("#search-form");
const input = document.querySelector("#location");
const status = document.querySelector("#status");
const spinner = document.querySelector("#spinner");
const favoritesContainer = document.querySelector("#favorites");
const favoriteCount = document.querySelector("#favorite-count");
const submitButton = form.querySelector("button[type='submit']");

const map = L.map("map", { zoomControl: true }).setView([15.5007, 32.5599], 6);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentMarker = null;
let currentWeather = null;
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((place) => typeof place === "string").slice(0, MAX_FAVORITES) : [];
  } catch {
    return [];
  }
}

function setStatus(message = "", type = "") {
  status.textContent = message;
  status.className = `status ${type}`;
}

function setLoading(loading) {
  spinner.hidden = !loading;
  submitButton.disabled = loading;
  input.disabled = loading;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error("Request failed");
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function geocode(place) {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({ q: place, format: "jsonv2", limit: "1" });
  const results = await fetchJson(url);
  if (!results.length) throw new Error("We couldn't find that place. Try another city or address.");
  return { lat: Number(results[0].lat), lon: Number(results[0].lon), name: results[0].display_name };
}

async function fetchWeather({ lat, lon }) {
  const url = new URL(WEATHER_URL);
  url.search = new URLSearchParams({ lat, lon, appid: WEATHER_API_KEY, units: "metric" });
  try {
    return await fetchJson(url);
  } catch (error) {
    if (error.status === 401) throw new Error("The weather API key is invalid or not active yet. Check the key and try again.");
    if (error.status === 404) throw new Error("Weather data is unavailable for this location.");
    if (error.status === 429) throw new Error("The weather service is busy. Please wait a moment and try again.");
    throw error;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function popupMarkup(place, weather) {
  const condition = weather.weather[0];
  const icon = `https://openweathermap.org/img/wn/${encodeURIComponent(condition.icon)}@2x.png`;
  const message = `${place}: ${Math.round(weather.main.temp)}°C, ${condition.description}. Humidity ${weather.main.humidity}%, wind ${weather.wind.speed} m/s.`;
  return `<article class="weather-popup">
    <h2 class="popup-title">${escapeHtml(place)}</h2>
    <p class="popup-description">${escapeHtml(condition.description)}</p>
    <div class="popup-main"><img src="${icon}" alt="${escapeHtml(condition.description)}"><span class="popup-temp">${Math.round(weather.main.temp)}°C</span></div>
    <div class="popup-details"><span>Clouds: ${weather.clouds.all}%</span><span>Humidity: ${weather.main.humidity}%</span><span>Wind: ${weather.wind.speed} m/s</span><span>Feels like: ${Math.round(weather.main.feels_like)}°C</span></div>
    <div class="popup-actions"><button type="button" data-action="share" data-message="${escapeHtml(message)}">Share Weather</button><button type="button" data-action="favorite" data-place="${escapeHtml(place)}">${favorites.includes(place) ? "Saved ★" : "☆ Favorite"}</button></div>
  </article>`;
}

function showWeather(place, coordinates, weather) {
  if (currentMarker) map.removeLayer(currentMarker);
  map.flyTo([coordinates.lat, coordinates.lon], 11, { duration: 1.2 });
  currentMarker = L.marker([coordinates.lat, coordinates.lon]).addTo(map);
  currentMarker.bindPopup(popupMarkup(place, weather), { maxWidth: 280 }).openPopup();
  currentWeather = { place, coordinates, weather };
}

async function searchWeather(place) {
  setLoading(true);
  setStatus("Finding location and loading current weather…");
  try {
    const coordinates = await geocode(place);
    const weather = await fetchWeather(coordinates);
    const displayName = weather.name || place;
    showWeather(displayName, coordinates, weather);
    setStatus(`Weather loaded for ${displayName}.`, "success");
    return displayName;
  } catch (error) {
    setStatus(error.message || "Something went wrong. Please try again.", "error");
    return null;
  } finally {
    setLoading(false);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    setStatus("Favorites could not be saved in this browser.", "error");
  }
  renderFavorites();
}

function renderFavorites() {
  favoritesContainer.replaceChildren();
  favoriteCount.textContent = `${favorites.length}/${MAX_FAVORITES}`;
  if (!favorites.length) {
    const empty = document.createElement("p");
    empty.className = "empty-favorites";
    empty.textContent = "Save a place from its weather card for quick access.";
    favoritesContainer.append(empty);
    return;
  }
  favorites.forEach((place) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "favorite-chip";
    chip.dataset.place = place;
    chip.setAttribute("aria-label", `Load ${place}`);
    chip.textContent = place;
    const remove = document.createElement("span");
    remove.className = "remove";
    remove.textContent = "×";
    remove.setAttribute("aria-hidden", "true");
    chip.append(remove);
    favoritesContainer.append(chip);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const place = input.value.trim();
  if (!place) {
    setStatus("Enter a city or place to get its weather.", "error");
    input.focus();
    return;
  }
  await searchWeather(place);
});

favoritesContainer.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-place]");
  if (!button) return;
  const place = button.dataset.place;
  if (event.target.closest(".remove")) {
    favorites = favorites.filter((favorite) => favorite !== place);
    saveFavorites();
    return;
  }
  input.value = place;
  await searchWeather(place);
});

document.querySelector("#map").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "share") {
    try {
      await navigator.clipboard.writeText(button.dataset.message);
      setStatus("Weather summary copied to clipboard.", "success");
      button.textContent = "Copied!";
    } catch {
      setStatus("Clipboard access is unavailable. You can copy the weather details from the card.", "error");
    }
  }
  if (button.dataset.action === "favorite") {
    const place = button.dataset.place;
    if (favorites.includes(place)) {
      setStatus(`${place} is already a favorite.`, "success");
    } else if (favorites.length >= MAX_FAVORITES) {
      setStatus(`You can save up to ${MAX_FAVORITES} favorite places. Remove one to add another.`, "error");
    } else {
      favorites = [...favorites, place];
      saveFavorites();
      button.textContent = "Saved ★";
      setStatus(`${place} added to favorites.`, "success");
    }
  }
});

renderFavorites();
