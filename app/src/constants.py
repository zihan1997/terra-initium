from pathlib import Path

ROOT = Path(__file__).parent.parent

ASSERTS_PATH = ROOT / "static" / "interview_questions" / "assets"
OPENLENS_STATIC_PATH = ROOT / "static" / "openlens"
OPENLENS_ASSETS_PATH = OPENLENS_STATIC_PATH / "assets"

INTERVIEW_QUESTIONS_PATH = ROOT / "static" / "InterviewQuestionList.json"
INTERVIEW_REAL_QUESTIONS_PATH = ROOT / "static" / "mian-jing.json"
ENTRY_POINT_INTERVIEW_QUESTIONS_PATH = ROOT / "static" / "interview_questions" / "index.html"
ENTRY_POINT_OPENLENS_PATH = OPENLENS_STATIC_PATH / "index.html"
