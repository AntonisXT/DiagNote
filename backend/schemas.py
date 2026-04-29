from pydantic import BaseModel, field_validator

MAX_NOTES_LENGTH = 3000

LANGUAGES = {
    "Auto-detect", "English", "Spanish", "French", "German", "Italian",
    "Portuguese", "Dutch", "Polish", "Russian", "Chinese", "Japanese",
    "Korean", "Arabic", "Hindi", "Turkish", "Swedish", "Norwegian",
}


class Visit(BaseModel):
    patient_name: str
    date_of_visit: str
    notes: str
    notes_language: str = "Auto-detect"
    output_language: str = "English"
    image_base64: str | None = None
    image_media_type: str | None = None  # "image/png" or "image/jpeg"

    @field_validator("patient_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("patient_name must not be blank")
        return v

    @field_validator("notes")
    @classmethod
    def notes_length(cls, v: str) -> str:
        if len(v) > MAX_NOTES_LENGTH:
            raise ValueError(f"notes must not exceed {MAX_NOTES_LENGTH} characters")
        return v

    @field_validator("notes_language", "output_language")
    @classmethod
    def valid_language(cls, v: str) -> str:
        if v not in LANGUAGES:
            raise ValueError(f"unsupported language: {v}")
        return v


class ConsultationIn(BaseModel):
    patient_name: str
    date_of_visit: str
    raw_notes: str = ""
    summary: str = ""
    next_steps: str = ""
    email_draft: str = ""
    icd10_codes: str = ""
    notes_language: str = "Auto-detect"
    output_language: str = "English"
    next_appointment_date: str | None = None   # YYYY-MM-DD
    next_appointment_time: str | None = None   # HH:MM


class AppointmentIn(BaseModel):
    patient_id: int
    date: str
    time: str
    notes: str = ""


class ChatIn(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message must not be blank")
        if len(v) > 2000:
            raise ValueError("message must not exceed 2000 characters")
        return v


class SettingsIn(BaseModel):
    custom_instruction: str = ""
    full_name: str = ""
    specialty: str = ""
    clinic_address: str = ""
    phone_number: str = ""


class AssistantMessage(BaseModel):
    role: str
    content: str


class AssistantIn(BaseModel):
    messages: list[AssistantMessage]

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v: list) -> list:
        if not v:
            raise ValueError("messages must not be empty")
        if len(v) > 40:
            raise ValueError("messages must not exceed 40 turns")
        for m in v:
            if m.role not in ("user", "assistant"):
                raise ValueError("message role must be 'user' or 'assistant'")
            if len(m.content) > 4000:
                raise ValueError("message content must not exceed 4000 characters")
        return v
