from __future__ import annotations

import numpy as np
import pandas as pd


def _drop_pct(actual: float, expected: float) -> float:
    if expected <= 0:
        return 0.0
    return ((expected - actual) / expected) * 100


def diagnose(
    p_actual,
    p_expected,
    v_actual,
    v_mp,
    i_actual,
    i_mp,
) -> dict:
    p_expected_value = float(p_expected or 0)

    if p_expected_value == 0:
        return {
            'efficiency_index': None,
            'fault_code': 'NIGHTTIME',
            'fault_confidence': 1.0,
            'recommendation': 'No solar irradiance. System idle.',
            'reasons': [],
            'suggestions': ['System will wake up at sunrise.'],
            'voltage_drop_pct': None,
            'current_drop_pct': None,
        }

    p_actual_value = float(p_actual or 0)
    ei = min(100.0, max(0.0, (p_actual_value / p_expected_value) * 100))

    if ei >= 85:
        return {
            'efficiency_index': ei,
            'fault_code': 'NORMAL',
            'fault_confidence': ei / 100.0,
            'recommendation': 'System performing within normal range.',
            'reasons': [
                'Voltage and current levels match the digital twin baseline.',
                'Ambient temperature is not significantly affecting output.',
                'Inverter conversion efficiency is above 96%.'
            ],
            'suggestions': [
                'Wipe dust from sensors occasionally.',
                'Check inverter status lights daily.'
            ],
            'voltage_drop_pct': 0,
            'current_drop_pct': 0,
        }

    v_drop = _drop_pct(float(v_actual or 0), float(v_mp or 0))
    i_drop = _drop_pct(float(i_actual or 0), float(i_mp or 0))

    if p_actual_value < (float(v_actual or 0) * float(i_actual or 0)) * 0.9:
        fault_code = 'INVERTER_EFFICIENCY_LOSS'
        confidence = 0.85
        recommendation = 'Power output is lower than DC production (V*I). Inverter conversion efficiency is dropping.'
        reasons = [
            'Significant discrepancy between DC input and AC output.',
            'Potential overheating in inverter power electronics.',
            'Mismatch in Maximum Power Point Tracking (MPPT) logic.'
        ]
        suggestions = ['Check inverter cooling fans.', 'Inspect DC disconnects for heat.', 'Update inverter firmware.']
    elif v_drop > 25 and i_drop < 10:
        fault_code = 'PID_POTENTIAL_INDUCED'
        confidence = min(1.0, v_drop / 40.0)
        recommendation = 'Critical voltage drop with normal current. Likely Potential Induced Degradation (PID) or insulation fault.'
        reasons = [
            f'Abnormal voltage suppression ({v_drop:.1f}%) detected.',
            'Current flow remains stable, ruling out shading or soiling.',
            'Potential leakage current from cells to the module frame.'
        ]
        suggestions = ['Install a PID recovery box.', 'Check grounding electrode conductor.', 'Review array insulation resistance.']
    elif i_drop > 25 and v_drop < 10:
        fault_code = 'HEAVY_SOILING'
        confidence = min(1.0, i_drop / 40.0)
        recommendation = 'Severe current drop. Heavy dust, bird droppings, or local shading detected.'
        reasons = [
            f'Drastic reduction in Short Circuit Current ({i_drop:.1f}% drop).',
            'Voltage remains healthy, indicating active cell strings.',
            'Optical transparency of panel glass is compromised.'
        ]
        suggestions = ['Deep clean panels with soft brush.', 'Check for persistent local shadows.', 'Inspect for leaf buildup in lower frame.']
    elif v_drop > i_drop + 10:
        fault_code = 'SHADING_OR_COMPONENT'
        confidence = min(1.0, v_drop / 30.0)
        recommendation = 'Voltage drop dominant. Check for partial shading or failed bypass diodes.'
        reasons = [
            'Voltage drop is disproportionate to current reduction.',
            'Likely failure of one or more bypass diodes in the module.',
            'Partial shadow is causing uneven cell string resistance.'
        ]
        suggestions = ['Trim nearby tree branches.', 'Check MC4 connectors.', 'Inspect diodes using a thermal camera if available.']
    elif i_drop > v_drop + 10:
        fault_code = 'DUST_ACCUMULATION'
        confidence = min(1.0, i_drop / 30.0)
        recommendation = 'Current drop dominant. Panel surface has significant dust or soiling.'
        reasons = [
            'Gradual current attrition observed over time.',
            'Uniform dust layer is blocking irradiance uniformly.',
            'System sensitivity to GHI is higher than expected.'
        ]
        suggestions = ['Rinse panels with distilled water.', 'Schedule cleaning within 48 hours.']
    else:
        fault_code = 'GENERAL_DEGRADATION'
        confidence = min(1.0, (100.0 - ei) / 30.0)
        recommendation = 'Balanced performance loss across V and I. Likely age-related cell degradation.'
        reasons = [
            'Performance loss is evenly distributed across V and I.',
            'Likely natural aging of Ethylene Vinyl Acetate (EVA) or cell ribbons.',
            'Potential micro-cracks in solar cells blocking electron flow.'
        ]
        suggestions = ['Compare vs manufacturer baseline.', 'Check for solar cell micro-cracks.']

    return {
        'efficiency_index': ei,
        'fault_code': fault_code,
        'fault_confidence': confidence,
        'recommendation': recommendation,
        'reasons': reasons if 'reasons' in locals() else [],
        'suggestions': suggestions,
        'voltage_drop_pct': v_drop,
        'current_drop_pct': i_drop,
    }


