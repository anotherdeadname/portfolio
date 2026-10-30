// Footer: Axel's local time in Brooklyn and the current weather there.
// The page shows "Eastern Time" until the script runs, and the weather
// stays hidden if the forecast request fails.

(function () {
  var TIME_ZONE = "America/New_York";
  var BROOKLYN = { lat: 40.68, lon: -73.94 };

  var timeEl = document.querySelector("[data-local-time]");
  var weatherEl = document.querySelector("[data-weather]");

  // Open-Meteo weather codes, grouped into short words
  function describe(code) {
    if (code === 0) return "Clear";
    if (code <= 2) return "Partly cloudy";
    if (code === 3) return "Cloudy";
    if (code <= 48) return "Fog";
    if (code <= 57) return "Drizzle";
    if (code <= 67) return "Rain";
    if (code <= 77) return "Snow";
    if (code <= 82) return "Showers";
    if (code <= 86) return "Snow showers";
    return "Storms";
  }

  function updateTime() {
    if (!timeEl) return;
    timeEl.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date());
  }

  function loadWeather() {
    if (!weatherEl || !window.fetch) return;
    var url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + BROOKLYN.lat +
      "&longitude=" + BROOKLYN.lon +
      "&current=temperature_2m,weather_code" +
      "&temperature_unit=fahrenheit";

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then(function (data) {
        var now = data.current;
        weatherEl.textContent =
          Math.round(now.temperature_2m) + "°F " + describe(now.weather_code);
        weatherEl.hidden = false;
      })
      .catch(function () {});
  }

  updateTime();
  setInterval(updateTime, 30 * 1000);
  loadWeather();
})();
