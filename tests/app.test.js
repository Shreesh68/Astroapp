import { beforeEach, describe, expect, it } from 'vitest'
import { chartFor } from '../src/engine'
import { checkMatch } from '../src/lib/astrologer'
import { readProfiles, rememberGender, removeProfile, replaceProfiles, saveEdits, saveProfile, samePerson, setCloudSink, setSelf } from '../src/lib/profiles'
import { paramsToProfile, profileToParams } from '../src/lib/share'

const person = (over = {}) => ({ name: 'Pooja', gender: 'female', date: '2001-08-20', time: '11:55', timeUnknown: false, place: 'Kumta', lat: 14.4271622, lon: 74.4117058, tz: 'Asia/Kolkata', ...over })

beforeEach(() => { localStorage.clear(); setCloudSink(null) })

describe('saved people', () => {
  it('saving the same person twice keeps one copy', () => {
    saveProfile(person()); saveProfile(person())
    expect(readProfiles()).toHaveLength(1)
  })

  it('edits to a saved person are kept (the birth-time bug)', () => {
    const saved = saveProfile(person())
    saveEdits({ ...saved, time: '10:30' })
    expect(readProfiles()[0].time).toBe('10:30')
  })

  it('a gender learned later is remembered', () => {
    const saved = saveProfile(person({ gender: '' }))
    rememberGender({ ...saved, gender: 'female' })
    expect(readProfiles()[0].gender).toBe('female')
  })

  it('only one person can be "My kundli"', () => {
    const a = saveProfile(person()), b = saveProfile(person({ name: 'Ravi', gender: 'male', date: '1995-03-05' }))
    setSelf(a.id); setSelf(b.id)
    expect(readProfiles().filter(p => p.self).map(p => p.name)).toEqual(['Ravi'])
  })

  it('same birth moment = same person, whatever the place spelling', () => {
    expect(samePerson(person(), person({ place: 'Honnavar', lat: 14.28 }))).toBe(true)
    expect(samePerson(person(), person({ time: '11:56' }))).toBe(false)
  })

  it('every change is mirrored to the account while logged in', () => {
    const calls = []
    setCloudSink({ put: p => calls.push(['put', p.name]), remove: id => calls.push(['remove', id]) })
    const saved = saveProfile(person())
    saveEdits({ ...saved, time: '10:30' })
    removeProfile(saved.id)
    expect(calls).toEqual([['put', 'Pooja'], ['put', 'Pooja'], ['remove', saved.id]])
  })

  it("the account's copy replaces the list without echoing back", () => {
    const calls = []
    setCloudSink({ put: () => calls.push('put'), remove: () => calls.push('remove') })
    replaceProfiles([{ ...person(), id: 'x', savedAt: 1 }])
    expect(readProfiles().map(p => p.id)).toEqual(['x'])
    expect(calls).toEqual([])
  })
})

describe('share links', () => {
  it('round-trip a person, gender included', () => {
    const back = paramsToProfile(new URLSearchParams(profileToParams(person()).toString()))
    expect(back).toMatchObject({ name: 'Pooja', gender: 'female', date: '2001-08-20', time: '11:55', place: 'Kumta', tz: 'Asia/Kolkata' })
  })

  it('reject broken links', () => {
    expect(paramsToProfile(new URLSearchParams('n=X&d=2001-02-30x'))).toBeNull()
  })
})

describe('matchmaking from the chat (check_match)', () => {
  const ravi = person({ name: 'Ravi', gender: 'male', date: '1995-03-05', time: '19:45', place: 'Honnavar', lat: 14.2810827, lon: 74.4446716 })
  const raviChart = chartFor({ date: ravi.date, time: ravi.time, lat: ravi.lat, lon: ravi.lon, tz: ravi.tz })
  const run = async args => JSON.parse(await checkMatch(JSON.stringify(args), ravi, raviChart))

  it('matches with someone saved in the app by name alone; the asker is the groom by gender', async () => {
    saveProfile(person()) // Pooja, younger
    const r = await run({ partner_name: 'pooja' })
    expect(r.groom.name).toBe('Ravi')
    expect(r.bride.name).toBe('Pooja')
    expect(r.gunas).toMatch(/ of 36$/)
    expect(r.ages).toMatch(/groom is .* older/)
  })

  it('asks before matching with an older bride, and matches once allowed', async () => {
    saveProfile(person({ name: 'Kavya', date: '1993-02-02', time: '18:15', place: 'Mysuru', lat: 12.3, lon: 76.64 }))
    const first = await run({ partner_name: 'Kavya' })
    expect(first.needs_confirmation).toBe(true)
    const second = await run({ partner_name: 'Kavya', allow_elder_bride: true })
    expect(second.ages).toMatch(/bride is .* older/)
    expect(second.verdict_reasons).toContain('bride_older (caution)')
  })

  it('asks for missing details of someone not saved', async () => {
    const r = await checkMatch(JSON.stringify({ partner_name: 'Meghana', birth_date: '1998-06-12' }), ravi, raviChart)
    expect(r).toMatch(/ask the person for the birth time, birth place/)
  })

  it('needs the asker\'s gender', async () => {
    const r = await checkMatch(JSON.stringify({ partner_name: 'Pooja' }), { ...ravi, gender: '' }, raviChart)
    expect(r).toMatch(/gender of the person asking is not known/)
  })
})
