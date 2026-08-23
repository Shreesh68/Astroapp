import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

export default function Home(){
  const { lang } = useLanguage()
  return (
    <div className="mx-auto">
      <section className="hero-gradient rounded p-6 mb-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">{lang==='kn' ? 'ಕರ್ನಾಟಕ ಮ್ಯಾಚ್' : 'KarnatakaMatch'}</h1>
          <p className="mt-2">{lang==='kn' ? 'ದಕ್ಷಿಣ ಭಾರತದ ಶೈಲಿಯ ತೂಕಗಳು ಮತ್ತು జೋಡಿ ಪರಿಶೀಲನೆ' : 'Focused, South-Indian (Karnataka) style matchmaking and birth-chart previews.'}</p>
        </div>
      </section>

      <div className="prose mx-auto">
        <p>{lang==='kn' ? 'ಹೆಸರು, ಜನನ ದಿನಾಂಕ ಮತ್ತು ಸ್ಥಳ ನೀಡಿರಿ — ಸರಳ ಪೂರ್ವಾವಲೋಕನ ಗಾಗಿ.' : 'Enter Name, DOB and Place to compute a quick chart and check match compatibility for bride & groom pairs.'}</p>

        <div className="mt-6 space-x-3">
          <Link to="/birth-chart" className="px-4 py-2 bg-karnataka-saffron text-white rounded">{lang==='kn' ? 'ಜನನ ಚಾರ್ಟ್' : 'Create Birth Chart'}</Link>
          <Link to="/matchmaking" className="px-4 py-2 bg-karnataka-green text-white rounded">{lang==='kn' ? 'ಮ್ಯಾಚ್ಮೇಕಿಂಗ್' : 'Matchmaking'}</Link>
        </div>
      </div>
    </div>
  )
}
