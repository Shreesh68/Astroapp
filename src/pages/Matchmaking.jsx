import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BirthWizard, { Avatar } from '../components/BirthWizard'
import { useLanguage } from '../contexts/LanguageContext'
import { rememberGender, saveProfile } from '../lib/profiles'
import { matchPath, paramsToProfile } from '../lib/share'

/**
 * Two guided forms in a row: groom, then bride.
 * `?w…` params (from a chart page or saved person) pre-fill one side after asking which side they are.
 */
export default function Matchmaking(){
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const withProfile = paramsToProfile(params, 'w')

  // someone whose gender is known goes straight to their side; otherwise ask
  const knownRole = { male: 'groom', female: 'bride' }[withProfile?.gender]
  const [groom, setGroom] = useState(knownRole === 'groom' ? withProfile : null)
  const [bride, setBride] = useState(knownRole === 'bride' ? withProfile : null)
  const [stage, setStage] = useState(!withProfile ? 'groom' : knownRole === 'groom' ? 'bride' : knownRole === 'bride' ? 'groom' : 'role')

  function chooseRole(role) {
    const person = { ...withProfile, gender: role === 'groom' ? 'male' : 'female' }
    rememberGender(person)
    if (role === 'groom') { setGroom(person); setStage('bride') }
    else { setBride(person); setStage('groom') }
  }

  function done(role, profile, { save }) {
    if (!save) rememberGender(profile)
    const saved = save ? saveProfile(profile) : profile
    const g = role === 'groom' ? saved : groom
    const b = role === 'bride' ? saved : bride
    if (role === 'groom') setGroom(saved)
    else setBride(saved)
    if (g && b) navigate(matchPath(g, b))
    else setStage(role === 'groom' ? 'bride' : 'groom')
  }

  const steps = [
    { key: 'groom', label: t('match_groom'), person: groom },
    { key: 'bride', label: t('match_bride'), person: bride },
  ]

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-3xl font-bold">{t('match_title')}</h1>
      <p className="text-ink-500 mt-1 mb-6">{t('match_sub')}</p>

      {stage !== 'role' && (
        <ol className="flex items-center gap-3 mb-4">
          {steps.map((s, i) => (
            <li key={s.key} className="flex items-center gap-3 flex-1">
              <button type="button" onClick={() => s.person && setStage(s.key)} disabled={!s.person && stage !== s.key}
                className={`flex items-center gap-2 rounded-full pl-1 pr-4 py-1 text-sm font-semibold transition w-full
                  ${stage === s.key ? 'bg-ink text-cream' : s.person ? 'bg-white ring-1 ring-cream-200 hover:ring-turmeric' : 'bg-cream-100 text-ink-300'}`}>
                {s.person ? <Avatar name={s.person.name} className="!h-7 !w-7 text-sm" />
                  : <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 ring-1 ring-current">{i + 1}</span>}
                <span className="truncate">{s.person ? s.person.name : s.label}</span>
              </button>
              {i === 0 && <span className="text-kumkum" aria-hidden>❦</span>}
            </li>
          ))}
        </ol>
      )}

      {stage === 'role' && (
        <div className="card card-pad sm:p-8 animate-rise">
          <h2 className="font-display text-2xl font-semibold mb-5">
            {t('match_role_q', { name: withProfile.name })}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {['groom', 'bride'].map(r => (
              <button key={r} onClick={() => chooseRole(r)}
                className="rounded-2xl border-2 border-cream-200 px-4 py-6 text-lg font-semibold hover:border-turmeric hover:bg-cream transition">
                {t(r === 'groom' ? 'match_groom' : 'match_bride')}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === 'groom' && <BirthWizard key="groom" role="groom" initial={groom} other={bride} onSubmit={(p, o) => done('groom', p, o)} />}
      {stage === 'bride' && <BirthWizard key="bride" role="bride" initial={bride} other={groom} onSubmit={(p, o) => done('bride', p, o)} />}
    </div>
  )
}
