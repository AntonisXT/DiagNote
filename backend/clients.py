import os
from openai import OpenAI


def get_openai_client(api_key: str | None = None) -> OpenAI | None:
    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        return None
    return OpenAI(api_key=key)
