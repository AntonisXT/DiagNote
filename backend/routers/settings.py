from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi_clerk_auth import HTTPAuthorizationCredentials  # type: ignore
from sqlalchemy.orm import Session

from backend.database import get_db, UserSettings
from backend.dependencies import clerk_guard, get_user_id
from backend.schemas import SettingsIn

router = APIRouter(prefix="/api", tags=["settings"])


@router.get("/settings")
def get_settings(
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    s = db.query(UserSettings).filter_by(clerk_user_id=user_id).first()
    return {
        "custom_instruction": s.custom_instruction if s else "",
        "full_name": s.full_name if s else "",
        "specialty": s.specialty if s else "",
        "clinic_address": s.clinic_address if s else "",
        "phone_number": s.phone_number if s else "",
    }


@router.put("/settings")
def update_settings(
    data: SettingsIn,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    db: Session = Depends(get_db),
):
    user_id = get_user_id(creds.credentials)
    s = db.query(UserSettings).filter_by(clerk_user_id=user_id).first()
    if not s:
        s = UserSettings(clerk_user_id=user_id)
        db.add(s)
    s.custom_instruction = data.custom_instruction
    s.full_name = data.full_name
    s.specialty = data.specialty
    s.clinic_address = data.clinic_address
    s.phone_number = data.phone_number
    s.updated_at = datetime.utcnow()
    db.commit()
    return {
        "custom_instruction": s.custom_instruction,
        "full_name": s.full_name,
        "specialty": s.specialty,
        "clinic_address": s.clinic_address,
        "phone_number": s.phone_number,
    }
