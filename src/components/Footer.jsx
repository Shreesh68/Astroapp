import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

export default function Footer(){
  const { t } = useLanguage()
  return (
    <footer className="no-print site-footer border-t border-cream-200 pt-8 pb-24 md:pb-8 text-ink-500">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row gap-2 items-center justify-between text-sm">
        <p>© {new Date().getFullYear()} {t('brand')} · {t('footnote')}</p>
        <Link to="/about" className="hover:text-ink">{t('nav_about')}</Link>
      </div>
    </footer>
  )
}
