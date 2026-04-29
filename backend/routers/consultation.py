from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File
from fastapi_clerk_auth import HTTPAuthorizationCredentials  # type: ignore
from sqlalchemy.orm import Session

from backend.database import get_db, UserSettings, Patient, Consultation, Appointment, Document
from backend.dependencies import clerk_guard, get_user_id
from backend.schemas import Visit, ConsultationIn
from backend.services import llm_service, audio_service

router = APIRouter(prefix="/api", tags=["consultation"])


@router.post("")
def consultation_summary(
    visit: Visit,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
    x_openai_key: str | None = Header(default=None),
):
    user_id = get_user_id(creds.credentials)
    settings = db.query(UserSettings).filter_by(clerk_user_id=user_id).first()
    custom_instruction = settings.custom_instruction if settings else ""
    return llm_service.stream_consultation(visit, custom_instruction, api_key=x_openai_key)


@router.post("/consultation")
def consultation_summary_aws(
    visit: Visit,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
    x_openai_key: str | None = Header(default=None),
):
    """Alias used when deployed to AWS App Runner."""
    user_id = get_user_id(creds.credentials)
    settings = db.query(UserSettings).filter_by(clerk_user_id=user_id).first()
    custom_instruction = settings.custom_instruction if settings else ""
    return llm_service.stream_consultation(visit, custom_instruction, api_key=x_openai_key)


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    x_openai_key: str | None = Header(default=None),
):
    audio_bytes = await file.read()
    text = audio_service.transcribe(
        file.filename or "audio.webm",
        audio_bytes,
        file.content_type or "audio/webm",
        api_key=x_openai_key,
    )
    return {"text": text}


@router.post("/consultations")
def save_consultation(
    data: ConsultationIn,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)

    patient = (
        db.query(Patient)
        .filter(Patient.clerk_user_id == user_id, Patient.name == data.patient_name)
        .first()
    )
    if not patient:
        patient = Patient(clerk_user_id=user_id, name=data.patient_name)
        db.add(patient)
        db.flush()

    consultation = Consultation(
        patient_id=patient.id,
        clerk_user_id=user_id,
        date_of_visit=data.date_of_visit,
        raw_notes=data.raw_notes,
        summary=data.summary,
        next_steps=data.next_steps,
        email_draft=data.email_draft,
        icd10_codes=data.icd10_codes,
        notes_language=data.notes_language,
        output_language=data.output_language,
    )
    db.add(consultation)
    db.flush()

    size_bytes = len(
        ((data.summary or "") + (data.next_steps or "") +
         (data.email_draft or "") + (data.icd10_codes or "")).encode("utf-8")
    )
    db.add(Document(
        clerk_user_id=user_id,
        consultation_id=consultation.id,
        patient_name=data.patient_name,
        name="Consultation Summary",
        type="Summary",
        format="PDF",
        size_bytes=size_bytes,
    ))

    appointment_id = None
    if data.next_appointment_date and data.next_appointment_time:
        appt = Appointment(
            patient_id=patient.id,
            clerk_user_id=user_id,
            date=data.next_appointment_date,
            time=data.next_appointment_time,
        )
        db.add(appt)
        db.flush()
        appointment_id = appt.id

    db.commit()
    db.refresh(consultation)
    return {
        "id": consultation.id,
        "patient_id": patient.id,
        "patient_name": patient.name,
        "appointment_id": appointment_id,
    }


@router.get("/consultations/{patient_id}")
def get_consultations(
    patient_id: int,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.clerk_user_id == user_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consultations = (
        db.query(Consultation)
        .filter(Consultation.patient_id == patient_id, Consultation.clerk_user_id == user_id)
        .order_by(Consultation.date_of_visit.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "date_of_visit": c.date_of_visit,
            "raw_notes": c.raw_notes,
            "summary": c.summary,
            "next_steps": c.next_steps,
            "email_draft": c.email_draft,
            "icd10_codes": c.icd10_codes,
            "notes_language": c.notes_language,
            "output_language": c.output_language,
            "created_at": c.created_at.isoformat(),
        }
        for c in consultations
    ]


@router.delete("/consultations/{consultation_id}")
def delete_consultation(
    consultation_id: int,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    consultation = (
        db.query(Consultation)
        .filter(Consultation.id == consultation_id, Consultation.clerk_user_id == user_id)
        .first()
    )
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    db.delete(consultation)
    db.commit()
    return {"ok": True}
