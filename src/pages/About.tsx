import { useEffect, useRef, useState } from 'react'
import './About.css'

const skills = [
  { name: 'TypeScript', level: 92 },
  { name: 'React', level: 88 },
  { name: 'Node.js', level: 85 },
  { name: 'Python', level: 78 },
  { name: 'Docker', level: 75 },
  { name: 'Kubernetes', level: 70 },
  { name: 'Rust', level: 55 },
  { name: 'Linux', level: 82 },
]

const stats = [
  { label: 'projects', value: '20+' },
  { label: 'commits', value: '3.2k' },
  { label: 'stars', value: '128' },
  { label: 'coffee', value: '∞' },
]

function SkillBar({ name, level, delay }: { name: string; level: number; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="skill-row" style={{ transitionDelay: `${delay}s` }}>
      <div className="skill-info">
        <span className="skill-name">{name}</span>
        <span className="skill-level">{level}%</span>
      </div>
      <div className="skill-track">
        <div
          className="skill-fill"
          style={{ width: visible ? `${level}%` : '0%', transitionDelay: `${delay}s` }}
        />
      </div>
    </div>
  )
}

function AsciiArt() {
  const art = `
    ██████╗ ██╗ ██████╗ ██╗   ██╗██████╗
   ██╔════╝███║██╔═══██╗██║   ██║██╔══██╗
   ██║     ╚██║██║   ██║██║   ██║██║  ██║
   ██║      ██║██║   ██║██║   ██║██║  ██║
   ╚██████╗ ██║╚██████╔╝╚██████╔╝██████╔╝
    ╚═════╝ ╚═╝ ╚═════╝  ╚═════╝ ╚═════╝ `

  return (
    <pre className="ascii-art">{art}</pre>
  )
}

export default function About() {
  return (
    <section className="about-page">
      <div className="about-header">
        <span className="section-label">// about</span>
        <h1 className="section-title">关于</h1>
      </div>

      <div className="about-grid">
        <div className="about-left">
          <AsciiArt />

          <div className="about-bio">
            <div className="terminal-window">
              <div className="terminal-bar">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
                <span className="terminal-title">c1oud@blog ~ %</span>
              </div>
              <div className="terminal-body">
                <p><span className="prompt">$</span> cat about.txt</p>
                <br />
                <p className="bio-text">
                  一个热爱编程的开发者，沉迷于用代码构建事物。
                  <br />
                  对分布式系统、云原生技术和 AI 充满好奇。
                  <br />
                  相信技术的力量能让世界变得更好。
                </p>
                <br />
                <p><span className="prompt">$</span> echo $PHILOSOPHY</p>
                <p className="bio-text">"Stay hungry, stay foolish."</p>
                <br />
                <p><span className="prompt">$</span> <span className="cursor-blink">_</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="about-right">
          <div className="stats-grid">
            {stats.map(({ label, value }) => (
              <div key={label} className="stat-card">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
              </div>
            ))}
          </div>

          <div className="skills-section">
            <h3 className="skills-title">
              <span className="section-label">// skills</span>
            </h3>
            {skills.map((skill, i) => (
              <SkillBar key={skill.name} name={skill.name} level={skill.level} delay={i * 0.06} />
            ))}
          </div>

          <div className="links-section">
            <h3 className="links-title">
              <span className="section-label">// links</span>
            </h3>
            <div className="link-row">
              <a href="https://github.com/c1oud" target="_blank" rel="noopener" className="ext-link" data-hover>
                <span className="link-icon">→</span> GitHub
              </a>
              <a href="mailto:hello@c1oud.dev" className="ext-link" data-hover>
                <span className="link-icon">→</span> Email
              </a>
              <a href="https://twitter.com/c1oud" target="_blank" rel="noopener" className="ext-link" data-hover>
                <span className="link-icon">→</span> Twitter / X
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="about-grid-bg" />
    </section>
  )
}
