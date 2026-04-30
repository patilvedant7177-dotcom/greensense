from __future__ import annotations

from datetime import datetime
from math import sqrt

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PanelConfig(BaseModel):
    model_config = ConfigDict(extra='ignore')

    id: str | None = None
    name: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    p_max_w: float = Field(gt=0)
    v_mp: float = Field(gt=0)
    i_mp: float = Field(gt=0)
    temp_coefficient: float
    area_m2: float = Field(gt=0)
    tilt_deg: float = Field(ge=0, le=90)
    azimuth_deg: float = Field(ge=0, le=360)
    capacity_kw: float | None = Field(default=None, gt=0)
    efficiency: float | None = Field(default=None, gt=0, le=1)
    installed_at: datetime | None = None


class OutputInput(BaseModel):
    model_config = ConfigDict(extra='ignore')

    power_ac_w: float | None = None
    voltage_v: float | None = None
    current_a: float | None = None
    i_mp: float | None = None
    v_mp: float | None = None
    p_actual: float | None = None

    @model_validator(mode='after')
    def compute_p_actual(self) -> 'OutputInput':
        if self.power_ac_w is not None:
            if self.v_mp:
                self.voltage_v = self.v_mp
                self.current_a = self.power_ac_w / self.v_mp
            elif self.i_mp:
                self.voltage_v = self.power_ac_w / self.i_mp
                self.current_a = self.i_mp
            self.p_actual = self.power_ac_w
        elif self.voltage_v is not None and self.current_a is not None:
            self.p_actual = self.voltage_v * self.current_a
        else:
            raise ValueError("Provide either power_ac_w OR both voltage_v and current_a.")
        return self


class ForecastPoint(BaseModel):
    model_config = ConfigDict(extra='ignore')

    hour: int = Field(ge=0, le=23)
    ghi: float = Field(ge=0)
    t_cell: float
    p_expected_w: float = Field(ge=0)
    energy_wh: float = Field(ge=0)


class ForecastDay(BaseModel):
    model_config = ConfigDict(extra='ignore')

    date: str
    peak_w: float
    total_kwh: float
    peak_hour: int = Field(ge=0, le=23)
    suggestion: str
    hourly: list[dict] = []


class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra='ignore')

    panel_id: str
    generated_at: datetime
    ambient_temp_c: float
    ghi: float = Field(ge=0)
    poa: float = Field(ge=0)
    t_cell: float
    p_actual_w: float
    p_expected_w: float
    efficiency_index: float | None = Field(default=None, ge=0, le=100)
    fault_code: str
    fault_confidence: float = Field(ge=0, le=1)
    recommendation: str
    suggestions: list[str]
    co2_saved_kg: float
    co2_equivalent: str
    optimal_load_w: float
    voltage_drop_pct: float | None = None
    current_drop_pct: float | None = None
    irradiance_ratio: float | None = None
    heat_derating_pct: float | None = None
    cumulative_kwh: float = Field(ge=0)
    today_kwh: float = Field(default=0.0, ge=0)
    today_co2_saved_kg: float = Field(default=0.0)
    projected_today_kwh: float = Field(default=0.0)
    projected_today_co2_kg: float = Field(default=0.0)
    fault_reasons: list[str] = []
