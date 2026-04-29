from openai import OpenAI
from backend.clients import openai_client


def transcribe(filename: str, audio_bytes: bytes, content_type: str, api_key: str | None = None) -> str:
    if not api_key:
        return "[Demo mode] No API key configured — add your OpenAI key on the Consultation page to enable real transcription."

    client = OpenAI(api_key=api_key) if api_key else openai_client
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=(filename, audio_bytes, content_type),
    )
    return transcript.text
