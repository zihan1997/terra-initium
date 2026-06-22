# Desktop Bootstrap

This folder contains the first Electron wrapper for running the integrated app as a desktop application.

Current scope:

- start a desktop-local Node server inside Electron
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

Then start the Electron shell:

```bash
npm run dev
```

To build a Windows installer from a Windows machine:

```bash
npm run build:win
```

The launcher will:

1. load environment variables from `../.env.local` if present
2. start a desktop-local Node server
3. wait for `http://127.0.0.1:8364/openlens`
4. open the Electron window

## Notes

- Basic Windows installer packaging is set up, but icons, signing, and release polish are not done yet.
- The desktop path no longer depends on the Python/FastAPI backend.
- The desktop server uses the same `.env.local` keys for Gemini and Ollama access.
- In packaged mode, place `.env.local` next to the installed executable if you want local desktop credentials/config.
