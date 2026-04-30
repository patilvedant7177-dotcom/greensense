from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from .client import supabase

PANELS_TABLE = 'solar_panels'
READINGS_TABLE = 'telemetry_readings'
READING_INTERVAL_MINUTES = 5

_in_memory_panels: dict[str, dict[str, Any]] = {}
_in_memory_readings: list[dict[str, Any]] = []


async def insert_panel(panel_dict: dict[str, Any]) -> dict[str, Any]:
    try:
        if supabase is None:
            raise ValueError("Supabase client not initialized")
        response = supabase.table(PANELS_TABLE).insert(panel_dict).execute()
        rows = response.data or []
        return rows[0] if rows else {}
    except Exception as e:
        print(f"Supabase insert_panel failed: {e}. Falling back to in-memory.")
        panel_id = panel_dict.get('id') or str(uuid4())
        stored = {
            **panel_dict,
            'id': panel_id,
            'created_at': panel_dict.get('created_at') or datetime.now(timezone.utc).isoformat(),
        }
        _in_memory_panels[panel_id] = stored
        return stored


async def get_panel(panel_id: str) -> dict[str, Any] | None:
    try:
        if supabase is None:
            raise ValueError("Supabase client not initialized")
        response = (
            supabase.table(PANELS_TABLE)
            .select('*')
            .eq('id', panel_id)
            .limit(1)
            .execute()
        )
        rows = response.data or []
        return rows[0] if rows else None
    except Exception as e:
        print(f"Supabase get_panel failed: {e}. Falling back to in-memory.")
        return _in_memory_panels.get(panel_id)


async def insert_reading(reading_dict: dict[str, Any]) -> dict[str, Any]:
    try:
        if supabase is None:
            raise ValueError("Supabase client not initialized")
        response = supabase.table(READINGS_TABLE).insert(reading_dict).execute()
        rows = response.data or []
        return rows[0] if rows else {}
    except Exception as e:
        print(f"Supabase insert_reading failed: {e}. Falling back to in-memory.")
        stored = {
            **reading_dict,
            'id': str(uuid4()),
            'created_at': reading_dict.get('created_at') or datetime.now(timezone.utc).isoformat(),
        }
        _in_memory_readings.append(stored)
        return stored


async def get_readings(panel_id: str, days: int = 7) -> list[dict[str, Any]]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    try:
        if supabase is None:
            raise ValueError("Supabase client not initialized")
        response = (
            supabase.table(READINGS_TABLE)
            .select('*')
            .eq('panel_id', panel_id)
            .gte('time', cutoff.isoformat())
            .order('time', desc=True)
            .execute()
        )
        return response.data or []
    except Exception as e:
        print(f"Supabase get_readings failed: {e}. Falling back to in-memory.")
        return [
            reading
            for reading in _in_memory_readings
            if reading.get('panel_id') == panel_id and reading.get('time', '') >= cutoff.isoformat()
        ]


async def get_cumulative_kwh(panel_id: str) -> float:
    readings = []
    try:
        if supabase is None:
            raise ValueError("Supabase client not initialized")
        response = (
            supabase.table(READINGS_TABLE)
            .select('power_w')
            .eq('panel_id', panel_id)
            .execute()
        )
        readings = response.data or []
    except Exception as e:
        print(f"Supabase get_cumulative_kwh failed: {e}. Falling back to in-memory.")
        readings = [
            reading for reading in _in_memory_readings if reading.get('panel_id') == panel_id
        ]

    total_power_w = sum(float(reading.get('power_w', 0) or 0) for reading in readings)
    return total_power_w * READING_INTERVAL_MINUTES / 60 / 1000


async def get_today_kwh(panel_id: str) -> float:
    # Get localized start of day (midnight)
    cutoff = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    readings = []
    try:
        if supabase is None:
            raise ValueError("Supabase client not initialized")
        response = (
            supabase.table(READINGS_TABLE)
            .select('power_w')
            .eq('panel_id', panel_id)
            .gte('time', cutoff.isoformat())
            .execute()
        )
        readings = response.data or []
    except Exception as e:
        print(f"Supabase get_today_kwh failed: {e}. Falling back to in-memory.")
        readings = [
            reading for reading in _in_memory_readings 
            if reading.get('panel_id') == panel_id and reading.get('time', '') >= cutoff.isoformat()
        ]

    total_power_w = sum(float(reading.get('power_w', 0) or 0) for reading in readings)
    return total_power_w * READING_INTERVAL_MINUTES / 60 / 1000
