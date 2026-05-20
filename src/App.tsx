import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Nav from './components/Nav'
import Home from './pages/Home'
import Timeline from './pages/Timeline'
import About from './pages/About'
import Cursor from './components/Cursor'
import './App.css'

function App() {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 400)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="app">
      <Cursor />
      <Nav />
      <main className={`main-content ${isTransitioning ? 'transitioning' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
