import { useEffect, useRef, useState } from 'react'
import './Timeline.css'

interface TimelineEntry {
  date: string
  title: string
  description: string
  tag: string
  type: 'personal' | 'agent'
}

const entries: TimelineEntry[] = [
  { date: '2026.05', title: '四大终端 Agent 格局成型', description: 'Claude Code / OpenClaw / Hermes / Codex', tag: 'agent', type: 'agent' },
  { date: '2026.05', title: '构建个人博客', description: '用粒子动效与极简设计，打造属于自己的数字空间。', tag: 'project', type: 'personal' },
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
  { date: '2025', title: '深入 Cloud Native', description: '探索 Kubernetes、微服务架构与分布式系统的实践之路。', tag: 'learning', type: 'personal' },
  { date: '2024.12', title: 'Google 发布 Gemini 2.0 + A2A 协议', description: 'Agent-to-Agent 协议', tag: 'agent', type: 'agent' },
  { date: '2024.10', title: 'MCP 由 Anthropic 提出并开源', description: 'Model Context Protocol', tag: 'agent', type: 'agent' },
  { date: '2024.09', title: 'Claude 3.5 Sonnet + Computer Use', description: 'Computer Use 能力开源', tag: 'agent', type: 'agent' },
  { date: '2024.07', title: 'OpenAI 发布 o1 系列', description: '复杂 Agent 规划成为可能', tag: 'agent', type: 'agent' },
  { date: '2024.06', title: 'Google I/O 发布 Project Astra', description: 'Gemini 1.5 Pro', tag: 'agent', type: 'agent' },
  { date: '2024.05', title: 'OpenAI 发布 GPT-4o', description: '多模态实时交互，Agent 体验飞跃', tag: 'agent', type: 'agent' },
  { date: '2024.03', title: 'Claude 3 系列发布', description: 'Haiku / Sonnet / Opus，Agent 能力初显', tag: 'agent', type: 'agent' },
  { date: '2024.01', title: 'GPT-4 Turbo 正式开放', description: 'Function Calling 能力大幅提升', tag: 'agent', type: 'agent' },
  { date: '2024', title: '全栈开发实践', description: '从前端到后端，TypeScript 全栈技术体系的构建与沉淀。', tag: 'career', type: 'personal' },
  { date: '2023', title: '拥抱 AI 浪潮', description: '将 AI 工具融入开发工作流，探索 LLM 的无限可能。', tag: 'exploration', type: 'personal' },
  { date: '2022', title: '开源贡献之旅', description: '在 GitHub 上参与开源项目，学习协作与代码审查。', tag: 'open-source', type: 'personal' },
  { date: '2021', title: '编程启程', description: '写下第一行代码，从此踏上了与计算机对话的旅程。', tag: 'origin', type: 'personal' },
]

function TimelineCard({ entry, index }: { entry: TimelineEntry; index: number }) {
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
      className={`timeline-card ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 0.06}s` }}
    >
      <div className="card-year">{entry.date}</div>
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
        <div className="timeline-legend">
          <span className="legend-item"><span className="legend-dot personal" />个人</span>
          <span className="legend-item"><span className="legend-dot agent" />Agent 大事件</span>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-axis" />
        {entries.map((entry, i) => (
          <TimelineCard key={`${entry.date}-${entry.title}`} entry={entry} index={i} />
        ))}
      </div>

      <div className="timeline-grid-bg" />
    </section>
  )
}
