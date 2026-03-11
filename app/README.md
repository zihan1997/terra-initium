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

Fill in `.env.local` at the repo root with the required server-side keys, then run:

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium
docker run --rm -p 8000:8000 --env-file .env.local terra-initium
```

Required env vars for protected interview question sharing:

- `INTERVIEW_ACCESS_TOKEN` for the share link gate

Optional:

- `INTERVIEW_ACCESS_COOKIE_DAYS` default `30`
- `COOKIE_SECURE=true` in production if you only serve over HTTPS

## Local URLs

- `http://localhost:8000/`
- `http://localhost:8000/interview_questions`
- `http://localhost:8000/openlens`

Protected interview questions link format:

- `http://localhost:8000/interview_questions?access=YOUR_TOKEN`
