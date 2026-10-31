# App Docker Usage

This folder is the deployable backend unit for `terra-initium`.

## Build

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium
docker build -t terra-initium .
```

This single Docker build now compiles both frontend modules:

- `ui` -> `app/static/interview_questions`
- `openlens_ui` -> `app/static/openlens`

## Run

Copy `.env.example` to `.env.local` at the repo root and set `INTERVIEW_ACCESS_TOKEN` to a long random secret. Put the question banks in `data/interview/` (gitignored):

- `InterviewQuestionList.json`
- `mian-jing.json`

Then run:

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium
docker run --rm -p 8000:8000 \
  --env-file .env.local \
  -v "$PWD/data/interview:/data/interview:ro" \
  terra-initium
```

The image does not contain those JSON files. Inside the container the default directory is `/data/interview`. Set `INTERVIEW_DATA_DIR` when the files are mounted somewhere else. If a file is missing, `/interview_questions/InterviewQuestionList.json` and `/interview_questions/mian-jing.json` respond with HTTP 503. Both routes still require the share token.

Required env vars for protected interview question sharing:

- `INTERVIEW_ACCESS_TOKEN` for the share link gate

Optional:

- `INTERVIEW_DATA_DIR` directory that contains the two JSON files
- `INTERVIEW_ACCESS_COOKIE_DAYS` default `30`
- `COOKIE_SECURE=true` in production if you only serve over HTTPS

## Local URLs

- `http://localhost:8000/`
- `http://localhost:8000/interview_questions`
- `http://localhost:8000/openlens`

Protected interview questions link format:

- `http://localhost:8000/interview_questions?access=YOUR_TOKEN`
