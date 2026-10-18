"""Vimshottari dasha periods (120-year cycle) from the Moon's sidereal longitude."""
from datetime import datetime, timedelta

from constants import DASHA_ORDER, DASHA_YEARS, nakshatra_of

YEAR_DAYS = 365.25
TOTAL_YEARS = 120


def _iso(dt):
    return dt.isoformat(timespec='minutes') + 'Z'


def _sub_periods(lord, start, years):
    """Antardashas within a mahadasha: same sequence starting from the mahadasha lord."""
    out = []
    i = DASHA_ORDER.index(lord)
    t = start
    for k in range(9):
        sub = DASHA_ORDER[(i + k) % 9]
        span = timedelta(days=years * DASHA_YEARS[sub] / TOTAL_YEARS * YEAR_DAYS)
        out.append({'lord': sub, 'start': t, 'end': t + span})
        t += span
    return out


def vimshottari(moon_lon, birth_utc: datetime):
    """Mahadashas covering 120 years from birth. The first one is partial (the 'balance' at birth).

    Times are UTC ISO strings. The first mahadasha's antardashas are computed from its theoretical
    start (before birth) so sub-period boundaries are correct, then clipped to birth.
    """
    nak, _, frac = nakshatra_of(moon_lon)
    first = DASHA_ORDER[nak % 9]
    birth = birth_utc.replace(tzinfo=None)

    elapsed_years = DASHA_YEARS[first] * frac
    t = birth - timedelta(days=elapsed_years * YEAR_DAYS)
    end_of_life = birth + timedelta(days=TOTAL_YEARS * YEAR_DAYS)

    periods = []
    i = DASHA_ORDER.index(first)
    while t < end_of_life:
        lord = DASHA_ORDER[i % 9]
        years = DASHA_YEARS[lord]
        end = t + timedelta(days=years * YEAR_DAYS)
        subs = [{'lord': s['lord'], 'start': _iso(max(s['start'], birth)), 'end': _iso(s['end'])}
                for s in _sub_periods(lord, t, years) if s['end'] > birth]
        periods.append({
            'lord': lord,
            'years': years,
            'start': _iso(max(t, birth)),
            'end': _iso(end),
            'antardashas': subs,
        })
        t = end
        i += 1

    return {
        'balance_at_birth': {'lord': first, 'years': round(DASHA_YEARS[first] * (1 - frac), 4)},
        'periods': periods,
    }
