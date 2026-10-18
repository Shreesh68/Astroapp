"""Sidereal birth-chart computation with Swiss Ephemeris."""
import threading
from datetime import datetime

import pytz
import swisseph as swe

from constants import NAKSHATRA, RASHI, RASHI_LORD, nakshatra_of, rashi_index
from dasha import vimshottari
from kuja import kuja_dosha, samya_planets

AYANAMSA = {
    'lahiri': swe.SIDM_LAHIRI,
    'raman': swe.SIDM_RAMAN,
    'kp': swe.SIDM_KRISHNAMURTI,
    'krishnamurti': swe.SIDM_KRISHNAMURTI,
    'fagan_bradley': swe.SIDM_FAGAN_BRADLEY,
}

SWE_IDS = {
    'sun': swe.SUN, 'moon': swe.MOON, 'mars': swe.MARS, 'mercury': swe.MERCURY,
    'jupiter': swe.JUPITER, 'venus': swe.VENUS, 'saturn': swe.SATURN, 'rahu': swe.MEAN_NODE,
}

# swe.set_sid_mode is global state; serialise calculations that depend on it
_swe_lock = threading.Lock()


class ChartInputError(ValueError):
    pass


def local_to_utc(date_str, time_str, tz_name):
    try:
        tz = pytz.timezone(tz_name)
    except Exception:
        raise ChartInputError(f'unknown time zone: {tz_name!r}')
    try:
        naive = datetime.fromisoformat(f'{date_str}T{time_str}')
    except ValueError:
        raise ChartInputError('date must be YYYY-MM-DD and time HH:MM')
    return tz.localize(naive).astimezone(pytz.utc)


def julian_day(dt_utc):
    hour = dt_utc.hour + dt_utc.minute / 60 + dt_utc.second / 3600 + dt_utc.microsecond / 3.6e9
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, hour)


def set_ayanamsa(name):
    mode = AYANAMSA.get((name or 'lahiri').lower())
    if mode is None:
        raise ChartInputError(f'unknown ayanamsa: {name!r}')
    swe.set_sid_mode(mode)


def point(lon):
    """Describe an ecliptic longitude: rashi, degree in rashi, nakshatra and pada."""
    r = rashi_index(lon)
    nak, pada, _ = nakshatra_of(lon)
    return {
        'lon': lon,
        'sign': RASHI[r],
        'sign_index': r,
        'degree': lon % 30.0,
        'nakshatra': NAKSHATRA[nak],
        'nakshatra_index': nak,
        'pada': pada,
    }


def compute_chart(date, time, lat, lon, tz, ayanamsa='lahiri', time_known=True):
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ChartInputError('latitude/longitude out of range')
    dt_utc = local_to_utc(date, time, tz)
    jd = julian_day(dt_utc)

    with _swe_lock:
        set_ayanamsa(ayanamsa)
        planets = {}
        for name, pid in SWE_IDS.items():
            xx, _ = swe.calc_ut(jd, pid, swe.FLG_SIDEREAL | swe.FLG_SPEED)
            planets[name] = {**point(xx[0]), 'retrograde': xx[3] < 0}
        _, ascmc = swe.houses_ex(jd, lat, lon, b'P', swe.FLG_SIDEREAL)
        ayanamsa_deg = swe.get_ayanamsa_ut(jd)

    ketu_lon = (planets['rahu']['lon'] + 180.0) % 360.0
    planets['rahu']['retrograde'] = True  # nodes always move backwards (mean node)
    planets['ketu'] = {**point(ketu_lon), 'retrograde': True}

    asc = point(ascmc[0])
    for p in planets.values():
        p['house'] = (p['sign_index'] - asc['sign_index']) % 12 + 1  # whole-sign houses

    moon = planets['moon']
    signs = {name: p['sign_index'] for name, p in planets.items()}
    return {
        'requested': {'date': date, 'time': time, 'lat': lat, 'lon': lon, 'tz': tz, 'ayanamsa': ayanamsa,
                      'time_known': time_known},
        'utc': dt_utc.isoformat(),
        'jd_ut': jd,
        'ayanamsa_degree': ayanamsa_deg,
        'ascendant': asc,
        'planets': planets,
        'moon_nakshatra': {'index': moon['nakshatra_index'], 'name': moon['nakshatra'], 'pada': moon['pada']},
        'moon_sign_lord': RASHI_LORD[moon['sign_index']],
        'manglik': kuja_dosha(signs, asc['sign_index'], time_known),
        'dosha_samya': samya_planets(signs, asc['sign_index'], time_known),
        'dasha': vimshottari(moon['lon'], dt_utc),
    }
