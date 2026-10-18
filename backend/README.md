# Backend (FastAPI + Swiss Ephemeris)

| Module | Purpose |
|---|---|
| `chart.py` | Sidereal chart: planets (with Ketu, nakshatra/pada, retrograde, whole-sign house), Lagna, dasha |
| `kuja.py` | South Indian Kuja dosha (from Lagna, Moon and Venus, with exemptions) and dosha samya for matching |
| `dasha.py` | Vimshottari mahadashas and antardashas |
| `ashtakoota.py` | 36-guna matching, dosha cancellations, Manglik compatibility |
| `panchang.py` | Daily panchang at local sunrise: Samvatsara, Ayana, Rutu, Maasa (amanta, Adhika), the five limbs with end times, Rahu Kala / Yamaganda / Gulika |
| `app.py` | HTTP API |

## Endpoints
- `POST /api/chart` with `{ "date": "YYYY-MM-DD", "time": "HH:MM", "lat": 12.97, "lon": 77.59, "tz": "Asia/Kolkata" }`. `tz` is required; optional `"time_known": false` drops the Lagna from the Kuja dosha check. Bad input returns **400**.
- `POST /api/match` with `{ "groom": <chart payload>, "bride": <chart payload> }`
- `GET /api/panchang?date=YYYY-MM-DD&lat=..&lon=..&tz=..`

## Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt      # runtime deps + pytest
uvicorn app:app --reload --port 8000
python -m pytest -q
```

`prokerala.py` is an optional, unverified proxy to the Prokerala API (set `PROKERAL_API_KEY`). It is mounted only when importable, and its response shape does not match the current frontend.
