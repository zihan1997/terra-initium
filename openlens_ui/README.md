# OpenLens UI

This frontend is built as a static bundle and served by the FastAPI app in `app/`.

Local workflow:

```bash
npm install
npm run build:terra
```

That writes the production bundle into `../app/static/openlens`, which is the path served at `/openlens`.
