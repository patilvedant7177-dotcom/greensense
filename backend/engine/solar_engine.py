from __future__ import annotations

import math
from datetime import datetime
from typing import Any

import numpy as np
import pysolar.solar as solar
import pytz

TIMEZONE = 'Asia/Kolkata'
SOLAR_CONSTANT = 1367.0  # W/m^2

def _normalize_timestamp(timestamp: Any) -> datetime:
    if isinstance(timestamp, str):
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    elif isinstance(timestamp, datetime):
        dt = timestamp
    else:
        dt = datetime.now(pytz.timezone(TIMEZONE))
    
    if dt.tzinfo is None:
        return pytz.timezone(TIMEZONE).localize(dt)
    return dt.astimezone(pytz.timezone(TIMEZONE))

def calculate_expected(
    lat: float,
    lon: float,
    p_max_w: float,
    v_mp: float,
    i_mp: float,
    temp_coefficient: float,
    area_m2: float,
    tilt_deg: float,
    azimuth_deg: float,
    ghi: float,
    ambient_temp_c: float,
    timestamp: Any,
) -> dict:
    dt = _normalize_timestamp(timestamp)
    
    # Solar Position using pysolar
    # pysolar.solar.get_altitude and get_azimuth expect aware datetime
    altitude = solar.get_altitude(lat, lon, dt)
    azimuth = solar.get_azimuth(lat, lon, dt)
    zenith = 90.0 - altitude

    ghi_value = max(float(ghi or 0), 0.0)
    ambient_temp = float(ambient_temp_c)
    p_max = max(float(p_max_w or 0), 0.0)
    temp_coeff = float(temp_coefficient or 0)

    if zenith >= 90 or altitude <= 0:
        return {
            'poa': 0.0,
            't_cell': ambient_temp,
            'p_expected': 0.0,
            'is_nighttime': True,
            'irradiance_ratio': 0.0,
            'heat_derating_pct': 0.0,
            'optimal_load_w': 0.0,
        }

    # Erbs Model Implementation (estimate DNI and DHI from GHI)
    cos_zenith = math.cos(math.radians(zenith))
    # Extraterrestrial irradiance (simplified)
    # For better accuracy, could include day-of-year correction: 
    # doy = dt.timetuple().tm_yday
    # ghi_extra = SOLAR_CONSTANT * (1 + 0.033 * math.cos(math.radians(360 * doy / 365))) * cos_zenith
    ghi_extra = SOLAR_CONSTANT * cos_zenith
    
    if ghi_extra <= 0:
        kt = 0.0
    else:
        kt = ghi_value / ghi_extra
    
    kt = max(0.0, min(kt, 1.0))
    
    if kt <= 0.22:
        df = 1.0 - 0.09 * kt
    elif kt <= 0.8:
        df = 0.9511 - 0.16036 * kt + 4.388 * (kt**2) - 16.638 * (kt**3) + 12.336 * (kt**4)
    else:
        df = 0.165
        
    dhi = ghi_value * df
    dni = (ghi_value - dhi) / cos_zenith if cos_zenith > 0.01 else 0.0
    dni = max(0.0, dni)

    # Plane of Array (POA) Irradiance (Isotropic Sky Model)
    z_rad = math.radians(zenith)
    a_rad = math.radians(azimuth)
    t_rad = math.radians(tilt_deg)
    sa_rad = math.radians(azimuth_deg) # azimuth_deg is panel orientation
    
    cos_aoi = (math.cos(z_rad) * math.cos(t_rad) + 
               math.sin(z_rad) * math.sin(t_rad) * math.cos(a_rad - sa_rad))
    
    poa_direct = dni * max(0.0, cos_aoi)
    poa_sky_diffuse = dhi * (1.0 + math.cos(t_rad)) / 2.0
    poa_ground_diffuse = ghi_value * 0.2 * (1.0 - math.cos(t_rad)) / 2.0 # albedo = 0.2
    
    poa_global = poa_direct + poa_sky_diffuse + poa_ground_diffuse
    poa_global = max(0.0, poa_global)

    # Temperature and Power calculations
    t_cell = ambient_temp + (poa_global / 800.0) * 25.0
    p_expected = p_max * (poa_global / 1000.0) * (1.0 + temp_coeff * (t_cell - 25.0))
    p_expected = max(float(p_expected), 0.0)

    irradiance_ratio = poa_global / 1000.0
    heat_derating_pct = abs(temp_coeff * (t_cell - 25.0)) * 100.0
    optimal_load_w = p_expected * 0.90

    return {
        'poa': poa_global,
        't_cell': t_cell,
        'p_expected': p_expected,
        'irradiance_ratio': irradiance_ratio,
        'heat_derating_pct': heat_derating_pct,
        'optimal_load_w': optimal_load_w,
        'is_nighttime': False,
    }

def calculate_daily_profile(
    lat: float,
    lon: float,
    p_max_w: float,
    v_mp: float,
    i_mp: float,
    temp_coefficient: float,
    area_m2: float,
    tilt_deg: float,
    azimuth_deg: float,
    hourly_forecast: list[dict],
) -> dict:
    p_expected_list = []
    hourly_data = []

    # Use today's date for hour calculations
    tz = pytz.timezone(TIMEZONE)
    base_date = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0)

    for item in hourly_forecast:
        hour = item['hour']
        ghi = item['ghi']
        temp = item['temp']

        ts = base_date + math.timedelta(hours=hour) if hasattr(math, 'timedelta') else None
        # Wait, math.timedelta doesn't exist. It's datetime.timedelta.
        from datetime import timedelta
        ts = base_date + timedelta(hours=hour)

        result = calculate_expected(
            lat=lat,
            lon=lon,
            p_max_w=p_max_w,
            v_mp=v_mp,
            i_mp=i_mp,
            temp_coefficient=temp_coefficient,
            area_m2=area_m2,
            tilt_deg=tilt_deg,
            azimuth_deg=azimuth_deg,
            ghi=ghi,
            ambient_temp_c=temp,
            timestamp=ts,
        )

        p_exp = result['p_expected']
        p_expected_list.append(p_exp)
        hourly_data.append({'hour': hour, 'p_expected_w': p_exp})

    peak_w = max(p_expected_list) if p_expected_list else 0.0
    total_kwh = sum(p_expected_list) / 1000.0
    peak_hour = 0
    if p_expected_list:
        peak_hour = hourly_forecast[p_expected_list.index(peak_w)]['hour']

    return {
        'peak_w': peak_w,
        'total_kwh': total_kwh,
        'peak_hour': peak_hour,
        'hourly': hourly_data,
    }
