"""Ashtakoota (Guna Milan) — the 36-point compatibility check, computed from each person's Moon.

Only the Moon's sidereal longitude is needed: it fixes the janma rashi and janma nakshatra, from which
every koota is derived. Where traditions differ (Vashya and Gana tables in particular) the most
commonly published North/South Indian software convention is used; results should be read as a
starting point for an astrologer, not a verdict.
"""
from constants import NAKSHATRA, RASHI, RASHI_LORD, nakshatra_of, rashi_index, relation

# ── 1. Varna (1) ───────────────────────────────────────────────────────────
VARNA_NAMES = ['Shudra', 'Vaishya', 'Kshatriya', 'Brahmin']  # rank 0..3
# Water signs Brahmin, fire Kshatriya, earth Vaishya, air Shudra
VARNA_OF_RASHI = [2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3]

# ── 2. Vashya (2) ──────────────────────────────────────────────────────────
VASHYA_NAMES = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta']
# rows = groom, cols = bride
VASHYA_TABLE = [
    [2,   1,   1,   0.5, 1],
    [1,   2,   0.5, 0,   1],
    [1,   0.5, 2,   1,   1],
    [0.5, 0,   1,   2,   0],
    [1,   1,   1,   0,   2],
]


def vashya_group(lon):
    r, deg = rashi_index(lon), lon % 30.0
    if r in (0, 1):            # Mesha, Vrishabha
        return 0
    if r in (2, 5, 6, 10):     # Mithuna, Kanya, Tula, Kumbha
        return 1
    if r in (3, 11):           # Karka, Meena
        return 2
    if r == 4:                 # Simha
        return 3
    if r == 7:                 # Vrischika
        return 4
    if r == 8:                 # Dhanu: first half human, second half quadruped
        return 1 if deg < 15 else 0
    return 0 if deg < 15 else 2  # Makara: first half quadruped, second half aquatic


# ── 3. Tara (3) ────────────────────────────────────────────────────────────
TARA_NAMES = ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Ati-Mitra']
BAD_TARAS = {2, 4, 6}  # Vipat, Pratyari, Vadha (0-based)


def tara_from(a, b):
    """Tara (0-based) of nakshatra b counted from nakshatra a."""
    return ((b - a) % 27) % 9


# ── 4. Yoni (4) ────────────────────────────────────────────────────────────
YONI_NAMES = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
              'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion']
YONI_OF_NAKSHATRA = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1]
# Symmetric; sworn enemies (Horse–Buffalo, Elephant–Lion, Sheep–Monkey, Serpent–Mongoose,
# Dog–Deer, Cat–Rat, Cow–Tiger) score 0.
YONI_TABLE = [
    # Ho El Sh Se Do Ca Ra Co Bu Ti De Mo Mn Li
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 1, 3, 2, 1],  # Horse
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],  # Elephant
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],  # Sheep
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],  # Serpent
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],  # Dog
    [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],  # Cat
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],  # Rat
    [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],  # Cow
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],  # Buffalo
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],  # Tiger
    [1, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],  # Deer
    [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],  # Monkey
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],  # Mongoose
    [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],  # Lion
]

# ── 5. Graha Maitri (5) ────────────────────────────────────────────────────
MAITRI_POINTS = {
    ('friend', 'friend'): 5,
    ('friend', 'neutral'): 4,
    ('neutral', 'neutral'): 3,
    ('friend', 'enemy'): 1,
    ('neutral', 'enemy'): 0.5,
    ('enemy', 'enemy'): 0,
}


def maitri(lord_a, lord_b):
    pair = tuple(sorted((relation(lord_a, lord_b), relation(lord_b, lord_a)),
                        key=['friend', 'neutral', 'enemy'].index))
    return MAITRI_POINTS[pair]


# ── 6. Gana (6) ────────────────────────────────────────────────────────────
GANA_NAMES = ['Deva', 'Manushya', 'Rakshasa']
GANA_OF_NAKSHATRA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0]
# rows = groom, cols = bride
GANA_TABLE = [
    [6, 6, 0],
    [5, 6, 0],
    [1, 0, 6],
]

# ── 7. Bhakoot (7) ─────────────────────────────────────────────────────────
BAD_BHAKOOT = {(2, 12), (12, 2), (5, 9), (9, 5), (6, 8), (8, 6)}

# ── 8. Nadi (8) ────────────────────────────────────────────────────────────
NADI_NAMES = ['Adi', 'Madhya', 'Antya']
NADI_OF_NAKSHATRA = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2]


