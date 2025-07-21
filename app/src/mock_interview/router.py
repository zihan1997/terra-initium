import random

from fastapi import APIRouter, UploadFile, File, Form

router = APIRouter(
    prefix="/evaluate-question",
    tags=["evaluate-question"],
    responses={404: {"description": "Not found"}},
)


@router.get('/')
async def evaluate_question():
    return 'hello world'


@router.post('/')
async def interview_question(
        questionId: str = Form(...),
        question: str = Form(...),
        correctAnswer: str = Form(...),
        audio: UploadFile = File(...)
):
    return {'score': random.randint(0, 5)}
