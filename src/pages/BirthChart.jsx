import { useNavigate } from 'react-router-dom'
import BirthWizard from '../components/BirthWizard'
import { useLanguage } from '../contexts/LanguageContext'
import { saveProfile } from '../lib/profiles'
import { chartPath } from '../lib/share'

export default function BirthChart(){
  const navigate = useNavigate()
  const { t } = useLanguage()

  function submit(profile, { save }) {
    if (save) saveProfile(profile)
    navigate(chartPath(profile))
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow mb-2">{t('nav_chart')}</p>
      <BirthWizard role="chart" onSubmit={submit} />
    </div>
  )
}
