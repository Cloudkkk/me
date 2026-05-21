import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import './Nav.css'

const links = [
  { path: '/', label: '首页', key: 'home' },
  { path: '/timeline', label: 'Timeline', key: 'timeline' },
  { path: '/about', label: '关于', key: 'about' },
]

export default function Nav() {
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="nav">
      <Link to="/" className="nav-logo" data-hover>
        <span className="logo-bracket">{`{`}</span>
        <span className="logo-text">C1oud</span>
        <span className="logo-bracket">{`}`}</span>
      </Link>

      <div className="nav-links">
        {links.map(({ path, label, key }) => (
          <Link
            key={key}
            to={path}
            className={`nav-link ${pathname === path ? 'active' : ''}`}
            data-hover
          >
            <span className="nav-link-prefix">./</span>
            {label}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          data-hover
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}