def describe_moon(lon):
    nak, pada, _ = nakshatra_of(lon)
    r = rashi_index(lon)
    return {
        'rashi': RASHI[r], 'rashi_index': r, 'rashi_lord': RASHI_LORD[r],
        'nakshatra': NAKSHATRA[nak], 'nakshatra_index': nak, 'pada': pada,
        'varna': VARNA_NAMES[VARNA_OF_RASHI[r]],
        'vashya': VASHYA_NAMES[vashya_group(lon)],
        'yoni': YONI_NAMES[YONI_OF_NAKSHATRA[nak]],
        'gana': GANA_NAMES[GANA_OF_NAKSHATRA[nak]],
        'nadi': NADI_NAMES[NADI_OF_NAKSHATRA[nak]],
    }


def verdict(total):
    if total >= 32:
        return 'excellent'
    if total >= 25:
        return 'very_good'
    if total >= 18:
        return 'average'
    return 'not_recommended'


def ashtakoota(groom_moon_lon, bride_moon_lon):
    g, b = describe_moon(groom_moon_lon), describe_moon(bride_moon_lon)
    gn, bn = g['nakshatra_index'], b['nakshatra_index']
    gr, br = g['rashi_index'], b['rashi_index']
    kootas = []

    def add(key, score, maximum, detail):
        kootas.append({'key': key, 'score': score, 'max': maximum, 'detail': detail})

    add('varna', 1 if VARNA_OF_RASHI[gr] >= VARNA_OF_RASHI[br] else 0, 1,
        f"Groom {g['varna']}, bride {b['varna']}")

    add('vashya', VASHYA_TABLE[vashya_group(groom_moon_lon)][vashya_group(bride_moon_lon)], 2,
        f"Groom {g['vashya']}, bride {b['vashya']}")

    t_bg = tara_from(bn, gn)  # groom's star counted from bride's
    t_gb = tara_from(gn, bn)
    tara = (0 if t_bg in BAD_TARAS else 1.5) + (0 if t_gb in BAD_TARAS else 1.5)
    add('tara', tara, 3, f"{TARA_NAMES[t_bg]} from bride, {TARA_NAMES[t_gb]} from groom")

    add('yoni', YONI_TABLE[YONI_OF_NAKSHATRA[gn]][YONI_OF_NAKSHATRA[bn]], 4,
        f"Groom {g['yoni']}, bride {b['yoni']}")

    add('graha_maitri', maitri(g['rashi_lord'], b['rashi_lord']), 5,
        f"Rashi lords {g['rashi_lord'].title()} and {b['rashi_lord'].title()}")

    add('gana', GANA_TABLE[GANA_OF_NAKSHATRA[gn]][GANA_OF_NAKSHATRA[bn]], 6,
        f"Groom {g['gana']}, bride {b['gana']}")

    pos_g_from_b = (gr - br) % 12 + 1
    pos_b_from_g = (br - gr) % 12 + 1
    bhakoot_bad = (pos_g_from_b, pos_b_from_g) in BAD_BHAKOOT
    add('bhakoot', 0 if bhakoot_bad else 7, 7, f"Rashis are {pos_g_from_b}/{pos_b_from_g} from each other")

    nadi_same = NADI_OF_NAKSHATRA[gn] == NADI_OF_NAKSHATRA[bn]
    add('nadi', 0 if nadi_same else 8, 8, f"Groom {g['nadi']}, bride {b['nadi']}")

    doshas = []
    if nadi_same:
        cancel = None
        if gr == br and gn != bn:
            cancel = 'Same rashi but different nakshatras'
        elif gn == bn and gr != br:
            cancel = 'Same nakshatra but different rashis'
        elif gn == bn and g['pada'] != b['pada']:
            cancel = 'Same nakshatra but different padas'
        doshas.append({'key': 'nadi', 'cancelled_reason': cancel})
    if bhakoot_bad:
        lg, lb = g['rashi_lord'], b['rashi_lord']
        cancel = None
        if lg == lb:
            cancel = 'Both rashis share the same lord'
        elif relation(lg, lb) == 'friend' and relation(lb, lg) == 'friend':
            cancel = 'Rashi lords are mutual friends'
        doshas.append({'key': 'bhakoot', 'cancelled_reason': cancel})
    if kootas[5]['score'] == 0:
        doshas.append({'key': 'gana', 'cancelled_reason': None})

    total = sum(k['score'] for k in kootas)
    return {
        'groom': g,
        'bride': b,
        'kootas': kootas,
        'total': total,
        'max': 36,
        'verdict': verdict(total),
        'doshas': doshas,
    }
