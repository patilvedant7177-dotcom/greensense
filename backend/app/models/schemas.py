# TODO: Define Pydantic models for request/response validation

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Location(BaseModel):
    lat: float
    lon: float

class SolarDataModel(BaseModel):
    id: Optional[str] = None
    location: Location
    irradiance: float  # W/m²
    temperature: float  # °C
    timestamp: datetime

class WeatherDataModel(BaseModel):
    id: Optional[str] = None
    location: Location
    temperature: float  # °C
    humidity: float  # %
    cloud_cover: float  # %
    wind_speed: float  # m/s
    timestamp: datetime

class SolarPredictionModel(BaseModel):
    location: Location
    predicted_irradiance: list[float]  # W/m² for next 24 hours
    confidence: float  # 0-1

class ApiResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
