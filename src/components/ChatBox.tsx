import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgent, type ChatMessage } from '../agent'
import './ChatBox.css'

interface ChatBoxProps {
  onFocusChange?: (focused: boolean) => void
}

const TOOL_LABELS: Record<string, string> = {
  knowledge_search: '检索知识库',
  navigate_to: '导航页面',
  query_timeline: '查询时间线',
  get_current_time: '获取时间',
}

function ToolIndicator({ tools }: { tools: string[] }) {
  if (tools.length === 0) return null
  return (
    <div className="chat-line tool-indicator">
      <span className="line-prefix">#</span>
      <span className="line-text tool-text">
        {tools.map(t => TOOL_LABELS[t] || t).join(' / ')}
        <span className="tool-dots"><span>.</span><span>.</span><span>.</span></span>
      </span>
    </div>
  )
}

function MessageLine({ msg }: { msg: ChatMessage }) {
  return (
    <div className={`chat-line ${msg.role}`}>
      <span className="line-prefix">{msg.role === 'user' ? '>' : '$'}</span>
      <span className="line-text">
        {msg.content}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <span className="tool-badge">
            {msg.toolCalls.map(tc => TOOL_LABELS[tc.name] || tc.name).join(', ')}
          </span>
        )}
      </span>
    </div>
  )
}

export default function ChatBox({ onFocusChange }: ChatBoxProps) {
  const {
    messages,
    streaming,
    loading,
    activeTools,
    isConfigured,
    send,
    clear,
  } = useAgent()

  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming, activeTools])

  useEffect(() => {
    onFocusChange?.(focused || loading)
  }, [focused, loading, onFocusChange])

  const handleMouseEnter = () => setFocused(true)
  const handleMouseLeave = () => {
    if (!loading) setFocused(false)
  }

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const navAction = await send(text)

    if (navAction) {
      navigate(navAction.path)
    }
  }, [input, loading, send, navigate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const expanded = focused || loading

  return (
    <div
      ref={containerRef}
      className={`chatbox-inline ${expanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {expanded && (messages.length > 0 || streaming || activeTools.length > 0) && (
        <div className="chatbox-history">
          {messages.map((msg, i) => (
            <MessageLine key={i} msg={msg} />
          ))}

          {activeTools.length > 0 && (
            <ToolIndicator tools={activeTools} />
          )}

          {streaming && (
            <div className="chat-line assistant">
              <span className="line-prefix">$</span>
              <span className="line-text">
                {streaming}
                <span className="stream-cursor">|</span>
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="chatbox-prompt">
        <span className="prompt-label">{'>'}_</span>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConfigured ? '你想问我什么？' : '// 对话服务未配置'}
          disabled={loading || !isConfigured}
          spellCheck={false}
          autoComplete="off"
        />
        {messages.length > 0 && !loading && (
          <button className="clear-btn" onClick={clear} title="清空对话">
            [x]
          </button>
        )}
      </div>
    </div>
  )
}
