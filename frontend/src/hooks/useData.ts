// TODO: Implement React Query hooks for data fetching
import { useQuery } from '@tanstack/react-query';
import { solarApi, weatherApi } from '../api/client';

export const useSolarData = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['solar', lat, lon],
    queryFn: () => solarApi.getSolarData(lat, lon),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSolarHistory = (lat: number, lon: number, days: number = 7) => {
  return useQuery({
    queryKey: ['solar-history', lat, lon, days],
    queryFn: () => solarApi.getSolarHistory(lat, lon, days),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useWeatherData = (lat: number, lon: number) => {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => weatherApi.getWeatherData(lat, lon),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useWeatherForecast = (lat: number, lon: number, days: number = 7) => {
  return useQuery({
    queryKey: ['weather-forecast', lat, lon, days],
    queryFn: () => weatherApi.getWeatherForecast(lat, lon, days),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
