import os
from dotenv import load_dotenv

# Load .env.local from the project root (one directory above backend/)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env.local"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import run_migrations
from backend.routers import consultation, patients, assistant, appointments, settings, documents

run_migrations()

app = FastAPI(title="DiagNote API")

_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
_allow_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


app.include_router(consultation.router)
app.include_router(patients.router)
app.include_router(assistant.router)
app.include_router(appointments.router)
app.include_router(settings.router)
app.include_router(documents.router)
