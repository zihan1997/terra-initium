import os
from pathlib import Path

ROOT = Path(__file__).parent.parent

ASSERTS_PATH = ROOT / "static" / "interview_questions" / "assets"
OPENLENS_STATIC_PATH = ROOT / "static" / "openlens"
OPENLENS_ASSETS_PATH = OPENLENS_STATIC_PATH / "assets"

ENTRY_POINT_INTERVIEW_QUESTIONS_PATH = ROOT / "static" / "interview_questions" / "index.html"
ENTRY_POINT_OPENLENS_PATH = OPENLENS_STATIC_PATH / "index.html"

INTERVIEW_QUESTION_LIST_NAME = "InterviewQuestionList.json"
INTERVIEW_REAL_QUESTIONS_NAME = "mian-jing.json"


def interview_data_dir() -> Path:
    configured = os.getenv("INTERVIEW_DATA_DIR", "").strip()
    if configured:
        return Path(configured).expanduser()
    # Checkout: <repo>/data/interview. Image: /data/interview (app code is in /app).
    return ROOT.parent / "data" / "interview"


def interview_questions_path() -> Path:
    return interview_data_dir() / INTERVIEW_QUESTION_LIST_NAME


def interview_real_questions_path() -> Path:
    return interview_data_dir() / INTERVIEW_REAL_QUESTIONS_NAME