def correlate_faults(readings: list[dict]) -> dict:
    if not readings:
        return {
            'ei_trend': 'stable',
            'ghi_vs_ei_correlation': 0.0,
            'temp_vs_ei_correlation': 0.0,
            'worst_hour': 12,
            'best_hour': 12,
            'avg_loss_w': 0.0
        }

    df = pd.DataFrame(readings)

    # Convert numeric columns
    numeric_cols = ['efficiency_index', 'ghi', 'ambient_temp_c', 'p_actual_w', 'power_w', 'p_expected_w', 'p_expected', 'irradiance_ratio', 'heat_derating_pct']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        elif col == 'p_actual_w' and 'power_w' in df.columns: # fallback
            df['p_actual_w'] = df['power_w']

    # 1. ei_trend
    mid = len(df) // 2
    first_half = df['efficiency_index'].iloc[:mid]
    second_half = df['efficiency_index'].iloc[mid:]

    mean1 = first_half.mean() if not first_half.empty else 0
    mean2 = second_half.mean() if not second_half.empty else 0

    delta = mean2 - mean1
    if delta > 3.0:
        ei_trend = "improving"
    elif delta < -3.0:
        ei_trend = "degrading"
    else:
        ei_trend = "stable"

    # 2. ghi_vs_ei_correlation
    ghi_ei_corr = 0.0
    if len(df) > 1 and df['ghi'].std() > 0 and df['efficiency_index'].std() > 0:
        corr_matrix = np.corrcoef(df['ghi'], df['efficiency_index'])
        ghi_ei_corr = round(float(corr_matrix[0, 1]), 2) if not np.isnan(corr_matrix[0, 1]) else 0.0
    elif len(df) == 1:
        # Fallback for single point: Show direct irradiance ratio as sensitivity
        ghi_ei_corr = round(float(df['irradiance_ratio'].iloc[0]), 2) if 'irradiance_ratio' in df.columns else 0.0

    # 3. temp_vs_ei_correlation
    temp_ei_corr = 0.0
    if len(df) > 1 and df['ambient_temp_c'].std() > 0 and df['efficiency_index'].std() > 0:
        corr_matrix = np.corrcoef(df['ambient_temp_c'], df['efficiency_index'])
        temp_ei_corr = round(float(corr_matrix[0, 1]), 2) if not np.isnan(corr_matrix[0, 1]) else 0.0
    elif len(df) == 1:
        # Fallback for single point: Show heat derating percentage as impact
        temp_ei_corr = round(float(df['heat_derating_pct'].iloc[0]), 2) if 'heat_derating_pct' in df.columns else 0.0

    # 4. worst_hour / best_hour
    if 'time' in df.columns:
        df['dt'] = pd.to_datetime(df['time'])
        df['hour'] = df['dt'].dt.hour
        hourly_means = df.groupby('hour')['efficiency_index'].mean()
        worst_hour = int(hourly_means.idxmin())
        best_hour = int(hourly_means.idxmax())
    else:
        worst_hour = 12
        best_hour = 12

    # 5. avg_loss_w
    p_actual_col = 'p_actual_w' if 'p_actual_w' in df.columns else 'power_w'
    p_expected_col = 'p_expected_w' if 'p_expected_w' in df.columns else 'p_expected'
    
    if p_expected_col in df.columns:
        loss_mask = df[p_expected_col] > 0
        if loss_mask.any():
            avg_loss_w = (df.loc[loss_mask, p_expected_col] - df.loc[loss_mask, p_actual_col]).mean()
        else:
            avg_loss_w = 0.0
    else:
        avg_loss_w = 0.0

    return {
        'ei_trend': ei_trend,
        'ghi_vs_ei_correlation': ghi_ei_corr,
        'temp_vs_ei_correlation': temp_ei_corr,
        'worst_hour': worst_hour,
        'best_hour': best_hour,
        'avg_loss_w': float(avg_loss_w)
    }
