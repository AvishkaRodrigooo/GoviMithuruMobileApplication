// frontend/src/utils/useUniversalLocation.js
import { useEffect, useState, useRef } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";

// Sinhala district map
const SI_DISTRICTS = {
  Colombo: "කොළඹ",
  Gampaha: "ගම්පහ",
  Kalutara: "කළුතර",
  Kandy: "මහනුවර",
  Matale: "මාතලේ",
  NuwaraEliya: "නුවර එලිය",
  Galle: "ගාල්ල",
  Matara: "මාතර",
  Hambantota: "හම්බන්තොට",
  Jaffna: "යාපනය",
  Kilinochchi: "කිලිනොච්චි",
  Mannar: "මන්නාරම",
  Vavuniya: "වවුනියාව",
  Mullaitivu: "මුලතිව්",
  Batticaloa: "බතිකලාව",
  Ampara: "අම්පාර",
  Trincomalee: "ත්‍රිකුණාමලය",
  Kurunegala: "කුරුණෑගල",
  Puttalam: "පුත්තලම",
  Anuradhapura: "අනුරාධපුර",
  Polonnaruwa: "පොලොන්නරුව",
  Badulla: "බදුල්ල",
  Monaragala: "මොණරාගල",
  Ratnapura: "රත්නපුර",
  Kegalle: "කෑගල්ල",
};

export default function useUniversalLocation(lang) {
  const [locationName, setLocationName] = useState("Loading...");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [weatherCondition, setWeatherCondition] = useState(null);
  const [weatherIcon, setWeatherIcon] = useState(null);
  const [rainfallMm, setRainfallMm] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const WEATHER_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

  // prevent GPS re-fetch on language change
  const hasFetchedRef = useRef(false);

  const clean = (v) =>
    v ? v.replace(/District|Province/gi, "").trim() : undefined;

  const toSinhalaDistrict = (d) =>
    d ? SI_DISTRICTS[d] || d : "";

  const fetchWeather = async (lat, lon) => {
    if (!WEATHER_KEY) return;

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`
      );

      if (!res.ok) return;

      const json = await res.json();

      setTemperature(
        typeof json.main?.temp === "number" ? json.main.temp : null
      );

      setHumidity(
        typeof json.main?.humidity === "number" ? json.main.humidity : null
      );

      if (Array.isArray(json.weather) && json.weather.length > 0) {
        setWeatherCondition(json.weather[0].description || null);
        setWeatherIcon(json.weather[0].icon || null);
      }

      // Rainfall (OpenWeatherMap)
      const rain =
        typeof json?.rain?.["1h"] === "number"
          ? json.rain["1h"]
          : typeof json?.rain?.["3h"] === "number"
          ? json.rain["3h"]
          : 0;

      setRainfallMm(rain);
    } catch {
      // silent fail (weather is optional)
    }
  };

  // 🔥 MAIN LOCATION LOGIC
  useEffect(() => {
    // allow language change to update label only
    if (hasFetchedRef.current && latitude && longitude) {
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1️⃣ Permission
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setError("Permission Denied");
          setLocationName("Permission Denied");
          setIsLoading(false);
          return;
        }

        // 2️⃣ GPS
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setLatitude(lat);
        setLongitude(lon);

        hasFetchedRef.current = true;

        // 3️⃣ Reverse geocode (OSM)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
          {
            headers: {
              "User-Agent": "MaizeGenie-App",
            },
          }
        );

        const data = await res.json();
        const a = data?.address || {};

        const place = clean(
          a.neighbourhood ||
            a.suburb ||
            a.village ||
            a.town ||
            a.city
        );

        const district = clean(
          a.district || a.county || a.state
        );

        // 4️⃣ Build display name
        let display = "";

        if (lang === "si") {
          const siDistrict = toSinhalaDistrict(district);
          display = place
            ? `${place}, ${siDistrict}`
            : siDistrict || "ස්ථානය";
        } else {
          display = place && district
            ? `${place}, ${district}`
            : district || "Location";
        }

        setLocationName(display);

        // 5️⃣ Weather
        await fetchWeather(lat, lon);

        setIsLoading(false);
      } catch (e) {
        console.error("Location error:", e);
        setError("Location Error");
        setLocationName("Unknown");
        setIsLoading(false);
      }
    };

    load();
  }, [lang]);

  return {
    locationName,
    latitude,
    longitude,
    temperature,
    humidity,
    weatherCondition,
    weatherIcon,
    rainfallMm,
    isLoading,
    error,
  };
}