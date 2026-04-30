# Solar Twin - Monorepo

A full-stack web application for real-time solar irradiance monitoring and prediction using weather data.

## 📁 Project Structure

```
solar-twin/
├── frontend/          # Vite + React 18 + TypeScript
├── backend/           # FastAPI + Python
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- npm or yarn (for frontend package management)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to access the frontend.

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The API will be available at `http://localhost:8000`

## 📦 Dependencies

### Frontend
- **Vite** - Fast build tool and dev server
- **React 18** - UI library
- **TypeScript** - Static typing
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **@tanstack/react-query** - Data fetching and caching
- **Recharts** - React charting library
- **maplibre-gl** - Interactive maps
- **lucide-react** - Icon library
- **@supabase/supabase-js** - Supabase client

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI web server
- **pvlib-python** - Solar irradiance calculations
- **Pandas** - Data manipulation
- **NumPy** - Numerical computing
- **scikit-learn** - Machine learning library
- **httpx** - Async HTTP client
- **supabase** - Supabase Python client
- **python-dotenv** - Environment variable management

## 🔧 Configuration

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

2. Required environment variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Supabase service role key
   - `OPENWEATHERMAP_API_KEY` - OpenWeatherMap API key
   - `VITE_SUPABASE_URL` - Frontend Supabase URL
   - `VITE_SUPABASE_ANON_KEY` - Frontend Supabase key

## 📚 Frontend Structure

```
frontend/src/
├── components/     # React components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── api/            # API client functions
├── lib/            # Utility libraries (Supabase client)
├── utils/          # Utility functions
├── types/          # TypeScript types
└── App.tsx
```

## 🔌 Backend Structure

```
backend/app/
├── routers/        # API route handlers
├── models/         # Pydantic request/response models
├── services/       # Business logic services
├── db/             # Database models and connection
├── utils/          # Utility functions and config
└── main.py         # FastAPI app initialization
```

## 📡 API Endpoints

### Solar Data
- `GET /api/solar` - Get current solar data
- `GET /api/solar/history` - Get historical solar data
- `GET /api/solar/forecast` - Get solar forecast

### Weather Data
- `GET /api/weather` - Get current weather
- `GET /api/weather/forecast` - Get weather forecast
- `GET /api/weather/cloud-impact` - Analyze cloud impact

## 🔄 Development Workflow

1. **Frontend Development**
   - Run `npm run dev` for hot reload
   - Run `npm run build` to build for production

2. **Backend Development**
   - Run `python main.py` for development
   - API documentation available at `http://localhost:8000/docs`

## 📝 TODO Items

- [ ] Implement Supabase database schema
- [ ] Integrate solar irradiance calculations with pvlib
- [ ] Add ML-based prediction models
- [ ] Implement user authentication
- [ ] Add real-time data updates with WebSockets
- [ ] Deploy to production
- [ ] Add comprehensive test coverage
- [ ] Implement data visualization dashboard
- [ ] Add historical data export functionality

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Created for Solar Twin project - Real-time solar monitoring system
