import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

_DATABASE_URL = os.getenv("DATABASE_URL")

if _DATABASE_URL:
    # PostgreSQL — no SQLite-specific args
    engine = create_engine(_DATABASE_URL)
else:
    # Local fallback: SQLite, kept in api/dev.db for continuity with existing data
    _PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    engine = create_engine(
        f"sqlite:///{os.path.join(_PROJECT_ROOT, 'api', 'dev.db')}",
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    consultations = relationship(
        "Consultation", back_populates="patient", cascade="all, delete-orphan"
    )
    appointments = relationship(
        "Appointment", back_populates="patient", cascade="all, delete-orphan"
    )


class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    clerk_user_id = Column(String, nullable=False, index=True)
    date_of_visit = Column(String, nullable=False)
    raw_notes = Column(Text, default="")
    summary = Column(Text, default="")
    next_steps = Column(Text, default="")
    email_draft = Column(Text, default="")
    icd10_codes = Column(Text, default="")
    notes_language = Column(String, default="Auto-detect")
    output_language = Column(String, default="English")
    created_at = Column(DateTime, default=datetime.utcnow)
    patient = relationship("Patient", back_populates="consultations")


class UserSettings(Base):
    __tablename__ = "user_settings"
    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, unique=True, nullable=False, index=True)
    custom_instruction = Column(Text, default="")
    full_name = Column(String, default="")
    specialty = Column(String, default="")
    clinic_address = Column(String, default="")
    phone_number = Column(String, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    clerk_user_id = Column(String, nullable=False, index=True)
    date = Column(String, nullable=False)   # YYYY-MM-DD
    time = Column(String, nullable=False)   # HH:MM
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    patient = relationship("Patient", back_populates="appointments")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, nullable=False, index=True)
    consultation_id = Column(
        Integer, ForeignKey("consultations.id", ondelete="SET NULL"), nullable=True
    )
    patient_name = Column(String, nullable=False, default="")
    name = Column(String, nullable=False, default="Consultation Summary")
    type = Column(String, nullable=False, default="Summary")
    format = Column(String, default="PDF")
    size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def run_migrations() -> None:
    """Add columns introduced after initial schema creation (safe to re-run)."""
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    if "user_settings" not in insp.get_table_names():
        return
    existing = {c["name"] for c in insp.get_columns("user_settings")}
    new_cols = [
        ("full_name", "VARCHAR"),
        ("specialty", "VARCHAR"),
        ("clinic_address", "VARCHAR"),
        ("phone_number", "VARCHAR"),
    ]
    with engine.begin() as conn:
        for col, typ in new_cols:
            if col not in existing:
                conn.execute(text(f"ALTER TABLE user_settings ADD COLUMN {col} {typ} DEFAULT ''"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
