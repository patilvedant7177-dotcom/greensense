// TODO: Implement API client functions
import type { SolarData, WeatherData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

export const solarApi = {
  async getSolarData(lat: number, lon: number): Promise<SolarData> {
    const response = await fetch(`${API_URL}/api/solar?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch solar data');
    }
    const payload = await response.json();
    return payload?.data ?? payload;
  },

  async getSolarHistory(lat: number, lon: number, days: number): Promise<SolarData[]> {
    const response = await fetch(
      `${API_URL}/api/solar/history?lat=${lat}&lon=${lon}&days=${days}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch solar history');
    }
    const payload = await response.json();
    return payload?.data ?? payload;
  },
};

export const weatherApi = {
  async getWeatherData(lat: number, lon: number): Promise<WeatherData> {
    const response = await fetch(`${API_URL}/api/weather?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch weather data');
    }
    const payload = await response.json();
    return payload?.data ?? payload;
  },

  async getWeatherForecast(lat: number, lon: number, days: number): Promise<WeatherData[]> {
    const response = await fetch(
      `${API_URL}/api/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch weather forecast');
    }
    const payload = await response.json();
    return payload?.data ?? payload;
  },
};
