import { useEffect, useRef, useState } from 'react'
import { personalEntries } from '../content/personal'
import PersonalDetail from './PersonalDetail'
import './Timeline.css'

interface TimelineEntry {
  date: string
  title: string
  description: string
  tag: string
  type: 'personal' | 'agent'
  slug?: string
}

const agentEntries: TimelineEntry[] = [
  { date: '2026.05', title: '四大终端 Agent 格局成型', description: 'Claude Code / OpenClaw / Hermes / Codex', tag: 'agent', type: 'agent' },
  { date: '2026.04', title: 'Hermes Agent 爆发，开发者迁移潮', description: '', tag: 'agent', type: 'agent' },
  { date: '2026.03', title: 'OpenClaw 登顶 GitHub', description: '25 万+ Stars', tag: 'agent', type: 'agent' },
  { date: '2026.02', title: 'Claude 3.7 Sonnet 发布 + Thinking 模式', description: '', tag: 'agent', type: 'agent' },
  { date: '2026.01', title: 'OpenClaw 开源', description: '72 小时星标暴涨', tag: 'agent', type: 'agent' },
  { date: '2025.12', title: 'A2UI（Google）+ Agent Skills 开源', description: '', tag: 'agent', type: 'agent' },
  { date: '2025.11', title: 'OpenClaw 诞生', description: '奥地利程序员 Peter Steinberger 创建 Clawdbot', tag: 'agent', type: 'agent' },
  { date: '2025.10', title: 'Agent Skills 概念正式提出', description: '', tag: 'agent', type: 'agent' },
  { date: '2025.08', title: 'agentskills.io 开放标准发布', description: 'Agent 技能格式统一', tag: 'agent', type: 'agent' },
  { date: '2025.07', title: 'OpenAI 发布 Codex', description: '代码 Agent 能力整合', tag: 'agent', type: 'agent' },
  { date: '2025.06', title: 'NVIDIA 发布 Nemotron 70B', description: '开源 Agent 训练生态启动', tag: 'agent', type: 'agent' },
  { date: '2025.05', title: 'OpenManus 开源', description: '社区替代方案引发热潮', tag: 'agent', type: 'agent' },
  { date: '2025.03', title: 'Claude Code 发布 + MCP 重大更新', description: '开发者工作流成型', tag: 'agent', type: 'agent' },
  { date: '2025.03', title: 'Manus AI 正式发布', description: '"DeepSeek Moment" 级 Agent 产品出圈', tag: 'agent', type: 'agent' },
  { date: '2025.02', title: 'Deep Research 正式发布', description: '自主研究 Agent 范式确立', tag: 'agent', type: 'agent' },
  { date: '2025.01', title: 'Manus AI 内测曝光', description: '全自主 Agent 概念引爆中文社区', tag: 'agent', type: 'agent' },
  { date: '2024.12', title: 'Google 发布 Gemini 2.0 + A2A 协议', description: 'Agent-to-Agent 协议', tag: 'agent', type: 'agent' },
  { date: '2024.10', title: 'MCP 由 Anthropic 提出并开源', description: 'Model Context Protocol', tag: 'agent', type: 'agent' },
  { date: '2024.09', title: 'Claude 3.5 Sonnet + Computer Use', description: 'Computer Use 能力开源', tag: 'agent', type: 'agent' },
  { date: '2024.07', title: 'OpenAI 发布 o1 系列', description: '复杂 Agent 规划成为可能', tag: 'agent', type: 'agent' },
  { date: '2024.06', title: 'Google I/O 发布 Project Astra', description: 'Gemini 1.5 Pro', tag: 'agent', type: 'agent' },
  { date: '2024.05', title: 'OpenAI 发布 GPT-4o', description: '多模态实时交互，Agent 体验飞跃', tag: 'agent', type: 'agent' },
  { date: '2024.03', title: 'Claude 3 系列发布', description: 'Haiku / Sonnet / Opus，Agent 能力初显', tag: 'agent', type: 'agent' },
  { date: '2024.01', title: 'GPT-4 Turbo 正式开放', description: 'Function Calling 能力大幅提升', tag: 'agent', type: 'agent' },
]

function buildEntries(): TimelineEntry[] {
  const personal: TimelineEntry[] = personalEntries.map(e => ({
    date: e.date,
    title: e.title,
    description: e.description,
    tag: e.tag,
    type: 'personal' as const,
    slug: e.slug,
  }))

  const all = [...personal, ...agentEntries]

  all.sort((a, b) => {
    const parseDate = (d: string) => {
      const parts = d.split('.')
      const year = parseInt(parts[0])
      const month = parts[1] ? parseInt(parts[1]) : 0
      return year * 100 + month
    }
    return parseDate(b.date) - parseDate(a.date)
  })

  return all
}

const entries = buildEntries()

function TimelineCard({
  entry,
  index,
  onSelect,
}: {
  entry: TimelineEntry
  index: number
  onSelect?: (slug: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (entry.type === 'agent') {
    return (
      <div
        ref={ref}
        className={`timeline-agent ${visible ? 'visible' : ''}`}
        style={{ transitionDelay: `${index * 0.04}s` }}
      >
        <div className="agent-date">{entry.date}</div>
        <div className="agent-body">
          <span className="agent-marker">//</span>
          <span className="agent-title">{entry.title}</span>
          {entry.description && (
            <span className="agent-desc"> — {entry.description}</span>
          )}
        </div>
        <div className="agent-connector" />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={`timeline-card clickable ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 0.06}s` }}
      onClick={() => entry.slug && onSelect?.(entry.slug)}
    >
      <div className="card-year">{entry.date}</div>
      <div className="card-content">
        <div className="card-tag">{entry.tag}</div>
        <h3 className="card-title">{entry.title}</h3>
        <p className="card-desc">{entry.description}</p>
        <span className="card-read-more">Read →</span>
      </div>
      <div className="card-line" />
    </div>
  )
}

export default function Timeline() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  if (activeSlug) {
    return <PersonalDetail slug={activeSlug} onBack={() => setActiveSlug(null)} />
  }

  return (
    <section className="timeline-page">
      <div className="timeline-header">
        <span className="section-label"> </span>
        <h1 className="section-title">Timeline</h1>
        <p className="section-desc">..</p>
        <div className="timeline-legend">
          <span className="legend-item"><span className="legend-dot personal" />Me</span>
          <span className="legend-item"><span className="legend-dot agent" />AI Event</span>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-axis" />
        {entries.map((entry, i) => (
          <TimelineCard
            key={`${entry.date}-${entry.title}`}
            entry={entry}
            index={i}
            onSelect={setActiveSlug}
          />
        ))}
      </div>

      <div className="timeline-grid-bg" />
    </section>
  )
}
