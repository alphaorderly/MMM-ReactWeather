import { fetchWeatherApi } from 'openmeteo';
import { useState, useEffect, useCallback } from 'react';

export interface WeatherData {
  date: string;
  temperature: number;             // current (today only) else 0
  apparentTemperature?: number;    // feels like (current)
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  humidity: number;                // current (today only)
  windSpeed: number;               // current (today only)
  windSpeedMax?: number;           // daily max wind (for tomorrow / today)
  precipitation: number;           // daily sum
  pressure?: number;               // hPa
  visibility?: number;             // meters
  uvIndex?: number;                // current UV
  uvIndexMax?: number;             // daily max UV
  cloudCover?: number;             // current %
  sunrise?: string;                // ISO
  sunset?: string;                 // ISO
}

export interface UseWeatherResult {
  today: WeatherData | null;
  tomorrow: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

interface UseWeatherParams {
  latitude?: number;
  longitude?: number;
  interval?: number; // explicit weather refresh interval override (ms)
}

export const useWeather = ({
  latitude = 37.5665,
  longitude = 126.9780,
  interval
}: UseWeatherParams = {}): UseWeatherResult => {
  const [today, setToday] = useState<WeatherData | null>(null);
  const [tomorrow, setTomorrow] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        latitude,
        longitude,
        current: [
          'temperature_2m',          // 0
          'apparent_temperature',    // 1
          'relative_humidity_2m',    // 2
            'weather_code',          // 3
          'wind_speed_10m',          // 4
          'pressure_msl',            // 5
          'visibility',              // 6
          'uv_index',                // 7
          'cloud_cover'              // 8
        ],
        daily: [
          'weather_code',            // 0
          'temperature_2m_max',      // 1
          'temperature_2m_min',      // 2
          'precipitation_sum',       // 3
          'wind_speed_10m_max',      // 4
          'uv_index_max',            // 5
          'sunrise',                 // 6
          'sunset'                   // 7
        ],
        timezone: 'auto',
        forecast_days: 2,
      };

      const responses = await fetchWeatherApi('https://api.open-meteo.com/v1/forecast', params);

      if (!responses || responses.length === 0) {
        throw new Error('No weather data received');
      }

      const response = responses[0];
      const utcOffsetSeconds = response.utcOffsetSeconds();
      
      // Current weather data
      const current = response.current();
  const currentTemperature = current?.variables(0)?.value() ?? 0;
  const currentApparent = current?.variables(1)?.value();
  const currentHumidity = current?.variables(2)?.value() ?? 0;
  const currentWeatherCode = current?.variables(3)?.value() ?? 0;
  const currentWindSpeed = current?.variables(4)?.value() ?? 0;
  const currentPressure = current?.variables(5)?.value();
  const currentVisibility = current?.variables(6)?.value();
  const currentUv = current?.variables(7)?.value();
  const currentCloud = current?.variables(8)?.value();

      // Daily weather data
      const daily = response.daily();
      const dailyTime = daily?.time();
  const dailyWeatherCode = daily?.variables(0)?.valuesArray();
  const dailyTemperatureMax = daily?.variables(1)?.valuesArray();
  const dailyTemperatureMin = daily?.variables(2)?.valuesArray();
  const dailyPrecipitation = daily?.variables(3)?.valuesArray();
  const dailyWindMax = daily?.variables(4)?.valuesArray();
  const dailyUvMax = daily?.variables(5)?.valuesArray();
  const dailySunrise = daily?.variables(6)?.valuesArray();
  const dailySunset = daily?.variables(7)?.valuesArray();

      if (!dailyTime || !dailyWeatherCode || !dailyTemperatureMax || !dailyTemperatureMin || !dailyPrecipitation) {
        throw new Error('Invalid weather data format');
      }

      // Process today's data
      // Convert sunrise/sunset epoch seconds (if provided) -> ISO
      const sunriseIso = dailySunrise && dailySunrise[0] ? new Date((dailySunrise[0] + utcOffsetSeconds) * 1000).toISOString() : undefined;
      const sunsetIso = dailySunset && dailySunset[0] ? new Date((dailySunset[0] + utcOffsetSeconds) * 1000).toISOString() : undefined;
      const sunriseTomorrowIso = dailySunrise && dailySunrise[1] ? new Date((dailySunrise[1] + utcOffsetSeconds) * 1000).toISOString() : undefined;
      const sunsetTomorrowIso = dailySunset && dailySunset[1] ? new Date((dailySunset[1] + utcOffsetSeconds) * 1000).toISOString() : undefined;

      const todayData: WeatherData = {
        date: new Date((Number(dailyTime) + utcOffsetSeconds) * 1000).toISOString().split('T')[0],
        temperature: currentTemperature,
        apparentTemperature: currentApparent ?? undefined,
        temperatureMax: dailyTemperatureMax[0] ?? 0,
        temperatureMin: dailyTemperatureMin[0] ?? 0,
        weatherCode: Math.round(currentWeatherCode),
        humidity: currentHumidity,
        windSpeed: currentWindSpeed,
        windSpeedMax: dailyWindMax ? dailyWindMax[0] : undefined,
        precipitation: dailyPrecipitation[0] ?? 0,
        pressure: currentPressure,
        visibility: currentVisibility,
        uvIndex: currentUv,
        uvIndexMax: dailyUvMax ? dailyUvMax[0] : undefined,
        cloudCover: currentCloud,
        sunrise: sunriseIso,
        sunset: sunsetIso,
      };

      // Process tomorrow's data
      const tomorrowData: WeatherData = {
        date: new Date((Number(dailyTime) + 86400 + utcOffsetSeconds) * 1000).toISOString().split('T')[0],
        temperature: 0, // No current temperature for tomorrow
        temperatureMax: dailyTemperatureMax[1] ?? 0,
        temperatureMin: dailyTemperatureMin[1] ?? 0,
        weatherCode: Math.round(dailyWeatherCode[1] ?? 0),
        humidity: 0,
        windSpeed: 0,
        windSpeedMax: dailyWindMax ? dailyWindMax[1] : undefined,
        precipitation: dailyPrecipitation[1] ?? 0,
        uvIndexMax: dailyUvMax ? dailyUvMax[1] : undefined,
        sunrise: sunriseTomorrowIso,
        sunset: sunsetTomorrowIso,
        pressure: undefined,
      };

      setToday(todayData);
      setTomorrow(tomorrowData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      console.error('Weather fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  const refresh = useCallback(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  useEffect(() => {
    fetchWeatherData();
    const effective = interval ?? 10 * 60 * 1000;
    const intervalId = setInterval(fetchWeatherData, effective);
    return () => clearInterval(intervalId);
  }, [fetchWeatherData, interval]);

  return {
    today,
    tomorrow,
    isLoading,
    error,
    refresh,
  };
};