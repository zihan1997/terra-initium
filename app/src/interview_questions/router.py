import json
import typing
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
import base64

from src.constants import ENTRY_POINT_INTERVIEW_QUESTIONS_PATH, INTERVIEW_QUESTIONS_PATH

router = APIRouter(
    prefix="/interview_questions",
    tags=["interview_questions"],
    responses={404: {"description": "Not found"}},
)

class Question(BaseModel):
    id: int
    question: str
    answer: str | None
    keyword: str
    frequency: int
    top: bool

@router.get('/interview-question-list')
async def serve_question_list():
    json_path = INTERVIEW_QUESTIONS_PATH
    with open(json_path, 'r') as f:
        raw = json.load(f)
    questions = [Question(**q) for q in raw]
    # return questions
    questions: typing.List[Question] = [Question(**q) for q in raw]
    return [{
        'id': q.id,
        'keyword': q.keyword,
        'question': base64.b64encode(q.question.encode()),
        'answer': base64.b64encode(q.answer.encode())if  q.answer else '',
        'frequency': q.frequency,
        'top' : q.top
    }for q in questions]

@router.get("/", response_class=HTMLResponse)
async def read_root():
    index_path = ENTRY_POINT_INTERVIEW_QUESTIONS_PATH
    return index_path.read_text(encoding="utf-8")