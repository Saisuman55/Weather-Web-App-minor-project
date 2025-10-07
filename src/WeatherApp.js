
import React, { useState } from "react";
import "./App.css";

const RAPIDAPI_HOST = process.env.REACT_APP_RAPIDAPI_HOST || "ai-weather-by-meteosource.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.REACT_APP_RAPIDAPI_KEY || "";

export default function WeatherApp() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const buildUrl = ({ q = "", lat = null, lon = null }) => {
    const base = `https://${RAPIDAPI_HOST}/points`;
    const params = new URLSearchParams({ language: "en", units: "metric" });
    if (lat != null && lon != null) {
      params.set("lat", String(lat));
      params.set("lon", String(lon));
    } else if (q) {
      params.set("q", q);
    }
    return `${base}?${params.toString()}`;
  };

  const fetchWeather = async ({ q = "", lat = null, lon = null }) => {
    setError(null);
    setWeatherData(null);

    if (!RAPIDAPI_KEY) {
      setError("Missing API key. Copy .env.example to .env and set REACT_APP_RAPIDAPI_KEY");
      return;
    }
    if (!q && (lat == null || lon == null)) {
      setError("Enter a city or use location button");
      return;
    }

    setLoading(true);
    try {
      const url = buildUrl({ q, lat, lon });
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error('API ' + res.status + ' ' + res.statusText + ' ' + text);
      }
      const json = await res.json();
      // Try to normalize response
      const cur = json?.data?.current ?? json?.current ?? json?.current_observation ?? null;
      const loc = json?.data?.location ?? json?.display_location ?? { name: json?.name, country: json?.country } ?? {};
      const normalized = {
        city: loc.name || q || "",
        country: loc.country || "",
        temperature: cur?.temp_c ?? cur?.temperature ?? cur?.temp ?? null,
        description: cur?.condition?.text ?? cur?.summary ?? cur?.weather ?? null,
        humidity: cur?.humidity ?? null,
        windSpeed: cur?.wind_kph ?? cur?.wind?.speed ?? null,
        icon: cur?.condition?.icon ?? cur?.icon ?? null,
      };
      setWeatherData(normalized);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchWeather({ q: city.trim() });
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => { setError(err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="weather-card">
      <h1>Weather Frontend Only</h1>
      <form onSubmit={handleSearch} className="controls">
        <input value={city} onChange={(e)=>setCity(e.target.value)} placeholder="Enter city (e.g., Bhubaneswar)" />
        <button type="submit">Search</button>
        <button type="button" onClick={handleLocation} title="Use precise location">📍</button>
      </form>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">Error: {error}</p>}

      {weatherData && (
        <div className="weather-display">
          <h2>{weatherData.city}{weatherData.country ? `, ${weatherData.country}` : ""}</h2>
          <p><strong>{weatherData.temperature ?? "—"}°C</strong></p>
          <p>{weatherData.description}</p>
          {weatherData.humidity != null && <p>Humidity: {weatherData.humidity}%</p>}
          {weatherData.windSpeed != null && <p>Wind: {weatherData.windSpeed} km/h</p>}
          {weatherData.icon && <img src={weatherData.icon} alt="icon" className="weather-icon" />}
        </div>
      )}

      {!loading && !error && !weatherData && <p className="muted">Enter a city or use the location button</p>}
    </div>
  );
}
