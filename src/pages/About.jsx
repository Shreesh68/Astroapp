import { useLanguage } from '../contexts/LanguageContext'

export default function About(){
  const { t, lang } = useLanguage()
  return (
    <div className="mx-auto max-w-2xl card card-pad sm:p-10 space-y-4 leading-relaxed">
      <h1 className="font-display text-3xl font-bold">{t('about_title')}</h1>
      {lang === 'kn' ? (
        <>
          <p>ಜಾತಕಗಳನ್ನು ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲೇ, ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ, ಲಹಿರಿ ಅಯನಾಂಶದೊಂದಿಗೆ ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ (Astronomy Engine; ಸ್ವಿಸ್ ಎಫೆಮೆರಿಸ್‌ನೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ). ಹೊಂದಾಣಿಕೆಗೆ ಸಾಂಪ್ರದಾಯಿಕ ಅಷ್ಟಕೂಟ (36 ಗುಣ) ಪದ್ಧತಿ ಮತ್ತು ಕುಜ ದೋಷ ಪರಿಶೀಲನೆ ಬಳಸಲಾಗುತ್ತದೆ.</p>
          <p>ನೀವು ಉಳಿಸುವ ಜಾತಕಗಳು ಈ ಫೋನ್‌ನಲ್ಲಿರುತ್ತವೆ. ನೀವು ಲಾಗಿನ್ ಆದರೆ, ಯಾವ ಫೋನ್‌ನಲ್ಲೂ ಮರಳಿ ಸಿಗುವಂತೆ ಅವು ನಿಮ್ಮ ಖಾತೆಯಲ್ಲೂ (Google Firebase) ಸುರಕ್ಷಿತವಾಗಿರುತ್ತವೆ; ನಿಮ್ಮ ಖಾತೆಯನ್ನು ನೀವು ಮಾತ್ರ ನೋಡಬಹುದು. AI ಜ್ಯೋತಿಷಿಗೆ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು ಉತ್ತರಕ್ಕಾಗಿ ಚಾಟ್ ಸರ್ವರ್‌ಗೆ ಹೋಗುತ್ತವೆ; ಅಲ್ಲಿ ಅವನ್ನು ಉಳಿಸಲಾಗುವುದಿಲ್ಲ.</p>
          <p className="text-sm text-ink-500">ಸಂಪ್ರದಾಯಗಳು ಬೇರೆ ಬೇರೆ ಇರುವುದರಿಂದ, ಮಹತ್ವದ ನಿರ್ಧಾರಗಳಿಗೆ ಮೊದಲು ಅನುಭವಿ ಜ್ಯೋತಿಷಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.</p>
        </>
      ) : (
        <>
          <p>Charts are calculated on your phone, with no internet needed, using Astronomy Engine (checked against the Swiss Ephemeris) with the Lahiri ayanamsa, mean Rahu/Ketu and whole-sign houses. Matching uses the traditional Ashtakoota (36 guna) system with common dosha cancellations, plus a Kuja dosha check from both the Lagna and the Moon.</p>
          <p>The people you save stay on this phone. If you log in, they are also kept in your account (Google Firebase) so they come back on any phone — only you can see your account. Questions to the AI astrologer go to the chat server to be answered and are not stored there.</p>
          <p className="text-sm text-ink-500">Traditions differ between families and regions — for important decisions, please consult an experienced astrologer.</p>
        </>
      )}
    </div>
  )
}
