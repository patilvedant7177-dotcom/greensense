from fastapi import FastAPI

from .routers import solar, weather

app = FastAPI()

app.include_router(solar.router)
app.include_router(weather.router)

@app.get("/")
async def root():
    return {"message": "Solar Twin API"}
