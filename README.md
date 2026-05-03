<div align="center">
  <img src="frontend/public/logo.svg" alt="DiagNote Logo" width="80" />
  <h1>DiagNote</h1>
  <p><strong>The Intelligent Clinical Workspace for Modern Healthcare Professionals.</strong></p>
  <p>Unifying AI documentation, patient records, scheduling, practice analytics,<br/>and an interactive clinical assistant into a single, seamless platform.</p>
  <br/><br/>

<a href="https://diagnote-ai.vercel.app" target="_blank">
  <img src="https://img.shields.io/badge/_LAUNCH_DIAGNOTE-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Launch DiagNote" height="45" />
</a>

  <br/><br/>

  <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" />

</div>
  <br/><br/>

<div align="center">
  <img src="docs/assets/hero.gif" alt="DiagNote - AI consultation workflow" width="100%" />
</div>

<br />

---

## 📋 Table of Contents
 
1. [The Problem](#-the-problem)
2. [The Solution](#-the-solution)
3. [Features](#-features)
4. [Tech Stack](#-tech-stack)
5. [Architecture](#-architecture)
6. [AI Pipeline](#-ai-pipeline)
7. [Preview](#-preview)
8. [Getting Started](#-getting-started)
9. [API Reference](#-api-reference)
10. [Project Structure](#-project-structure)
11. [Roadmap](#-roadmap)
12. [Contributing](#-contributing)
13. [License](#-license)

---

<br />

## 🏥 The Problem

Managing a clinical practice involves more coordination overhead than most tools account for. Patient notes, scheduling, billing codes, and follow-up communication are typically handled across separate systems, each with its own interface and workflow.

The result is a set of recurring friction points:

- **Fragmented workflows.** Notes, appointments, and analytics live in separate places with no unified view of a patient or a practice.
- **Repetitive manual work.** Every consultation generates the same downstream tasks, written independently each time.
- **No clinical intelligence.** There is no assistant to summarize a patient's history before a visit, look up a drug interaction, or surface relevant information about a condition mid-consultation.

<br />

## ✨ The Solution

DiagNote is a **unified AI-powered Clinical Management Workspace** that covers the full lifecycle of a patient encounter, from consultation to follow-up. Not a patchwork of integrated tools, but a single platform where every module shares the same patient record, the same context, and the same intelligence.

Everything a clinician needs, in one place:

- **AI Clinical Documentation.** Real-time voice dictation is instantly transcribed and converted into structured consultation notes, streamed live via GPT-4o.
- **Electronic Health Records.** A searchable, chronological patient database with full consultation history and AI-assisted patient chat.
- **Appointment Scheduling.** Book, manage, and track appointments directly within the patient record.
- **Practice Analytics.** Visit trends, ICD-10 frequency, language distribution, and document volume, configurable by time period.
- **Clinical AI Assistant.** A versatile medical companion ready to support any clinical query, diagnostic task, or daily workflow.

All output is streamed in real time, editable in a rich-text editor, and exportable to PDF or DOCX.

<br />

---

<br />

## 🚀 Features
 
### 🧠 Clinical Intelligence
 
- **AI Consultation Notes.** 5-section structured output streamed live via GPT-4o
- **ICD-10 Code Extraction.** Billing codes auto-extracted from visit notes
- **Differential Diagnosis.** Red flags, alternative diagnoses & investigations
- **AI Clinical Assistant.** Chatbot for ICD-10, drug interactions & clinical scoring
- **Custom Instructions.** Per-user system prompt for specialty & style
- **Multi-language Support.** Notes & output in 18 languages

### 🎙️ Multi-modal Input
 
- **Voice Transcription.** Browser recording transcribed via Whisper
- **Lab Report Analysis.** GPT-4o Vision reads uploaded scans automatically
- **Rich Text Editor.** Real-time streaming editor with PDF/DOCX export

### 📋 Practice Management
 
- **Electronic Health Records.** Searchable patient DB with history & AI chat
- **Appointment Scheduling.** Book & manage appointments per patient record
- **Document Management.** All summaries tracked, exportable to PDF/DOCX
- **Analytics Dashboard.** Visit trends, top codes & language stats

### 🔒 Security & Privacy
 
- **PII Masking.** Names, phones & IDs redacted before OpenAI
- **JWT Authentication.** Every request validated via Clerk JWKS
- **BYOK.** Your OpenAI key, stored only in browser

<br />

---

<br />

## 🛠 Tech Stack

### Frontend
 
| Technology | Why |
|---|---|
| **Next.js 16 + React 19** | File-system routing, server-side Clerk middleware, zero-config Vercel deployment |
| **TypeScript** | End-to-end type safety across all API interfaces and component props |
| **Tailwind CSS v4** | Entire dark clinical UI built utility-first, no external CSS framework |
| **Tiptap** | Programmatic content injection for rendering live AI token streams into an editable document |
| **`@microsoft/fetch-event-source`** | SSE client with custom header support, required for JWT auth on every streaming request |
 
<br />

### Backend
 
| Technology | Why |
|---|---|
| **FastAPI** | Native async + `StreamingResponse`, optimal for SSE-based AI streaming at low latency |
| **SQLAlchemy + PostgreSQL** | Mature ORM with automatic schema migration via Supabase managed Postgres |
| **`fastapi-clerk-auth`** | Clerk JWT validation via public JWKS, so the backend never holds a secret key |
| **OpenAI Python SDK** | `stream=True` pipes tokens directly into SSE events as they arrive |
| **Pydantic v2** | Field-level validators for PII masking, language allow-lists, and message length limits |
 
<br />

### Infrastructure
 
| Service | Role |
|---|---|
| **Vercel** | Frontend hosting with global CDN and automatic preview deployments |
| **Render** | Backend hosting with managed TLS and auto-deploy from `main` |
| **Supabase** | Managed PostgreSQL via session-pooler (port 5432) for persistent SQLAlchemy connections |
| **Clerk** | JWT issuance, JWKS rotation, and user management without a custom auth server |
| **Docker Compose** | Single-command local environment mirroring production topology |
 
<br />

---
 
<br />

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Vercel)                      │
│                                                          │
│  Next.js 16  ·  React 19  ·  Tailwind  ·  Tiptap        │
│                                                          │
│  Clerk SDK  =>  JWT attached to every request            │
└──────────────────┬───────────────────────────────────────┘
                   │  NEXT_PUBLIC_FASTAPI_URL (direct call)
                   ▼
┌──────────────────────────────────────────────────────────┐
│                  FastAPI (Render)                        │
│                                                          │
│  JWT validated via  <=  Clerk JWKS endpoint              │
│                                                          │
│  ├── SQLAlchemy  =>  PostgreSQL (Supabase)               │
│  └── OpenAI SDK  =>  GPT-4o / GPT-4o-mini / Whisper     │
└──────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- The Next.js frontend calls the FastAPI backend **directly** via `NEXT_PUBLIC_FASTAPI_URL` in production. There is no Next.js API proxy layer on Vercel, eliminating double-hop latency on every streaming response.
- In local development, `next.config.ts` rewrites `/api/*` to `http://localhost:8000`, so the frontend code is identical across environments.
- The backend holds **no Clerk secret**. JWT validation is purely cryptographic via Clerk's rotating public JWKS, meaning a leaked backend environment file cannot be used to impersonate users.

<br />

---

<br />

## 🤖 AI Pipeline

```
Raw Input (text + optional image)
        │
        ▼
  ┌─────────────────────┐
  │   PII Masking       │  Patient name  =>  [PATIENT]
  │                     │  Phone number  =>  [PHONE]
  │                     │  Email address =>  [EMAIL]
  │                     │  National ID   =>  [SSN]
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  System Prompt      │  Output language
  │  Construction       │  Notes language
  │                     │  Custom clinician instructions
  │                     │  5-section output schema
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  OpenAI Streaming   │  Text only  =>  gpt-4o-mini
  │                     │  With image =>  gpt-4o (Vision)
  │                     │  stream=True
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  SSE Token Stream   │  FastAPI StreamingResponse
  │                     │  =>  fetch-event-source client
  │                     │  =>  Tiptap editor (live render)
  └─────────────────────┘
```

The pipeline is **stateless per request**. No consultation data is buffered on the server during streaming; tokens flow directly from OpenAI through FastAPI's `StreamingResponse` to the browser.

When no OpenAI key is configured, `llm_service.py` returns a pre-written mock SSE stream that is clinically realistic and structurally identical to a live response, so every platform feature is fully demonstrable in demo mode.

<br />

---

## 📸 Preview

### Full Application View
Navigation sidebar, central workspace, and floating AI assistant.

![DiagNote full application view](docs/assets/overview.png)

### AI Consultation Workspace
Real-time structured clinical documentation from voice or text, with automated patient email drafting and multi-format exports.

![AI Consultation Workspace](docs/assets/consultation.png)

### Intelligent Patient Records (EHR)
Searchable patient database with consultation history and AI chat based on the patient's medical record.

![Patient Records & EHR](docs/assets/patients.png)

### Appointment Scheduling
Book and track upcoming patient appointments seamlessly within your clinical workflow.

![Appointment Scheduling](docs/assets/appointments.png)

### Clinical AI Assistant
Floating assistant for on-demand medical support, including ICD-10 lookups, drug interactions, clinical scoring, and more.

![AI Clinical Assistant](docs/assets/assistant.png)

### Settings
Configure your doctor profile, OpenAI API key, custom AI instructions, and subscription plan.

![Settings](docs/assets/settings.png)

---

<br />

## 📦 Getting Started

### Prerequisites
 
- **Node.js** ≥ 20.9.0
- **Python** 3.11+
- **PostgreSQL** *(optional - falls back to SQLite for local dev)*
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Clerk](https://clerk.com) account (free tier is sufficient to start)
---
 
### Environment Variables
 
**Backend** - copy `backend/.env.example` to `.env.local` in the project root:
 
```bash
cp backend/.env.example .env.local
```
 
```env
# PostgreSQL connection string (omit to use SQLite locally)
DATABASE_URL=postgresql://user:password@host:5432/dbname
 
# Clerk JWKS URL - found in Clerk Dashboard → API Keys → Advanced
CLERK_JWKS_URL=https://clerk.your-domain.com/.well-known/jwks.json
 
# Allowed CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000
 
# Optional - app runs in demo mode with mock AI responses without this
OPENAI_API_KEY=sk-...
```
 
**Frontend** - copy `frontend/.env.example` to `frontend/.env.local`:
 
```bash
cp frontend/.env.example frontend/.env.local
```
 
```env
# Clerk keys - found in Clerk Dashboard → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
 
# Backend URL used by Next.js rewrites in development
FASTAPI_URL=http://localhost:8000
 
# Production only - direct backend URL for client-side fetch
NEXT_PUBLIC_FASTAPI_URL=https://your-backend.onrender.com
```

> **Note:** If `DATABASE_URL` is not set, the backend automatically falls back to a local SQLite file at `api/dev.db` - no setup needed for local development.
 
---
 
### Run with Docker (recommended)
 
Make sure Docker Desktop is running, then:
 
```bash
docker compose up --build
```
 
| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:3000  |
| Backend  | http://localhost:8000  |
| Health   | http://localhost:8000/health |
 
To stop:
 
```bash
docker compose down
```
 
---
 
### Run Manually
 
**Backend** (from project root):
 
```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```
 
**Frontend** (separate terminal):
 
```bash
cd frontend
npm install
npm run dev
```
 
The frontend will be available at **http://localhost:3000**.
 
---
 
## Configuration
 
### OpenAI API Key (in-app)
 
The OpenAI key can also be set directly in the UI without touching `.env.local`:
 
1. Sign in and navigate to **Settings → API Configuration**
2. Paste your `sk-...` key and click **Save Key**
The key is stored in your **browser's localStorage only** - it is never sent to DiagNote's servers. Without a key the app operates in **demo mode**, returning realistic mock responses.
 
### Custom AI Instructions
 
In **Settings → Custom AI Instructions** you can append persistent instructions to every AI prompt, for example:
 
```
Always write patient emails in a warm, reassuring tone.
Include dosage reminders in the next steps section.
Format the summary as a SOAP note.
```

---

<br />

## 📡 API Reference

Interactive Swagger UI: **https://diagnote-backend.onrender.com/docs**

All routes require `Authorization: Bearer <clerk-jwt>` except `/health`.
SSE endpoints (`POST /api/consultation`, `POST /api/patients/{id}/chat`, `POST /api/assistant`) return `Content-Type: text/event-stream`.

<br />

**Health**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (no authentication required) |

<br />

**Consultation**

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/consultation` | Stream consultation summary (SSE) |
| `POST` | `/api/transcribe` | Transcribe audio via Whisper |
| `POST` | `/api/consultations` | Save a consultation to the database |
| `GET` | `/api/consultations/{patient_id}` | List all consultations for a patient |
| `DELETE` | `/api/consultations/{id}` | Delete a consultation |

<details>
<summary><code>POST /api/consultation</code> - request body</summary>

```json
{
  "patient_name": "Jane Smith",
  "date_of_visit": "2026-04-30",
  "notes": "Patient presents with productive cough and low-grade fever for 3 days.",
  "output_language": "English",
  "notes_language": "Auto-detect",
  "image_base64": null,
  "image_media_type": null
}
```

Optional header: `X-OpenAI-Key: sk-...` - uses the clinician's own key when provided; falls back to the server-side key or demo mode.

</details>

<details>
<summary><code>POST /api/transcribe</code> - request body</summary>

```
Content-Type: multipart/form-data
file: <audio blob>   (webm / mp4 / mp3 / wav)
```

Optional header: `X-OpenAI-Key: sk-...`

Returns: `{ "text": "Transcribed text..." }`

</details>

<details>
<summary><code>POST /api/consultations</code> - request body</summary>

```json
{
  "patient_name": "Jane Smith",
  "date_of_visit": "2026-04-30",
  "raw_notes": "Patient presents with productive cough and low-grade fever.",
  "summary": "### Summary of visit...",
  "next_steps": "### Next steps...",
  "email_draft": "### Draft of email...",
  "icd10_codes": "J18.1 - Lobar pneumonia, unspecified organism",
  "output_language": "English",
  "notes_language": "Auto-detect",
  "next_appointment_date": "2026-05-07",
  "next_appointment_time": "09:00"
}
```

`next_appointment_date` and `next_appointment_time` are optional - when provided, an appointment record is created automatically.

</details>

<br />

**Patients**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/patients` | List all patients |
| `GET` | `/api/analytics` | Aggregated analytics: diagnosis trends, visit frequency |
| `DELETE` | `/api/patients/{id}` | Delete a patient and all their records |
| `POST` | `/api/patients/{id}/chat` | AI chat using the patient's full history as context (SSE) |

<details>
<summary><code>POST /api/patients/{id}/chat</code> - request body</summary>

```json
{
  "message": "What medications is this patient currently on?"
}
```

Optional header: `X-OpenAI-Key: sk-...`

</details>

<br />

**Appointments**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/appointments` | List all appointments |
| `POST` | `/api/appointments` | Book an appointment |
| `DELETE` | `/api/appointments/{id}` | Cancel an appointment |

<details>
<summary><code>POST /api/appointments</code> - request body</summary>

```json
{
  "patient_id": 42,
  "date": "2026-05-07",
  "time": "09:00",
  "notes": "Follow-up on blood results"
}
```

`notes` is optional.

</details>

<br />

**Documents**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/documents` | List all documents |
| `DELETE` | `/api/documents/{id}` | Delete a document |

<br />

**Analytics**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics` | Visit trends, top ICD-10 codes, language distribution. Accepts `?period=7d\|30d\|90d\|1y` |

<br />

**Assistant**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/assistant` | Stream AI assistant response (SSE) |

<details>
<summary><code>POST /api/assistant</code> - request body</summary>

```json
{
  "messages": [
    { "role": "user", "content": "Calculate the CHA₂DS₂-VASc score for a 72-year-old male with hypertension and diabetes." }
  ]
}
```

Multi-turn: include prior `"assistant"` turns in the array (max 40 messages, 4000 chars each).

Optional header: `X-OpenAI-Key: sk-...`

</details>

<br />

**Settings**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/settings` | Get clinic profile and custom instructions |
| `PUT` | `/api/settings` | Update user settings |

<details>
<summary><code>PUT /api/settings</code> - request body</summary>

```json
{
  "full_name": "Dr. Sarah Chen",
  "specialty": "General Practice",
  "clinic_address": "123 Medical Centre, London",
  "phone_number": "+44 20 7123 4567",
  "custom_instruction": "Always include a medication reconciliation section at the end of each summary."
}
```

All fields are optional - send only the fields you want to update.

</details>

<br />

---

<br />

## 📁 Project Structure

```
DiagNote/
│
├── backend/
│   ├── main.py              # FastAPI entry point: CORS and router registration
│   ├── database.py          # SQLAlchemy models and automatic schema migrations
│   ├── dependencies.py      # Clerk JWT guard used by every protected route
│   ├── schemas.py           # Pydantic models with field-level validation
│   ├── clients.py           # OpenAI client factory (supports per-request keys)
│   ├── routers/
│   │   ├── consultation.py  # Notes streaming, transcription, save and delete
│   │   ├── patients.py      # Patient CRUD, AI chat, analytics
│   │   ├── appointments.py  # Calendar management
│   │   ├── documents.py     # PDF/Word export
│   │   ├── assistant.py     # Floating AI assistant
│   │   └── settings.py      # User profile & API key management
│   ├── services/
│   │    ├── llm_service.py   # GPT-4o streaming, PII masking, demo mode mock
│   │    └── audio_service.py # Whisper transcription
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── pages/               # Next.js pages router
│   │   ├── index.tsx        # Marketing landing page
│   │   ├── product.tsx      # Main consultation workspace
│   │   ├── patients.tsx     # Patient management and EHR
│   │   ├── appointments.tsx # Calendar scheduling
│   │   ├── documents.tsx    # Document repository
│   │   ├── analytics.tsx    # Clinic insights dashboard
│   │   └── settings.tsx     # Profile, API key, billing
│   ├── components/  
│   │   ├── AppLayout.tsx    # Sidebar navigation wrapper
│   │   ├── FloatingAssistant.tsx
│   │   ├── TiptapEditor.tsx # Rich text + voice recording editor
│   │   ├── UpgradeModal.tsx # Pro plan upgrade prompt
│   │   └── Logo.tsx         # Brand logo component
│   ├── hooks/               # Custom React hooks
│   │   ├── useApiKey.ts     # OpenAI API key state (localStorage)
│   │   └── useProStatus.ts  # Subscription tier check
│   ├── lib/
│   │   └── api.ts           # apiUrl(): centralises NEXT_PUBLIC_FASTAPI_URL prefix
│   ├── next.config.ts           # Tiptap transpilation + /api/* rewrites
│   ├── package.json
│   ├── Dockerfile
│   ├── .env.example
│   └── styles/
│
├── docker-compose.yml
├── requirements.txt
└── README.md
```

<br />

---

<br />


## 🧭 Roadmap
 
DiagNote is evolving into a complete AI-powered clinical workflow platform, focused on automation, interoperability, and scalability.
 
### ⚙️ Core Platform
- **Multi-clinician workspaces.** Role-based access control, shared patient records, and team dashboards
- **Google Calendar integration.** Two-way synchronization for appointments and scheduling
### 🧑‍⚕️ Patient Experience
- **Patient portal.** Secure interface for messaging, visit summaries, and document access
### 🔗 Interoperability
- **FHIR data export.** HL7 FHIR-compatible data export for EHR integration
### 💼 Business & Scaling
- **Enterprise billing.** Subscription management and usage-based pricing
- **Mobile interface.** Mobile-optimized experience for on-the-go usage

<br />

---

## 🤝 Contributing

Contributions are welcome. If you have an idea for a new feature or have found a bug, please open an issue first to discuss it before submitting a pull request.

When contributing:

- Follow the existing code style and naming conventions used throughout the project
- Keep pull requests focused
- Write clear commit messages that describe the change and its intent

To get started, fork the repository, create a feature branch, and open a pull request against `main`.


---

## ⚠️ Disclaimer

DiagNote is a developer tool and proof-of-concept project. It is **not certified, validated, or approved for use in production clinical environments**. It does not comply with HIPAA, GDPR, or any other healthcare data regulation out of the box. Do not use it to store or process real patient data without appropriate legal, security, and compliance review.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

If you'd like to connect, collaborate, or have any questions about the project:

- 🐙 GitHub: [AntonisXT](https://github.com/AntonisXT)  
- 💼 LinkedIn: [antonis-tsiakiris](https://www.linkedin.com/in/antonis-tsiakiris)  
- 📧 Email: [tsiakiris.dev@gmail.com](mailto:tsiakiris.dev@gmail.com)

---

## ⭐ Support

If you find this project useful, consider giving it a star ⭐ on GitHub - it helps a lot!
