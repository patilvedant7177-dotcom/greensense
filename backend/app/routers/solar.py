from fastapi import APIRouter, Query
from backend.app.services.solar import SolarService
from backend.app.utils.helpers import validate_coordinates

router = APIRouter(prefix="/api/solar", tags=["solar"])

# TODO: Implement solar data routes and integrate with database

@router.get("/")
async def get_solar_data(lat: float = Query(...), lon: float = Query(...)):
    """Get current solar irradiance data for location"""
    valid, error = validate_coordinates(lat, lon)
    if not valid:
        return {"error": error}
    
    return SolarService.calculate_irradiance(lat, lon)

@router.get("/history")
async def get_solar_history(lat: float = Query(...), lon: float = Query(...), days: int = Query(7)):
    """Get historical solar data for location"""
    valid, error = validate_coordinates(lat, lon)
    if not valid:
        return {"error": error}
    
    # TODO: Fetch from database
    return {"data": []}

@router.get("/forecast")
async def get_solar_forecast(lat: float = Query(...), lon: float = Query(...)):
    """Get solar forecast for next 7 days"""
    valid, error = validate_coordinates(lat, lon)
    if not valid:
        return {"error": error}
    
    return SolarService.predict_irradiance(lat, lon)
