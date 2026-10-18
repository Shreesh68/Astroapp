import pytest


from panchang import compute_panchang

BLR = (12.9716, 77.5946, 'Asia/Kolkata')


def test_sharad_purnima_2024():
    # Full moon 17 Oct 2024 11:26 UTC; Purnima tithi prevails at Bengaluru sunrise that day
    p = compute_panchang('2024-10-17', *BLR)
    assert p['tithi']['name'] == 'Purnima' and p['tithi']['paksha'] == 'Shukla'
    assert p['vara']['name'] == 'Thursday'


def test_sunrise_and_rahu_kala_sunday():
    p = compute_panchang('2026-10-18', *BLR)
    assert p['vara']['name'] == 'Sunday'
    assert p['sunrise'].startswith('2026-10-18T06:')
    # Sunday Rahu Kala is the last eighth of the day, ending at sunset
    assert p['rahu_kala']['end'] == p['sunset']


def test_end_times_are_after_sunrise():
    p = compute_panchang('2026-10-18', *BLR)
    for limb in ('tithi', 'nakshatra', 'yoga', 'karana'):
        assert p[limb]['ends'] > p['sunrise']


@pytest.mark.parametrize('date,maasa,adhika,rutu,ayana,samvatsara', [
    ('2026-10-18', 'Ashwayuja', False, 'Sharad', 'Dakshinayana', 'Parabhava'),
    ('2026-01-20', 'Magha', False, 'Shishira', 'Uttarayana', 'Vishvavasu'),   # before Ugadi 2026
    ('2026-03-25', 'Chaitra', False, 'Vasanta', 'Uttarayana', 'Parabhava'),   # after Ugadi (19 Mar 2026)
    ('2026-05-25', 'Jyeshtha', True, 'Grishma', 'Uttarayana', 'Parabhava'),   # Adhika Jyeshtha 2026
    ('2026-06-20', 'Jyeshtha', False, 'Grishma', 'Uttarayana', 'Parabhava'),  # Nija Jyeshtha
    ('2023-07-25', 'Shravana', True, 'Varsha', 'Dakshinayana', 'Shobhakrit'), # Adhika Shravana 2023
    ('2024-10-17', 'Ashwayuja', False, 'Sharad', 'Dakshinayana', 'Krodhi'),
])
def test_year_and_month(date, maasa, adhika, rutu, ayana, samvatsara):
    p = compute_panchang(date, *BLR)
    assert p['maasa']['name'] == maasa and p['maasa']['adhika'] is adhika
    assert p['rutu']['name'] == rutu
    assert p['ayana']['name'] == ayana
    assert p['samvatsara']['name'] == samvatsara
