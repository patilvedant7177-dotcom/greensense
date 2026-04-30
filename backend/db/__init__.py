from .client import supabase
from .queries import (
    get_cumulative_kwh,
    get_panel,
    get_readings,
    insert_panel,
    insert_reading,
)

__all__ = [
    'supabase',
    'insert_panel',
    'get_panel',
    'insert_reading',
    'get_readings',
    'get_cumulative_kwh',
]
