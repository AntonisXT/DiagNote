import os
import base64
import json
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials  # type: ignore

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)


def get_user_id(token: str) -> str:
    try:
        payload_part = token.split('.')[1]
        payload_part += '=' * (4 - len(payload_part) % 4)
        decoded = json.loads(base64.b64decode(payload_part))
        return decoded.get('sub', '')
    except Exception:
        return ''
