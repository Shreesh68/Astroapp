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
import ReplyToast from './components/ReplyToast'
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

// While the on-screen keyboard is up, the page is much shorter: the bottom tab bar and footer are hidden
// (index.css, .kb-open) so the field being typed in and the card around it get the room, and the focused
// field is brought back into view instead of the page jumping.
function KeyboardWatcher() {
  useEffect(() => {
    const vv = window.visualViewport
    let tallest = window.innerHeight
    const typing = () => document.activeElement?.matches?.('input:not([type=checkbox]):not([type=radio]), textarea')
    const update = () => {
      const h = vv ? vv.height : window.innerHeight
      if (!typing()) tallest = Math.max(tallest, h)
      const open = typing() && h < tallest - 120
      if (open !== document.documentElement.classList.contains('kb-open')) {
        document.documentElement.classList.toggle('kb-open', open)
        if (open) setTimeout(() => document.activeElement?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }), 50)
      }
    }
    const later = () => setTimeout(update, 100)
    ;(vv || window).addEventListener('resize', update)
    document.addEventListener('focusin', update)
    document.addEventListener('focusout', later)
    return () => {
      (vv || window).removeEventListener('resize', update)
      document.removeEventListener('focusin', update)
      document.removeEventListener('focusout', later)
    }
  }, [])
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
      <KeyboardWatcher />
      <ReplyToast />
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
