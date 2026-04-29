import re
from openai import OpenAI
from fastapi.responses import StreamingResponse
from backend.clients import openai_client
from backend.schemas import Visit

_PII_PATTERNS = [
    (re.compile(r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b'), '[SSN]'),
    (re.compile(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'), '[PHONE]'),
    (re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b'), '[EMAIL]'),
]

_ASSISTANT_SYSTEM = """You are an expert AI medical assistant for physicians using DiagNote.

Your core capabilities:
1. **Medical knowledge** — Answer questions on pharmacology, drug interactions, dosage guidelines, contraindications, and clinical guidelines concisely and accurately.
2. **ICD-10 codes** — Look up and explain ICD-10 codes on request. Format as a markdown table when listing multiple codes.
3. **Medical calculations & scoring** — Perform clinical scoring systems accurately (e.g. CHA₂DS₂-VASc, HAS-BLED, CHADS₂, Wells score, CURB-65, Glasgow Coma Scale, Child-Pugh, eGFR/CKD-EPI, BMI, BSA, Cockcroft-Gault, Framingham risk). Show the formula, each variable's value, and the final score in a clear markdown table or numbered breakdown.
4. **Document templates** — Draft generic, non-patient-specific medical document templates when asked (e.g. sick leave certificates, return-to-work letters, return-to-sports fitness certificates, medical clearance letters, referral letter templates). Format these as professional documents using markdown with bold headings and clearly labelled placeholder fields in [SQUARE BRACKETS].
5. **Differential diagnosis support** — Suggest differentials and red flags based on symptom descriptions.
6. **Formatting** — Use markdown (bold, tables, bullet lists) to structure complex responses for easy reading at a glance.

Always end responses that involve clinical decisions with a brief italicised reminder: *Always verify clinical decisions independently before applying to patient care.*"""

_MOCK_CONSULTATION = """### Summary of visit for the doctor's records
Patient presented with a 3-day history of productive cough, low-grade fever (38.1°C), and mild dyspnoea on exertion. Auscultation revealed decreased breath sounds at the right base with dullness to percussion. SpO₂ 96% on room air. Peripheral oxygen saturation has been stable throughout the visit. Patient has a background of well-controlled type 2 diabetes mellitus (HbA1c 7.1% three months prior). No known drug allergies. Non-smoker. No recent travel history.

### Next steps for the doctor
- **Chest X-ray** (PA and lateral): confirm right lower lobe consolidation and exclude pleural effusion
- **FBC + CRP + U&E**: assess inflammatory markers and baseline renal function before antibiotic prescribing
- **Blood cultures** (×2 sets) if temperature ≥ 38.5°C or signs of clinical deterioration
- **Commence empirical antibiotic therapy**: Amoxicillin-clavulanate 875/125 mg PO twice daily for 5–7 days; adjust if cultures return a resistant organism
- **Monitor blood glucose closely**: acute infection commonly destabilises glycaemic control — advise patient to check BGL twice daily and contact clinic if readings exceed 15 mmol/L
- **CURB-65 score**: calculate at review — consider hospital admission if score ≥ 2
- **Review appointment in 48 hours** or earlier if respiratory symptoms worsen, SpO₂ drops below 94%, or fever does not respond to antipyretics

### Draft of email to patient in patient-friendly language
Subject: Follow-up from your appointment today

Dear [Patient Name],

Thank you for coming in to see me today. Based on your symptoms and my examination, I believe you have a **chest infection** (pneumonia) affecting the lower part of your right lung.

I have prescribed **Amoxicillin-Clavulanate** — please take one tablet **twice a day with food** for the next 7 days. It is very important to complete the full course, even if you start feeling better after a few days.

**Please monitor your blood sugar levels** twice a day while you are unwell, as infections can make them harder to control.

**Go to the Emergency Department immediately or call 000 if you experience:**
- Difficulty breathing that is getting worse
- A high fever above 39°C that does not come down with paracetamol
- Chest pain or coughing up blood
- Confusion or extreme drowsiness

We have scheduled a follow-up appointment in 48 hours to check on your progress. Please bring a list of all current medications to that visit.

Take care and do not hesitate to call the clinic if you have any concerns before then.

Warm regards,
[Doctor's Name]

### ICD-10 Codes
`J18.1 — Lobar pneumonia, unspecified organism`
`E11.9 — Type 2 diabetes mellitus without complications`
`R05.9 — Cough, unspecified`
`R50.9 — Fever, unspecified`

### AI Clinical Insights & Differential Diagnosis
**Red flags to monitor:**
- SpO₂ trending below 94% — reassess for hospital admission using CURB-65 criteria
- Rapid clinical deterioration in the context of diabetes (higher susceptibility to complications including bacteraemia)
- New pleuritic chest pain — consider pleural effusion or empyema requiring drainage

**Differentials to consider:**
- **Pulmonary embolism** — especially if the cough is non-productive and SpO₂ is disproportionately low relative to clinical appearance; consider D-dimer and CT-PA if Wells score ≥ 2
- **Lung abscess** — suspect if fever persists beyond 48–72 hours despite appropriate antibiotics or if imaging shows cavitation
- **Atypical pneumonia** (Mycoplasma, Legionella) — consider if patient does not respond to beta-lactam therapy within 48 hours; add a macrolide or switch to doxycycline

**Recommended investigations:**
- CXR PA and lateral views (urgent)
- FBC, CMP, CRP, LFTs, blood cultures if febrile
- Sputum MCS if productive cough persists beyond 48 hours
- Urinary Legionella and pneumococcal antigens if atypical presentation

*Always verify clinical decisions independently before applying to patient care.*"""

_MOCK_ASSISTANT = (
    "I'm running in **demo mode** — no OpenAI API key is configured.\n\n"
    "To enable real AI responses, enter your OpenAI API key in the **API Key** field "
    "on the Consultation page. Your key is stored only in your browser's local storage "
    "and is never sent to our servers.\n\n"
    "In a live session I can assist with:\n"
    "- ICD-10 code lookups\n"
    "- Drug interaction checks\n"
    "- Clinical scoring (CHA₂DS₂-VASc, eGFR, CURB-65…)\n"
    "- Document templates (sick notes, referrals, clearance letters)\n"
    "- Differential diagnosis support"
)


def _mock_sse_stream(text: str) -> StreamingResponse:
    """Stream mock text as SSE, one paragraph per event with proper newline encoding."""
    def event_stream():
        paragraphs = text.split("\n\n")
        for i, para in enumerate(paragraphs):
            if not para:
                continue
            for line in para.split("\n"):
                yield f"data: {line}\n"
            # Two trailing empty data fields produce \n\n in the accumulated buffer
            if i < len(paragraphs) - 1:
                yield "data: \n"
                yield "data: \n"
            yield "\n"  # dispatch SSE event
    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _get_client(api_key: str | None) -> OpenAI:
    return OpenAI(api_key=api_key) if api_key else openai_client


def _mask_pii(text: str, patient_name: str) -> str:
    if patient_name.strip():
        text = re.sub(re.escape(patient_name.strip()), '[PATIENT]', text, flags=re.IGNORECASE)
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def _sse_stream(openai_stream) -> StreamingResponse:
    def event_stream():
        for chunk in openai_stream:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for line in lines[:-1]:
                    yield f"data: {line}\n\n"
                    yield "data:  \n"
                yield f"data: {lines[-1]}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")


def build_system_prompt(
    output_language: str,
    notes_language: str,
    custom_instruction: str = "",
) -> str:
    lang_note = (
        f" The notes are written in {notes_language}."
        if notes_language != "Auto-detect"
        else ""
    )
    custom = (
        f"\n\nAdditional instructions from the physician: {custom_instruction.strip()}"
        if custom_instruction.strip()
        else ""
    )
    return (
        f"You are a medical documentation assistant helping physicians create professional clinical records."
        f"{lang_note}{custom}\n"
        f"Generate ALL output in {output_language}.\n"
        f"Reply with EXACTLY five sections using these exact headings:\n"
        f"### Summary of visit for the doctor's records\n"
        f"### Next steps for the doctor\n"
        f"### Draft of email to patient in patient-friendly language\n"
        f"### ICD-10 Codes\n"
        f"### AI Clinical Insights & Differential Diagnosis\n\n"
        f"For the ICD-10 Codes section, list each relevant code on its own line in the format: "
        f"`CODE — Description` (e.g. `J06.9 — Acute upper respiratory infection`). "
        f"Include only codes supported by the visit notes.\n"
        f"For the AI Clinical Insights & Differential Diagnosis section, identify any potential red flags "
        f"or warning signs from the notes, suggest 2-4 alternative or additional diagnoses to consider, "
        f"and note any recommended follow-up investigations. Format as concise bullet points."
    )


def _user_prompt_for(visit: Visit) -> str:
    masked_notes = _mask_pii(visit.notes, visit.patient_name)
    text = (
        f"Create the summary, next steps, draft email, and ICD-10 codes for:\n"
        f"Patient Name: {visit.patient_name}\n"
        f"Date of Visit: {visit.date_of_visit}\n"
        f"Notes:\n{masked_notes}"
    )
    if visit.image_base64:
        text += "\n\nA lab report image is attached. Analyse it and incorporate all relevant findings into your response."
    return text


def stream_consultation(visit: Visit, custom_instruction: str = "", api_key: str | None = None) -> StreamingResponse:
    if not api_key:
        return _mock_sse_stream(_MOCK_CONSULTATION)

    client = _get_client(api_key)
    user_text = _user_prompt_for(visit)
    if visit.image_base64:
        user_content: list | str = [
            {"type": "text", "text": user_text},
            {"type": "image_url", "image_url": {
                "url": f"data:{visit.image_media_type or 'image/jpeg'};base64,{visit.image_base64}"
            }},
        ]
        model = "gpt-4o"
    else:
        user_content = user_text
        model = "gpt-4o-mini"

    messages = [
        {
            "role": "system",
            "content": build_system_prompt(
                visit.output_language, visit.notes_language, custom_instruction
            ),
        },
        {"role": "user", "content": user_content},
    ]
    openai_stream = client.chat.completions.create(
        model=model, messages=messages, stream=True
    )
    return _sse_stream(openai_stream)


def stream_patient_chat(system_content: str, message: str, api_key: str | None = None) -> StreamingResponse:
    if not api_key:
        return _mock_sse_stream(
            "**Demo mode** — add your OpenAI API key on the Consultation page to enable real patient history chat."
        )

    client = _get_client(api_key)
    openai_stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_content},
            {"role": "user", "content": message},
        ],
        stream=True,
    )
    return _sse_stream(openai_stream)


def stream_assistant(messages: list[dict], api_key: str | None = None) -> StreamingResponse:
    if not api_key:
        return _mock_sse_stream(_MOCK_ASSISTANT)

    client = _get_client(api_key)
    full_messages = [{"role": "system", "content": _ASSISTANT_SYSTEM}] + messages
    openai_stream = client.chat.completions.create(
        model="gpt-4o", messages=full_messages, stream=True
    )
    return _sse_stream(openai_stream)
