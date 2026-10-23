# WeatherMap

A small, responsive single page weather app built with semantic HTML, CSS, and vanilla JavaScript. Search for a city or place to geocode it, view current weather on an interactive map, save favorite places, and copy a weather summary to share.

## OpenWeatherMap API Key Setup

1. Create a free account at [OpenWeatherMap](https://home.openweathermap.org/users/sign_up).
2. Sign in and open the **API keys** page in your account.
3. Copy your API key. New keys may take a little while to activate.
4. In `app.js`, replace the value of `WEATHER_API_KEY` with your key:

   ```js
   const WEATHER_API_KEY = "YOUR_API_KEY";

## Run locally

1. Install or open a code editor and place the project files in one folder.
2. Open a terminal in that folder.
3. Start a local static server. For example, with Python installed, run `python -m http.server 8000`.
4. Visit `http://localhost:8000` in a browser.
5. Search for a city such as `Port Sudan` and select **Get Weather**.

## APIs and libraries

- **OpenWeatherMap Current Weather API** supplies current temperature, condition, clouds, humidity, wind, and the condition icon. The API key is configured near the top of `app.js`.
- **OpenStreetMap Nominatim** resolves the typed place to coordinates.
- **Leaflet** displays the interactive OpenStreetMap tiles and weather marker. No map API key is needed.
- **Google Fonts (Roboto)** supplies the page font.

Geocoding and weather requests run asynchronously with `fetch` and `async`/`await`. The form prevents full page navigation. Favorites are stored in browser local storage.

---

Name: Ahmed Abdelkarim Ahmed
