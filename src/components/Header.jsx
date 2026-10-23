import { NavLink, Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { accountsAvailable, useAccount } from '../lib/account'
import { useProfiles } from '../lib/profiles'

const LINKS = [
  { to: '/', key: 'nav_home', icon: '⌂', end: true },
  { to: '/birth-chart', key: 'nav_chart', icon: '◈' },
  { to: '/matchmaking', key: 'nav_match', icon: '❦' },
  { to: '/panchang', key: 'nav_panchang', icon: '☼' },
]

export default function Header() {
  const { lang, setLang, t } = useLanguage()
  const { user } = useAccount()
  const { self } = useProfiles()
  // logged in: the person's initial (or 👤); logged out: "Log in"
  const account = accountsAvailable && (
    <Link to={user ? '/account' : '/login'} aria-label={user ? t('acc_eyebrow') : t('login_link')}
      className={user
        ? 'flex h-8 w-8 items-center justify-center rounded-full bg-turmeric text-sm font-bold text-ink'
        : 'rounded-full px-3 py-1 text-sm font-semibold text-turmeric hover:bg-white/10 transition'}>
      {user ? ((self?.name || user.name)?.trim().charAt(0).toUpperCase() || '👤') : t('login_link')}
    </Link>
  )
  const toggle = (
    <button onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
      className="rounded-full border border-white/25 px-3 py-1 text-sm font-semibold text-cream hover:bg-white/10 transition"
      lang={lang === 'en' ? 'kn' : 'en'}>
      {t('lang_toggle')}
    </button>
  )

  return (
    <>
      {/* extends under the phone's status bar when the page is edge-to-edge (Android app) */}
      <header className="no-print sticky top-0 z-40 bg-ink/95 backdrop-blur text-cream" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="text-turmeric" aria-hidden>✺</span>{t('brand')}
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Main">
            {[...LINKS, { to: '/about', key: 'nav_about' }].map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `rounded-full px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-cream/80 hover:text-white'}`}>
                {t(l.key)}
              </NavLink>
            ))}
            <span className="ml-2 flex items-center gap-2">{account}{toggle}</span>
          </nav>
          <div className="md:hidden flex items-center gap-2">{account}{toggle}</div>
        </div>
      </header>

      {/* Bottom tab bar on phones */}
      <nav aria-label="Main" className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-cream-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="grid grid-cols-4">
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-kumkum' : 'text-ink-500'}`}>
              <span className="text-lg leading-none" aria-hidden>{l.icon}</span>
              {t(l.key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
