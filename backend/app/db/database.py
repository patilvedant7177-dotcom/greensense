# TODO: Initialize Supabase database connection

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Supabase credentials not configured")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_db():
    """Dependency for getting database connection"""
    return supabase
