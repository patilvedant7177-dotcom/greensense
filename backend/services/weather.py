from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx
from dotenv import load_dotenv

from backend.db.client import supabase

_ENV_PATH = Path(__file__).resolve().parents[1] / '.env'
_ENV_LOCAL_PATH = Path(__file__).resolve().parents[1] / '.env.local'
load_dotenv(_ENV_PATH)
load_dotenv(_ENV_LOCAL_PATH, override=True)

OPENWEATHERMAP_API_KEY = os.getenv('OPENWEATHERMAP_API_KEY')
ONE_CALL_URL = 'https://api.openweathermap.org/data/3.0/onecall'
CURRENT_WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
FIVE_DAY_URL = 'https://api.openweathermap.org/data/2.5/forecast'
INDIA_TZ = ZoneInfo('Asia/Kolkata')


def _uvi_to_ghi(uvi: float) -> float:
    return min(max(float(uvi or 0) * 100, 0.0), 1000.0)


async def _fallback_latest_telemetry(lat: float, lon: float) -> dict:
    panel_response = (
        supabase.table('solar_panels')
        .select('id')
        .eq('latitude', lat)
        .eq('longitude', lon)
        .limit(1)
        .execute()
    )
    panels = panel_response.data or []
    if not panels:
        raise RuntimeError('No fallback telemetry available for the requested coordinates.')

    panel_id = panels[0]['id']
    telemetry_response = (
        supabase.table('telemetry_readings')
        .select('ambient_temp_c, ghi, time')
        .eq('panel_id', panel_id)
        .order('time', desc=True)
        .limit(1)
        .execute()
    )
    rows = telemetry_response.data or []
    if not rows:
        raise RuntimeError('No fallback telemetry readings available for the requested panel.')

    return rows[0]


