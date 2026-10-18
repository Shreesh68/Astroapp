"""Daily Panchang for a place: the five limbs at local sunrise, plus Rahu Kala & co."""
from datetime import datetime, timedelta

import pytz
import swisseph as swe

from chart import ChartInputError, _swe_lock, julian_day, set_ayanamsa
from constants import NAKSHATRA, NAKSHATRA_SPAN

TITHI_NAMES = ['Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
               'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi']
YOGA_NAMES = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti',
              'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata',
              'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti']
MOVABLE_KARANA = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti']
VARA_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

# Amanta lunar months (Karnataka spelling), Chaitra first
MAASA_NAMES = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwayuja',
               'Kartika', 'Margashira', 'Pushya', 'Magha', 'Phalguna']
# Chandramana rutus: two lunar months each, starting with Chaitra
RUTU_NAMES = ['Vasanta', 'Grishma', 'Varsha', 'Sharad', 'Hemanta', 'Shishira']
SAMVATSARA_NAMES = [
    'Prabhava', 'Vibhava', 'Shukla', 'Pramoduta', 'Prajotpatti', 'Angirasa', 'Shrimukha', 'Bhava', 'Yuva', 'Dhatu',
    'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vrisha', 'Chitrabhanu', 'Svabhanu', 'Tarana', 'Parthiva', 'Vyaya',
    'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi',
    'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava',
    'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadicha', 'Ananda', 'Rakshasa', 'Nala',
    'Pingala', 'Kalayukti', 'Siddharthi', 'Raudri', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya',
]
PRABHAVA_YEAR = 1987  # a Prabhava samvatsara began at Ugadi 1987

# 1-based eighth of the daytime (sunrise→sunset) for each weekday, Sunday first
RAHU_KALA = [8, 2, 7, 5, 6, 4, 3]
YAMAGANDA = [5, 4, 3, 2, 1, 7, 6]
GULIKA = [7, 6, 5, 4, 3, 2, 1]


def _sid_lon(jd, body):
    return swe.calc_ut(jd, body, swe.FLG_SIDEREAL)[0][0]


