import json
from types import SimpleNamespace as NS

import pytest
from fastapi.testclient import TestClient

import ask
from app import app

client = TestClient(app)
BIRTH = {'name': 'Asha', 'date': '1990-08-15', 'time': '06:30', 'lat': 14.2251, 'lon': 76.398,
         'tz': 'Asia/Kolkata', 'place': 'Chitradurga'}


def body(*questions, lang='en'):
    msgs = []
    for i, q in enumerate(questions):
        msgs.append({'role': 'user' if i % 2 == 0 else 'assistant', 'content': q})
    return {'birth': BIRTH, 'messages': msgs, 'lang': lang}


class FakeStream:
    def __init__(self, events, final):
        self.events, self.final = events, final

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def __iter__(self):
        return iter(self.events)

    def get_final_message(self):
        return self.final


class FakeClient:
    """Plays back one scripted model response per round and records each request."""

    def __init__(self, rounds):
        self.rounds, self.calls = list(rounds), []
        self.beta = NS(messages=NS(stream=self.stream))

    def stream(self, **kwargs):
        self.calls.append(json.loads(json.dumps(kwargs, default=lambda o: o.__dict__)))
        return self.rounds.pop(0)


def text_round(text, stop='end_turn'):
    events = [NS(type='content_block_start', content_block=NS(type='text')), NS(type='text', text=text)]
    return FakeStream(events, NS(stop_reason=stop, content=[NS(type='text', text=text)]))


def tool_round(name, args):
    block = NS(type='tool_use', id='tu_1', name=name, input=args)
    events = [NS(type='content_block_start', content_block=NS(type='tool_use', name=name))]
    return FakeStream(events, NS(stop_reason='tool_use', content=[block]))


def events_of(r):
    return [json.loads(line[6:]) for line in r.text.split('\n\n') if line.startswith('data: ')]


@pytest.fixture
def api_key(monkeypatch):
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test')
    ask._hits.clear()


def use(monkeypatch, fake):
    monkeypatch.setattr(ask, 'client', lambda: fake)
    return fake


def test_not_configured_is_503(monkeypatch):
    monkeypatch.delenv('ANTHROPIC_API_KEY', raising=False)
    monkeypatch.delenv('ANTHROPIC_AUTH_TOKEN', raising=False)
    assert client.post('/api/ask', json=body('Hi')).status_code == 503


def test_must_end_with_question(api_key):
    assert client.post('/api/ask', json=body('Hi', 'Hello')).status_code == 400


def test_streams_answer_after_tool_call(api_key, monkeypatch):
    fake = use(monkeypatch, FakeClient([
        tool_round('find_sign_changes', {'planet': 'saturn', 'start_date': '2025-01-01', 'end_date': '2030-01-01'}),
        text_round('Saturn enters Meena in 2025.'),
    ]))
    r = client.post('/api/ask', json=body('When does Saturn change sign?'))
    assert r.status_code == 200
    ev = events_of(r)
    assert ev[0] == {'type': 'tool', 'name': 'find_sign_changes'}
    assert ''.join(e['text'] for e in ev if e['type'] == 'text') == 'Saturn enters Meena in 2025.'
    assert ev[-1] == {'type': 'done'}

    first, second = fake.calls
    # the chart goes in front of the first question, the language note last
    assert 'Lagna: Simha' in first['messages'][0]['content'][0]['text']
    assert first['messages'][-1]['role'] == 'system'
    assert first['fallbacks'] == 'default'
    result = second['messages'][-1]['content'][0]
    assert result['tool_use_id'] == 'tu_1' and not result['is_error']
    assert json.loads(result['content'])['changes'][0]['to'] == 'Meena'


def test_bad_tool_input_is_reported_to_the_model(api_key, monkeypatch):
    fake = use(monkeypatch, FakeClient([tool_round('get_panchang', {'date': 'tomorrow'}), text_round('ok')]))
    client.post('/api/ask', json=body('Panchang?'))
    result = fake.calls[1]['messages'][-1]['content'][0]
    assert result['is_error'] and 'YYYY-MM-DD' in result['content']


def test_refusal_resets_partial_answer(api_key, monkeypatch):
    use(monkeypatch, FakeClient([text_round('partial', stop='refusal')]))
    ev = events_of(client.post('/api/ask', json=body('?')))
    assert ev[-2:] == [{'type': 'reset'}, {'type': 'error', 'message': 'refused'}]


def test_kannada_note(api_key, monkeypatch):
    fake = use(monkeypatch, FakeClient([text_round('ಸರಿ')]))
    client.post('/api/ask', json=body('ನನ್ನ ದಶೆ?', lang='kn'))
    assert 'Kannada' in fake.calls[0]['messages'][-1]['content']


def test_rate_limit(api_key, monkeypatch):
    monkeypatch.setattr(ask, 'RATE_LIMIT', 1)
    use(monkeypatch, FakeClient([text_round('one'), text_round('two')]))
    assert client.post('/api/ask', json=body('1')).status_code == 200
    assert client.post('/api/ask', json=body('2')).status_code == 429


def test_unknown_birth_time_hides_houses():
    natal = ask.compute_chart('1990-08-15', '12:00', 14.2, 76.4, 'Asia/Kolkata', 'lahiri', False)
    b = ask.Birth(**{**BIRTH, 'time': '12:00', 'time_known': False})
    from datetime import date
    text = ask.chart_summary(b, natal, date(2026, 10, 22))
    assert 'Lagna: not reliable' in text and 'house ' not in text
