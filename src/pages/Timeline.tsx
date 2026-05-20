import { useEffect, useRef, useState } from 'react'
import './Timeline.css'

interface TimelineEntry {
  year: string
  title: string
  description: string
  tag: string
}

const entries: TimelineEntry[] = [
  {
    year: '2026',
    title: '构建个人博客',
    description: '用粒子动效与极简设计，打造属于自己的数字空间。',
    tag: 'project',
  },
  {
    year: '2025',
    title: '深入 Cloud Native',
    description: '探索 Kubernetes、微服务架构与分布式系统的实践之路。',
    tag: 'learning',
  },
  {
    year: '2024',
    title: '全栈开发实践',
    description: '从前端到后端，TypeScript 全栈技术体系的构建与沉淀。',
    tag: 'career',
  },
  {
    year: '2023',
    title: '拥抱 AI 浪潮',
    description: '将 AI 工具融入开发工作流，探索 LLM 的无限可能。',
    tag: 'exploration',
  },
  {
    year: '2022',
    title: '开源贡献之旅',
    description: '在 GitHub 上参与开源项目，学习协作与代码审查。',
    tag: 'open-source',
  },
  {
    year: '2021',
    title: '编程启程',
    description: '写下第一行代码，从此踏上了与计算机对话的旅程。',
    tag: 'origin',
  },
]

function TimelineCard({ entry, index }: { entry: TimelineEntry; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`timeline-card ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <div className="card-year">{entry.year}</div>
      <div className="card-content">
        <div className="card-tag">{entry.tag}</div>
        <h3 className="card-title">{entry.title}</h3>
        <p className="card-desc">{entry.description}</p>
      </div>
      <div className="card-line" />
    </div>
  )
}

export default function Timeline() {
  return (
    <section className="timeline-page">
      <div className="timeline-header">
        <span className="section-label">// timeline</span>
        <h1 className="section-title">时间线</h1>
        <p className="section-desc">记录每一个节点，连接过去与未来。</p>
      </div>

      <div className="timeline-container">
        <div className="timeline-axis" />
        {entries.map((entry, i) => (
          <TimelineCard key={entry.year} entry={entry} index={i} />
        ))}
      </div>

      <div className="timeline-grid-bg" />
    </section>
  )
}
