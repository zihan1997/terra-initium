from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from src.constants import ENTRY_POINT_INTERVIEW_QUESTIONS_PATH, INTERVIEW_QUESTIONS_PATH, INTERVIEW_REAL_QUESTIONS_PATH
from src.interview_questions.auth import authorize_from_query, is_authorized

router = APIRouter(
    prefix="/interview_questions",
    tags=["interview_questions"],
    responses={404: {"description": "Not found"}},
)

def _forbidden_page() -> HTMLResponse:
    return HTMLResponse(
        """
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Access Restricted</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f5f7fb;
              color: #111827;
            }
            main {
              width: min(520px, calc(100vw - 32px));
              background: white;
              padding: 32px;
              border-radius: 18px;
              box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
            }
            h1 { margin: 0 0 12px; font-size: 28px; }
            p { margin: 0; line-height: 1.6; color: #4b5563; }
          </style>
        </head>
        <body>
          <main>
            <h1>Access Restricted</h1>
            <p>This interview question set requires a valid access link. Use the shared URL that includes the access token.</p>
          </main>
        </body>
        </html>
        """,
        status_code=403,
    )


def _require_access(request: Request) -> None:
    if not is_authorized(request):
        raise HTTPException(status_code=403, detail="Access denied.")


@router.get('/InterviewQuestionList.json')
async def serve_question_list(request: Request):
    _require_access(request)
    json_path = INTERVIEW_QUESTIONS_PATH
    return FileResponse(json_path, media_type="application/json")

@router.get('/mian-jing.json')
async def serve_real_question_list(request: Request):
    _require_access(request)
    json_path = INTERVIEW_REAL_QUESTIONS_PATH
    return FileResponse(json_path, media_type="application/json")

@router.get("", response_class=HTMLResponse)
@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    if is_authorized(request):
        index_path = ENTRY_POINT_INTERVIEW_QUESTIONS_PATH
        return index_path.read_text(encoding="utf-8")

    redirect = RedirectResponse(url="/interview_questions/", status_code=302)
    if authorize_from_query(request, redirect):
        return redirect

    return _forbidden_page()

@router.get("/access-check")
async def access_check(request: Request):
    if is_authorized(request):
        return {"authorized": True}
    raise HTTPException(status_code=403, detail="Access denied.")

@router.get("/_health")
async def interview_questions_health():
    index_path = ENTRY_POINT_INTERVIEW_QUESTIONS_PATH
    return {"index_exists": index_path.exists()}
