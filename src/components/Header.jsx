import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

export default function Header() {
  const { lang, setLang } = useLanguage()

  return (
    <header className="bg-karnataka-saffron text-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌺</span>
          <Link to="/" className="font-bold text-xl">KarnatakaMatch</Link>
        </div>

        <nav className="space-x-4">
          <Link to="/" className="hover:underline">{lang==='kn' ? 'ಮುಖಪುಟ' : 'Home'}</Link>
          <Link to="/birth-chart" className="hover:underline">{lang==='kn' ? 'ಜನನ ಚಾರ್ಟ್' : 'Birth Chart'}</Link>
          <Link to="/matchmaking" className="hover:underline">{lang==='kn' ? 'ಮ್ಯಾಚ್ಮೇಕಿಂಗ್' : 'Matchmaking'}</Link>
          <Link to="/about" className="hover:underline">{lang==='kn' ? 'ಬಗ್ಗೆ' : 'About'}</Link>
          <button onClick={()=>setLang(lang==='en'?'kn':'en')} className="ml-3 px-2 py-1 bg-white text-karnataka-saffron rounded text-sm">
            {lang==='kn' ? 'EN' : 'ಕನ್ನಡ'}
          </button>
        </nav>
      </div>
    </header>
  )
}
