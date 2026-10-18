from fastapi.testclient import TestClient

from app import app

client = TestClient(app)
PERSON = {'date': '2000-02-19', 'time': '01:10', 'lat': 14.3159, 'lon': 74.4324, 'tz': 'Asia/Kolkata'}


def test_chart_ok():
    r = client.post('/api/chart', json=PERSON)
    assert r.status_code == 200
    assert r.json()['ascendant']['sign']


def test_chart_bad_tz_is_400():
    r = client.post('/api/chart', json={**PERSON, 'tz': 'Nowhere/Land'})
    assert r.status_code == 400
    assert 'time zone' in r.json()['detail']


def test_chart_requires_tz():
    r = client.post('/api/chart', json={k: v for k, v in PERSON.items() if k != 'tz'})
    assert r.status_code == 422


def test_match():
    bride = {**PERSON, 'date': '2002-07-05', 'time': '14:30'}
    r = client.post('/api/match', json={'groom': PERSON, 'bride': bride})
    assert r.status_code == 200
    m = r.json()['match']
    assert m['max'] == 36 and len(m['kootas']) == 8
    assert m['total'] == sum(k['score'] for k in m['kootas'])


def test_panchang():
    r = client.get('/api/panchang', params={'date': '2026-10-18', 'lat': 12.97, 'lon': 77.59, 'tz': 'Asia/Kolkata'})
    assert r.status_code == 200
    assert r.json()['tithi']['name']
