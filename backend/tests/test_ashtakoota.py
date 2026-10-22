import pytest

from ashtakoota import (GANA_OF_NAKSHATRA, NADI_OF_NAKSHATRA, YONI_NAMES, YONI_OF_NAKSHATRA, YONI_TABLE,
                        ashtakoota, maitri, tara_from)
from constants import NAKSHATRA_SPAN


def moon_at(nakshatra_index, pada=1):
    """A Moon longitude in the middle of the given nakshatra pada."""
    return nakshatra_index * NAKSHATRA_SPAN + (pada - 0.5) * NAKSHATRA_SPAN / 4


def scores(result):
    return {k['key']: k['score'] for k in result['kootas']}


def test_tables_have_one_entry_per_nakshatra():
    assert len(YONI_OF_NAKSHATRA) == len(GANA_OF_NAKSHATRA) == len(NADI_OF_NAKSHATRA) == 27


def test_yoni_table_is_symmetric_with_full_diagonal():
    for i in range(14):
        assert YONI_TABLE[i][i] == 4
        for j in range(14):
            assert YONI_TABLE[i][j] == YONI_TABLE[j][i]


@pytest.mark.parametrize('a,b', [('Horse', 'Buffalo'), ('Elephant', 'Lion'), ('Sheep', 'Monkey'),
                                 ('Serpent', 'Mongoose'), ('Dog', 'Deer'), ('Cat', 'Rat'), ('Cow', 'Tiger')])
def test_yoni_sworn_enemies_score_zero(a, b):
    assert YONI_TABLE[YONI_NAMES.index(a)][YONI_NAMES.index(b)] == 0


def test_nadi_groups_have_nine_nakshatras_each():
    assert [NADI_OF_NAKSHATRA.count(n) for n in range(3)] == [9, 9, 9]


def test_tara_counting():
    assert tara_from(0, 0) == 0   # Janma
    assert tara_from(0, 2) == 2   # Vipat
    assert tara_from(3, 0) == 6   # 25th star from Rohini → Vadha


def test_maitri():
    assert maitri('sun', 'sun') == 5
    assert maitri('mars', 'venus') == 3      # neutral both ways
    assert maitri('sun', 'saturn') == 0      # mutual enemies
    assert maitri('moon', 'mercury') == 1    # friend / enemy


def test_hand_worked_example():
    # Groom: Moon 5° Mesha (Ashwini). Bride: Moon 20° Vrishabha (Rohini).
    r = ashtakoota(5.0, 50.0)
    assert scores(r) == {'varna': 1, 'vashya': 2, 'tara': 1.5, 'yoni': 3,
                         'graha_maitri': 3, 'gana': 6, 'bhakoot': 0, 'nadi': 8}
    assert r['total'] == 24.5
    assert r['verdict'] == 'average'
    assert r['doshas'] == [{'key': 'bhakoot', 'cancelled_reason': None}]


def test_same_nakshatra_same_pada_is_not_recommended_whatever_the_score():
    r = ashtakoota(moon_at(7, 2), moon_at(7, 2))
    s = scores(r)
    assert s['nadi'] == 0 and s['tara'] == 3 and s['yoni'] == 4 and s['gana'] == 6 and s['bhakoot'] == 7
    assert r['total'] == 28
    assert r['verdict'] == 'not_recommended' and r['verdict_reason'] == 'ekanakshatra'
    assert r['doshas'] == [{'key': 'nadi', 'cancelled_reason': None},
                           {'key': 'ekanakshatra', 'cancelled_reason': None, 'same_rashi': True, 'same_pada': True}]


def test_shared_star_outside_permitted_list_is_not_recommended():
    r = ashtakoota(moon_at(2, 1), moon_at(2, 3))  # Krittika, different padas
    assert r['verdict'] == 'not_recommended'
    assert not next(d for d in r['doshas'] if d['key'] == 'ekanakshatra')['cancelled_reason']


def test_nadi_dosha_cancelled_for_different_padas():
    r = ashtakoota(moon_at(7, 1), moon_at(7, 3))
    assert r['doshas'][0]['cancelled_reason'] == 'Same nakshatra but different padas'


def test_total_is_bounded():
    for g in range(27):
        for b in range(27):
            total = ashtakoota(moon_at(g), moon_at(b))['total']
            assert 0 <= total <= 36
