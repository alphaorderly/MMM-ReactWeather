import React from "react";

import { ensureConfig } from "./config";
import WeatherComponent from "./WeatherComponent";


export default function App(): JSX.Element {
  const config = ensureConfig();

  return (
    <div className={`mmm-reactweather-app ${config?.size || 'md'}`}>
      <WeatherComponent
        latitude={config?.lat}
        longitude={config?.lon}
        size={config?.size as 'sm' | 'md' | 'lg' | 'xl' | undefined}
        interval={config?.interval as number | undefined}
      />
    </div>
  );
}
