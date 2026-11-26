"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  MapPin,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface DailyForecastItem {
  dateStr: string;
  dayLabel: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipProb: number;
}

interface WeatherDataState {
  locationName: string;
  isGeoDetected: boolean;
  days: DailyForecastItem[];
}

const DEFAULT_COORDS = {
  lat: -6.2088,
  lon: 106.8456,
  name: "Jakarta",
};

const DAY_NAMES_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatDayShortId(isoDate: string, index: number): string {
  if (index === 0) return "Hari Ini";
  if (index === 1) return "Besok";
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3) return isoDate;
  const dt = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  if (Number.isNaN(dt.getTime())) return isoDate;
  return `${DAY_NAMES_ID[dt.getDay()]}, ${dt.getDate()}`;
}

function renderWeatherIcon(code: number) {
  if (code === 0) {
    return <Sun className="w-4 h-4 text-amber-500 shrink-0" />;
  }
  if (code === 1 || code === 2) {
    return <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />;
  }
  if (code === 3) {
    return <Cloud className="w-4 h-4 text-neutral-500 shrink-0" />;
  }
  if (code === 45 || code === 48) {
    return <CloudFog className="w-4 h-4 text-neutral-500 shrink-0" />;
  }
  if (code >= 95) {
    return <CloudLightning className="w-4 h-4 text-amber-600 shrink-0" />;
  }
  return <CloudRain className="w-4 h-4 text-sky-600 shrink-0" />;
}

function getWeatherLabelId(code: number): string {
  if (code === 0) return "Cerah";
  if (code === 1 || code === 2) return "Cerah Berawan";
  if (code === 3) return "Berawan";
  if (code === 45 || code === 48) return "Berkabut";
  if (code >= 95) return "Badai Petir";
  return "Hujan";
}

