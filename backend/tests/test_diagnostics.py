from backend.engine.diagnostics import diagnose


def test_diagnose_normal_case():
    result = diagnose(
        p_actual=900,
        p_expected=1000,
        v_actual=40,
        v_mp=40,
        i_actual=10,
        i_mp=10,
    )

    assert result == {
        'ei': 90.0,
        'fault_code': 'NORMAL',
        'recommendation': 'System performing within normal range.',
        'v_drop_pct': 0,
        'i_drop_pct': 0,
    }


def test_diagnose_nighttime_case():
    result = diagnose(
        p_actual=0,
        p_expected=0,
        v_actual=0,
        v_mp=40,
        i_actual=0,
        i_mp=10,
    )

    assert result == {
        'ei': None,
        'fault_code': 'NIGHTTIME',
        'recommendation': 'No solar irradiance. System idle.',
        'v_drop_pct': None,
        'i_drop_pct': None,
    }


def test_diagnose_soiling_case():
    result = diagnose(
        p_actual=500,
        p_expected=1000,
        v_actual=38,
        v_mp=40,
        i_actual=6,
        i_mp=10,
    )

    assert result['fault_code'] == 'SOILING_DUST'
    assert result['recommendation'] == (
        'Current drop dominant. Panel surface likely has dust or soiling. '
        'Schedule a clean within 48 hours.'
    )
    assert result['ei'] == 50.0
    assert result['v_drop_pct'] == 5.0
    assert result['i_drop_pct'] == 40.0


def test_diagnose_shading_case():
    result = diagnose(
        p_actual=500,
        p_expected=1000,
        v_actual=28,
        v_mp=40,
        i_actual=9,
        i_mp=10,
    )

    assert result['fault_code'] == 'SHADING_OR_COMPONENT'
    assert result['recommendation'] == (
        'Voltage drop dominant. Check for shading obstructions, failed '
        'bypass diodes, or loose MC4 connectors.'
    )
    assert result['ei'] == 50.0
    assert result['v_drop_pct'] == 30.0
    assert result['i_drop_pct'] == 10.0


def test_diagnose_degradation_case():
    result = diagnose(
        p_actual=500,
        p_expected=1000,
        v_actual=34,
        v_mp=40,
        i_actual=8,
        i_mp=10,
    )

    assert result['fault_code'] == 'DEGRADATION'
    assert result['recommendation'] == (
        'Balanced performance loss. Compare against 30-day baseline. '
        'May indicate cell degradation.'
    )
    assert result['ei'] == 50.0
    assert result['v_drop_pct'] == 15.0
    assert result['i_drop_pct'] == 20.0
