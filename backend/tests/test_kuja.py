import pytest

from kuja import (DHANU, KANYA, KARKA, KUMBHA, MAKARA, MEENA, MESHA, MITHUNA, SIMHA, TULA, VRISCHIKA, VRISHABHA,
                  kuja_compatibility, kuja_dosha, samya_planets)


def chart(mars, moon=TULA, venus=TULA, sun=DHANU, mercury=DHANU, jupiter=VRISHABHA, saturn=KANYA,
          rahu=MITHUNA, ketu=DHANU):
    """Sign placements; defaults are chosen so that no general exemption applies to Mars in Meena/Mithuna."""
    return {'mars': mars, 'moon': moon, 'venus': venus, 'sun': sun, 'mercury': mercury,
            'jupiter': jupiter, 'saturn': saturn, 'rahu': rahu, 'ketu': ketu}


def ref(result, name):
    return next(r for r in result['references'] if r['from'] == name)


def test_mars_in_7th_from_lagna_gives_dosha():
    # Lagna Kanya, Mars in Meena = 7th; Meena is not an exempt sign for the 7th
    m = kuja_dosha(chart(MEENA, moon=VRISHABHA, venus=VRISHABHA), KANYA)
    assert ref(m, 'lagna')['house'] == 7 and ref(m, 'lagna')['active']
    assert m['present'] and m['strength'] == 'mild' and m['active_from'] == ['lagna']


def test_first_house_is_not_a_south_indian_dosha_house():
    m = kuja_dosha(chart(MEENA, moon=VRISHABHA, venus=VRISHABHA), MEENA)
    assert ref(m, 'lagna')['house'] == 1 and not ref(m, 'lagna')['dosha_house']


def test_strength_counts_references():
    # Mars in Meena: 7th from Kanya Lagna, 10th from Mithuna Moon, 12th from Mesha Venus
    m = kuja_dosha(chart(MEENA, moon=MITHUNA, venus=MESHA), KANYA)
    assert ref(m, 'moon')['house'] == 10
    assert m['active_from'] == ['lagna', 'venus'] and m['strength'] == 'moderate'


@pytest.mark.parametrize('house,lagna,mars', [
    (2, VRISHABHA, MITHUNA), (2, SIMHA, KANYA), (4, MAKARA, MESHA), (4, SIMHA, VRISCHIKA),
    (7, MAKARA, KARKA), (7, KARKA, MAKARA), (8, VRISHABHA, DHANU), (8, SIMHA, MEENA),
    (12, MITHUNA, VRISHABHA), (12, VRISCHIKA, TULA),
])
def test_house_sign_exemptions(house, lagna, mars):
    m = kuja_dosha(chart(mars, moon=lagna, venus=lagna), lagna)
    r = ref(m, 'lagna')
    assert r['house'] == house and r['dosha_house'] and not r['active'] and r['cancelled_reason']


@pytest.mark.parametrize('lagna', [KARKA, SIMHA])
def test_karka_and_simha_lagna_have_no_dosha(lagna):
    mars = (lagna + 11) % 12  # 12th house, not one of its exempt signs
    m = kuja_dosha(chart(mars, moon=lagna, venus=lagna), lagna)
    assert not m['present'] and 'yogakaraka' in m['cancelled_reason']


def test_conjunction_with_jupiter_cancels():
    m = kuja_dosha(chart(MEENA, moon=MITHUNA, venus=MITHUNA, jupiter=MEENA), KANYA)
    assert not m['present'] and m['cancelled_reason'] == 'Mars is conjunct Jupiter'


def test_jupiter_aspect_cancels():
    # Jupiter in Vrischika aspects the 5th sign from it: Meena
    m = kuja_dosha(chart(MEENA, moon=MITHUNA, venus=MITHUNA, jupiter=VRISCHIKA), KANYA)
    assert not m['present'] and m['cancelled_reason'] == 'Mars is aspected by Jupiter'


def test_own_sign_cancels_only_where_the_house_table_says():
    # Tula lagna, Mars in Vrischika: 2nd house — own sign does not exempt the 2nd
    m = kuja_dosha(chart(VRISCHIKA, moon=SIMHA, venus=MITHUNA, jupiter=MITHUNA, mercury=SIMHA), TULA)
    assert m['present'] and ref(m, 'lagna')['active']
    # …but from the Moon in Simha, Vrischika is the 4th, which the table exempts
    assert ref(m, 'moon')['dosha_house'] and not ref(m, 'moon')['active']


def test_all_dosha_houses_exempt_is_reported_as_cancelled():
    m = kuja_dosha(chart(MEENA, moon=MITHUNA, venus=MITHUNA, jupiter=MEENA), KANYA)
    assert not m['present'] and m['strength'] == 'cancelled'


def test_mars_in_kumbha_is_no_longer_exempt():
    m = kuja_dosha(chart(KUMBHA, moon=SIMHA, venus=SIMHA), SIMHA + 1)  # Kanya lagna → 6th; Moon Simha → 7th
    assert ref(m, 'moon')['active'] and m['present']


def test_unknown_time_ignores_lagna():
    m = kuja_dosha(chart(MEENA, moon=VRISHABHA, venus=VRISHABHA), KANYA, time_known=False)
    assert not m['present'] and ref(m, 'lagna')['skipped']


def test_compatibility_both_and_none():
    yes = {'kuja': {'present': True}, 'samya': []}
    no = {'kuja': {'present': False}, 'samya': []}
    assert kuja_compatibility(yes, yes)['status'] == 'both'
    assert kuja_compatibility(no, no) == {'status': 'none', 'ok': True, 'balanced_by': []}
    assert kuja_compatibility(yes, no) == {'status': 'groom', 'ok': False, 'balanced_by': []}


def test_saturn_in_partner_dosha_house_balances():
    signs = chart(MESHA, moon=MESHA, saturn=MAKARA)  # Saturn in Makara is 4th from a Tula Lagna
    samya = samya_planets(signs, TULA)
    assert {'planet': 'saturn', 'from': 'lagna', 'house': 4} in samya
    r = kuja_compatibility({'kuja': {'present': False}, 'samya': samya}, {'kuja': {'present': True}, 'samya': []})
    assert r['status'] == 'bride' and r['ok'] and r['balanced_by'][0]['planet'] == 'saturn'
