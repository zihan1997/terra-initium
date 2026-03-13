import hashlib
import os
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, Response


COOKIE_NAME = "interview_access"
QUERY_NAME = "access"


def _configured_token() -> str:
    token = os.getenv("INTERVIEW_ACCESS_TOKEN", "").strip()
    if not token:
        raise HTTPException(status_code=503, detail="Interview access token is not configured.")
    return token


def _token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def is_authorized(request: Request) -> bool:
    expected = _token_digest(_configured_token())
    return request.cookies.get(COOKIE_NAME) == expected


def authorize_response(response: Response) -> None:
    ttl_days = int(os.getenv("INTERVIEW_ACCESS_COOKIE_DAYS", "30"))
    secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    expires = datetime.now(timezone.utc) + timedelta(days=ttl_days)
    response.set_cookie(
        key=COOKIE_NAME,
        value=_token_digest(_configured_token()),
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/interview_questions",
        expires=expires,
    )


def authorize_from_query(request: Request, response: Response) -> bool:
    candidate = (request.query_params.get(QUERY_NAME) or "").strip()
    if not candidate:
        return False
    if candidate != _configured_token():
        return False
    authorize_response(response)
    return True
