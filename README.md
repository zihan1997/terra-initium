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

Run locally with a local env file and the interview data mounted in:

```bash
docker run --rm -p 8000:8000 \
  --env-file .env.local \
  -v "$PWD/data/interview:/data/interview:ro" \
  terra-initium
```

## Environment Files

- `.env.local` local runtime values, not committed
- `.env.example` tracked template of expected keys

```bash
cp .env.example .env.local
```

Set `INTERVIEW_ACCESS_TOKEN` in `.env.local` to a long random secret. Do not commit that file.

Interview question banks are not in the repo. Create `data/interview/` and place these files there:

- `InterviewQuestionList.json`
- `mian-jing.json`

`INTERVIEW_DATA_DIR` overrides that location. Leave it unset to use `data/interview` at the repo root locally, or `/data/interview` inside the Docker image. The files are not copied into the image or the frontend build. Authorized requests return HTTP 503 if either file is missing.

## Main Modules

### Interview Questions

Served at:

- `/interview_questions`

This module now uses backend-protected share-token access.

Required env var:

```env
INTERVIEW_ACCESS_TOKEN=replace_with_your_secret_token
```

Required data files, supplied at run time (see above):

- `InterviewQuestionList.json`
- `mian-jing.json`

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

- Interview Questions data is read at runtime from `INTERVIEW_DATA_DIR` (default `data/interview`). It is not part of the UI bundle or the image.
- If duplicate question ids appear, run:

```bash
python3 scripts/fix_question_ids.py
```

The script updates `data/interview/InterviewQuestionList.json`, or `$INTERVIEW_DATA_DIR/InterviewQuestionList.json` when that variable is set.

- More app-specific runtime notes are in `app/README.md`
