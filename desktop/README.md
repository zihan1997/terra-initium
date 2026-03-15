# Desktop Bootstrap

This folder contains the first Electron wrapper for running the integrated app as a desktop application.

Current scope:

- start the existing FastAPI backend from `../app`
- load the integrated OpenLens route at `/openlens`
- keep all desktop-specific code isolated inside `desktop/`

## Run

Install desktop dependencies:

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium/desktop
npm install
```

Build the integrated OpenLens frontend bundle:

```bash
cd /Users/zihanwang/Documents/hobby/terra-initium/openlens_ui
npm install
npm run build:terra
```

Then return to `desktop/`.

Set up the backend Python environment the first time:

```bash
npm run setup:backend
```

Then start the Electron shell:

```bash
npm run dev
```

The launcher will:

1. load environment variables from `../.env.local` if present
2. try to start the backend from `../app`
3. wait for `http://127.0.0.1:8000/openlens`
4. open the Electron window

## Notes

- This is a bootstrap only. Packaging, icons, installers, and Windows-specific bundling are not set up yet.
- The preferred interpreter is `app/.venv/bin/python` on macOS/Linux and `app/.venv/Scripts/python.exe` on Windows, with `python3` / `python` fallback.
- If the backend fails to launch because `uvicorn` or other Python packages are missing, run `npm run setup:backend` from this folder.
