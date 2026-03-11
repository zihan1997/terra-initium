# App Docker Usage

This folder is the deployable backend unit for `terra-initium`.

## Prerequisite

Build both frontend bundles before building the Docker image.

### Interview Questions UI

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium/ui
npm install
npm run build
```

This writes the bundle to `app/static/interview_questions`.

### OpenLens UI

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium/openlens_ui
npm install
npm run build:terra
```

This writes the bundle to `app/static/openlens`.

## Build

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium/app
docker build -t terra-initium .
```

## Run

Fill in `app/.env.local` with the required server-side keys, then run:

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium/app
docker run --rm -p 8000:8000 --env-file .env.local terra-initium
```

## Local URLs

- `http://localhost:8000/`
- `http://localhost:8000/interview_questions`
- `http://localhost:8000/openlens`
