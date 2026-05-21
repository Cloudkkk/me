import { useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

const THEME_CHANGE_EVENT = 'theme-change'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>
      setTheme(customEvent.detail)
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: newTheme }))
  }

  return { theme, toggleTheme }
}
