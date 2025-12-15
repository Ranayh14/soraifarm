
import { ClimateData, DailyForecast } from '../types';

// FIXED: Menggunakan Open-Meteo API (GRATIS, tidak perlu API key)
// Open-Meteo adalah alternatif gratis untuk OpenWeatherMap
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

export const getRealTimeWeather = async (lat: number, lon: number): Promise<Partial<ClimateData>> => {
  try {
    // Open-Meteo API - Current Weather
    const currentUrl = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FJakarta`;
    
    const response = await fetch(currentUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.current) {
      throw new Error('Invalid response from weather API');
    }

    const current = data.current;
    
    // Map weather code to condition (WMO Weather interpretation codes)
    const weatherCode = current.weather_code;
    let condition = 'Cerah';
    let isExtreme = false;
    let extremeMessage = 'Kondisi optimal untuk fotosintesis tanaman sorghum.';

    // Weather code mapping (simplified)
    if (weatherCode >= 0 && weatherCode <= 3) {
      condition = weatherCode === 0 ? 'Cerah' : 'Cerah Berawan';
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      condition = 'Berkabut';
    } else if (weatherCode >= 51 && weatherCode <= 67) {
      condition = 'Hujan';
    } else if (weatherCode >= 71 && weatherCode <= 77) {
      condition = 'Salju';
    } else if (weatherCode >= 80 && weatherCode <= 82) {
      condition = 'Hujan Lebat';
      isExtreme = true;
      extremeMessage = 'PERINGATAN: Hujan lebat terdeteksi. Hindari aktivitas di lahan.';
    } else if (weatherCode >= 95 && weatherCode <= 99) {
      condition = 'Badai Petir';
      isExtreme = true;
      extremeMessage = 'PERINGATAN BADAI: Tunda aktivitas pemupukan dan panen.';
    }

    // Check wind speed (extreme if > 20 m/s = 72 km/h)
    const windSpeedKmh = Math.round(current.wind_speed_10m * 3.6);
    if (windSpeedKmh > 72) {
      isExtreme = true;
      extremeMessage = 'PERINGATAN: Angin kencang terdeteksi. Waspada kerusakan tanaman.';
    }

    // Get location name (reverse geocoding - using simple approach)
    let locationName = 'Bandung';
    try {
      const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`);
      const geoData = await geoResponse.json();
      if (geoData.locality) {
        locationName = `${geoData.locality}, ${geoData.principalSubdivision || 'Indonesia'}`;
      }
    } catch (geoError) {
      console.warn('Failed to get location name, using default');
    }

    return {
      currentTemp: Math.round(current.temperature_2m),
      condition: condition,
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: windSpeedKmh,
      isExtreme: isExtreme,
      extremeMessage: extremeMessage,
      location: locationName
    };
  } catch (error) {
    console.error("Weather Fetch Error:", error);
    // Return realistic mock data as fallback
    return getMockWeatherData(lat, lon);
  }
};

// Helper function untuk forecast (jika diperlukan di masa depan)
export const getWeatherForecast = async (lat: number, lon: number, days: number = 7): Promise<DailyForecast[]> => {
  try {
    const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max&timezone=Asia%2FJakarta&forecast_days=${days}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.daily) {
      throw new Error('Invalid forecast response');
    }

    const forecasts: DailyForecast[] = [];
    for (let i = 0; i < Math.min(days, data.daily.time.length); i++) {
      const date = new Date(data.daily.time[i]);
      forecasts.push({
        name: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        temp: Math.round((data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2),
        rain: Math.round(data.daily.precipitation_sum[i] || 0),
        humidity: Math.round(data.daily.relative_humidity_2m_max[i] || 0)
      });
    }

    return forecasts;
  } catch (error) {
    console.error("Forecast Fetch Error:", error);
    return getMockForecast();
  }
};

const getMockWeatherData = (lat?: number, lon?: number): Partial<ClimateData> => ({
  currentTemp: 29,
  condition: "Cerah Berawan",
  humidity: 68,
  windSpeed: 14,
  isExtreme: false,
  extremeMessage: "Kondisi optimal untuk fotosintesis tanaman sorghum.",
  location: "Bojongsoang, Bandung"
});

const getMockForecast = (): DailyForecast[] => [
  { name: 'Sen', temp: 28, rain: 0, humidity: 65 },
  { name: 'Sel', temp: 29, rain: 5, humidity: 70 },
  { name: 'Rab', temp: 27, rain: 10, humidity: 75 },
  { name: 'Kam', temp: 30, rain: 0, humidity: 60 },
  { name: 'Jum', temp: 29, rain: 2, humidity: 68 },
  { name: 'Sab', temp: 28, rain: 0, humidity: 65 },
  { name: 'Min', temp: 27, rain: 8, humidity: 72 },
];
