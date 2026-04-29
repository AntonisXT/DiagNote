import re
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi_clerk_auth import HTTPAuthorizationCredentials  # type: ignore
from sqlalchemy.orm import Session

from backend.database import get_db, Patient, Consultation, Document
from backend.dependencies import clerk_guard, get_user_id
from backend.schemas import ChatIn
from backend.services import llm_service

router = APIRouter(prefix="/api", tags=["patients"])

_ICD_CODE_RE = re.compile(r'`?([A-Z][A-Z0-9]{1,5}(?:\.[A-Z0-9]{1,4})?)`?\s*[—\-–]\s*(.+)')


def _build_chart(consultations: list, period: str, now: datetime) -> list[dict]:
    if period == "week":
        return [
            {
                "label": (now - timedelta(days=6 - i)).strftime("%a"),
                "val": sum(
                    1 for c in consultations
                    if c.created_at.date() == (now - timedelta(days=6 - i)).date()
                ),
            }
            for i in range(7)
        ]
    if period == "month":
        result = []
        for i in range(4, 0, -1):
            w_start = now - timedelta(weeks=i)
            w_end = now - timedelta(weeks=i - 1)
            result.append({
                "label": f"W{5 - i}",
                "val": sum(1 for c in consultations if w_start <= c.created_at < w_end),
            })
        return result
    if period == "quarter":
        result = []
        for i in range(12, 0, -1):
            w_start = now - timedelta(weeks=i)
            w_end = now - timedelta(weeks=i - 1)
            result.append({
                "label": f"W{13 - i}",
                "val": sum(1 for c in consultations if w_start <= c.created_at < w_end),
            })
        return result
    # year — last 12 calendar months
    month_abbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    result = []
    for i in range(11, -1, -1):
        m = ((now.month - 1 - i) % 12) + 1
        y = now.year + (now.month - 1 - i) // 12
        result.append({
            "label": month_abbr[m - 1],
            "val": sum(
                1 for c in consultations
                if c.created_at.month == m and c.created_at.year == y
            ),
        })
    return result


@router.get("/patients")
def list_patients(
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    patients = (
        db.query(Patient)
        .filter(Patient.clerk_user_id == user_id)
        .order_by(Patient.name)
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "created_at": p.created_at.isoformat(),
            "consultation_count": len(p.consultations),
        }
        for p in patients
    ]


@router.delete("/patients/{patient_id}")
def delete_patient(
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
    db.delete(patient)
    db.commit()
    return {"ok": True}


@router.get("/analytics")
def get_analytics(
    period: str = Query(default="month", pattern="^(week|month|quarter|year)$"),
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    now = datetime.utcnow()

    period_days = {"week": 7, "month": 30, "quarter": 90, "year": 365}
    days = period_days[period]
    curr_start = now - timedelta(days=days)
    prev_start = now - timedelta(days=days * 2)

    curr_consultations = (
        db.query(Consultation)
        .filter(Consultation.clerk_user_id == user_id, Consultation.created_at >= curr_start)
        .all()
    )
    curr_count = len(curr_consultations)

    prev_count = (
        db.query(Consultation)
        .filter(
            Consultation.clerk_user_id == user_id,
            Consultation.created_at >= prev_start,
            Consultation.created_at < curr_start,
        )
        .count()
    )
    if prev_count > 0:
        change_pct = round(((curr_count - prev_count) / prev_count) * 100, 1)
    else:
        change_pct = 100.0 if curr_count > 0 else 0.0

    new_patients = (
        db.query(Patient)
        .filter(Patient.clerk_user_id == user_id, Patient.created_at >= curr_start)
        .count()
    )
    docs_generated = (
        db.query(Document)
        .filter(Document.clerk_user_id == user_id, Document.created_at >= curr_start)
        .count()
    )
    hours_saved = round(curr_count * 0.25, 1)

    chart = _build_chart(curr_consultations, period, now)

    icd_rows = (
        db.query(Consultation.icd10_codes)
        .filter(Consultation.clerk_user_id == user_id, Consultation.icd10_codes != "")
        .all()
    )
    code_counts: dict[str, dict] = {}
    for (text,) in icd_rows:
        for line in text.splitlines():
            m = _ICD_CODE_RE.match(line.strip())
            if m:
                code = m.group(1).upper()
                desc = m.group(2).strip().rstrip("`").strip()
                if code not in code_counts:
                    code_counts[code] = {"code": code, "description": desc, "count": 0}
                code_counts[code]["count"] += 1

    top_icd10 = sorted(code_counts.values(), key=lambda x: x["count"], reverse=True)[:6]
    top_max = top_icd10[0]["count"] if top_icd10 else 1
    for item in top_icd10:
        item["pct"] = round(item["count"] / top_max * 100)

    return {
        "consultations": curr_count,
        "hours_saved": hours_saved,
        "new_patients": new_patients,
        "docs_generated": docs_generated,
        "change_pct": change_pct,
        "chart": chart,
        "top_icd10": top_icd10,
    }


@router.post("/patients/{patient_id}/chat")
def patient_history_chat(
    patient_id: int,
    data: ChatIn,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
    x_openai_key: str | None = Header(default=None),
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

    history_parts = []
    for c in consultations:
        parts = [f"Visit Date: {c.date_of_visit}"]
        if c.summary:
            parts.append(f"Summary: {c.summary}")
        if c.next_steps:
            parts.append(f"Next Steps: {c.next_steps}")
        if c.icd10_codes:
            parts.append(f"ICD-10: {c.icd10_codes}")
        history_parts.append("\n".join(parts))

    history = "\n\n---\n\n".join(history_parts) if history_parts else "No consultations on record."

    system_content = (
        f"You are a clinical assistant for the physician. You have the complete consultation history "
        f"for patient '{patient.name}'. Answer questions and assist using ONLY this history. "
        f"Be concise and clinically precise. If the answer is not in the history, say so clearly.\n\n"
        f"Patient History:\n{history}"
    )
    return llm_service.stream_patient_chat(system_content, data.message, api_key=x_openai_key)
