from __future__ import annotations


def generate_suggestions(
    fault_code: str,
    ei: float | None,
    heat_derating_pct: float,
    irradiance_ratio: float,
    tilt_deg: float,
    azimuth_deg: float,
    lat: float,
    correlation_data: dict,
) -> list[str]:
    """
    Generates plain-English improvement tips based on system performance and correlations.
    """
    suggestions = []
    ei_value = float(ei or 0)

    # 1. Soiling checks
    if ei_value < 85 and fault_code == "SOILING_DUST":
        suggestions.append(
            "Clean the panel surface. A 3mm dust layer can reduce "
            "output by 15–25%. Morning cleaning is most effective."
        )

    # 2. Temperature/Heat checks
    if heat_derating_pct > 10:
        suggestions.append(
            f"Heat is reducing output by {heat_derating_pct:.1f}%. "
            "Consider adding rear ventilation or a 10cm mounting gap "
            "to lower cell temperature."
        )

    # 3. Sun angle and Load timing
    if irradiance_ratio < 0.4 and ei_value > 80:
        suggestions.append(
            "Low sun angle right now. Wait for peak irradiance "
            "(typically 10am–2pm) before drawing heavy loads."
        )

    # 4. Azimuth orientation check
    if abs(azimuth_deg - 180) > 20 and lat > 0:
        suggestions.append(
            "Panel faces away from true south by more than 20°. "
            "Reorienting toward 180° azimuth could recover "
            "5–15% annual yield."
        )

    # 5. Tilt angle check
    optimal_tilt = lat * 0.76 - 3
    if tilt_deg < optimal_tilt:
        suggestions.append(
            f"Panel tilt of {tilt_deg:.1f}° is below the optimal "
            f"{optimal_tilt:.0f}° for your latitude. Adjusting tilt "
            "can improve winter yield."
        )

    # 6. Temperature Sensitivity (Correlation)
    if correlation_data.get("temp_vs_ei_correlation", 0) < -0.5:
        suggestions.append(
            "Strong negative correlation between temperature and "
            "efficiency detected. Your panel is heat-sensitive. "
            "Schedule high-load tasks before 11am."
        )

    # 7. Degradation trend check
    if correlation_data.get("ei_trend") == "degrading":
        suggestions.append(
            "EI has declined over the analysis window. Compare "
            "against manufacturer's 0.5%/year degradation spec. "
            "If steeper, inspect solder joints and cell cracks."
        )

    # 8. Shading detection
    if fault_code == "SHADOW_PARTIAL":
        suggestions.append(
            "Partial shading detected. Even 10% coverage can drop "
            "output by 50%. Check for nearby tree growth or "
            "chimney shadows between 11am and 1pm."
        )

    # 9. Inverter clipping / Battery state
    if ei_value > 95 and correlation_data.get("peak_clipping"):
        suggestions.append(
            "Performance is optimal, but peak clipping is occurring. "
            "Your inverter may be undersized or the battery is full. "
            "Shift high-load tasks to peak sun hours."
        )

    # 10. Sensor maintenance
    if abs(irradiance_ratio - 1.0) > 0.4:
        suggestions.append(
            "High mismatch between model and telemetry. Inspect your "
            "irradiance sensor for debris or birds. Recalibrate if "
            "error persists over 48 hours."
        )

    # 11. Seasonal tilt reminder
    if "seasonal_adjustment" in correlation_data:
        suggestions.append(
            "Seasonal transition detected. Stepping up tilt by 15° "
            "for the upcoming winter months could yield a 12% "
            "production boost."
        )

    # Always append the optimal window tip
    best_hour = correlation_data.get('best_hour', 12)
    next_hour = (best_hour + 2)
    suggestions.append(
        f"Optimal window today: {best_hour:02d}:00–{next_hour:02d}:00 "
        "for maximum yield."
    )

    return suggestions
