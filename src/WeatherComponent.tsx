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

interface WeatherComponentProps { 
  latitude?: number; 
  longitude?: number; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const WeatherComponent: React.FC<WeatherComponentProps> = ({
  latitude = 37.5665,
  longitude = 126.9780,
  size = 'md'
}) => {
  const { today, tomorrow, isLoading, error } = useWeather({ latitude, longitude, updateInterval: 10 * 60 * 1000 });

  const scaleMap: Record<string, string> = {
    sm: 'text-[10px] [&_.today-temp]:text-3xl [&_.today-meta]:text-[11px] [&_.tomorrow-line]:text-[10px] gap-2',
    md: 'text-[12px] [&_.today-temp]:text-5xl [&_.today-meta]:text-sm [&_.tomorrow-line]:text-xs gap-3',
    lg: 'text-[14px] [&_.today-temp]:text-6xl [&_.today-meta]:text-base [&_.tomorrow-line]:text-sm gap-4',
    xl: 'text-[16px] [&_.today-temp]:text-7xl [&_.today-meta]:text-lg [&_.tomorrow-line]:text-base gap-5'
  };
  const scaleClasses = scaleMap[size] || scaleMap.md;

  // Loading state (compact)
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

  // TODAY (emphasized)
  const todayTemp = today.temperature > -100 ? Math.round(today.temperature) : Math.round(today.temperatureMax);
  const tomorrowLine = tomorrow ? `${Math.round(tomorrow.temperatureMin)}° / ${Math.round(tomorrow.temperatureMax)}° • ${descFor(tomorrow.weatherCode)}${tomorrow.precipitation > 0 ? ` • ${tomorrow.precipitation.toFixed(1)}mm` : ''}` : null;

  return (
    <div className={`flex flex-col text-white select-none ${scaleClasses}`}>
      {/* Today */}
      <div className="flex items-center gap-4">
        <div className="shrink-0">{iconFor(today.weatherCode)}</div>
        <div className="flex flex-col leading-tight">
          <div className="flex items-end gap-2">
            <span className="today-temp font-light tracking-tight tabular-nums">{todayTemp}°</span>
            <span className="today-meta text-white/60">{Math.round(today.temperatureMin)}° / {Math.round(today.temperatureMax)}°</span>
          </div>
          <div className="today-meta text-white/70 mt-1 flex flex-wrap items-center gap-3">
            <span>{descFor(today.weatherCode)}</span>
            {today.precipitation > 0 && (
              <span className="flex items-center gap-1 text-blue-300"><Droplets size={14} />{today.precipitation.toFixed(1)}mm</span>
            )}
            {today.humidity > 0 && (
              <span className="flex items-center gap-1 text-white/60"><Eye size={14} />{Math.round(today.humidity)}%</span>
            )}
            {today.windSpeed > 0 && (
              <span className="flex items-center gap-1 text-white/60"><Wind size={14} />{today.windSpeed.toFixed(0)}km/h</span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      {tomorrow && <div className="h-px bg-white/10" />}

      {/* Tomorrow (secondary) */}
      {tomorrow && (
        <div className="flex items-start gap-2 tomorrow-line text-white/60">
          <div className="pt-0.5">{iconFor(tomorrow.weatherCode, 28)}</div>
          <div className="flex flex-col gap-0.5">
            <span className="uppercase tracking-wide text-[10px] text-white/40">Tomorrow</span>
            <span className="font-medium text-white/70">{tomorrowLine}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherComponent;