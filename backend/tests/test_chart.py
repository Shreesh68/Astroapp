from datetime import datetime

import pytest

from chart import ChartInputError, compute_chart
from constants import DASHA_ORDER


def test_sun_at_j2000_is_in_dhanu():
    # J2000.0: tropical Sun ≈ 280.46°, Lahiri ayanamsa ≈ 23.85° → sidereal ≈ 256.6° (16.6° Dhanu)
    c = compute_chart('2000-01-01', '12:00', 0.0, 0.0, 'UTC')
    assert c['planets']['sun']['sign'] == 'Dhanu'
    assert c['planets']['sun']['degree'] == pytest.approx(16.6, abs=0.15)


def test_chart_shape():
    c = compute_chart('2000-02-19', '01:10', 14.3159, 74.4324, 'Asia/Kolkata')
    assert set(c['planets']) == {'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'}
    assert (c['planets']['ketu']['lon'] - c['planets']['rahu']['lon']) % 360 == pytest.approx(180)
    assert all(1 <= p['house'] <= 12 for p in c['planets'].values())
    assert c['utc'].startswith('2000-02-18T19:40')  # IST is UTC+5:30
    assert c['moon_nakshatra']['name'] == c['planets']['moon']['nakshatra']


def test_local_time_zone_matters():
    ist = compute_chart('2000-02-19', '01:10', 12.97, 77.59, 'Asia/Kolkata')
    utc = compute_chart('2000-02-19', '01:10', 12.97, 77.59, 'UTC')
    assert ist['planets']['moon']['lon'] != pytest.approx(utc['planets']['moon']['lon'], abs=1)


@pytest.mark.parametrize('kwargs', [
    {'tz': 'Mars/Olympus'}, {'date': '19-02-2000'}, {'lat': 95.0}, {'ayanamsa': 'nope'},
])
def test_invalid_input_raises(kwargs):
    args = {'date': '2000-02-19', 'time': '01:10', 'lat': 12.97, 'lon': 77.59, 'tz': 'Asia/Kolkata', **kwargs}
    with pytest.raises(ChartInputError):
        compute_chart(**args)


def test_kuja_dosha_shape():
    c = compute_chart('2000-02-19', '01:10', 14.3159, 74.4324, 'Asia/Kolkata')
    m = c['manglik']
    assert [r['from'] for r in m['references']] == ['lagna', 'moon', 'venus']
    assert m['strength'] in ('none', 'mild', 'moderate', 'strong')


def test_unknown_time_skips_lagna_for_kuja():
    c = compute_chart('2000-02-19', '12:00', 14.3159, 74.4324, 'Asia/Kolkata', time_known=False)
    lagna = c['manglik']['references'][0]
    assert lagna['skipped'] and not lagna['active']
    assert c['manglik']['mars_house_from_lagna'] is None


def test_dasha_is_contiguous_and_spans_120_years():
    c = compute_chart('2000-02-19', '01:10', 14.3159, 74.4324, 'Asia/Kolkata')
    periods = c['dasha']['periods']
    assert periods[0]['lord'] == DASHA_ORDER[c['moon_nakshatra']['index'] % 9]
    for a, b in zip(periods, periods[1:]):
        assert a['end'] == b['start']
        assert DASHA_ORDER.index(b['lord']) == (DASHA_ORDER.index(a['lord']) + 1) % 9
    start = datetime.fromisoformat(periods[0]['start'][:-1])
    end = datetime.fromisoformat(periods[-1]['end'][:-1])
    assert (end - start).days / 365.25 >= 120
    assert periods[0]['antardashas'][0]['start'] == periods[0]['start']