async function resolveLocationName(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`
    );
    if (!res.ok) return DEFAULT_COORDS.name;
    const data = await res.json();
    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      DEFAULT_COORDS.name;
    return String(city).trim() || DEFAULT_COORDS.name;
  } catch {
    return DEFAULT_COORDS.name;
  }
}

async function fetchSevenDayForecast(
  lat: number,
  lon: number
): Promise<DailyForecastItem[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Gagal memuat prakiraan cuaca");
  }
  const data = await res.json();
  const daily = data?.daily;
  const times: string[] = Array.isArray(daily?.time) ? daily.time : [];
  const codes: number[] = Array.isArray(daily?.weather_code)
    ? daily.weather_code
    : [];
  const maxTemps: number[] = Array.isArray(daily?.temperature_2m_max)
    ? daily.temperature_2m_max
    : [];
  const minTemps: number[] = Array.isArray(daily?.temperature_2m_min)
    ? daily.temperature_2m_min
    : [];
  const precips: number[] = Array.isArray(daily?.precipitation_probability_max)
    ? daily.precipitation_probability_max
    : [];

  return times.map((dateStr, idx) => ({
    dateStr,
    dayLabel: formatDayShortId(dateStr, idx),
    weatherCode: Number(codes[idx] ?? 1),
    tempMax: Math.round(Number(maxTemps[idx] ?? 30)),
    tempMin: Math.round(Number(minTemps[idx] ?? 22)),
    precipProb: Math.round(Number(precips[idx] ?? 0)),
  }));
}

export default function WeatherOverview() {
  const [weather, setWeather] = useState<WeatherDataState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWeatherByCoords = useCallback(
    async (
      lat: number,
      lon: number,
      fallbackName: string,
      detected: boolean
    ) => {
      setLoading(true);
      try {
        const [locName, days] = await Promise.all([
          detected
            ? resolveLocationName(lat, lon)
            : Promise.resolve(fallbackName),
          fetchSevenDayForecast(lat, lon),
        ]);
        setWeather({
          locationName: locName,
          isGeoDetected: detected,
          days,
        });
      } catch {
        setWeather({
          locationName: fallbackName,
          isGeoDetected: detected,
          days: [],
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const detectUserLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      loadWeatherByCoords(
        DEFAULT_COORDS.lat,
        DEFAULT_COORDS.lon,
        DEFAULT_COORDS.name,
        false
      );
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loadWeatherByCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          DEFAULT_COORDS.name,
          true
        );
      },
      () => {
        loadWeatherByCoords(
          DEFAULT_COORDS.lat,
          DEFAULT_COORDS.lon,
          DEFAULT_COORDS.name,
          false
        );
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 }
    );
  }, [loadWeatherByCoords]);

  useEffect(() => {
    detectUserLocation();
  }, [detectUserLocation]);

  const accuWeatherUrl = useMemo(() => {
    const query = encodeURIComponent(
      weather?.locationName || DEFAULT_COORDS.name
    );
    return `https://www.accuweather.com/en/search-locations?query=${query}`;
  }, [weather?.locationName]);

  return (
    <section className="w-full bg-white py-3.5 sm:py-4 px-3.5 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[26px] bg-white/95 backdrop-blur-2xl backdrop-saturate-150 border border-black/[0.08] ring-1 ring-black/[0.04] shadow-[0_12px_30px_-12px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,1)] px-3.5 py-2.5 sm:px-6 transition-all duration-200 hover:bg-white hover:border-black/[0.14] hover:shadow-[0_16px_36px_-12px_rgba(15,23,42,0.16),inset_0_1px_0_0_rgba(255,255,255,1)]">
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-3">
            {/* Lokasi & Tombol Refresh */}
            <div className="flex items-center justify-between lg:justify-start gap-2.5 shrink-0">
              <a
                href={accuWeatherUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Lihat detail cuaca di AccuWeather"
                className="group inline-flex items-center gap-2.5 text-left min-w-0"
              >
                <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.08] text-[#6F4E37] flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 leading-none">
                      Cuaca 7 Hari
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-neutral-950 leading-snug truncate block">
                      {loading
                        ? "Mendeteksi lokasi..."
                        : weather?.locationName || DEFAULT_COORDS.name}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#6F4E37] transition shrink-0" />
                </div>
              </a>

              <button
                type="button"
                onClick={detectUserLocation}
                title="Perbarui lokasi"
                className="w-7 h-7 rounded-full bg-white/90 hover:bg-neutral-100 backdrop-blur-md border border-black/[0.08] text-neutral-700 flex items-center justify-center transition cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,1)] shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Strip 7 Hari Memanjang Gaya Glass Putih iOS 26 */}
            <a
              href={accuWeatherUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka prakiraan lengkap di AccuWeather"
              className="flex-1 min-w-0"
            >
              {loading && (!weather || weather.days.length === 0) ? (
                <div className="flex sm:grid sm:grid-cols-7 gap-1.5 sm:gap-0 sm:divide-x divide-neutral-900/[0.07] overflow-x-auto">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="min-w-[74px] sm:min-w-0 px-2 py-1 shrink-0 sm:shrink"
                    >
                      <div className="h-10 rounded-2xl bg-neutral-100 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : weather && weather.days.length > 0 ? (
                <div className="flex sm:grid sm:grid-cols-7 divide-x divide-neutral-900/[0.08] overflow-x-auto no-scrollbar">
                  {weather.days.slice(0, 7).map((d) => (
                    <div
                      key={d.dateStr}
                      className="min-w-[76px] sm:min-w-0 shrink-0 sm:shrink px-2.5 py-1.5 flex flex-col items-center justify-center gap-1 text-center rounded-2xl hover:bg-white/80 backdrop-blur-xs transition"
                    >
                      <span className="text-[11px] font-bold text-neutral-700 whitespace-nowrap">
                        {d.dayLabel}
                      </span>
                      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                        <span title={getWeatherLabelId(d.weatherCode)}>
                          {renderWeatherIcon(d.weatherCode)}
                        </span>
                        <span className="text-xs font-black text-neutral-950">
                          {d.tempMax}°
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-500">
                          {d.tempMin}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3.5 py-2 text-xs font-bold text-neutral-800 flex items-center justify-between rounded-2xl bg-white/80 hover:bg-white transition">
                  <span>Klik untuk cek prakiraan 7 hari di AccuWeather</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#6F4E37]" />
                </div>
              )}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}