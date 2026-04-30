from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from typing import Any, Callable

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

get_cumulative_kwh: Callable[..., Any] | None = None
get_today_kwh: Callable[..., Any] | None = None
get_panel: Callable[..., Any] | None = None
insert_panel: Callable[..., Any] | None = None
insert_reading: Callable[..., Any] | None = None
db_import_error: Exception | None = None

try:
    from backend.db.queries import get_cumulative_kwh, get_today_kwh, get_panel, get_readings, insert_panel, insert_reading
except Exception as exc:
    db_import_error = exc

from backend.engine.diagnostics import correlate_faults, diagnose
from backend.engine.suggestions import generate_suggestions
from backend.engine.solar_engine import calculate_daily_profile, calculate_expected
from backend.schemas import AnalysisResult, ForecastDay, ForecastPoint, OutputInput, PanelConfig
from backend.services.weather import get_current_weather, get_hourly_forecast
from backend.app.routers import solar, weather

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(solar.router)
app.include_router(weather.router)


def _get_db_error_detail() -> str:
    return str(db_import_error or 'Database dependencies are not available.')


def _require_db() -> None:
    if insert_panel is None or get_panel is None or insert_reading is None or get_cumulative_kwh is None:
        raise HTTPException(status_code=500, detail=_get_db_error_detail())


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/panels', response_model=PanelConfig)
async def create_panel(panel: PanelConfig) -> dict:
    try:
        _require_db()
        return await insert_panel(panel.model_dump(exclude_none=True))
    except Exception as e:
        import traceback
        print(f"ERROR creating panel: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/panels/{panel_id}', response_model=PanelConfig)
async def read_panel(panel_id: str) -> dict:
    _require_db()
    panel = await get_panel(panel_id)
    if not panel:
        raise HTTPException(status_code=404, detail='Panel not found.')
    return panel


@app.post('/panels/{panel_id}/analyze', response_model=AnalysisResult)
async def analyze_panel(panel_id: str, telemetry: OutputInput) -> AnalysisResult:
    try:
        _require_db()
        panel = await get_panel(panel_id)
        if not panel:
            raise HTTPException(status_code=404, detail='Panel not found.')

        generated_at = datetime.utcnow()
        weather = await get_current_weather(panel['latitude'], panel['longitude'])
        expected = calculate_expected(
            lat=panel['latitude'],
            lon=panel['longitude'],
            p_max_w=panel['p_max_w'],
            v_mp=panel['v_mp'],
            i_mp=panel['i_mp'],
            temp_coefficient=panel['temp_coefficient'],
            area_m2=panel['area_m2'],
            tilt_deg=panel['tilt_deg'],
            azimuth_deg=panel['azimuth_deg'],
            ghi=weather['ghi'],
            ambient_temp_c=weather['ambient_temp_c'],
            timestamp=generated_at,
        )
        # Pre-populate i_mp and v_mp for potential derivation
        telemetry.i_mp = panel['i_mp']
        telemetry.v_mp = panel['v_mp']
        telemetry.compute_p_actual()

        # Fetch last 30 readings for correlation context
        history = await get_readings(panel_id, days=30)
        recent_readings = history[:30]
        correlation_data = correlate_faults(recent_readings)

        diagnosis = diagnose(
            p_actual=telemetry.p_actual,
            p_expected=expected['p_expected'],
            v_actual=telemetry.voltage_v,
            v_mp=panel['v_mp'],
            i_actual=telemetry.current_a,
            i_mp=panel['i_mp'],
        )

        # Generate smart suggestions
        smart_suggestions = generate_suggestions(
            fault_code=diagnosis['fault_code'],
            ei=diagnosis['efficiency_index'],
            heat_derating_pct=expected['heat_derating_pct'],
            irradiance_ratio=expected['irradiance_ratio'],
            tilt_deg=panel['tilt_deg'],
            azimuth_deg=panel['azimuth_deg'],
            lat=panel['latitude'],
            correlation_data=correlation_data,
        )
        cumulative_kwh = await get_cumulative_kwh(panel_id)
        today_kwh = await get_today_kwh(panel_id)
        co2_saved_kg = cumulative_kwh * 0.82
        today_co2_saved_kg = today_kwh * 0.82
        trees_equivalent = round(co2_saved_kg / 21.77, 1)

        # Projected impact scaled by current efficiency
        todays_forecast = await forecast_panel(panel_id)
        if todays_forecast:
            # Scale today's total expected kwh by current efficiency index
            ei_factor = (diagnosis['efficiency_index'] or 100.0) / 100.0
            projected_today_kwh = todays_forecast[0].total_kwh * ei_factor
        else:
            projected_today_kwh = 0.0
        projected_today_co2_kg = projected_today_kwh * 0.82

        await insert_reading(
            {
                'panel_id': panel_id,
                'time': generated_at.replace(tzinfo=timezone.utc).isoformat(),
                'power_w': telemetry.p_actual,
                'voltage_v': telemetry.voltage_v,
                'current_a': telemetry.current_a,
                'ambient_temp_c': weather['ambient_temp_c'],
                'ghi': weather['ghi'],
                'uvi': weather['uvi'],
                'poa': expected['poa'],
                't_cell': expected['t_cell'],
                'p_expected': expected['p_expected'],
                'efficiency_index': diagnosis['efficiency_index'],
                'fault_code': diagnosis['fault_code'],
                'fault_confidence': diagnosis['fault_confidence'],
                'recommendation': diagnosis['recommendation'],
                'suggestions': smart_suggestions,
                'voltage_drop_pct': diagnosis['voltage_drop_pct'],
                'current_drop_pct': diagnosis['current_drop_pct'],
                'irradiance_ratio': expected['irradiance_ratio'],
                'heat_derating_pct': expected['heat_derating_pct'],
                'optimal_load_w': expected['optimal_load_w'],
            }
        )
    except Exception as e:
        import traceback
        print(f"ERROR in analysis: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    return AnalysisResult(
        panel_id=panel_id,
        generated_at=generated_at,
        ambient_temp_c=weather['ambient_temp_c'],
        ghi=weather['ghi'],
        poa=expected['poa'],
        t_cell=expected['t_cell'],
        p_actual_w=telemetry.p_actual or 0.0,
        p_expected_w=expected['p_expected'],
        efficiency_index=diagnosis['efficiency_index'],
        fault_code=diagnosis['fault_code'],
        fault_confidence=diagnosis['fault_confidence'],
        recommendation=diagnosis['recommendation'],
        suggestions=smart_suggestions,
        co2_saved_kg=co2_saved_kg,
        co2_equivalent=f"equivalent to planting {trees_equivalent} trees for one year",
        optimal_load_w=expected['optimal_load_w'],
        voltage_drop_pct=diagnosis['voltage_drop_pct'],
        current_drop_pct=diagnosis['current_drop_pct'],
        irradiance_ratio=expected['irradiance_ratio'],
        heat_derating_pct=expected['heat_derating_pct'],
        cumulative_kwh=cumulative_kwh,
        today_kwh=today_kwh,
        today_co2_saved_kg=today_co2_saved_kg,
        projected_today_kwh=projected_today_kwh,
        projected_today_co2_kg=projected_today_co2_kg,
        fault_reasons=diagnosis['reasons'],
    )


@app.get('/panels/{panel_id}/correlation')
async def read_correlation(panel_id: str) -> dict:
    _require_db()
    # Real-time insight: Fetch readings for the CURRENT day (last 24h)
    history = await get_readings(panel_id, days=1)
    if len(history) < 3:
        # Fallback to 7 days if today has sparse data
        history = await get_readings(panel_id, days=7)
    return correlate_faults(history[:90])


@app.get('/panels/{panel_id}/forecast', response_model=list[ForecastDay])
async def forecast_panel(panel_id: str) -> list[ForecastDay]:
    _require_db()
    panel = await get_panel(panel_id)
    if not panel:
        raise HTTPException(status_code=404, detail='Panel not found.')

    weather_points = await get_hourly_forecast(panel['latitude'], panel['longitude'])
    
    # Apply latest efficiency scaling to the forecast
    latest_readings = await get_readings(panel_id, days=1)
    ei_factor = 1.0
    if latest_readings:
        latest = latest_readings[0]
        ei = float(latest.get('efficiency_index', 100.0) or 100.0)
        ei_factor = ei / 100.0

    # Group weather points by day (assuming 1h intervals)
    days_data: dict[str, list[dict]] = {}
    start_time = datetime.now(timezone.utc)
    
    for index, point in enumerate(weather_points):
        point_time = start_time + timedelta(hours=index)
        date_str = point_time.strftime('%Y-%m-%d')
        if date_str not in days_data:
            days_data[date_str] = []
        days_data[date_str].append(point)

    forecast_days: list[ForecastDay] = []
    p_max = panel['p_max_w']

    for date_str, hourly_weather in days_data.items():
        profile = calculate_daily_profile(
            lat=panel['latitude'],
            lon=panel['longitude'],
            p_max_w=p_max,
            v_mp=panel['v_mp'],
            i_mp=panel['i_mp'],
            temp_coefficient=panel['temp_coefficient'],
            area_m2=panel['area_m2'],
            tilt_deg=panel['tilt_deg'],
            azimuth_deg=panel['azimuth_deg'],
            hourly_forecast=hourly_weather
        )
        
        total_kwh = profile['total_kwh']
        if total_kwh > p_max * 6 / 1000:
            suggestion = "High yield day. Good day to run washing machine, water heater, or EV charging."
        elif total_kwh < p_max * 2 / 1000:
            suggestion = "Low yield expected. Minimise non-essential loads."
        else:
            suggestion = "Moderate yield. Spread loads across peak window."
            
        forecast_days.append(
            ForecastDay(
                date=date_str,
                peak_w=profile['peak_w'] * ei_factor,
                total_kwh=total_kwh * ei_factor,
                peak_hour=profile['peak_hour'],
                suggestion=suggestion,
                hourly=profile['hourly']
            )
        )

    return forecast_days


if __name__ == '__main__':
    import uvicorn

    uvicorn.run(app, host='0.0.0.0', port=8000)
