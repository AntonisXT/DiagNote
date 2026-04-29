from fastapi import APIRouter, Depends, HTTPException
from fastapi_clerk_auth import HTTPAuthorizationCredentials  # type: ignore
from sqlalchemy.orm import Session

from backend.database import get_db, Patient, Appointment
from backend.dependencies import clerk_guard, get_user_id
from backend.schemas import AppointmentIn

router = APIRouter(prefix="/api", tags=["appointments"])


@router.get("/appointments")
def list_appointments(
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    appointments = (
        db.query(Appointment)
        .filter(Appointment.clerk_user_id == user_id)
        .order_by(Appointment.date, Appointment.time)
        .all()
    )
    return [
        {
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": a.patient.name,
            "date": a.date,
            "time": a.time,
            "notes": a.notes,
            "created_at": a.created_at.isoformat(),
        }
        for a in appointments
    ]


@router.post("/appointments")
def create_appointment(
    data: AppointmentIn,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    patient = (
        db.query(Patient)
        .filter(Patient.id == data.patient_id, Patient.clerk_user_id == user_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    appt = Appointment(
        patient_id=data.patient_id,
        clerk_user_id=user_id,
        date=data.date,
        time=data.time,
        notes=data.notes,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "patient_name": patient.name,
        "date": appt.date,
        "time": appt.time,
        "notes": appt.notes,
    }


@router.delete("/appointments/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    appt = (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id, Appointment.clerk_user_id == user_id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appt)
    db.commit()
    return {"ok": True}
