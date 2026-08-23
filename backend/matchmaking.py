"""
Matchmaking utilities for Vedic compatibility checks.

This module contains simple, explainable heuristics inspired by common porutham
checks: nakshatra porutham, manglik (Mangal Dosha) approximation, and a
combined compatibility score. The aim is not a full Vedic matching engine but a
practical starting point you can extend.
"""
from typing import Dict, Any


def is_manglik(ephem: Dict[str, Any]) -> bool:
    """Rough check for Mangal Dosha: Mars in 1,4,7,8 relative to ascendant.

    This function expects ephem to contain 'planets' and 'ascendant' entries
    with numeric 'lon' values (0-360). It's a heuristic and should be
    replaced with a full house-based calculation if you need authoritative
    results.
    """
    mars = ephem.get('planets', {}).get('mars', {})
    asc = ephem.get('ascendant', {})
    try:
        mars_lon = mars.get('lon')
        asc_lon = asc.get('lon')
        if mars_lon is None or asc_lon is None:
            return False
        # compute relative degrees from ascendant
        rel = (mars_lon - asc_lon) % 360
        # house index (0-based) where 0 => 1st house
        house = int(rel // 30)
        # common houses considered malefic for Mangal dosha: 1,4,7,8 (0-based: 0,3,6,7)
        return house in (0,3,6,7)
    except Exception:
        return False


def nakshatra_porutham(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    """Simplified nakshatra porutham check based on moon nakshatra index.

    Returns a small dict with match booleans and a score.
    """
    an = a.get('moon_nakshatra') or {}
    bn = b.get('moon_nakshatra') or {}
    ai = an.get('index')
    bi = bn.get('index')
    if ai is None or bi is None:
        return {'compatible': False, 'score': 0, 'reason': 'missing_nakshatra'}
    # exact same nakshatra is usually considered strong; nearby indices less so
    diff = abs(ai - bi)
    diff = min(diff, 27 - diff)
    if diff == 0:
        score = 100
    elif diff <= 2:
        score = 70
    elif diff <= 5:
        score = 40
    else:
        score = 10
    return {'compatible': score >= 50, 'score': score, 'diff': diff}


def match_profiles(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    """Combine quick checks into a single compatibility object.

    The output includes components so you can surface the reasoning in the UI.
    """
    manglik_a = is_manglik(a)
    manglik_b = is_manglik(b)
    nak = nakshatra_porutham(a, b)

    # combine into a score: nakshatra weight 0.7, manglik penalty 0.3
    nak_score = nak.get('score', 0)
    manglik_penalty = 0
    if manglik_a != manglik_b:
        # mismatched manglik is traditionally penalized
        manglik_penalty = 30

    total = max(0, nak_score * 0.7 - manglik_penalty * 0.3 + 30)
    # normalize 0-100
    total = min(100, int(total))

    return {
        'nakshatra': nak,
        'manglik': {'a': manglik_a, 'b': manglik_b},
        'score': total,
        'compatible': total >= 50
    }


if __name__ == '__main__':
    # small self-check
    demo_a = {'planets': {'mars': {'lon': 100}}, 'ascendant': {'lon': 80}, 'moon_nakshatra': {'index': 5}}
    demo_b = {'planets': {'mars': {'lon': 200}}, 'ascendant': {'lon': 190}, 'moon_nakshatra': {'index': 6}}
    print('Manglik A:', is_manglik(demo_a))
    print('Nakshatra porutham:', nakshatra_porutham(demo_a, demo_b))
    print('Match:', match_profiles(demo_a, demo_b))
