# OpenLens Migration

`OpenLens` has been migrated into `terra-initium` as a FastAPI-served module.

Routes:

- `/openlens`
- `/api/openlens/health`
- `/api/openlens/translate`
- `/api/openlens/translate/stream`

Frontend source:

- `openlens_ui/`
- `openlens_ui/openlens.config.json` shared defaults for frontend and backend

Built frontend output:

- `app/static/openlens/`

Server environment variables:

- `OPENLENS_GEMINI_API_KEY` or `GEMINI_API_KEY`
- `OPENLENS_OLLAMA_API_KEY` or `OLLAMA_API_KEY`
- `OPENLENS_DEFAULT_OLLAMA_HOST` optional, defaults to `https://ollama.com`
- `OPENLENS_ALLOWED_OLLAMA_HOSTS` optional comma-separated allowlist

Build and sync the frontend bundle:

```bash
cd openlens_ui
npm install
npm run build:terra
```

Then deploy the existing `app/Dockerfile` as usual.
