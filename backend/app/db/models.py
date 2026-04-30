# TODO: Define database models (ORM models)

from datetime import datetime
from typing import Optional

class SolarDataDB:
    """Solar data stored in database"""
    
    def __init__(self, 
                 id: str,
                 lat: float,
                 lon: float,
                 irradiance: float,
                 temperature: float,
                 timestamp: datetime,
                 created_at: datetime):
        self.id = id
        self.lat = lat
        self.lon = lon
        self.irradiance = irradiance
        self.temperature = temperature
        self.timestamp = timestamp
        self.created_at = created_at

class WeatherDataDB:
    """Weather data stored in database"""
    
    def __init__(self,
                 id: str,
                 lat: float,
                 lon: float,
                 temperature: float,
                 humidity: float,
                 cloud_cover: float,
                 wind_speed: float,
                 timestamp: datetime,
                 created_at: datetime):
        self.id = id
        self.lat = lat
        self.lon = lon
        self.temperature = temperature
        self.humidity = humidity
        self.cloud_cover = cloud_cover
        self.wind_speed = wind_speed
        self.timestamp = timestamp
        self.created_at = created_at

class UserLocation:
    """User-saved locations"""
    
    def __init__(self,
                 id: str,
                 user_id: str,
                 name: str,
                 lat: float,
                 lon: float,
                 created_at: datetime):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.lat = lat
        self.lon = lon
        self.created_at = created_at
