SOLAR-TWIN MONOREPO - PROJECT STRUCTURE
========================================

```
solar-twin/
│
├── README.md                 # Main project documentation
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
│
├── frontend/               # React + Vite + TypeScript
│   ├── node_modules/       # Dependencies (npm)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts   # API client functions (solar, weather)
│   │   │
│   │   ├── components/
│   │   │   ├── SolarMap.tsx
│   │   │   └── SolarChart.tsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useData.ts  # Custom React Query hooks
│   │   │
│   │   ├── lib/
│   │   │   └── supabase.ts # Supabase client initialization
│   │   │
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   │
│   │   ├── types/
│   │   │   └── index.ts    # TypeScript interfaces
│   │   │
│   │   ├── utils/
│   │   │   └── index.ts    # Utility functions
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── .env.local           # Local environment config (git-ignored)
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
└── backend/                # FastAPI + Python
    ├── app/
    │   ├── __init__.py
    │   │
    │   ├── main.py         # FastAPI app initialization
    │   │
    │   ├── routers/
    │   │   ├── __init__.py
    │   │   ├── solar.py    # Solar data endpoints
    │   │   └── weather.py  # Weather data endpoints
    │   │
    │   ├── models/
    │   │   ├── __init__.py
    │   │   └── schemas.py  # Pydantic request/response models
    │   │
    │   ├── services/
    │   │   ├── __init__.py
    │   │   ├── solar.py    # Solar calculations (pvlib)
    │   │   └── weather.py  # Weather API integration
    │   │
    │   ├── db/
    │   │   ├── __init__.py
    │   │   ├── database.py # Supabase connection
    │   │   └── models.py   # ORM models
    │   │
    │   └── utils/
    │       ├── __init__.py
    │       ├── config.py   # Configuration settings
    │       └── helpers.py  # Utility functions
    │
    ├── main.py             # Application entry point
    ├── requirements.txt    # Python dependencies
    ├── .env.local         # Local environment config (git-ignored)
    └── .env.local.example # Example environment config


INSTALLED DEPENDENCIES
======================

Frontend (npm):
  ✓ Vite 8.0.8
  ✓ React 18 + React DOM
  ✓ TypeScript
  ✓ TailwindCSS 3.x
  ✓ PostCSS + Autoprefixer
  ✓ @tanstack/react-query
  ✓ Recharts
  ✓ lucide-react
  ✓ maplibre-gl
  ✓ @supabase/supabase-js
  ✓ shadcn/ui

Backend (pip):
  ✓ fastapi
  ✓ uvicorn[standard]
  ✓ pvlib
  ✓ pandas
  ✓ numpy
  ✓ scikit-learn
  ✓ httpx
  ✓ supabase
  ✓ python-dotenv


KEY FILES CREATED
=================

Frontend:
  - client.ts: API functions for solar/weather data
  - useData.ts: React Query hooks for data fetching
  - supabase.ts: Supabase client setup
  - index.ts (types): TypeScript interfaces
  - index.ts (utils): Utility calculations & formatting

Backend:
  - solar.py: Solar irradiance calculations
  - weather.py: Weather API integration
  - schemas.py: Request/response validation
  - models.py: Database models
  - database.py: Supabase connection
  - config.py: Application settings
  - helpers.py: Common utility functions
  - solar.py (router): GET /api/solar endpoints
  - weather.py (router): GET /api/weather endpoints


API ENDPOINTS
=============

Solar Data:
  GET /api/solar                    # Current solar data
  GET /api/solar/history            # Historical data
  GET /api/solar/forecast           # 7-day forecast

Weather Data:
  GET /api/weather                  # Current weather
  GET /api/weather/forecast         # N-day forecast
  GET /api/weather/cloud-impact     # Cloud impact analysis


ENVIRONMENT VARIABLES
=====================

Required (.env):
  SUPABASE_URL                 # Supabase project URL
  SUPABASE_ANON_KEY           # Anonymous key
  SUPABASE_SERVICE_KEY        # Service role key
  OPENWEATHERMAP_API_KEY      # Weather API key
  VITE_SUPABASE_URL           # Frontend Supabase URL (same)
  VITE_SUPABASE_ANON_KEY      # Frontend Supabase key (same)

Frontend (.env.local):
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_API_URL                # Backend URL (default: localhost:8000)

Backend (.env.local):
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_KEY
  OPENWEATHERMAP_API_KEY
  DEBUG                        # Debug mode (default: false)


QUICK START
===========

Frontend:
  $ cd frontend
  $ npm install
  $ npm run dev
  Visit: http://localhost:5173

Backend:
  $ cd backend
  $ pip install -r requirements.txt
  $ python main.py
  API: http://localhost:8000
  Docs: http://localhost:8000/docs


DEVELOPMENT NOTES
=================

TODO Items:
  - Implement Supabase database schema
  - Integrate pvlib solar calculations
  - Add ML-based prediction models
  - Implement user authentication
  - Add real-time WebSocket updates
  - Deploy to production
  - Add comprehensive testing
  - Implement visualization dashboard
  - Add data export functionality

All modules contain TODO comments indicating:
  - Service implementations
  - Database integrations
  - API endpoint completions
  - External API calls
  - ML model implementations
