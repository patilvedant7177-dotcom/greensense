// TODO: Implement utility functions for calculations and formatting

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString();
};

export const calculateSolarPotential = (irradiance: number, efficiency: number = 0.2): number => {
  return irradiance * efficiency; // Simple calculation, TODO: enhance with actual physics
};

export const getCurrentLocation = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error)
    );
  });
};

export const metersToMiles = (meters: number): number => {
  return meters * 0.000621371;
};

export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9) / 5 + 32;
};
