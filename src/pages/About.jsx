import { useLanguage } from '../contexts/LanguageContext'

export default function About(){
  const { t, lang } = useLanguage()
  return (
    <div className="mx-auto max-w-2xl card card-pad sm:p-10 space-y-4 leading-relaxed">
      <h1 className="font-display text-3xl font-bold">{t('about_title')}</h1>
      {lang === 'kn' ? (
        <>
          <p>ಜಾತಕಗಳನ್ನು ಸ್ವಿಸ್ ಎಫೆಮೆರಿಸ್ ಬಳಸಿ ಲಹಿರಿ ಅಯನಾಂಶದೊಂದಿಗೆ ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ. ಹೊಂದಾಣಿಕೆಗೆ ಸಾಂಪ್ರದಾಯಿಕ ಅಷ್ಟಕೂಟ (36 ಗುಣ) ಪದ್ಧತಿ ಮತ್ತು ಕುಜ ದೋಷ ಪರಿಶೀಲನೆ ಬಳಸಲಾಗುತ್ತದೆ.</p>
          <p>ನೀವು ಉಳಿಸುವ ವಿವರಗಳು ನಿಮ್ಮ ಈ ಸಾಧನದಲ್ಲೇ ಇರುತ್ತವೆ; ನಮ್ಮ ಸರ್ವರ್ ಯಾವುದೇ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.</p>
          <p className="text-sm text-ink-500">ಸಂಪ್ರದಾಯಗಳು ಬೇರೆ ಬೇರೆ ಇರುವುದರಿಂದ, ಮಹತ್ವದ ನಿರ್ಧಾರಗಳಿಗೆ ಮೊದಲು ಅನುಭವಿ ಜ್ಯೋತಿಷಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.</p>
        </>
      ) : (
        <>
          <p>Charts are calculated with the Swiss Ephemeris using the Lahiri ayanamsa, mean Rahu/Ketu and whole-sign houses. Matching uses the traditional Ashtakoota (36 guna) system with common dosha cancellations, plus a Kuja dosha check from both the Lagna and the Moon.</p>
          <p>The people you save stay on this device only. The server computes charts and keeps nothing.</p>
          <p className="text-sm text-ink-500">Traditions differ between families and regions — for important decisions, please consult an experienced astrologer.</p>
        </>
      )}
    </div>
  )
}
