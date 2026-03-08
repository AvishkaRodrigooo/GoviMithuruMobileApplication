// weatherForecastScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import {
  Cloud,
  CloudRain,
  Sun,
  Calendar,
  MapPin,
  ArrowLeft,
  RefreshCw,
  Droplets,
  Wind,
  AlertCircle,
  CloudDrizzle,
  Sprout,
  AlertTriangle,
  CheckCircle,
  Info,
  Bell,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import useUniversalLocation from "../utils/useUniversalLocation";
import { BarChart } from "react-native-chart-kit";
import { useFocusEffect } from "@react-navigation/native";

const getHourlyIcon = (mm) => {
  if (mm >= 3) return <AlertTriangle size={18} color="#dc2626" />;
  if (mm >= 1) return <CloudRain size={18} color="#2563eb" />;
  return <Sun size={18} color="#f59e0b" />;
};

const getTranslatedLocation = (rawName, lang) => {
  if (!rawName) return lang === "sinhala" ? "ස්ථානය" : "Location";

  if (lang === "english") return rawName;

  let enName = rawName.trim();

  enName = enName
    .replace(/District/i, "")
    .replace(/Province/i, "")
    .trim();

  const districtMap = {
    Colombo: "කොළඹ",
    Gampaha: "ගම්පහ",
    Kalutara: "කළුතර",
    Kandy: "මහනුවර",
    Matale: "මාතලේ",
    "Nuwara Eliya": "නුවර එලිය",
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

  if (districtMap[enName]) return districtMap[enName];

  return rawName;
};

const DEFAULT_LAT = 6.9271;
const DEFAULT_LON = 79.8612;
const screenWidth = Dimensions.get("window").width;

const WeatherForecastScreen = () => {
  const navigation = useNavigation();
  const language = "sinhala";
  const [sentRainAlert, setSentRainAlert] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const locationHook = useUniversalLocation("si");
  const {
    locationName,
    temperature,
    latitude,
    longitude,
  } = locationHook || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [hasUserRetried, setHasUserRetried] = useState(false);
  const [hourlyData, setHourlyData] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const content = {
    sinhala: {
      title: "කාලගුණ පුරෝකථනය",
      subtitle: "වී වගාව සඳහා",
      loading: "දත්ත ගෙනෙමින්...",
      error: "දත්ත ලබා ගැනීමට නොහැකි විය",
      retry: "නැවත උත්සාහ කරන්න",
      farmingAdvice: "වගා උපදෙස්",
      rainTrend: "වර්ෂාපතන ප්‍රවණතාව",
      weeklyOverview: "සතිපතා දළ විශ්ලේෂණය",
      humidity: "ආර්ද්‍රතාව",
      rainfall: "වර්ෂාව",
      wind: "සුළං",
      goodForPlanting: "රෝපණයට සුදුසුයි",
      heavyRainWarning: "අධික වර්ෂාව - අවධානය",
      dryCondition: "වියළි තත්ත්වය - වාරිමාර්ග කරන්න",
      idealConditions: "වගාවට සුදුසු තත්ත්වයක්",
      highTemp: "අධික උෂ්ණත්වය",
      dayLabel: "දින",
      today: "අද",
      goodDay: "වගාවට හොඳයි",
      riskyDay: "අවදානම් දිනක්",
      excellentTemp: "🌤️ ඉතා හොඳ උෂ්ණත්වය",
      lowHumidity: "💧 ආර්ද්‍රතාව අඩුයි",
      dontPlantToday: "– අද වගා කරන්න එපා",
      goodForFarming: "– වගාවට සුදුසුයි",
      irrigateNeeded: "– වාරිමාර්ග කරන්න",
      moderateConditions: "සාමාන්‍ය තත්ත්වය",
      heavyRain: "🌧️ අධික වර්ෂාව",
      goodWeek: "🌱 මෙම සතිය වගා කිරීමට හොඳයි",
      riskyWeek: "⛔ මෙම සතිය අවදානම් – වැඩි වර්ෂාව/උෂ්ණත්වය",
      mixedWeek: "⚠️ සමහර දින හොඳයි – සමහර දින අවධානයෙන්",
    },
    english: {
      title: "Weather Forecast",
      subtitle: "For Paddy Farming",
      loading: "Loading weather...",
      error: "Failed to load weather",
      retry: "Retry",
      farmingAdvice: "Farming Advice",
      rainTrend: "Rainfall Pattern",
      weeklyOverview: "Weekly Overview",
      humidity: "Humidity",
      rainfall: "Rainfall",
      wind: "Wind",
      goodForPlanting: "Good for Planting",
      heavyRainWarning: "Heavy Rain - Caution",
      dryCondition: "Dry Conditions - Irrigate",
      idealConditions: "Ideal Farming Conditions",
      highTemp: "High Temperature",
      dayLabel: "Day",
      today: "Today",
      goodDay: "Good for farming",
      riskyDay: "Risky day",
      excellentTemp: "🌤️ Excellent temperature",
      lowHumidity: "💧 Low humidity",
      dontPlantToday: "– Don't plant today",
      goodForFarming: "– Good for farming",
      irrigateNeeded: "– Irrigation needed",
      moderateConditions: "Moderate Conditions",
      heavyRain: "🌧️ Heavy rainfall",
      goodWeek: "🌱 Great week for farming",
      riskyWeek: "⛔ Risky week – high rainfall/temperature",
      mixedWeek: "⚠️ Mixed week – some good days, some caution needed",
    },
  };

  const getContent = () => {
    return content[language];
  };

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const monthsSi = [
      "ජන", "පෙබ", "මාර්", "අප්‍රි", "මැයි", "ජූනි", 
      "ජූලි", "අගෝ", "සැප්", "ඔක්", "නොවැ", "දැසැ"
    ];
    const monthsEn = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const months = language === "sinhala" ? monthsSi : monthsEn;
    return `${months[(m || 1) - 1]} ${d || 1}`;
  };

  const getDayName = (dateStr, short = false) => {
    const date = new Date(dateStr + "T00:00:00");
    const si = short
      ? ["ඉරි", "සඳු", "අඟ", "බදා", "බ්‍රහ", "සිකු", "සෙන"]
      : ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"];
    const en = short
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return language === "sinhala" ? si[date.getDay()] : en[date.getDay()];
  };

  // Get first rain hour helper
  const getFirstRainHour = () => {
    if (!hourlyData || hourlyData.length === 0) return null;

    const index = hourlyData.findIndex((h) => h.precipitation >= 1);
    if (index === -1) return null;

    return {
      index,
      time: new Date(hourlyData[index].time),
    };
  };

  // Hourly Action Banner Component
  const HourlyActionBanner = () => {
    if (!hourlyData || hourlyData.length === 0) return null;

    const rainInfo = getFirstRainHour();

    // No rain at all
    if (!rainInfo) {
      return (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            backgroundColor: "#F0FDF4",
            borderRadius: 16,
            padding: 14,
            borderLeftWidth: 6,
            borderLeftColor: "#10B981",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#065F46" }}>
            {language === "sinhala"
              ? "🟢 ඉදිරි පැය කිහිපය වැසි නොමැත – වගා වැඩ සඳහා සුදුසුයි"
              : "🟢 No rain expected in the next few hours – suitable for farming"}
          </Text>
        </View>
      );
    }

    const { index, time } = rainInfo;

    const hourLabel = time.toLocaleString("en-US", {
      hour: "numeric",
      hour12: true,
      timeZone: "Asia/Colombo",
    });

    // Decision levels
    let bg = "#FFFBEB";
    let border = "#f59e0b";
    let text =
      language === "sinhala"
        ? `⚠️ ${hourLabel} පමණ වැසි ඇතිවිය හැක – එයට පෙර වැඩ සූදානම් කරන්න`
        : `⚠️ Rain expected around ${hourLabel} – prepare work before that`;

    if (index <= 2) {
      // Rain very soon (1–2 hours)
      bg = "#FEF2F2";
      border = "#ef4444";
      text =
        language === "sinhala"
          ? `⛔ ${hourLabel}ට පෙර වැසි පටන්ගන්න පුළුවන් – දැන්ම අස්වැන්න ආවරණය කරන්න`
          : `⛔ Rain may start before ${hourLabel} – protect harvest immediately`;
    }

    return (
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 12,
          backgroundColor: bg,
          borderRadius: 16,
          padding: 14,
          borderLeftWidth: 6,
          borderLeftColor: border,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: "#1F2937",
          }}
        >
          {text}
        </Text>
      </View>
    );
  };

  // Hourly Risk Helper
  const getHourlyRisk = (mm) => {
    if (mm >= 3) return "red";
    if (mm >= 1) return "yellow";
    return "green";
  };

  const getHourlyLabel = (mm) => {
    if (mm >= 3) return language === "sinhala" ? "අවදානම්" : "Risky";
    if (mm >= 1) return language === "sinhala" ? "වැසි" : "Rain";
    return language === "sinhala" ? "හොඳයි" : "Good";
  };

  // Hourly Rain Strip Component
  const HourlyRainStrip = () => {
    if (!hourlyData || hourlyData.length === 0) return null;

    return (
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 10,
          marginBottom: 10,
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 14,
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: "#047857",
          }}
        >
          {language === "sinhala"
            ? "⏱️ ඉදිරි පැය – වගාවට කොහොමද?"
            : "⏱️ Next few hours – farming suitability"}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 14 }}
          contentContainerStyle={{
            flexDirection: "row",
            paddingRight: 12,
          }}
        >
          {hourlyData.slice(0, 12).map((h, idx) => {
            const risk = getHourlyRisk(h.precipitation);

            const bgColor =
              risk === "red"
                ? "#FEE2E2"
                : risk === "yellow"
                ? "#FEF9C3"
                : "#DCFCE7";

            const hourLabel = new Date(h.time).toLocaleString("en-US", {
              hour: "numeric",
              hour12: true,
              timeZone: "Asia/Colombo",
            });

            return (
              <View
                key={idx}
                style={{
                  alignItems: "center",
                  width: 56,
                  marginRight: 6,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: bgColor,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  {getHourlyIcon(h.precipitation)}
                </View>

                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#374151",
                  }}
                >
                  {hourLabel}
                </Text>

                <Text
                  style={{
                    fontSize: 9,
                    color: "#6B7280",
                    marginTop: 2,
                  }}
                >
                  {getHourlyLabel(h.precipitation)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const getTrafficColor = (day) => {
    const rain = day.rain_mm || 0;
    const temp = day.temperature;
    const humidity = day.humidity_mean || 0;

    if (rain > 25 || temp > 33) return "red";
    if ((rain < 2 && humidity < 50) || (rain >= 2 && rain < 5)) return "yellow";
    if (rain >= 5 && rain <= 25 && temp >= 25 && temp <= 33) return "green";
    return "yellow";
  };

  // Enhanced getDailySummaryText function
  const getDailySummaryText = (day) => {
    const rain = day.rain_mm || 0;
    const temp = day.temperature;
    const humidity = day.humidity_mean || 0;
    const currentContent = getContent();

    if (rain > 25) {
      return `${currentContent.heavyRain} ${currentContent.dontPlantToday}`;
    } else if (rain >= 5 && rain <= 25 && temp >= 25 && temp <= 33) {
      return `${currentContent.excellentTemp} ${currentContent.goodForFarming}`;
    } else if (rain < 2 && humidity < 50) {
      return `${currentContent.lowHumidity} ${currentContent.irrigateNeeded}`;
    } else if (temp > 33) {
      return `${currentContent.highTemp} ${currentContent.irrigateNeeded}`;
    }
    return currentContent.moderateConditions;
  };

  const getWeatherIcon = (day) => {
    const rain = day.rain_mm || 0;
    const temp = day.temperature;
    const cloud = day.cloud_cover || 0;

    if (rain > 25) return <CloudRain size={32} color="#ef4444" />;
    if (rain >= 5 && rain <= 25) return <CloudDrizzle size={32} color="#0ea5e9" />;
    if (cloud > 70) return <Cloud size={32} color="#9CA3AF" />;
    if (temp > 30) return <Sun size={32} color="#f59e0b" />;
    return <Sun size={32} color="#fbbf24" />;
  };

  const EnhancedTrafficDot = ({ color }) => {
    const bg = color === "red" ? "#ef4444" : color === "yellow" ? "#facc15" : "#22c55e";
    const glowBg = color === "red" ? "rgba(239, 68, 68, 0.3)" : 
                   color === "yellow" ? "rgba(250, 204, 21, 0.3)" : 
                   "rgba(34, 197, 94, 0.3)";

    return (
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 24,
        backgroundColor: glowBg,
        justifyContent: "center",
        alignItems: "center",
      }}>
        <View style={{
          width: 16,
          height: 16,
          borderRadius: 16,
          backgroundColor: bg,
          shadowColor: bg,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
          elevation: 8,
        }} />
      </View>
    );
  };

  // Enhanced Farming Advice function
  const getFarmingAdvice = (predictions) => {
    const advice = [];
    const currentContent = getContent();

    predictions.forEach((day, idx) => {
      const rain = day.rain_mm || 0;
      const temp = day.temperature;
      const humidity = day.humidity_mean || 0;

      if (rain > 25) {
        advice.push({
          type: "alert",
          title: `${getDayName(day.date, true)} - ${currentContent.heavyRainWarning}`,
          description: `${rain.toFixed(1)}mm ${language === "sinhala" ? "වර්ෂාව අපේක්ෂිතයි" : "rainfall expected"}`,
          icon: <CloudRain size={20} color="#ef4444" />,
        });
      } else if (rain >= 5 && rain <= 25 && temp >= 25 && temp <= 33) {
        advice.push({
          type: "good",
          title: `${getDayName(day.date, true)} - ${currentContent.idealConditions}`,
          description: `${rain.toFixed(1)}mm ${language === "sinhala" ? "වර්ෂාව, උෂ්ණත්වය" : "rain, temp"} ${Math.round(temp)}°C`,
          icon: <CheckCircle size={20} color="#10B981" />,
        });
      } else if (rain < 2 && humidity < 50) {
        advice.push({
          type: "warning",
          title: `${getDayName(day.date, true)} - ${currentContent.dryCondition}`,
          description: `${language === "sinhala" ? "ආර්ද්‍රතාව" : "Humidity"} ${Math.round(humidity)}%`,
          icon: <AlertTriangle size={20} color="#f59e0b" />,
        });
      } else if (temp > 33) {
        advice.push({
          type: "warning",
          title: `${getDayName(day.date, true)} - ${currentContent.highTemp}`,
          description: `${Math.round(temp)}°C - ${language === "sinhala" ? "අමතර වාරිමාර්ග අවශ්‍යයි" : "Extra irrigation needed"}`,
          icon: <Sun size={20} color="#f59e0b" />,
        });
      }
    });
    return advice;
  };

  // Enhanced Farm Action Card Component
  const EnhancedFarmActionCard = ({ predictions }) => {
    const goodDaysCount = predictions.filter(
      (d) =>
        (d.rain_mm ?? 0) >= 5 &&
        (d.rain_mm ?? 0) <= 25 &&
        d.temperature >= 25 &&
        d.temperature <= 33
    ).length;
    const riskyDaysCount = predictions.filter(
      (d) => (d.rain_mm ?? 0) > 25 || d.temperature > 33
    ).length;

    const currentContent = getContent();

    let title = "";
    let emoji = "🌱";
    let desc = "";
    let bgColor = "#F0FDF4";
    let borderColor = "#10B981";
    let textColor = "#047857";

    if (goodDaysCount >= 4) {
      title = currentContent.goodWeek;
      emoji = "🌱";
      desc =
        language === "sinhala"
          ? `${goodDaysCount} හොඳ දින - සිටින්න!`
          : `${goodDaysCount} good days - Perfect time to farm!`;
      bgColor = "#F0FDF4";
      borderColor = "#10B981";
      textColor = "#047857";
    } else if (riskyDaysCount >= 4) {
      title = currentContent.riskyWeek;
      emoji = "⛔";
      desc =
        language === "sinhala"
          ? `${riskyDaysCount} අවදානම් දින - අවධානයෙන්!`
          : `${riskyDaysCount} risky days - Be careful!`;
      bgColor = "#FEF2F2";
      borderColor = "#ef4444";
      textColor = "#dc2626";
    } else {
      title = currentContent.mixedWeek;
      emoji = "⚠️";
      desc =
        language === "sinhala"
          ? "දිනපතා පුරෝකථනය පරීක්ෂා කරන්න"
          : "Check daily forecasts";
      bgColor = "#FFFBEB";
      borderColor = "#f59e0b";
      textColor = "#d97706";
    }

    return (
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
          backgroundColor: bgColor,
          borderRadius: 16,
          padding: 16,
          borderWidth: 2.5,
          borderColor: borderColor,
          elevation: 4,
        }}
      >
        <Text style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: textColor,
            marginBottom: 6,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: textColor,
            opacity: 0.7,
            lineHeight: 19,
          }}
        >
          {desc}
        </Text>
      </View>
    );
  };

  // Animated Weekly Strip Component
  const AnimatedWeeklyStrip = ({ predictions }) => {
    return (
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 12,
          marginBottom: 16,
          backgroundColor: "#fff",
          borderRadius: 14,
          padding: 16,
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#047857",
            marginBottom: 12,
          }}
        >
          📅 {language === "sinhala" ? "සතිය පුරා දළ විශ්ලේෂණය" : "Weekly Overview"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            gap: 6,
          }}
        >
          {predictions.slice(0, 7).map((day, idx) => (
            <View key={idx} style={{ alignItems: "center" }}>
              <EnhancedTrafficDot color={getTrafficColor(day)} />
              <Text
                style={{
                  fontSize: 10,
                  color: "#6B7280",
                  marginTop: 6,
                  fontWeight: "600",
                }}
              >
                {getDayName(day.date, true).substring(0, 2)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Beautiful Day Card Header Component
  const BeautifulDayCardHeader = ({ day, trafficColor }) => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor:
            trafficColor === "red"
              ? "#FECACA"
              : trafficColor === "yellow"
              ? "#FEF08A"
              : "#BBFDE0",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.dayName}>{getDayName(day.date)}</Text>
          <Text style={styles.dateTxt}>{formatDate(day.date)}</Text>
        </View>

        {getWeatherIcon(day)}

        <View style={{ marginLeft: 12, alignItems: "center", gap: 4 }}>
          <EnhancedTrafficDot color={trafficColor} />
        </View>
      </View>
    );
  };

  // Beautiful Metrics Grid Component
  const BeautifulMetricsGrid = ({ day }) => {
    const metrics = [
      {
        icon: <Sun size={16} color="#f59e0b" />,
        label: `${Math.round(day.temperature_min)}°-${Math.round(day.temperature_max)}°C`,
        value: language === "sinhala" ? "උෂ්ණත්වය" : "Temp",
      },
      {
        icon: <CloudRain size={16} color="#0ea5e9" />,
        label: `${(day.rain_mm || 0).toFixed(1)} mm`,
        value: language === "sinhala" ? "වර්ෂාව" : "Rain",
      },
      {
        icon: <Droplets size={16} color="#06b6d4" />,
        label: `${Math.round(day.humidity_mean || 0)}%`,
        value: language === "sinhala" ? "ආර්ද්‍රතාව" : "Humidity",
      },
      {
        icon: <Wind size={16} color="#047857" />,
        label: `${Math.round(day.windspeed || 0)} km/h`,
        value: language === "sinhala" ? "සුළං" : "Wind",
      },
    ];

    return (
      <View style={styles.metricsGrid}>
        {metrics.map((metric, idx) => (
          <View key={idx} style={styles.metricBox}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "#F3F4F6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {metric.icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#9CA3AF" }}>
                {metric.value}
              </Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // ✅ FIXED: fetchWeatherData with current_weather parameter
  const fetchWeatherData = async (lat, lon, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Added current_weather parameter to get real-time temperature
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_min,temperature_2m_max,relative_humidity_2m_mean,cloudcover_mean,uv_index_max,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant&forecast_days=8&timezone=Asia/Colombo`;

      const res = await fetch(url);
      const data = await res.json();
      const d = data.daily;

      if (!d || !Array.isArray(d.time) || d.time.length === 0) {
        throw new Error("Invalid weather data");
      }

      const predictions = d.time.slice(1).map((date, idx) => {
        const realIndex = idx + 1;
        const tMin = d.temperature_2m_min[realIndex];
        const tMax = d.temperature_2m_max[realIndex];
        const tAvg = (tMin + tMax) / 2;

        return {
          day: realIndex,
          date,
          temperature_min: tMin,
          temperature_max: tMax,
          temperature: tAvg,
          humidity_mean: d.relative_humidity_2m_mean[realIndex],
          cloud_cover: d.cloudcover_mean[realIndex],
          uv_index: d.uv_index_max[realIndex],
          rain_probability: d.precipitation_probability_max[realIndex],
          rain_mm: d.precipitation_sum[realIndex],
          windspeed: d.wind_speed_10m_max[realIndex],
          wind_dir: d.wind_direction_10m_dominant[realIndex],
        };
      });

      // Get current temperature from API response
      const currentTemp = data?.current_weather?.temperature || temperature || predictions[0]?.temperature || 26;

      setWeatherData({
        success: true,
        city: locationName || "Sri Lanka",
        predictions,
        last_actual_temp: currentTemp,
        advice: [],
      });
    } catch (e) {
      console.log("Weather error:", e);
      setError("Invalid weather data");
      setWeatherData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch hourly data
  useEffect(() => {
    if (latitude == null || longitude == null) return;

    const fetchHourlyRain = async () => {
      try {
        const hourlyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=precipitation&forecast_hours=12&timezone=Asia/Colombo`;

        const res = await fetch(hourlyUrl);
        const json = await res.json();

        if (json?.hourly?.time && json?.hourly?.precipitation) {
          const hourly = json.hourly.time.map((t, i) => ({
            time: t,
            precipitation: json.hourly.precipitation[i] || 0,
          }));
          setHourlyData(hourly);
        }
      } catch (e) {
        console.log("Hourly rain fetch error", e);
      }
    };

    fetchHourlyRain();
  }, [latitude, longitude]);

  // Fetch weather data when location changes
  useEffect(() => {
    if (latitude != null && longitude != null) {
      fetchWeatherData(latitude, longitude);
    }
  }, [latitude, longitude, temperature]); // Added temperature dependency

  useEffect(() => {
    if (!loading && weatherData) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, weatherData]);

  const EnhancedHeader = () => {
    const currentContent = getContent();

    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#047857" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Sprout size={22} color="#047857" />
            <Text style={styles.headerTitle}>{currentContent.title}</Text>
          </View>
          <Text style={styles.headerSubtitle}>{currentContent.subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Bell size={20} color="#10B981" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ✅ FIXED: EnhancedCurrentWeatherCard with proper temperature display
  const EnhancedCurrentWeatherCard = () => {
    const currentContent = getContent();
    
    // Get current temperature from weatherData
    const currentTemp = weatherData?.last_actual_temp || temperature || 26;
    const feelsLike = temperature ? Math.round(temperature) : Math.round(currentTemp);

    return (
      <Animated.View style={[styles.currentWeatherCard, { opacity: fadeAnim }]}>
        <View style={styles.locationRow}>
          <MapPin size={18} color="#047857" />
          <Text style={styles.locationText}>
            {getTranslatedLocation(locationName || null, language)}
          </Text>
        </View>

        <View style={styles.tempContainer}>
          <View style={styles.tempIcon}>
            <Sun size={48} color="#f59e0b" />
          </View>
          <View>
            <Text style={styles.currentTemp}>
              {Math.round(currentTemp)}°C
            </Text>
            <Text style={styles.currentLabel}>
              {language === "sinhala" ? "දැන් තියෙන උෂ්ණත්වය" : "Current Temperature"}
            </Text>
            {temperature && (
              <Text style={styles.feelsLikeText}>
                {language === "sinhala" 
                  ? `හැඟෙන උෂ්ණත්වය: ${Math.round(temperature)}°C` 
                  : `Feels like: ${Math.round(temperature)}°C`}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  if (!latitude || !longitude || locationName === "Loading...") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingTxt}>GPS සකස් වෙමින්...</Text>
      </View>
    );
  }

  if (error && hasUserRetried) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={64} color="#ef4444" />
        <Text style={styles.errorText}>{getContent().error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setHasUserRetried(true);
            fetchWeatherData(latitude || DEFAULT_LAT, longitude || DEFAULT_LON);
          }}
        >
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryTxt}>{getContent().retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!weatherData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingTxt}>
          {language === "sinhala" ? "කාලගුණ දත්ත සකස් වෙමින්..." : "Preparing weather data..."}
        </Text>
      </View>
    );
  }

  const predictions = weatherData.predictions || [];
  const farmingAdvice = getFarmingAdvice(predictions);

  const rainChartData = {
    labels: predictions.map((d) => getDayName(d.date, true)),
    datasets: [{
      data: predictions.map((d) => d.rain_mm || 0),
    }],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#f8fafc",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
    style: { borderRadius: 16 },
    barPercentage: 0.7,
  };

  return (
    <View style={styles.container}>
      <EnhancedHeader />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchWeatherData(latitude || DEFAULT_LAT, longitude || DEFAULT_LON, true)}
          />
        }
      >
        <EnhancedCurrentWeatherCard />

        {/* Hourly Rain Strip */}
        <HourlyRainStrip />

        {/* Hourly Action Banner */}
        <HourlyActionBanner />

        {predictions.length > 0 && (
          <Animated.View style={[styles.dailySummaryBanner, { opacity: fadeAnim }]}>
            <View style={styles.dailySummaryContent}>
              <Text style={styles.dailySummaryLabel}>
                {language === "sinhala" ? "📍 අද කාලගුණය" : "📍 Today's Weather"}
              </Text>
              <Text style={styles.dailySummaryValue}>
                {getDailySummaryText(predictions[0])}
              </Text>
            </View>
            <EnhancedTrafficDot color={getTrafficColor(predictions[0])} />
          </Animated.View>
        )}

        {/* Animated Weekly Strip */}
        {predictions.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <AnimatedWeeklyStrip predictions={predictions} />
          </Animated.View>
        )}

        {/* Enhanced Farm Action Card */}
        {predictions.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <EnhancedFarmActionCard predictions={predictions} />
          </Animated.View>
        )}

        {/* Farming Advice Section */}
        {farmingAdvice.length > 0 && (
          <Animated.View style={[styles.adviceSection, { opacity: fadeAnim }]}>
            <View style={styles.adviceHeader}>
              <Info size={20} color="#047857" />
              <Text style={styles.adviceTitle}>
                {getContent().farmingAdvice}
              </Text>
            </View>

            {farmingAdvice.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.adviceCard,
                  item.type === "good" && styles.adviceGood,
                  item.type === "warning" && styles.adviceWarning,
                  item.type === "alert" && styles.adviceAlert,
                ]}
              >
                {item.icon}
                <View style={styles.adviceContent}>
                  <Text style={styles.adviceCardTitle}>{item.title}</Text>
                  <Text style={styles.adviceCardDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View style={[styles.chartCard, { opacity: fadeAnim }]}>
          <View style={styles.chartHeader}>
            <CloudRain size={20} color="#0ea5e9" />
            <Text style={styles.chartTitle}>{getContent().rainTrend}</Text>
          </View>
          <View style={styles.chartClip}>
            <BarChart
              data={rainChartData}
              width={screenWidth - 56}
              height={210}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={true}
              fromZero={true}
              yAxisSuffix=" mm"
              yAxisLabel=""
              verticalLabelRotation={-15}
            />
          </View>
          <Text style={styles.chartNote}>
            {language === "sinhala"
              ? "* 5-25mm වර්ෂාව වී වගාවට හිතකරයි"
              : "* 5-25mm rainfall is ideal for paddy farming"}
          </Text>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Calendar size={18} color="#047857" />
          <Text style={styles.sectionTitle}>{getContent().weeklyOverview}</Text>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <EnhancedTrafficDot color="green" />
            <Text style={styles.legendTextGreen}>
              {language === "sinhala" ? "හොඳ" : "Good"}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <EnhancedTrafficDot color="yellow" />
            <Text style={styles.legendTextYellow}>
              {language === "sinhala" ? "අවධානයෙන්" : "Moderate"}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <EnhancedTrafficDot color="red" />
            <Text style={styles.legendTextRed}>
              {language === "sinhala" ? "අවදානම්" : "Risky"}
            </Text>
          </View>
        </View>

        {predictions.map((d, idx) => {
          const trafficColor = getTrafficColor(d);
          const cardBg = trafficColor === "red" ? "#FEF2F2" : 
                        trafficColor === "yellow" ? "#FFFBEB" : "#F0FDF4";
          const cardBorder = trafficColor === "red" ? "#FECACA" : 
                           trafficColor === "yellow" ? "#FEF08A" : "#BBFDE0";

          return (
            <Animated.View
              key={d.day}
              style={[
                styles.dayCard,
                {
                  backgroundColor: cardBg,
                  borderWidth: 2,
                  borderColor: cardBorder,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Using BeautifulDayCardHeader */}
              <BeautifulDayCardHeader day={d} trafficColor={trafficColor} />
              
              <Text style={styles.dailyReasonText}>
                {getDailySummaryText(d)}
              </Text>
              
              {/* Using BeautifulMetricsGrid */}
              <BeautifulMetricsGrid day={d} />
            </Animated.View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FDF4" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  loadingTxt: { fontSize: 16, color: "#6B7280", marginTop: 10 },
  errorText: { color: "#ef4444", fontSize: 17, marginTop: 10 },
  retryBtn: {
    backgroundColor: "#10B981",
    padding: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  retryTxt: { color: "#fff", fontWeight: "600" },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  backBtn: { padding: 10, backgroundColor: "#E7F9ED", borderRadius: 20 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#047857" },
  headerSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  currentWeatherCard: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  locationText: { fontSize: 15, fontWeight: "600", color: "#047857" },
  tempContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  tempIcon: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  currentTemp: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#047857",
  },
  currentLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  // ✅ ADDED: feelsLikeText style
  feelsLikeText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  dailySummaryBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#10B981",
  },
  dailySummaryContent: { flex: 1 },
  dailySummaryLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  dailySummaryValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "700",
    marginTop: 4,
  },
  adviceSection: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  adviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  adviceTitle: { fontSize: 18, fontWeight: "700", color: "#047857" },
  adviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  adviceGood: { borderLeftColor: "#10B981", backgroundColor: "#F0FDF4" },
  adviceWarning: { borderLeftColor: "#f59e0b", backgroundColor: "#FFFBEB" },
  adviceAlert: { borderLeftColor: "#ef4444", backgroundColor: "#FEF2F2" },
  adviceContent: { flex: 1 },
  adviceCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  adviceCardDesc: { fontSize: 12, color: "#6B7280" },
  chartCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  chartTitle: { fontSize: 16, fontWeight: "700", color: "#047857" },
  chart: { borderRadius: 12, marginVertical: 8 },
  chartNote: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 8,
  },
  chartClip: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
  },
  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#047857" },
  legendContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendTextGreen: { color: "#047857", fontSize: 12, fontWeight: "600" },
  legendTextYellow: { color: "#CA8A04", fontSize: 12, fontWeight: "600" },
  legendTextRed: { color: "#DC2626", fontSize: 12, fontWeight: "600" },
  dayCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 14,
    borderRadius: 14,
    elevation: 2,
  },
  dayName: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  dateTxt: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  dailyReasonText: {
    fontSize: 13,
    color: "#047857",
    fontWeight: "600",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  metricLabel: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
});

export default WeatherForecastScreen;