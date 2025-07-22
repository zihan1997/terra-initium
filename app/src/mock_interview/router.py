from functools import lru_cache

from fastapi import APIRouter, UploadFile, File, Form, Depends
from src.mock_interview.audio_process import LLM

@lru_cache
def get_llm(token: str):
    return LLM(token)

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
        token: str = Form(...),
        question: str = Form(...),
        correctAnswer: str = Form(...),
        audio: UploadFile = File(...),
):
    llm = get_llm(token)
    response = await llm.transcribe(audio=audio)
    score = await llm.get_score(response.text, question, correctAnswer)
    # score = {'score': 0, 'explanation': "The candidate's response does not address the question at all and does not include any relevant information about deploying a microservice in AWS containers."}

    print(score)
    return score

