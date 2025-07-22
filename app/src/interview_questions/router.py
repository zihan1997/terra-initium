from fastapi import APIRouter
from fastapi.responses import HTMLResponse, FileResponse
from src.constants import ENTRY_POINT_INTERVIEW_QUESTIONS_PATH, INTERVIEW_QUESTIONS_PATH

router = APIRouter(
    prefix="/interview_questions",
    tags=["interview_questions"],
    responses={404: {"description": "Not found"}},
)

@router.get('/InterviewQuestionList.json')
async def serve_question_list():
    json_path = INTERVIEW_QUESTIONS_PATH
    return FileResponse(json_path, media_type="application/json")

@router.get("/", response_class=HTMLResponse)
async def read_root():
    index_path = ENTRY_POINT_INTERVIEW_QUESTIONS_PATH
    return index_path.read_text(encoding="utf-8")