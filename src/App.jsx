import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import BirthChart from './pages/BirthChart'
import ChartResultPage from './pages/ChartResultPage'
import Matchmaking from './pages/Matchmaking'
import MatchResultPage from './pages/MatchResultPage'
import Panchang from './pages/Panchang'
import About from './pages/About'
import AskAI from './pages/AskAI'
import Login from './pages/Login'
import Account from './pages/Account'
import Header from './components/Header'
import Footer from './components/Footer'
import { onBackButton } from './lib/platform'

function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname, search])
  return null
}

function BackButton() {
  const navigate = useNavigate()
  useEffect(() => onBackButton(() => navigate(-1), () => navigate('/', { replace: true })), [navigate])
  return null
}

export default function App() {
  useEffect(() => {
    // closed <details> sections would be missing from the printed report
    const openAll = () => document.querySelectorAll('details').forEach(d => { d.open = true })
    window.addEventListener('beforeprint', openAll)
    return () => window.removeEventListener('beforeprint', openAll)
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <BackButton />
      <Routes>
        {/* the chat is full-screen, like a messaging app */}
        <Route path="/ask" element={<AskAI />} />
        <Route path="*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  )
}

function Layout() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 sm:py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/birth-chart" element={<BirthChart />} />
          <Route path="/birth-chart/result" element={<ChartResultPage />} />
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/matchmaking/result" element={<MatchResultPage />} />
          <Route path="/panchang" element={<Panchang />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
