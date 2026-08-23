import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import BirthChart from './pages/BirthChart'
import ChartResultPage from './pages/ChartResultPage'
import Matchmaking from './pages/Matchmaking'
import About from './pages/About'
import Header from './components/Header'
import Footer from './components/Footer'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/birth-chart" element={<BirthChart />} />
            <Route path="/birth-chart/result" element={<ChartResultPage />} />
            <Route path="/matchmaking" element={<Matchmaking />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
