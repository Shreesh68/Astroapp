// Kannada for the English terms the app's fact sheets use. Shared by the AI's language instruction
// (worker/src/index.js) and the answer check (factcheck.js), so the two can never drift apart.
export const KN_GLOSSARY = {
  'double transit': 'ಗುರು–ಶನಿ ದ್ವಿಗೋಚಾರ', transit: 'ಗೋಚಾರ', mahadasha: 'ಮಹಾದಶೆ', dasha: 'ದಶೆ', bhukti: 'ಭುಕ್ತಿ',
  antardasha: 'ಅಂತರ್ದಶೆ', period: 'ಅವಧಿ', significator: 'ಕಾರಕ', lord: 'ಅಧಿಪತಿ', house: 'ಮನೆ (7th house = 7ನೇ ಮನೆ)',
  retrograde: 'ವಕ್ರ', 'brief retrograde touch': 'ಅಲ್ಪಕಾಲದ ವಕ್ರ ಸ್ಪರ್ಶ', aspect: 'ದೃಷ್ಟಿ', 'own sign': 'ಸ್ವಕ್ಷೇತ್ರ',
  exalted: 'ಉಚ್ಚ', debilitated: 'ನೀಚ', moolatrikona: 'ಮೂಲತ್ರಿಕೋನ', 'sade sati': 'ಸಾಡೇಸಾತಿ', yoga: 'ಯೋಗ',
  remedy: 'ಪರಿಹಾರ', strong: 'ಬಲವಾದ', good: 'ಉತ್ತಮ', moderate: 'ಸಾಧಾರಣ',
}
export const KN_MONTHS = ['ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್']
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The glossary as one instruction line for the model. */
export const knGlossaryLine = () =>
  `${Object.entries(KN_GLOSSARY).map(([en, kn]) => `${en} = ${kn}`).join('; ')}. Months in Kannada: ${EN_MONTHS.map((m, i) => `${m} = ${KN_MONTHS[i]}`).join(', ')} (so "Mar 2028" is "ಮಾರ್ಚ್ 2028").`
