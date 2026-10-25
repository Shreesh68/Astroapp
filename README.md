# KannadaAstro

Vedic birth charts, Ashtakoota kundli matching and a daily Panchang, in Kannada and English.

- **Frontend:** React + Vite + Tailwind (`src/`)
- **Backend:** FastAPI + Swiss Ephemeris (`backend/`), which handles every calculation

## Features
- **Guided input:** one question at a time, with an "I don't know the birth time" option and saved people ("My people", stored in this browser only).
- **Birth chart:** a plain-language reading of Moon sign, nakshatra and Lagna; a tappable South-Indian chart that explains each house; a Vimshottari dasha timeline; and a South Indian Kuja dosha check (2, 4, 7, 8, 12 from Lagna, Moon and Venus, with the standard exemptions).
- **Matching:** traditional 36-guna Ashtakoota, with common Nadi/Bhakoot cancellations and Kuja dosha samya between the two charts.
- **Panchang:** Samvatsara, Ayana, Rutu and Maasa (amanta, with Adhika masa); tithi, nakshatra, yoga and karana with end times; sunrise and sunset; Rahu Kala, Yamaganda and Gulika.
- **Sharing:** every result lives in its URL, so pages survive a refresh and can be shared (WhatsApp / share sheet). "Save as PDF" uses a print stylesheet.

## Run locally (macOS, zsh)

```bash
# backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app:app --reload --port 8000

# frontend (another terminal, repo root)
npm install
npm run dev          # http://localhost:5173
```

Set `VITE_API_URL` (see `.env.example`) when the backend is not on `http://127.0.0.1:8000`, and set `ALLOWED_ORIGINS` on the backend to the frontend's origin.

## Deploy (Render, free tier)

`render.yaml` deploys both parts. It sets each service's public URL explicitly (`VITE_API_URL`, `ALLOWED_ORIGINS`), so update those two values if you rename a service.

1. Push this repo to GitHub.
2. On [render.com](https://render.com): **New → Blueprint**, then pick the repo and branch, then **Apply**.
3. Wait for both services to finish building. The site is the `karnatakamatch` service, at `https://karnatakamatch….onrender.com`.

On the free plan the API sleeps after about 15 minutes of no traffic. The first request afterwards takes up to about a minute, and the app shows a "waking up" message while it waits.

## Android app (Capacitor)

The same React app is wrapped as a native Android app in `android/`. It talks to the live API on Render, using the URLs in `.env.android`.

```bash
npm run android        # builds the web app for Android, syncs it into android/, opens Android Studio
```

In Android Studio, pick your phone (USB debugging on) or an emulator and press **Run ▶**. To build an APK from the terminal:

```bash
npm run build:android
cd android && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

- Rerun `npm run build:android` after every web change; the app bundles a copy of the site.
- Icon and splash sources are in `assets/`. Regenerate the Android sizes with `npx @capacitor/assets generate --android`.
- Inside the app, share links point at the public website, and "Save as PDF" is hidden because the Android WebView has no print dialog.
- A Play Store release needs a signed build: in Android Studio, **Build → Generate Signed App Bundle**. Keep the keystore safe; every future update must be signed with the same key.

## Tests

```bash
npm test                                   # the app's engine, matching, AI fact sheets, safety guard, saved people
cd backend && .venv/bin/python -m pytest -q # the Python backend
```

## Notes
- Calculation conventions: Lahiri ayanamsa, mean Rahu, whole-sign houses. Kuja dosha follows South Indian practice (`src/engine/chart.js` lists every exemption). Lunar months are amanta and Rutu is Chandramana, as in Karnataka.
- Matching (`src/engine/ashtakoota.js`): Ashtakoota with OnlineJyotish's bride × groom tables, plus Rajju, Vedha, Mahendra and Stree Deergha. Rajju, Vedha, a non-permitted shared star or under 18 gunas make a match not recommended; uncancelled Nadi/Bhakoot, one-sided Kuja dosha or an older bride cap it at acceptable.
- Place search uses Photon (OpenStreetMap, made for type-ahead), with Nominatim as a fallback.
