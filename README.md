# terra-initium

`terra-initium` is a single-container app that serves multiple frontend modules from one FastAPI backend.

## Repo Layout

- `app/` FastAPI backend and deployable runtime code
- `ui/` Interview Questions frontend
- `openlens_ui/` OpenLens frontend
- `scripts/` local maintenance scripts

## Docker Build

Build from the repo root:

```bash
docker build -t terra-initium .
```

Run locally with a local env file:

```bash
docker run --rm -p 8000:8000 --env-file .env.local terra-initium
```

## Environment Files

- `.env.local` local runtime values, not committed
- `.env.example` tracked template of expected keys

## Main Modules

### Interview Questions

Served at:

- `/interview_questions`

This module now uses backend-protected share-token access.

Required env var:

```env
INTERVIEW_ACCESS_TOKEN=replace_with_your_secret_token
```

Protected link format:

```text
/interview_questions?access=YOUR_TOKEN
```

Behavior:

- first successful visit sets an HTTP-only cookie
- later visits in the same browser use the cookie
- protected JSON routes are no longer meant to be publicly accessible without backend authorization

### OpenLens

Served at:

- `/openlens`

This module is bundled into the same Docker image and uses server-side API access for model providers.

## Notes

- Interview Questions data source: `app/static/InterviewQuestionList.json`
- If duplicate question ids appear, run:

```bash
python3 scripts/fix_question_ids.py
```

- More app-specific runtime notes are in `app/README.md`
