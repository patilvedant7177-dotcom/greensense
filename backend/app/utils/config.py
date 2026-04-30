# TODO: Application configuration

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Application
    APP_NAME = "Solar Twin API"
    APP_VERSION = "0.1.0"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    
    # External APIs
    OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
    
    # API Configuration
    API_PREFIX = "/api"
    CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]
    
    # Cache
    CACHE_TTL_MINUTES = 5
    
    # Solar Calculation
    DEFAULT_PANEL_EFFICIENCY = 0.20
    
    @classmethod
    def validate(cls):
        """Validate all required settings are configured"""
        required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "OPENWEATHERMAP_API_KEY"]
        missing = [r for r in required if not getattr(cls, r)]
        if missing:
            raise ValueError(f"Missing required settings: {', '.join(missing)}")

settings = Settings()
