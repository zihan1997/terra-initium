from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from .constants import (INTERVIEW_QUESTIONS_PATH, 
                           ENTRY_POINT_INTERVIEW_QUESTIONS_PATH,
                           ASSERTS_PATH)


INTERVIEW_QUESTIONS = "/InterviewQuestionList.json"

app = FastAPI()

app.mount(
    "/assets",
    StaticFiles(directory=ASSERTS_PATH),
    name="assets"
)

@app.get("/", response_class=HTMLResponse)
async def root():
    index_path = Path(__file__).parent.parent / "static" / "index.html"
    print(index_path)
    return index_path.read_text(encoding="utf-8")

@app.get(INTERVIEW_QUESTIONS)
async def serve_question_list():
    json_path = INTERVIEW_QUESTIONS_PATH
    return FileResponse(json_path, media_type="application/json")

@app.get("/interview_questions", response_class=HTMLResponse)
async def read_interview_questions():
    index_path = ENTRY_POINT_INTERVIEW_QUESTIONS_PATH
    return index_path.read_text(encoding="utf-8")