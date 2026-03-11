import ipaddress
import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Generator, Iterable
from urllib.parse import urlparse

import httpx
from google import genai
from google.genai import types


SYSTEM_PROMPT = """Translate the following scholarly or philosophical text into Chinese.
Requirements:
1. Use precise academic, psychological, or philosophical terminology appropriate for the context.
2. Maintain the scholarly tone, elegance, and depth of the original text.
3. Provide a brief explanation for extremely complex or culture-specific terms if necessary.
4. Ensure the translation is fluent and natural in Chinese, avoiding awkward translation-ese.
5. Format with clear paragraphs."""

OPENLENS_CONFIG_PATH = Path(__file__).resolve().parents[3] / "openlens_ui" / "openlens.config.json"


@lru_cache
def get_openlens_config() -> dict[str, str]:
    if not OPENLENS_CONFIG_PATH.exists():
        return {
            "defaultGeminiModel": "gemini-2.5-flash",
            "defaultOllamaModel": "minimax-m2.5",
            "defaultOllamaHost": "https://ollama.com",
        }
    return json.loads(OPENLENS_CONFIG_PATH.read_text(encoding="utf-8"))


DEFAULT_GEMINI_MODEL = get_openlens_config()["defaultGeminiModel"]
DEFAULT_OLLAMA_MODEL = get_openlens_config()["defaultOllamaModel"]
DEFAULT_OLLAMA_HOST = get_openlens_config()["defaultOllamaHost"]


class OpenLensError(ValueError):
    pass


def _normalize_host(raw_host: str | None) -> str:
    host = (raw_host or os.getenv("OPENLENS_DEFAULT_OLLAMA_HOST") or DEFAULT_OLLAMA_HOST).strip()
    if not host:
        raise OpenLensError("Ollama host is required.")

    parsed = urlparse(host)
    if parsed.scheme != "https" or not parsed.netloc:
        raise OpenLensError("Ollama host must be a valid https URL.")

    hostname = parsed.hostname
    if not hostname:
        raise OpenLensError("Ollama host is invalid.")

    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local:
            raise OpenLensError("Private Ollama hosts are not allowed.")
    except ValueError:
        lowered = hostname.lower()
        if lowered in {"localhost", "localhost.localdomain"} or lowered.endswith(".local"):
            raise OpenLensError("Local Ollama hosts are not allowed.")

    cleaned = parsed._replace(path="", params="", query="", fragment="")
    return cleaned.geturl().rstrip("/")


def _allowed_ollama_hosts() -> set[str]:
    hosts = {
        _normalize_host(os.getenv("OPENLENS_DEFAULT_OLLAMA_HOST") or DEFAULT_OLLAMA_HOST),
    }
    extra_hosts = os.getenv("OPENLENS_ALLOWED_OLLAMA_HOSTS", "")
    for host in extra_hosts.split(","):
        host = host.strip()
        if host:
            hosts.add(_normalize_host(host))
    return hosts


def validate_ollama_host(raw_host: str | None) -> str:
    host = _normalize_host(raw_host)
    if host not in _allowed_ollama_hosts():
        raise OpenLensError("Ollama host is not in the server allowlist.")
    return host


def gemini_is_configured() -> bool:
    return bool(os.getenv("OPENLENS_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY"))


def ollama_is_configured() -> bool:
    return bool(os.getenv("OPENLENS_OLLAMA_API_KEY") or os.getenv("OLLAMA_API_KEY"))


@lru_cache
def get_gemini_client() -> genai.Client:
    api_key = os.getenv("OPENLENS_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise OpenLensError("Gemini API key is not configured on the server.")
    return genai.Client(api_key=api_key)


def ollama_headers() -> dict[str, str]:
    api_key = os.getenv("OPENLENS_OLLAMA_API_KEY") or os.getenv("OLLAMA_API_KEY")
    if not api_key:
        raise OpenLensError("Ollama API key is not configured on the server.")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def translate_with_gemini(text: str, model: str | None = None) -> str:
    response = get_gemini_client().models.generate_content(
        model=model or DEFAULT_GEMINI_MODEL,
        contents=text,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
        ),
    )
    return response.text or ""


def stream_gemini_translation(text: str, model: str | None = None) -> Iterable[str]:
    stream = get_gemini_client().models.generate_content_stream(
        model=model or DEFAULT_GEMINI_MODEL,
        contents=text,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
        ),
    )
    for chunk in stream:
        if chunk.text:
            yield chunk.text


def _ollama_payload(text: str, model: str | None) -> dict:
    return {
        "model": model or DEFAULT_OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Text: {text}"},
        ],
    }


def translate_with_ollama(text: str, host: str, model: str | None = None) -> str:
    response = httpx.post(
        f"{host}/api/chat",
        headers=ollama_headers(),
        json={**_ollama_payload(text, model), "stream": False},
        timeout=120,
    )
    response.raise_for_status()
    body = response.json()
    return body.get("message", {}).get("content", "")


def stream_ollama_translation(text: str, host: str, model: str | None = None) -> Generator[str, None, None]:
    with httpx.stream(
        "POST",
        f"{host}/api/chat",
        headers=ollama_headers(),
        json={**_ollama_payload(text, model), "stream": True},
        timeout=120,
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if not line:
                continue
            payload = json.loads(line)
            content = payload.get("message", {}).get("content")
            if content:
                yield content
