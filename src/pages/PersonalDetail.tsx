import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPersonalEntry, type PersonalEntry } from '../content/personal'
import './PersonalDetail.css'

interface Props {
  slug: string
  onBack: () => void
}

export default function PersonalDetail({ slug, onBack }: Props) {
  const [entry, setEntry] = useState<PersonalEntry | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const found = getPersonalEntry(slug)
    if (!found) return
    setEntry(found)
    found.content().then(md => {
      setMarkdown(md)
      setLoading(false)
    })
  }, [slug])

  if (loading) {
    return (
      <section className="personal-detail">
        <div className="detail-loading">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      </section>
    )
  }

  if (!entry) {
    return (
      <section className="personal-detail">
        <button className="detail-back" onClick={onBack}>← Back</button>
        <p className="detail-not-found">Entry not found.</p>
      </section>
    )
  }

  return (
    <section className="personal-detail">
      <button className="detail-back" onClick={onBack}>
        <span className="back-arrow">←</span>
        <span className="back-text">Timeline</span>
      </button>

      <div className="detail-header">
        <span className="detail-date">{entry.date}</span>
        <span className="detail-tag">{entry.tag}</span>
      </div>

      <article className="detail-content">
        <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
      </article>
    </section>
  )
}
