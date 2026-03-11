import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from pydantic import BaseModel, Field

from src.constants import ENTRY_POINT_OPENLENS_PATH
from src.openlens.service import (
    OpenLensError,
    gemini_is_configured,
    ollama_is_configured,
    ollama_headers,
    stream_gemini_translation,
    stream_ollama_translation,
    translate_with_gemini,
    translate_with_ollama,
    validate_ollama_host,
)


class TranslationRequest(BaseModel):
    provider: str = Field(pattern="^(gemini|ollama-cloud)$")
    text: str = Field(min_length=1, max_length=20000)
    model: str | None = Field(default=None, max_length=200)
    baseUrl: str | None = Field(default=None, max_length=500)


router = APIRouter(
    prefix="",
    tags=["openlens"],
    responses={404: {"description": "Not found"}},
)


def _entrypoint():
    if not ENTRY_POINT_OPENLENS_PATH.exists():
        raise HTTPException(status_code=503, detail="OpenLens UI has not been built yet.")
    return ENTRY_POINT_OPENLENS_PATH


@router.get("/api/openlens/health")
async def openlens_health(provider: str, baseUrl: str | None = None):
    if provider == "gemini":
        if not gemini_is_configured():
            return {"success": False, "message": "Gemini is not configured on the server."}
        return {"success": True, "message": "Gemini service is configured on the server."}

    if provider == "ollama-cloud":
        try:
            validated_host = validate_ollama_host(baseUrl)
        except OpenLensError as exc:
            return {"success": False, "message": str(exc)}

        if not ollama_is_configured():
            return {"success": False, "message": "Ollama is not configured on the server."}

        try:
            response = httpx.get(
                f"{validated_host}/api/version",
                headers=ollama_headers(),
                timeout=10,
            )
            response.raise_for_status()
        except httpx.HTTPError:
            return {"success": False, "message": "Configured Ollama endpoint is unreachable."}

        return {"success": True, "message": "Ollama endpoint is reachable and allowed."}

    raise HTTPException(status_code=400, detail="Unknown provider.")


@router.post("/api/openlens/translate")
async def translate_text(payload: TranslationRequest):
    try:
        if payload.provider == "gemini":
            content = translate_with_gemini(payload.text, payload.model)
        else:
            validated_host = validate_ollama_host(payload.baseUrl)
            content = translate_with_ollama(payload.text, validated_host, payload.model)
    except OpenLensError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=exc.response.text) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Translation failed.") from exc

    return {"content": content}


@router.post("/api/openlens/translate/stream")
async def stream_translation(payload: TranslationRequest):
    try:
        if payload.provider == "gemini":
            iterator = stream_gemini_translation(payload.text, payload.model)
        else:
            validated_host = validate_ollama_host(payload.baseUrl)
            iterator = stream_ollama_translation(payload.text, validated_host, payload.model)
    except OpenLensError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return StreamingResponse(iterator, media_type="text/plain; charset=utf-8")


@router.get("/openlens")
@router.get("/openlens/")
async def openlens_root():
    return HTMLResponse(_entrypoint().read_text(encoding="utf-8"))