def _limbs(jd):
    sun, moon = _sid_lon(jd, swe.SUN), _sid_lon(jd, swe.MOON)
    diff = (moon - sun) % 360.0
    return {
        'tithi': int(diff // 12.0),                          # 0..29
        'nakshatra': int(moon // NAKSHATRA_SPAN) % 27,       # 0..26
        'yoga': int(((sun + moon) % 360.0) // NAKSHATRA_SPAN),  # 0..26
        'karana': int(diff // 6.0),                          # 0..59
    }


def _end_time(jd_start, key, max_days=2.0):
    """First moment after jd_start when limb `key` changes value (bisection, ~1 minute precision)."""
    start_val = _limbs(jd_start)[key]
    step = 1 / 24.0
    lo = jd_start
    hi = jd_start + step
    while _limbs(hi)[key] == start_val:
        lo = hi
        hi += step
        if hi - jd_start > max_days:
            return None
    while hi - lo > 1 / 1440.0:
        mid = (lo + hi) / 2
        if _limbs(mid)[key] == start_val:
            lo = mid
        else:
            hi = mid
    return hi


MEAN_ELONGATION_RATE = 12.190749  # degrees per day the Moon gains on the Sun


def _elongation(jd):
    return (_sid_lon(jd, swe.MOON) - _sid_lon(jd, swe.SUN)) % 360.0


def _new_moon(jd_guess):
    """Refine a guess to the exact new moon (Sun–Moon conjunction) nearest to it."""
    jd = jd_guess
    for _ in range(8):
        e = (_elongation(jd) + 180.0) % 360.0 - 180.0  # signed, near 0 at new moon
        jd -= e / MEAN_ELONGATION_RATE
    return jd


def lunar_month(jd):
    """Amanta month containing jd: named by the Sun's sidereal sign at the new moon that began it.
    A month in which the Sun changes no sign (no sankranti) is Adhika, named after the month that follows."""
    e = _elongation(jd)
    start = _new_moon(jd - e / MEAN_ELONGATION_RATE)
    if start > jd:  # refinement overshot into the next lunation
        start = _new_moon(start - 29.5)
    end = _new_moon(start + 29.53)
    sun_start = int(_sid_lon(start, swe.SUN) // 30)
    sun_end = int(_sid_lon(end, swe.SUN) // 30)
    index = (sun_start + 1) % 12  # Sun in Meena at the new moon → Chaitra
    return {'index': index, 'adhika': sun_start == sun_end, 'start_jd': start, 'end_jd': end}


def _karana_name(k):
    if k == 0:
        return 'Kimstughna'
    if k >= 57:
        return ['Shakuni', 'Chatushpada', 'Naga'][k - 57]
    return MOVABLE_KARANA[(k - 1) % 7]


def _tithi_name(t):
    paksha = 'Shukla' if t < 15 else 'Krishna'
    n = t % 15
    if n == 14:
        return paksha, ('Purnima' if paksha == 'Shukla' else 'Amavasya')
    return paksha, TITHI_NAMES[n]


def _rise_set(jd, lat, lon, flag):
    res, tret = swe.rise_trans(jd, swe.SUN, flag, (lon, lat, 0.0))
    return tret[0] if res == 0 else None


def compute_panchang(date, lat, lon, tz_name, ayanamsa='lahiri'):
    try:
        tz = pytz.timezone(tz_name)
    except Exception:
        raise ChartInputError(f'unknown time zone: {tz_name!r}')
    try:
        day = datetime.fromisoformat(date)
    except ValueError:
        raise ChartInputError('date must be YYYY-MM-DD')

    midnight_utc = tz.localize(day.replace(hour=0, minute=0)).astimezone(pytz.utc)
    jd0 = julian_day(midnight_utc)

    def to_local(jd):
        if jd is None:
            return None
        y, m, d, h = swe.revjul(jd)
        dt = datetime(y, m, d, tzinfo=pytz.utc) + timedelta(hours=h)
        return dt.astimezone(tz).isoformat(timespec='minutes')

    with _swe_lock:
        set_ayanamsa(ayanamsa)
        sunrise = _rise_set(jd0, lat, lon, swe.CALC_RISE)
        if sunrise is None:
            raise ChartInputError('no sunrise at this latitude on this date')
        sunset = _rise_set(sunrise, lat, lon, swe.CALC_SET)
        limbs = _limbs(sunrise)
        maasa = lunar_month(sunrise)
        sun_sign = int(_sid_lon(sunrise, swe.SUN) // 30)
        ends = {k: _end_time(sunrise, k) for k in ('tithi', 'nakshatra', 'yoga', 'karana')}

    weekday = (day.weekday() + 1) % 7  # python Monday=0 → Sunday=0
    eighth = (sunset - sunrise) / 8.0

    def segment(part):
        s = sunrise + (part - 1) * eighth
        return {'start': to_local(s), 'end': to_local(s + eighth)}

    paksha, tithi_name = _tithi_name(limbs['tithi'])

    # Chandramana year begins at Ugadi (Chaitra Shukla Prathama, Mar–Apr). Pushya–Phalguna falling
    # early in the Gregorian year still belong to the previous samvatsara.
    year = day.year if (maasa['index'] < 9 or day.month >= 6) else day.year - 1
    samvatsara = (year - PRABHAVA_YEAR) % 60
    rutu = maasa['index'] // 2
    uttarayana = sun_sign >= 9 or sun_sign <= 2  # Sun from Makara through Mithuna
    return {
        'date': date,
        'location': {'lat': lat, 'lon': lon, 'tz': tz_name},
        'samvatsara': {'index': samvatsara, 'name': SAMVATSARA_NAMES[samvatsara]},
        'ayana': {'key': 'uttarayana' if uttarayana else 'dakshinayana',
                  'name': 'Uttarayana' if uttarayana else 'Dakshinayana'},
        'rutu': {'index': rutu, 'name': RUTU_NAMES[rutu]},
        'maasa': {'index': maasa['index'], 'name': MAASA_NAMES[maasa['index']], 'adhika': maasa['adhika'],
                  'system': 'amanta'},
        'vara': {'index': weekday, 'name': VARA_NAMES[weekday]},
        'sunrise': to_local(sunrise),
        'sunset': to_local(sunset),
        'tithi': {'index': limbs['tithi'], 'paksha': paksha, 'name': tithi_name, 'ends': to_local(ends['tithi'])},
        'nakshatra': {'index': limbs['nakshatra'], 'name': NAKSHATRA[limbs['nakshatra']],
                      'ends': to_local(ends['nakshatra'])},
        'yoga': {'index': limbs['yoga'], 'name': YOGA_NAMES[limbs['yoga']], 'ends': to_local(ends['yoga'])},
        'karana': {'index': limbs['karana'], 'name': _karana_name(limbs['karana']), 'ends': to_local(ends['karana'])},
        'rahu_kala': segment(RAHU_KALA[weekday]),
        'yamaganda': segment(YAMAGANDA[weekday]),
        'gulika': segment(GULIKA[weekday]),
    }
