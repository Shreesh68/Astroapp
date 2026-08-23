# Backend (Swiss Ephemeris prototype)

This folder contains a minimal FastAPI prototype that uses `pyswisseph` to compute sidereal planetary longitudes, ascendant, and moon nakshatra.

Setup (macOS / zsh)

```bash
cd /Users/shreesh/Desktop/AstrologyApp/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Prokerala integration

To enable Prokerala (optional):

1. Get an API key from Prokerala and set it as an environment variable:

```bash
export PROKERAL_API_KEY="your_key_here"
```

2. (Optional) set `PROKERAL_API_URL` if your account requires a custom endpoint.

3. Start the server. A new endpoint will be available at `POST /api/chart/prokerala` which the frontend can call.

Note: The proxy maps Prokerala's response to the frontend's expected shape. When you first run it, inspect the JSON returned and adjust `backend/prokerala.py::map_prokerala_to_frontend` if necessary — provider response keys may differ.

Run the server:

```bash
uvicorn app:app --reload --port 8000
```

Notes and troubleshooting
- `pyswisseph` (Python binding to Swiss Ephemeris) may require the swisseph ephemeris data files; if you see errors about missing ephemeris files, download the ephemeris (`sepl` files) and set `swe.set_ephe_path('/path/to/ephemeris')` in `app.py`.
- The endpoint is `POST /api/chart` and accepts JSON: `{ "date":"YYYY-MM-DD", "time":"HH:MM", "lat":12.9716, "lon":77.5946, "tz":"Asia/Kolkata" }`.
