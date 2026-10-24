"""
FastAPI backend using Swiss Ephemeris (pyswisseph).

Endpoints
- POST /api/chart     { date: 'YYYY-MM-DD', time: 'HH:MM', lat, lon, tz: 'Asia/Kolkata', ayanamsa?: 'lahiri' }
- POST /api/match     { groom: <chart payload>, bride: <chart payload> }
- GET  /api/panchang  ?date=YYYY-MM-DD&lat=..&lon=..&tz=..
- POST /api/ask       { birth, messages, lang }  → streamed answer from the AI astrologer (see ask.py)

Run from this directory:  uvicorn app:app --reload --port 8000
"""
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ashtakoota import ashtakoota
from kuja import kuja_compatibility
from chart import ChartInputError, compute_chart
from panchang import compute_panchang

from ask import router as ask_router

try:
    from prokerala import router as prokerala_router
except ImportError:
    prokerala_router = None

app = FastAPI(title='KannadaAstro Ephemeris')

_raw = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173')
# Hosts given without a scheme (e.g. Render's `fromService` host) are assumed to be https
_allowed_origins = [o if '://' in o else f'https://{o}' for o in (o.strip().rstrip('/') for o in _raw.split(',')) if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(ask_router)

if prokerala_router is not None:
    app.include_router(prokerala_router)


class ChartRequest(BaseModel):
    date: str = Field(..., description='YYYY-MM-DD')
    time: str = Field(..., description='HH:MM, local to the place')
    lat: float
    lon: float
    tz: str = Field(..., description='IANA time zone, e.g. Asia/Kolkata')
    ayanamsa: Optional[str] = 'lahiri'
    time_known: bool = True


class MatchRequest(BaseModel):
    groom: ChartRequest
    bride: ChartRequest


def _chart(req: ChartRequest):
    try:
        return compute_chart(req.date, req.time, req.lat, req.lon, req.tz, req.ayanamsa, req.time_known)
    except ChartInputError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get('/')
def root():
    return {'status': 'ok'}


@app.post('/api/chart')
def chart(req: ChartRequest):
    return _chart(req)


@app.post('/api/match')
def match(req: MatchRequest):
    groom, bride = _chart(req.groom), _chart(req.bride)
    result = ashtakoota(groom['planets']['moon']['lon'], bride['planets']['moon']['lon'])
    result['manglik'] = kuja_compatibility(
        {'kuja': groom['manglik'], 'samya': groom['dosha_samya']},
        {'kuja': bride['manglik'], 'samya': bride['dosha_samya']},
    )
    return {'groom_chart': groom, 'bride_chart': bride, 'match': result}


@app.get('/api/panchang')
def panchang(date: str, lat: float, lon: float, tz: str, ayanamsa: str = 'lahiri'):
    try:
        return compute_panchang(date, lat, lon, tz, ayanamsa)
    except ChartInputError as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('app:app', host='127.0.0.1', port=8000, reload=True)
