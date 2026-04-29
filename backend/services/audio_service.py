from backend.clients import get_openai_client


def transcribe(filename: str, audio_bytes: bytes, content_type: str, api_key: str | None = None) -> str:
    client = get_openai_client(api_key)
    if client is None:
        return "[Demo mode] No API key configured — add your OpenAI key on the Consultation page to enable real transcription."

    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=(filename, audio_bytes, content_type),
    )
    return transcript.text
