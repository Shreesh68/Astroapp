"""
Simple FastAPI backend prototype using Swiss Ephemeris (pyswisseph).

Endpoint: POST /api/chart
Payload: { date: 'YYYY-MM-DD', time: 'HH:MM', lat: float, lon: float, tz: 'Asia/Kolkata', ayanamsa: 'lahiri' }

Response: planetary sidereal longitudes, ascendant, moon nakshatra and basic rashi names.

Notes:
- Requires `pip install -r requirements.txt` inside `backend/`.
- pyswisseph (swisseph) uses ephemeris files. If you see errors, set `swe.set_ephe_path('/path/to/ephemeris')` or install the packaged ephemeris files.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import swisseph as swe
from dateutil import parser
import pytz
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import math
from fastapi import APIRouter

# include prokerala router if available
try:
    from .prokerala import router as prokerala_router
except Exception:
    prokerala_router = None

app = FastAPI(title='KarnatakaMatch Ephemeris')

# Allow localhost:5173 (vite) during development
import os

_raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")
_allowed_origins = [o.strip() for o in _raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if prokerala_router is not None:
    app.include_router(prokerala_router)

@app.get('/')
def root():
    return {'status': 'ok'}


class ChartRequest(BaseModel):
    date: str  # YYYY-MM-DD
    time: str  # HH:MM (local to place)
    lat: float
    lon: float
    tz: Optional[str] = None
    ayanamsa: Optional[str] = 'lahiri'


RASHI = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena']
NAKSHATRA = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha','Magha',
  'Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Moola','Purva Ashadha',
  'Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
]


def parse_local_to_utc(date_str, time_str, tz_name=None):
    # parse local naive datetime then convert to UTC using tz_name if provided
    local_dt = datetime.fromisoformat(f"{date_str}T{time_str}")
    if tz_name:
        try:
            tz = pytz.timezone(tz_name)
            local_dt = tz.localize(local_dt)
        except Exception:
            # fallback: assume naive is local and leave as is
            pass
    # convert to UTC
    utc_dt = local_dt.astimezone(pytz.utc)
    return utc_dt


def jd_from_utc(dt_utc):
    # dt_utc: aware datetime in UTC
    y = dt_utc.year
    m = dt_utc.month
    d = dt_utc.day
    hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0 + dt_utc.microsecond / 3.6e9
    return swe.julday(y, m, d, hour)


@app.post('/api/chart')
def chart(req: ChartRequest):
    # set sidereal/ayanamsa mode if requested (try mapping to swisseph SIDM_* constants)
    try:
        mode = (req.ayanamsa or 'lahiri').upper()
        # attempt common mappings
        mapping = {
            'LAHIRI': 'SIDM_LAHIRI',
            'L': 'SIDM_LAHIRI',
            'FAGAN': 'SIDM_FAGAN_BRADLEY',
            'FAGAN_BRADLEY': 'SIDM_FAGAN_BRADLEY',
            'KP': 'SIDM_KRISHNAMURTI',
            'KRISHNAMURTI': 'SIDM_KRISHNAMURTI',
            'RAMAN': 'SIDM_RAMAN',
        }
        key = mapping.get(mode, None)
        if key is None:
            # try direct SIDM_<MODE>
            key = 'SIDM_' + mode
        sid_const = getattr(swe, key, None)
        if sid_const is not None:
            swe.set_sid_mode(sid_const)
        else:
            # fallback to Lahiri
            swe.set_sid_mode(swe.SIDM_LAHIRI)
    except Exception:
        try:
            swe.set_sid_mode(swe.SIDM_LAHIRI)
        except Exception:
            pass

    # parse local to UTC and build Julian Day (UT)
    try:
        dt_utc = parse_local_to_utc(req.date, req.time, req.tz)
    except Exception as e:
        return { 'error': 'invalid date/time', 'details': str(e) }

    jd_ut = jd_from_utc(dt_utc)

    planets = {
        'sun': swe.SUN,
        'moon': swe.MOON,
        'mercury': swe.MERCURY,
        'venus': swe.VENUS,
        'mars': swe.MARS,
        'jupiter': swe.JUPITER,
        'saturn': swe.SATURN,
        'rahu': swe.MEAN_NODE,  # mean node as Rahu
    }

    out = { 'requested': req.dict(), 'jd_ut': jd_ut }

    planets_out = {}
    for name, pid in planets.items():
        try:
            pos = swe.calc_ut(jd_ut, pid, swe.FLG_SIDEREAL)
            # pos[0] is longitude in degrees for most returns
            lon = pos[0][0] if isinstance(pos[0], (list, tuple)) else pos[0]
        except Exception:
            # fallback try reading pos directly
            try:
                lon = float(pos[0])
            except Exception:
                lon = None

        if lon is None:
            planets_out[name] = { 'lon': None }
            continue

        sign_idx = int(math.floor(lon / 30.0)) % 12
        sign = RASHI[sign_idx]
        deg_in_sign = lon % 30.0
        planets_out[name] = { 'lon': lon, 'sign': sign, 'degree': deg_in_sign }

    out['planets'] = planets_out

    # Ascendant (Lagna) — use sidereal house calculation
    try:
        cusps, ascmc = swe.houses_ex(jd_ut, req.lat, req.lon, b'P', swe.FLG_SIDEREAL)
        asc = ascmc[0]
        asc_sign = RASHI[int(math.floor(asc / 30.0)) % 12]
        out['ascendant'] = { 'lon': asc, 'sign': asc_sign, 'degree': asc % 30.0 }
    except Exception as e:
        out['ascendant'] = { 'error': str(e) }

    # Nakshatra for Moon (27 nakshatras, each 13°20' = 13.333...°)
    moon_lon = planets_out.get('moon', {}).get('lon')
    if moon_lon is not None:
        nak_index = int(math.floor(moon_lon / (360.0 / 27.0))) % 27
        nak_name = NAKSHATRA[nak_index]
        # pada: which quarter (1-4)
        shade = (moon_lon % (360.0 / 27.0)) / (360.0 / 27.0)
        pada = int(math.floor(shade * 4.0)) + 1
        out['moon_nakshatra'] = { 'index': nak_index, 'name': nak_name, 'pada': pada }
    else:
        out['moon_nakshatra'] = None

    # Manglik (Mangal Dosha): Mars in houses 1, 2, 4, 7, 8, 12 from Lagna
    # House counting is rashi-based: Lagna rashi = house 1, next rashi = house 2, etc.
    try:
        mars_lon = planets_out.get('mars', {}).get('lon')
        asc_lon = out.get('ascendant', {}).get('lon')
        if mars_lon is not None and asc_lon is not None:
            asc_rashi  = int(math.floor(asc_lon  / 30.0)) % 12
            mars_rashi = int(math.floor(mars_lon / 30.0)) % 12
            house = (mars_rashi - asc_rashi) % 12  # 0-based (0 = 1st house)
            # South Indian tradition: houses 1,4,7,8,12 are Manglik
            manglik = house in (0, 3, 6, 7, 11)
            out['manglik'] = manglik
            out['manglik_mars_house'] = house + 1  # 1-based for display
        else:
            out['manglik'] = None
            out['manglik_mars_house'] = None
    except Exception:
        out['manglik'] = None
        out['manglik_mars_house'] = None

    return out


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app:app', host='127.0.0.1', port=8000, reload=True)
