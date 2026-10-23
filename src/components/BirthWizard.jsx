import { useState } from 'react'
import { DateTime } from 'luxon'
import PlaceSearch from './PlaceSearch'
import { DateFields, TimeFields } from './DateTimeFields'
import { useLanguage } from '../contexts/LanguageContext'
import { samePerson, useProfiles } from '../lib/profiles'
import { getTimezone } from '../lib/geocode'
import { fmtLongDate, fmtTime } from '../lib/dates'

// gender is asked only when drawing a chart: a groom is male and a bride female
const STEPS = { chart: ['name', 'gender', 'date', 'time', 'place', 'review'], other: ['name', 'date', 'time', 'place', 'review'] }
const ROLE_GENDER = { groom: 'male', bride: 'female' }

const EMPTY = { name: '', gender: '', date: '', time: '', timeUnknown: false, place: '', lat: null, lon: null, tz: null }

/**
 * One-question-at-a-time birth details form.
 *   role: 'chart' | 'groom' | 'bride' | 'self' (the logged-in person's own kundli) — changes the wording
 *   initial: a profile to start from (skips straight to review)
 *   initialName: a name to start with (e.g. from the Google account)
 *   other: the person already chosen for the other side of a match (never offered again)
 *   onSubmit(profile, { save })
 */
