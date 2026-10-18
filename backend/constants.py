"""Shared Jyotish constants. Indexes are 0-based everywhere (Mesha = 0, Ashwini = 0)."""

RASHI = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
         'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena']

NAKSHATRA = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
    'Uttara Bhadrapada', 'Revati',
]

NAKSHATRA_SPAN = 360.0 / 27.0  # 13°20'

PLANETS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']

# Lord of each rashi
RASHI_LORD = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
              'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter']

# Naisargika (natural) relationships, Parashara
FRIENDS = {
    'sun':     {'moon', 'mars', 'jupiter'},
    'moon':    {'sun', 'mercury'},
    'mars':    {'sun', 'moon', 'jupiter'},
    'mercury': {'sun', 'venus'},
    'jupiter': {'sun', 'moon', 'mars'},
    'venus':   {'mercury', 'saturn'},
    'saturn':  {'mercury', 'venus'},
}
ENEMIES = {
    'sun':     {'venus', 'saturn'},
    'moon':    set(),
    'mars':    {'mercury'},
    'mercury': {'moon'},
    'jupiter': {'mercury', 'venus'},
    'venus':   {'sun', 'moon'},
    'saturn':  {'sun', 'moon', 'mars'},
}


def relation(a, b):
    """How planet `a` regards planet `b`: 'friend' | 'neutral' | 'enemy' (same planet counts as friend)."""
    if a == b or b in FRIENDS[a]:
        return 'friend'
    if b in ENEMIES[a]:
        return 'enemy'
    return 'neutral'


# Vimshottari dasha sequence and years; nakshatra N is ruled by DASHA_ORDER[N % 9]
DASHA_ORDER = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']
DASHA_YEARS = {'ketu': 7, 'venus': 20, 'sun': 6, 'moon': 10, 'mars': 7,
               'rahu': 18, 'jupiter': 16, 'saturn': 19, 'mercury': 17}


def rashi_index(lon):
    return int(lon // 30.0) % 12


def nakshatra_of(lon):
    """Return (index, pada 1-4, fraction of nakshatra elapsed)."""
    idx = int(lon // NAKSHATRA_SPAN) % 27
    frac = (lon % NAKSHATRA_SPAN) / NAKSHATRA_SPAN
    return idx, min(int(frac * 4) + 1, 4), frac
