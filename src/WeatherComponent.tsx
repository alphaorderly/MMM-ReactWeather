/* eslint-disable import/order */
import { Cloud, CloudRain, CloudSnow, Sun, CloudDrizzle, Zap, Wind, Droplets, Eye } from 'lucide-react';

import React from 'react';
import { useWeather } from './useWeather';

// Compact icon resolver
const iconFor = (code: number, size = 56) => {
  const p = { size, strokeWidth: 1.25, className: 'text-white/90' };
  if (code === 0 || code === 1) return <Sun {...p} className="text-yellow-300" />;
  if (code === 2 || code === 3) return <Cloud {...p} />;
  if (code >= 61 && code <= 67) return <CloudRain {...p} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle {...p} />;
  if (code >= 71 && code <= 86) return <CloudSnow {...p} />;
  if (code >= 95 && code <= 99) return <Zap {...p} className="text-yellow-400" />;
  if (code === 45 || code === 48) return <Eye {...p} />;
  return <Cloud {...p} />;
};

const descFor = (code: number) => {
  const map: Record<number, string> = {
    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime Fog',
    51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle', 56: 'Frz Drizzle', 57: 'Frz Drizzle',
    61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain', 66: 'Frz Rain', 67: 'Frz Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
    80: 'Shower', 81: 'Showers', 82: 'Heavy Showers', 85: 'Snow Shwr', 86: 'Snow Shwr',
    95: 'Storm', 96: 'Storm (hail)', 99: 'Storm (hail)'
  };
  return map[code] || 'Unknown';
};

// Convert wind speed (m/s from Open-Meteo) to km/h
const msToKmh = (v: number) => v * 3.6;

interface WeatherComponentProps {
  latitude?: number;
  longitude?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interval?: number; // weather refresh override (ms)
}

const WeatherComponent: React.FC<WeatherComponentProps> = ({
  latitude = 37.5665,
  longitude = 126.9780,
  size = 'md',
  interval
}) => {
  const { today, tomorrow, isLoading, error } = useWeather({ latitude, longitude, interval });

  const scaleMap: Record<string, string> = {
    sm: 'text-[12px] [&_.today-temp]:text-4xl [&_.mini]:text-[11px] [&_.meta-sm]:text-[11px]',
    md: 'text-[13px] [&_.today-temp]:text-5xl [&_.mini]:text-[12px] [&_.meta-sm]:text-[12px]',
    lg: 'text-[15px] [&_.today-temp]:text-6xl [&_.mini]:text-[13px] [&_.meta-sm]:text-[13px]',
    xl: 'text-[17px] [&_.today-temp]:text-7xl [&_.mini]:text-[14px] [&_.meta-sm]:text-[14px]'
  };
  const scaleClasses = scaleMap[size] || scaleMap.md;

  if (isLoading && !today && !tomorrow) {
    return (
      <div className="flex items-center gap-3 text-white/70 text-sm">
        <div className="w-5 h-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
        <span>Loading weather...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-300">Weather error: {error}</div>;
  }

  if (!today) return null;

  const todayTemp = today.temperature > -100 ? Math.round(today.temperature) : Math.round(today.temperatureMax);
  const feelsLike = today.apparentTemperature != null ? Math.round(today.apparentTemperature) : undefined;
  const tomorrowTempLine = tomorrow ? `${Math.round(tomorrow.temperatureMin)}° / ${Math.round(tomorrow.temperatureMax)}°` : null;

  const formatTime = (iso?: string) => {
    if (!iso) return undefined;
    try { const d = new Date(iso); return d.toISOString().substring(11, 16); } catch { return undefined; }
  };

  return (
    <div className={`flex flex-col text-white select-none ${scaleClasses} leading-snug`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-4">
          <div>{iconFor(today.weatherCode)}</div>
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-wrap items-end gap-4">
              <span className="today-temp font-light tracking-tight tabular-nums">{todayTemp}°</span>
              <span className="meta-sm text-white/60">{Math.round(today.temperatureMin)}° / {Math.round(today.temperatureMax)}°</span>
              {feelsLike !== undefined && <span className="mini text-white/50">Feels {feelsLike}°</span>}
              {today.uvIndex != null && <span className="mini text-white/50">UV {Math.round(today.uvIndex)}{today.uvIndexMax!=null?`/${Math.round(today.uvIndexMax)}`:''}</span>}
            </div>
            {/* Grouped detail rows (excluding UV) -> 3 / 4 / 3 layout */}
            <div className="flex flex-col gap-1 mini text-white/70 leading-tight">
              <div className="flex flex-wrap gap-4">
                <span>{descFor(today.weatherCode)}</span>
                {today.precipitation > 0 && <span className="flex items-center gap-1 text-blue-300"><Droplets size={14} />{today.precipitation.toFixed(1)}mm</span>}
                {today.humidity > 0 && <span className="flex items-center gap-1 text-white/60"><Eye size={14} />{Math.round(today.humidity)}%</span>}
              </div>
              <div className="flex flex-wrap gap-4">
                {today.windSpeed > 0 && <span className="flex items-center gap-1 text-white/60"><Wind size={14} />{msToKmh(today.windSpeed).toFixed(0)} km/h</span>}
                {today.windSpeedMax != null && <span className="flex items-center gap-1 text-white/40"><Wind size={12} />max {msToKmh(today.windSpeedMax).toFixed(0)} km/h</span>}
              </div>
              <div className="flex flex-wrap gap-4">
                {today.pressure && <span>Pressure {Math.round(today.pressure)}hPa</span>}
                {today.visibility && <span>Vis {(today.visibility/1000).toFixed(0)}km</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {tomorrow && <div className="h-px my-3 bg-white/10" />}

      {tomorrow && (
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-4">
            <div>{iconFor(tomorrow.weatherCode, 46)}</div>
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-wrap items-baseline gap-4">
                <span className="uppercase tracking-wide text-white/55 mini">Tomorrow</span>
                <span className="font-semibold tabular-nums text-white/80">{tomorrowTempLine}</span>
                <span className="mini text-white/50">{descFor(tomorrow.weatherCode)}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-white/65 mini leading-tight">
                {tomorrow.precipitation > 0 && <span className="flex items-center gap-1 text-blue-300"><Droplets size={13} />{tomorrow.precipitation.toFixed(1)}mm</span>}
                {tomorrow.windSpeedMax != null && <span className="flex items-center gap-1"><Wind size={13} />max {msToKmh(tomorrow.windSpeedMax).toFixed(0)} km/h</span>}
                {tomorrow.uvIndexMax != null && <span>UV Max {Math.round(tomorrow.uvIndexMax)}</span>}
                {tomorrow.sunrise && <span>Sunrise {formatTime(tomorrow.sunrise)}</span>}
                {tomorrow.sunset && <span>Sunset {formatTime(tomorrow.sunset)}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherComponent;