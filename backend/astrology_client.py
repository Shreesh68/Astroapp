"""
Astrology client library

Provides a small, opinionated interface to fetch natal charts from either:
- Prokerala (via their HTTP API)
- Local Swiss Ephemeris (pyswisseph)

The goal is to return a normalized chart shape used by the frontend:
{
  'requested': {...},
  'planets': { 'sun': {lon, sign, degree}, ... },
  'ascendant': { lon, sign, degree },
  'moon_nakshatra': { name, pada }
}

This module intentionally keeps mapping logic small and testable so you can
swap providers or add caching later.
"""
from datetime import datetime
import math
import os
from typing import Optional

import requests

try:
    import swisseph as swe
except Exception:
    swe = None

RASHI = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena']
NAKSHATRA = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha','Magha',
  'Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Moola','Purva Ashadha',
  'Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
]


def _parse_local_to_utc(date_str: str, time_str: str, tzinfo=None):
    # Accepts date YYYY-MM-DD and time HH:MM
    # Returns a naive UTC datetime (suitable for swe.julday via year,month,day,hour)
    if 'T' in date_str:
        # accept ISO-ish input
        dt = datetime.fromisoformat(f"{date_str}")
    else:
        dt = datetime.fromisoformat(f"{date_str}T{time_str}")
    if tzinfo is not None:
        try:
            import pytz
            tz = pytz.timezone(tzinfo)
            dt = tz.localize(dt)
            dt = dt.astimezone(pytz.utc)
        except Exception:
            # fall through and treat dt as naive UTC-ish
            pass
    return dt


def _jd_from_utc(dt_utc: datetime):
    y = dt_utc.year
    m = dt_utc.month
    d = dt_utc.day
    hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0 + dt_utc.microsecond / 3.6e9
    return swe.julday(y, m, d, hour)


class AstrologyClient:
    def __init__(self, prokerala_key: Optional[str] = None, prokerala_url: Optional[str] = None):
        self.prokey = prokerala_key or os.getenv('PROKERAL_API_KEY')
        self.prourl = prokerala_url or os.getenv('PROKERAL_API_URL', 'https://api.prokerala.com/v1/vedic/natal')

    def fetch_prokerala(self, date: str, time: str, lat: float, lon: float, tz: Optional[str] = None, ayanamsa: str = 'lahiri'):
        if not self.prokey:
            raise RuntimeError('PROKERAL_API_KEY not configured')
        payload = {
            'date': date,
            'time': time,
            'latitude': lat,
            'longitude': lon,
            'timezone': tz or 'Asia/Kolkata',
            'ayanamsa': ayanamsa
        }
        headers = {'Authorization': f'Bearer {self.prokey}', 'Content-Type': 'application/json'}
        r = requests.post(self.prourl, json=payload, headers=headers, timeout=15)
        r.raise_for_status()
        data = r.json()
        return self._map_prokerala_to_frontend(data)

    def _map_prokerala_to_frontend(self, data: dict):
        # Attempt to robustly extract planet longitudes and ascendant from provider response
        planets_out = {}
        p = data.get('planets') or {}
        for k in ['sun','moon','mercury','venus','mars','jupiter','saturn','rahu']:
            node = p.get(k) or {}
            lon = None
            for key in ('longitude','lon','degree','value'):
                if key in node:
                    lon = node.get(key);
                    break
            if lon is None:
                planets_out[k] = {'lon': None}
                continue
            try:
                lonf = float(lon)
                sign_idx = int(math.floor(lonf / 30.0)) % 12
                sign = RASHI[sign_idx]
                deg = lonf % 30.0
            except Exception:
                lonf = lon
                sign = None
                deg = None
            planets_out[k] = {'lon': lonf, 'sign': sign, 'degree': deg}

        asc = data.get('ascendant') or {}
        asc_lon = None
        for key in ('longitude','lon','degree'):
            if key in asc:
                asc_lon = asc.get(key); break
        asc_out = None
        if asc_lon is not None:
            try:
                ascf = float(asc_lon)
                asc_out = {'lon': ascf, 'sign': RASHI[int(ascf // 30) % 12], 'degree': ascf % 30.0}
            except Exception:
                asc_out = {'lon': asc_lon}

        nak = data.get('moon_nakshatra') or {}
        if isinstance(nak, dict):
            nak_out = {'name': nak.get('name'), 'pada': nak.get('pada')}
        else:
            nak_out = None

        return {'requested': data.get('requested', {}), 'planets': planets_out, 'ascendant': asc_out, 'moon_nakshatra': nak_out}

    def fetch_local(self, date: str, time: str, lat: float, lon: float, tz: Optional[str] = None, ayanamsa: str = 'lahiri'):
        if swe is None:
            raise RuntimeError('pyswisseph (swisseph) is not available in this environment')

        # set sidereal mode
        try:
            mode = (ayanamsa or 'lahiri').upper()
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
                key = 'SIDM_' + mode
            sid_const = getattr(swe, key, None)
            if sid_const is not None:
                swe.set_sid_mode(sid_const)
            else:
                swe.set_sid_mode(swe.SIDM_LAHIRI)
        except Exception:
            try:
                swe.set_sid_mode(swe.SIDM_LAHIRI)
            except Exception:
                pass

        dt_utc = _parse_local_to_utc(date, time, tz)
        jd_ut = _jd_from_utc(dt_utc)

        # capture geographic lon before the planet loop overwrites the name
        lon_coord = lon

        planets = {
            'sun': swe.SUN,
            'moon': swe.MOON,
            'mercury': swe.MERCURY,
            'venus': swe.VENUS,
            'mars': swe.MARS,
            'jupiter': swe.JUPITER,
            'saturn': swe.SATURN,
            'rahu': swe.MEAN_NODE,
        }

        planets_out = {}
        for name, pid in planets.items():
            try:
                pos = swe.calc_ut(jd_ut, pid, swe.FLG_SIDEREAL)
                lon = pos[0][0] if isinstance(pos[0], (list, tuple)) else pos[0]
            except Exception:
                try:
                    lon = float(pos[0])
                except Exception:
                    lon = None
            if lon is None:
                planets_out[name] = {'lon': None}
                continue
            sign_idx = int(math.floor(lon / 30.0)) % 12
            sign = RASHI[sign_idx]
            deg_in_sign = lon % 30.0
            planets_out[name] = {'lon': lon, 'sign': sign, 'degree': deg_in_sign}

        out = {'requested': {'date': date, 'time': time, 'lat': lat, 'lon': lon_coord, 'tz': tz}, 'planets': planets_out}

        # Ascendant — sidereal
        try:
            cusps, ascmc = swe.houses_ex(jd_ut, lat, lon_coord, b'P', swe.FLG_SIDEREAL)
            asc = ascmc[0]
            asc_sign = RASHI[int(math.floor(asc / 30.0)) % 12]
            out['ascendant'] = {'lon': asc, 'sign': asc_sign, 'degree': asc % 30.0}
        except Exception as e:
            out['ascendant'] = {'error': str(e)}

        # Moon nakshatra
        moon_lon = planets_out.get('moon', {}).get('lon')
        if moon_lon is not None:
            nak_index = int(math.floor(moon_lon / (360.0 / 27.0))) % 27
            nak_name = NAKSHATRA[nak_index]
            shade = (moon_lon % (360.0 / 27.0)) / (360.0 / 27.0)
            pada = int(math.floor(shade * 4.0)) + 1
            out['moon_nakshatra'] = {'index': nak_index, 'name': nak_name, 'pada': pada}
        else:
            out['moon_nakshatra'] = None

        # Manglik: Mars in houses 1,2,4,7,8,12 from Lagna
        try:
            mars_lon = planets_out.get('mars', {}).get('lon')
            asc_lon = out.get('ascendant', {}).get('lon')
            if mars_lon is not None and asc_lon is not None:
                asc_rashi  = int(math.floor(asc_lon  / 30.0)) % 12
                mars_rashi = int(math.floor(mars_lon / 30.0)) % 12
                house = (mars_rashi - asc_rashi) % 12  # 0-based
                out['manglik'] = house in (0, 3, 6, 7, 11)  # 1st,4th,7th,8th,12th
                out['manglik_mars_house'] = house + 1
            else:
                out['manglik'] = None
                out['manglik_mars_house'] = None
        except Exception:
            out['manglik'] = None
            out['manglik_mars_house'] = None

        return out


if __name__ == '__main__':
    # quick local demo when run directly
    client = AstrologyClient()
    try:
        print('Local fetch demo (will require pyswisseph):')
        print(client.fetch_local('2000-02-19','01:10',14.3159009,74.432402,'Asia/Kolkata'))
    except Exception as e:
        print('Local fetch failed:', e)
