"""
Proxy to Prokerala Astrology API (server-side).

This module exposes a single POST endpoint `/api/chart/prokerala` that accepts
the same payload as the local `/api/chart` and returns a mapped response
containing planetary longitudes, ascendant and nakshatra in our frontend shape.

To use, set the environment variable `PROKERAL_API_KEY`.
"""
import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

PROKERAL_KEY = os.getenv('PROKERAL_API_KEY')


class ProkReq(BaseModel):
    date: str
    time: str
    lat: float
    lon: float
    tz: Optional[str] = None
    ayanamsa: Optional[str] = 'lahiri'


def map_prokerala_to_frontend(data):
    # This mapping depends on Prokerala's response format. Below is a flexible
    # attempt: adapt keys after you test with a real API response.
    planets = {}
    # sample provider keys: data['planets']['sun']['longitude'] etc.
    p = data.get('planets') or {}
    for k in ['sun','moon','mercury','venus','mars','jupiter','saturn','rahu']:
        node = p.get(k) or {}
        lon = node.get('longitude') or node.get('lon') or node.get('degree')
        if lon is None:
            planets[k] = {'lon': None}
        else:
            # provider may return 0-360
            sign = None
            deg = None
            try:
                lonf = float(lon)
                sign_idx = int(lonf // 30) % 12
                # Rashi names match backend.app.RASHI
                RASHI = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena']
                sign = RASHI[sign_idx]
                deg = lonf % 30.0
            except Exception:
                lonf = lon
            planets[k] = {'lon': lonf, 'sign': sign, 'degree': deg}

    asc = data.get('ascendant') or {}
    asc_lon = asc.get('longitude') or asc.get('lon')
    asc_out = None
    if asc_lon is not None:
        try:
            ascf = float(asc_lon)
            RASHI = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena']
            asc_out = { 'lon': ascf, 'sign': RASHI[int(ascf // 30) % 12], 'degree': ascf % 30.0 }
        except Exception:
            asc_out = {'lon': asc_lon}

    nak = data.get('moon_nakshatra') or {}
    if isinstance(nak, dict):
        nak_out = {'name': nak.get('name'), 'pada': nak.get('pada')}
    else:
        nak_out = None

    return {'requested': data.get('requested', {}), 'planets': planets, 'ascendant': asc_out, 'moon_nakshatra': nak_out}


@router.post('/api/chart/prokerala')
def prokerala_chart(req: ProkReq):
    if not PROKERAL_KEY:
        raise HTTPException(status_code=500, detail='PROKERAL_API_KEY not set on server')

    # Build provider payload — adapt these keys to Prokerala's API spec
    provider_payload = {
        'date': req.date,
        'time': req.time,
        'latitude': req.lat,
        'longitude': req.lon,
        'timezone': req.tz or 'Asia/Kolkata',
        'ayanamsa': req.ayanamsa or 'lahiri'
    }

    headers = {'Authorization': f'Bearer {PROKERAL_KEY}', 'Content-Type': 'application/json'}
    url = os.getenv('PROKERAL_API_URL', 'https://api.prokerala.com/v1/vedic/natal')
    try:
        r = requests.post(url, json=provider_payload, headers=headers, timeout=15)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=r.text)

    data = r.json()
    mapped = map_prokerala_to_frontend(data)
    return mapped
