import os
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from dotenv import load_dotenv

try:
    from supabase import Client, create_client
except ImportError:  # pragma: no cover
    Client = None
    create_client = None

_ENV_PATH = Path(__file__).resolve().parents[1] / '.env'
_ENV_LOCAL_PATH = Path(__file__).resolve().parents[1] / '.env.local'
load_dotenv(_ENV_PATH)
load_dotenv(_ENV_LOCAL_PATH, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

supabase: Any | None = None
if create_client and SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase_host = urlparse(SUPABASE_URL).hostname
    if supabase_host:
        existing_no_proxy = os.getenv('NO_PROXY', '')
        no_proxy_entries = [entry.strip() for entry in existing_no_proxy.split(',') if entry.strip()]
        if supabase_host not in no_proxy_entries:
            no_proxy_entries.append(supabase_host)
            os.environ['NO_PROXY'] = ','.join(no_proxy_entries)
            os.environ['no_proxy'] = os.environ['NO_PROXY']

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

__all__ = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'supabase']
