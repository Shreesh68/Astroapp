# AstrologyApp (Static)

Simple static site scaffold for a South-Indian (Karnataka-focused) astrology / matchmaking site.

What this scaffold includes
- React + Vite front-end
- Tailwind CSS for styling
- Pages: Home, Birth Chart (single profile), Matchmaking (bride + groom), About
- Simple deterministic placeholder astrology utilities (sun-sign + approximate dosha checks)

Important notes
- Calculations are simplified placeholders and NOT a substitute for professional/astronomical chart calculation. For production accuracy integrate an astrology engine (e.g. Swiss Ephemeris) or a verified astrology API.

Quick start (macOS, zsh)

```bash
cd /Users/shreesh/Desktop/AstrologyApp
npm install
npm run dev
```

Important: The app now requires time-of-birth inputs for accurate quick previews. Enter local time (HH:MM) along with date when using `Birth Chart` or `Matchmaking`.

Backend (ephemeris) — optional, for accurate Vedic charts

The project includes a minimal FastAPI backend (`/backend`) that uses Swiss Ephemeris (`pyswisseph`) to compute sidereal rāśi and nakshatra. To run it locally:

```bash
cd /Users/shreesh/Desktop/AstrologyApp/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Once the backend is running, the frontend will POST to `http://127.0.0.1:8000/api/chart` to get Vedic planetary positions. If the backend is not running the app will fall back to simplified local calculations.

Open http://localhost:5173 in your browser.

Next steps I can take for you
- Integrate a proper ephemeris library for accurate birth charts
- Add Kannada language support and Karnataka-specific UI assets
- Add printable PDF birth-chart reports
