from fastapi import APIRouter, HTTPException, Query
from backend.app.services.weather import WeatherService
from backend.app.utils.helpers import validate_coordinates

router = APIRouter(prefix="/api/weather", tags=["weather"])

# TODO: Implement weather data routes and integrate with database

@router.get("/")
async def get_weather_data(lat: float = Query(...), lon: float = Query(...)):
    """Get current weather data for location"""
    valid, error = validate_coordinates(lat, lon)
    if not valid:
        raise HTTPException(status_code=400, detail=error)
    
    try:
        data = await WeatherService.get_current_weather(lat, lon)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return data

@router.get("/forecast")
async def get_weather_forecast(lat: float = Query(...), lon: float = Query(...), days: int = Query(7)):
    """Get weather forecast for next N days"""
    valid, error = validate_coordinates(lat, lon)
    if not valid:
        return {"error": error}
    
    forecast = await WeatherService.get_weather_forecast(lat, lon, days)
    return {"data": forecast}

@router.get("/cloud-impact")
async def analyze_cloud_impact(cloud_cover: float = Query(..., ge=0, le=100)):
    """Analyze impact of cloud cover on solar generation"""
    analysis = WeatherService.analyze_cloud_impact(cloud_cover)
    return {"data": analysis}