export default function BirthWizard({ role = 'chart', initial = null, initialName = '', onSubmit, other = null }) {
  const { t, lang } = useLanguage()
  const { profiles } = useProfiles()
  const STEPS_FOR = STEPS[role === 'chart' || role === 'self' ? 'chart' : 'other']
  const roleGender = ROLE_GENDER[role]
  // a groom is picked only from men and a bride only from women (people saved before gender was asked
  // are offered on both sides); never the person already on the other side
  const choices = role === 'self' ? [] : profiles.filter(p => !samePerson(p, other) && (!roleGender || !p.gender || p.gender === roleGender))
  const [data, setData] = useState(initial || { ...EMPTY, name: initialName })
  const [step, setStep] = useState(initial ? 'review' : choices.length ? 'pick' : 'name')
  const [error, setError] = useState('')
  const [save, setSave] = useState(!initial?.id)

  const name = data.name.trim() || '…'
  const stepIndex = STEPS_FOR.indexOf(step)
  const set = patch => { setData(d => ({ ...d, ...patch })); setError('') }

  function validate(s) {
    if (s === 'name' && !data.name.trim()) return t('err_name')
    if (s === 'gender' && !data.gender) return t('err_gender')
    if (s === 'date') {
      const dt = DateTime.fromISO(data.date)
      if (!data.date || !dt.isValid || dt.year < 1800) return t('err_date')
      if (dt > DateTime.now()) return t('err_future')
    }
    if (s === 'time' && !data.timeUnknown && !/^\d{2}:\d{2}$/.test(data.time)) return t('err_time')
    if (s === 'place' && (data.lat == null || !data.tz)) return t('err_place')
    return ''
  }

  function next(e) {
    e?.preventDefault()
    if (step === 'review') {
      const bad = STEPS_FOR.slice(0, -1).find(s => validate(s))
      if (bad) { setStep(bad); setError(validate(bad)); return }
      onSubmit({ ...data, gender: roleGender || data.gender, name: data.name.trim(), time: data.timeUnknown ? '12:00' : data.time }, { save })
      return
    }
    const err = validate(step)
    if (err) { setError(err); return }
    setStep(STEPS_FOR[stepIndex + 1])
  }

  function back() {
    setError('')
    if (stepIndex > 0) setStep(STEPS_FOR[stepIndex - 1])
    else if (choices.length) setStep('pick')
  }

  function pickProfile(p) {
    setData({ ...EMPTY, ...p })
    setSave(false)
    setStep('review')
  }

  function onPlace(loc) {
    if (!loc) return set({ place: '', lat: null, lon: null, tz: null })
    set({ place: loc.name, lat: loc.lat, lon: loc.lon, tz: getTimezone(loc.lat, loc.lon), display_name: loc.display_name })
  }

  const submitLabel = { chart: t('wiz_submit_chart'), groom: t('wiz_submit_groom'), bride: t('wiz_submit_bride'), self: t('wiz_submit_self') }[role]
  const nameTitle = { chart: t('wiz_name_title_chart'), groom: t('wiz_name_title_groom'), bride: t('wiz_name_title_bride'), self: t('wiz_name_title_self') }[role]

  return (
    <form onSubmit={next} className="card card-pad sm:p-8" noValidate>
      {step !== 'pick' && (
        <div className="flex items-center gap-3 mb-6" aria-label={t('wiz_step', { n: stepIndex + 1, total: STEPS_FOR.length })}>
          {STEPS_FOR.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= stepIndex ? 'bg-turmeric' : 'bg-cream-200'}`} />
          ))}
        </div>
      )}

      <div key={step} className="animate-rise min-h-[13rem]">
        {step === 'pick' && (
          <>
            <Question>{t('wiz_pick_title')}</Question>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {choices.map(p => (
                <button type="button" key={p.id} onClick={() => pickProfile(p)}
                  className="text-left rounded-xl border border-cream-200 bg-white px-4 py-3 hover:border-turmeric hover:bg-cream transition">
                  <span className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">{p.name}</span>
                      <span className="block text-xs text-ink-500 truncate">{p.date} · {p.place}</span>
                    </span>
                  </span>
                </button>
              ))}
              <button type="button" onClick={() => { setData(EMPTY); setSave(true); setStep('name') }}
                className="rounded-xl border-2 border-dashed border-cream-200 px-4 py-3 font-semibold text-ink-500 hover:border-turmeric hover:text-ink transition">
                + {t('wiz_pick_new')}
              </button>
            </div>
          </>
        )}

        {step === 'name' && (
          <>
            <Question>{nameTitle}</Question>
            <input className="input text-lg" autoFocus value={data.name} placeholder={t('wiz_name_ph')}
              onChange={e => set({ name: e.target.value })} autoComplete="name" />
          </>
        )}

        {step === 'gender' && (
          <>
            <Question>{t('wiz_gender_title', { name })}</Question>
            <div className="grid grid-cols-2 gap-3">
              {['male', 'female'].map(g => (
                <button type="button" key={g} onClick={() => { set({ gender: g }); setStep(STEPS_FOR[stepIndex + 1]) }}
                  className={`rounded-2xl border-2 px-4 py-6 text-lg font-semibold transition ${data.gender === g ? 'border-kumkum bg-kumkum-50' : 'border-cream-200 hover:border-turmeric hover:bg-cream'}`}>
                  {t(`gender_${g}`)}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'date' && (
          <>
            <Question>{t('wiz_date_title', { name })}</Question>
            <DateFields autoFocus value={data.date} onChange={date => set({ date })} />
            {data.date && !validate('date') && (
              <p className="mt-3 text-ink-500 animate-rise">✓ {fmtLongDate(data.date, lang)}</p>
            )}
          </>
        )}

        {step === 'time' && (
          <>
            <Question>{t('wiz_time_title')}</Question>
            <TimeFields autoFocus value={data.time} disabled={data.timeUnknown} onChange={time => set({ time })} />
            <p className="mt-2 text-sm text-ink-500">{t('wiz_time_hint')}</p>
            <label className="mt-4 flex items-start gap-3 cursor-pointer select-none rounded-xl bg-cream px-4 py-3">
              <input type="checkbox" className="mt-1 accent-kumkum h-4 w-4" checked={data.timeUnknown}
                onChange={e => set({ timeUnknown: e.target.checked })} />
              <span>
                <span className="font-medium">{t('wiz_time_unknown')}</span>
                {data.timeUnknown && <span className="block text-sm text-ink-500 mt-1">{t('wiz_time_unknown_hint')}</span>}
              </span>
            </label>
          </>
        )}

        {step === 'place' && (
          <>
            <Question>{t('wiz_place_title', { name })}</Question>
            <PlaceSearch autoFocus onLocationSelect={onPlace}
              value={data.lat != null ? { lat: data.lat, lon: data.lon, name: data.place, display_name: data.display_name || data.place } : null} />
            <p className="mt-2 text-sm text-ink-500">{t('wiz_place_hint')}</p>
          </>
        )}

        {step === 'review' && (
          <>
            <Question>{t('wiz_review_title')}</Question>
            <ul className="divide-y divide-cream-100 rounded-xl border border-cream-200">
              {[
                ['name', data.name],
                ...(role === 'chart' || role === 'self' ? [['gender', data.gender ? t(`gender_${data.gender}`) : t('gender_unset')]] : []),
                ['date', data.date && fmtLongDate(data.date, lang)],
                ['time', data.timeUnknown ? t('time_unknown_short') : data.time && fmtTime(data.time, lang)],
                ['place', data.place],
              ].map(([s, v]) => (
                <li key={s} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-medium min-w-0 truncate">{v}</span>
                  <button type="button" onClick={() => setStep(s)} className="text-sm text-turmeric-700 font-semibold hover:underline shrink-0">
                    {t('wiz_edit')}
                  </button>
                </li>
              ))}
            </ul>
            {!data.id && role !== 'self' && (
              <label className="mt-4 flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" className="accent-kumkum h-4 w-4" checked={save} onChange={e => setSave(e.target.checked)} />
                <span className="text-sm">{t('wiz_save', { name: data.name })}</span>
              </label>
            )}
          </>
        )}

        {error && <p role="alert" className="mt-3 text-sm font-medium text-kumkum animate-rise">{error}</p>}
      </div>

      {step !== 'pick' && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" onClick={back} className={`btn-ghost ${stepIndex === 0 && !choices.length ? 'invisible' : ''}`}>
            ← {t('wiz_back')}
          </button>
          <button type="submit" className="btn-primary min-w-[9rem]">
            {step === 'review' ? submitLabel : t('wiz_next')} →
          </button>
        </div>
      )}
    </form>
  )
}

function Question({ children }) {
  return <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-5 leading-snug">{children}</h2>
}

export function Avatar({ name, className = '' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  const hue = [...(name || '')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 30)
  return (
    <span aria-hidden className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display font-bold text-white ${className}`}
      style={{ background: `hsl(${hue} 45% 42%)` }}>
      {initial}
    </span>
  )
}
