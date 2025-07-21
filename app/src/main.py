from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from .constants import (INTERVIEW_QUESTIONS_PATH, 
                           ENTRY_POINT_INTERVIEW_QUESTIONS_PATH,
                           ASSERTS_PATH)
from src.price_tracker.price_tracker import router as price_tracker_router
from src.interview_questions.router import router


INTERVIEW_QUESTIONS = "/InterviewQuestionList.json"

app = FastAPI()

""" Routes """
app.include_router(price_tracker_router)
app.include_router(router)

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