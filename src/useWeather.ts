import { fetchWeatherApi } from 'openmeteo';
import { useState, useEffect, useCallback } from 'react';

export interface WeatherData {
  date: string;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
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
  updateInterval?: number;
}

export const useWeather = ({
  latitude = 37.5665, // Default to Seoul
  longitude = 126.9780,
  updateInterval = 10 * 60 * 1000, // 10 minutes default
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
          'temperature_2m',
          'relative_humidity_2m',
          'weather_code',
          'wind_speed_10m',
        ],
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
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
      const currentHumidity = current?.variables(1)?.value() ?? 0;
      const currentWeatherCode = current?.variables(2)?.value() ?? 0;
      const currentWindSpeed = current?.variables(3)?.value() ?? 0;

      // Daily weather data
      const daily = response.daily();
      const dailyTime = daily?.time();
      const dailyWeatherCode = daily?.variables(0)?.valuesArray();
      const dailyTemperatureMax = daily?.variables(1)?.valuesArray();
      const dailyTemperatureMin = daily?.variables(2)?.valuesArray();
      const dailyPrecipitation = daily?.variables(3)?.valuesArray();

      if (!dailyTime || !dailyWeatherCode || !dailyTemperatureMax || !dailyTemperatureMin || !dailyPrecipitation) {
        throw new Error('Invalid weather data format');
      }

      // Process today's data
      const todayData: WeatherData = {
        date: new Date((Number(dailyTime) + utcOffsetSeconds) * 1000).toISOString().split('T')[0],
        temperature: currentTemperature,
        temperatureMax: dailyTemperatureMax[0] ?? 0,
        temperatureMin: dailyTemperatureMin[0] ?? 0,
        weatherCode: Math.round(currentWeatherCode),
        humidity: currentHumidity,
        windSpeed: currentWindSpeed,
        precipitation: dailyPrecipitation[0] ?? 0,
      };

      // Process tomorrow's data
      const tomorrowData: WeatherData = {
        date: new Date((Number(dailyTime) + 86400 + utcOffsetSeconds) * 1000).toISOString().split('T')[0],
        temperature: 0, // No current temperature for tomorrow
        temperatureMax: dailyTemperatureMax[1] ?? 0,
        temperatureMin: dailyTemperatureMin[1] ?? 0,
        weatherCode: Math.round(dailyWeatherCode[1] ?? 0),
        humidity: 0, // No current humidity for tomorrow
        windSpeed: 0, // No current wind speed for tomorrow
        precipitation: dailyPrecipitation[1] ?? 0,
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

    const intervalId = setInterval(fetchWeatherData, updateInterval);

    return () => clearInterval(intervalId);
  }, [fetchWeatherData, updateInterval]);

  return {
    today,
    tomorrow,
    isLoading,
    error,
    refresh,
  };
};