async def _fetch_one_call_payload(lat: float, lon: float) -> dict:
    if not OPENWEATHERMAP_API_KEY:
        raise RuntimeError('OPENWEATHERMAP_API_KEY is not configured.')

    params = {
        'lat': lat,
        'lon': lon,
        'exclude': 'minutely,alerts',
        'appid': OPENWEATHERMAP_API_KEY,
        'units': 'metric',
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(ONE_CALL_URL, params=params)
        if response.status_code == 429:
            raise httpx.HTTPStatusError(
                'OpenWeatherMap rate limited the request.',
                request=response.request,
                response=response,
            )
        response.raise_for_status()
        return response.json()


async def _fetch_basic_weather(lat: float, lon: float) -> dict:
    params = {'lat': lat, 'lon': lon, 'appid': OPENWEATHERMAP_API_KEY, 'units': 'metric'}
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(CURRENT_WEATHER_URL, params=params)
        response.raise_for_status()
        return response.json()

async def _fetch_basic_forecast(lat: float, lon: float) -> dict:
    params = {'lat': lat, 'lon': lon, 'appid': OPENWEATHERMAP_API_KEY, 'units': 'metric'}
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(FIVE_DAY_URL, params=params)
        response.raise_for_status()
        return response.json()

async def get_current_weather(lat, lon) -> dict:
    try:
        # Try One Call 3.0 first
        payload = await _fetch_one_call_payload(lat, lon)
        current = payload.get('current', {})
        ambient_temp_c = float(current.get('temp', 0))
        uvi = float(current.get('uvi', 0))
        return {
            'ambient_temp_c': ambient_temp_c,
            'ghi': _uvi_to_ghi(uvi),
            'uvi': uvi,
        }
    except Exception as e:
        print(f"One Call 3.0 failed ({e}), trying basic 2.5 API...")
        try:
            # Fallback to basic current weather
            basic = await _fetch_basic_weather(lat, lon)
            main = basic.get('main', {})
            # Basic 2.5 doesn't provide UVI directly, estimate GHI from cloudiness
            clouds = basic.get('clouds', {}).get('all', 50)
            # Simple heuristic: 1000W at 0 clouds, 100W at 100 clouds (crude but works for fallback)
            ghi = max(100.0, 1000.0 - (clouds * 8)) 
            return {
                'ambient_temp_c': float(main.get('temp', 25.0)),
                'ghi': ghi,
                'uvi': ghi / 100.0,
            }
        except Exception:
            print("All live APIs failed, using DB fallback.")
            try:
                fallback = await _fallback_latest_telemetry(lat, lon)
                ghi = float(fallback.get('ghi', 800.0))
                return {
                    'ambient_temp_c': float(fallback.get('ambient_temp_c', 25.0)),
                    'ghi': ghi,
                    'uvi': ghi / 100.0,
                }
            except Exception:
                return {'ambient_temp_c': 28.0, 'ghi': 800.0, 'uvi': 8.0}


async def get_hourly_forecast(lat, lon) -> list[dict]:
    import math
    from datetime import timedelta
    try:
        # Try One Call 3.0 first
        payload = await _fetch_one_call_payload(lat, lon)
        hourly = payload.get('hourly', [])
        daily = payload.get('daily', [])
        
        forecast = []
        now_h = datetime.now(INDIA_TZ).hour
        
        for i in range(168):
            slot_hour = (now_h + i) % 24
            if i < len(hourly):
                entry = hourly[i]
                forecast.append({
                    'hour': datetime.fromtimestamp(int(entry.get('dt')), INDIA_TZ).hour,
                    'temp': float(entry.get('temp', 25.0)),
                    'uvi': float(entry.get('uvi', 0)),
                    'ghi': _uvi_to_ghi(float(entry.get('uvi', 0))),
                })
            else:
                day_index = min(i // 24, len(daily) - 1) if len(daily) > 0 else 0
                day_entry = daily[day_index] if len(daily) > 0 else {}
                
                temp_obj = day_entry.get('temp', {})
                if isinstance(temp_obj, dict):
                    temp = float(temp_obj.get('day', 25.0)) if 6 <= slot_hour <= 18 else float(temp_obj.get('night', 20.0))
                else:
                    temp = float(temp_obj) if temp_obj else 25.0
                    
                max_uvi = float(day_entry.get('uvi', 8.0))
                ghi = 0.0
                if 7 <= slot_hour <= 17:
                    factor = math.sin(math.pi * (slot_hour - 7) / 10.0)
                    ghi = _uvi_to_ghi(max_uvi) * factor
                
                forecast.append({
                    'hour': slot_hour,
                    'temp': temp,
                    'uvi': (ghi / 100.0) if ghi > 0 else 0.0,
                    'ghi': ghi,
                })
        return forecast
    except Exception as e:
        print(f"One Call 3.0 forecast failed ({e}), trying 5-day / 3-hour fallback...")
        try:
            # Fallback to 5-day / 3-hour forecast
            basic = await _fetch_basic_forecast(lat, lon)
            list_data = basic.get('list', [])
            
            forecast = []
            now_h = datetime.now(INDIA_TZ).hour
            
            # Map 3-hour chunks to 1-hour slots (simple repeat)
            for i in range(168):
                slot_hour = (now_h + i) % 24
                chunk_index = min(i // 3, len(list_data) - 1)
                chunk = list_data[chunk_index] if list_data else {}
                temp = chunk.get('main', {}).get('temp', 25.0)
                clouds = chunk.get('clouds', {}).get('all', 50)
                
                if 7 <= slot_hour <= 17:
                    factor = math.sin(math.pi * (slot_hour - 7) / 10.0)
                    base_ghi = max(100.0, 1000.0 - (clouds * 8))
                    ghi = base_ghi * factor
                else:
                    ghi = 0.0
                
                forecast.append({
                    'hour': slot_hour,
                    'temp': float(temp),
                    'uvi': ghi / 100.0,
                    'ghi': ghi,
                })
            return forecast
        except Exception:
            print("Full forecast fallback failed, using solar cycle.")
            forecast = []
            now = datetime.now(INDIA_TZ)
            for i in range(168):
                slot_time = now + timedelta(hours=i)
                h = slot_time.hour
                # Realistic solar curve: peak at 13:00 (1 PM), range 7-17
                ghi = 0.0
                if 7 <= h <= 17:
                    ghi = 900.0 * math.sin(math.pi * (h - 7) / 10.0)
                
                forecast.append({
                    'hour': h,
                    'temp': 25.0 + (2.0 if 10 <= h <= 16 else 0),
                    'uvi': ghi / 100.0,
                    'ghi': ghi,
                })
            return forecast
