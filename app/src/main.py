from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from src.constants import ASSERTS_PATH
from src.interview_questions.router import router as interview_questions_router
from src.mock_interview.router import router as mock_interview_router


INTERVIEW_QUESTIONS = "/InterviewQuestionList.json"

app = FastAPI()

""" Routes """
app.include_router(interview_questions_router)
app.include_router(mock_interview_router)

""" Static files """
app.mount(
    "/assets",
    StaticFiles(directory=ASSERTS_PATH),
    name="assets"
)

""" Sample """
@app.get("/", response_class=HTMLResponse)
async def root():
    index_path = Path(__file__).parent.parent / "static" / "index.html"
    print(index_path)
    return index_path.read_text(encoding="utf-8")