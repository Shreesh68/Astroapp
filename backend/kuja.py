"""Kuja (Mangal / Sevvai) dosha, as reckoned in South India.

Mars in the 2nd, 4th, 7th, 8th or 12th house (whole-sign) counted from the Lagna, the Moon or Venus
gives the dosha. Lagna is the strongest reference, then Moon, then Venus; the more references
that show it, the stronger the dosha. (North Indian practice uses 1, 4, 7, 8, 12 from Lagna only.)

Exemptions are the core set common to South Indian texts and practitioners — Mars's sign in
the specific house, Lagna, Mars's own/exalted dignity, and association with benefics. Families and
astrologers apply these differently, so every exemption is reported with its reason rather than
silently dropping the dosha.

Sign indexes: Mesha 0 … Meena 11.
"""

DOSHA_HOUSES = (2, 4, 7, 8, 12)
REFERENCES = ('lagna', 'moon', 'venus')

MESHA, VRISHABHA, MITHUNA, KARKA, SIMHA, KANYA, TULA, VRISCHIKA, DHANU, MAKARA, KUMBHA, MEENA = range(12)

# No dosha when Mars, in the given house, occupies one of these signs
HOUSE_SIGN_EXEMPTIONS = {
    2: ((MITHUNA, KANYA), 'Mars in the 2nd house in Mithuna or Kanya'),
    4: ((MESHA, VRISCHIKA), 'Mars in the 4th house in Mesha or Vrischika'),
    7: ((KARKA, MAKARA), 'Mars in the 7th house in Karka or Makara'),
    8: ((DHANU, MEENA), 'Mars in the 8th house in Dhanu or Meena'),
    12: ((VRISHABHA, TULA), 'Mars in the 12th house in Vrishabha or Tula'),
}

# Malefics whose presence in dosha houses of the other chart balances Kuja dosha (dosha samya).
# The partner's own Mars is judged as their Kuja dosha instead.
SAMYA_PLANETS = ('saturn', 'rahu', 'ketu')


def house_from(sign, ref_sign):
    return (sign - ref_sign) % 12 + 1


def aspects(planet, from_sign, to_sign):
    """Graha drishti between signs: all planets aspect the 7th; Mars 4/8, Jupiter 5/9, Saturn 3/10 too."""
    h = house_from(to_sign, from_sign)
    special = {'mars': (4, 8), 'jupiter': (5, 9), 'saturn': (3, 10)}.get(planet, ())
    return h == 7 or h in special


def general_exemption(signs, asc_sign):
    """Exemptions that hold whichever house Mars occupies (Jataka Parijata: Jupiter or Mercury with or
    aspecting Mars; Karka/Simha Lagna, for which Mars is a yogakaraka). Returns the reason or None.
    asc_sign is None when the birth time (and so the Lagna) is unknown. Mars in its own or exalted
    sign cancels only where HOUSE_SIGN_EXEMPTIONS says so."""
    mars = signs['mars']
    if asc_sign in (KARKA, SIMHA):
        return 'Lagna is Karka or Simha, for which Mars is a yogakaraka'
    for p, label in (('jupiter', 'Jupiter'), ('mercury', 'Mercury')):
        if signs[p] == mars:
            return f'Mars is conjunct {label}'
    for p, label in (('jupiter', 'Jupiter'), ('mercury', 'Mercury')):
        if aspects(p, signs[p], mars):
            return f'Mars is aspected by {label}'
    return None


def kuja_dosha(signs, asc_sign, time_known=True):
    """signs: {planet: sign_index}. Lagna is skipped as a reference when the birth time is unknown."""
    mars = signs['mars']
    general = general_exemption(signs, asc_sign if time_known else None)
    refs = []
    for ref in REFERENCES:
        if ref == 'lagna' and not time_known:
            refs.append({'from': ref, 'house': None, 'dosha_house': False, 'active': False,
                         'cancelled_reason': None, 'skipped': 'birth time unknown'})
            continue
        ref_sign = asc_sign if ref == 'lagna' else signs[ref]
        h = house_from(mars, ref_sign)
        in_house = h in DOSHA_HOUSES
        reason = None
        if in_house:
            exempt_signs, why = HOUSE_SIGN_EXEMPTIONS[h]
            reason = why if mars in exempt_signs else general
        refs.append({'from': ref, 'house': h, 'dosha_house': in_house,
                     'active': in_house and reason is None, 'cancelled_reason': reason})

    active = [r['from'] for r in refs if r['active']]
    in_houses = [r for r in refs if r['dosha_house']]
    # 'cancelled': Mars is in a dosha house, but every one of them is exempt
    strength = ['none', 'mild', 'moderate', 'strong'][len(active)] if active or not in_houses else 'cancelled'
    by_ref = {r['from']: r for r in refs}
    return {
        'present': bool(active),
        'strength': strength,
        'active_from': active,
        'references': refs,
        # first exemption that removed an otherwise-present dosha (when no reference stays active)
        'cancelled_reason': None if active or not in_houses else in_houses[0]['cancelled_reason'],
        'mars_house_from_lagna': by_ref['lagna']['house'],
        'mars_house_from_moon': by_ref['moon']['house'],
        'mars_house_from_venus': by_ref['venus']['house'],
    }


def samya_planets(signs, asc_sign, time_known=True):
    """Malefics sitting in dosha houses from Lagna or Moon — they counterbalance the partner's dosha."""
    found = []
    refs = (('lagna', asc_sign), ('moon', signs['moon'])) if time_known else (('moon', signs['moon']),)
    for p in SAMYA_PLANETS:
        for ref, ref_sign in refs:
            h = house_from(signs[p], ref_sign)
            if h in DOSHA_HOUSES:
                found.append({'planet': p, 'from': ref, 'house': h})
                break
    return found


def kuja_compatibility(groom, bride):
    """groom/bride: {'kuja': kuja_dosha(...), 'samya': samya_planets(...)}"""
    g, b = groom['kuja']['present'], bride['kuja']['present']
    if g and b:
        return {'status': 'both', 'ok': True, 'balanced_by': []}
    if not g and not b:
        return {'status': 'none', 'ok': True, 'balanced_by': []}
    who, other = ('groom', bride) if g else ('bride', groom)
    return {'status': who, 'ok': bool(other['samya']), 'balanced_by': other['samya']}
