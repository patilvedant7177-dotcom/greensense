from __future__ import annotations

from typing import Any

import pandas as pd
import pvlib

TIMEZONE = 'Asia/Kolkata'


def _normalize_timestamp(timestamp: Any) -> pd.Timestamp:
    ts = pd.Timestamp(timestamp)
    if ts.tzinfo is None:
        return ts.tz_localize(TIMEZONE)
    return ts.tz_convert(TIMEZONE)


def calculate_expected(
    lat,
    lon,
    p_max_w,
    v_mp,
    i_mp,
    temp_coefficient,
    area_m2,
    tilt_deg,
    azimuth_deg,
    ghi,
    ambient_temp_c,
    timestamp,
) -> dict:
    location = pvlib.location.Location(lat, lon, tz=TIMEZONE)
    ts = _normalize_timestamp(timestamp)
    times = pd.DatetimeIndex([ts])

    solar_position = location.get_solarposition(times)
    solar_zenith = float(solar_position['zenith'].iloc[0])
    solar_azimuth = float(solar_position['azimuth'].iloc[0])

    ghi_value = max(float(ghi or 0), 0.0)
    ambient_temp = float(ambient_temp_c)
    p_max = max(float(p_max_w or 0), 0.0)
    temp_coeff = float(temp_coefficient or 0)
    _ = float(v_mp or 0)
    _ = float(i_mp or 0)
    _ = float(area_m2 or 0)

    if solar_zenith >= 90:
        return {
            'poa': 0.0,
            't_cell': ambient_temp,
            'p_expected': 0.0,
            'is_nighttime': True,
            'irradiance_ratio': 0.0,
            'heat_derating_pct': 0.0,
            'optimal_load_w': 0.0,
        }

    if ghi_value == 0:
        return {
            'poa': 0.0,
            't_cell': ambient_temp,
            'p_expected': 0.0,
            'is_nighttime': False,
            'irradiance_ratio': 0.0,
            'heat_derating_pct': 0.0,
            'optimal_load_w': 0.0,
        }

    erbs_result = pvlib.irradiance.erbs(
        ghi=pd.Series([ghi_value], index=times),
        zenith=pd.Series([solar_zenith], index=times),
        datetime_or_doy=times,
    )

    dni = float(erbs_result['dni'].iloc[0]) if not erbs_result.empty else 0.0
    dhi = float(erbs_result['dhi'].iloc[0]) if not erbs_result.empty else 0.0

    irradiance = pvlib.irradiance.get_total_irradiance(
        surface_tilt=tilt_deg,
        surface_azimuth=azimuth_deg,
        solar_zenith=solar_zenith,
        solar_azimuth=solar_azimuth,
        dni=max(dni, 0.0),
        ghi=ghi_value,
        dhi=max(dhi, 0.0),
    )
    poa_global = max(float(irradiance.get('poa_global', 0.0)), 0.0)

    t_cell = ambient_temp + (poa_global / 800.0) * 25.0
    p_expected = p_max * (poa_global / 1000.0) * (1 + temp_coeff * (t_cell - 25.0))
    p_expected = max(float(p_expected), 0.0)

    # New computations
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
    lat,
    lon,
    p_max_w,
    v_mp,
    i_mp,
    temp_coefficient,
    area_m2,
    tilt_deg,
    azimuth_deg,
    hourly_forecast: list[dict],
) -> dict:
    p_expected_list = []
    hourly_data = []

    # Use today's date for hour calculations
    base_date = pd.Timestamp.now(tz=TIMEZONE).normalize()

    for item in hourly_forecast:
        hour = item['hour']
        ghi = item['ghi']
        temp = item['temp']

        ts = base_date + pd.Timedelta(hours=hour)

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
