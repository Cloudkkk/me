import { useState, useRef, useEffect, useCallback } from 'react'
import './ChatBox.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const PROXY_URL = import.meta.env.VITE_CHAT_PROXY_URL
const API_KEY = import.meta.env.VITE_CHAT_API_KEY || ''
const isDev = import.meta.env.DEV

function getChatEndpoint() {
  if (PROXY_URL) return PROXY_URL
  if (isDev) return '/api/chat'
  return ''
}

function getChatHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (isDev && API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`
  }
  return headers
}

const SYSTEM_PROMPT = `你是 C1oud 的个人博客 AI 助手。C1oud 是一个热爱编程的开发者，擅长全栈开发、云原生技术和 AI。
请用简洁、友好、略带极客气质的风格回答访客的问题。回答控制在 2-3 句话以内。不要使用 emoji。`

interface ChatBoxProps {
  onFocusChange?: (focused: boolean) => void
}

export default function ChatBox({ onFocusChange }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [focused, setFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const endpoint = getChatEndpoint()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  useEffect(() => {
    onFocusChange?.(focused || loading)
  }, [focused, loading, onFocusChange])

  const handleMouseEnter = () => setFocused(true)
  const handleMouseLeave = () => {
    if (!loading) setFocused(false)
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !endpoint) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStreaming('')

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getChatHeaders(),
        body: JSON.stringify({
          model: 'qwen3.6-plus',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.slice(-6),
          ],
          max_tokens: 256,
          temperature: 0.7,
          stream: true,
          enable_thinking: false,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error('request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') break

          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) {
              fullText += delta
              setStreaming(fullText)
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      const finalText = fullText || '// 信号丢失，请重试'
      setStreaming('')
      setMessages(prev => [...prev, { role: 'assistant', content: finalText }])
    } catch {
      setStreaming('')
      setMessages(prev => [...prev, { role: 'assistant', content: '// 连接超时，请稍后再试' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, endpoint])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
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
      {expanded && (messages.length > 0 || streaming) && (
        <div className="chatbox-history">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-line ${msg.role}`}>
              <span className="line-prefix">{msg.role === 'user' ? '>' : '$'}</span>
              <span className="line-text">{msg.content}</span>
            </div>
          ))}

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
          placeholder={endpoint ? '你想问我什么？' : '// 对话服务未配置'}
          disabled={loading || !endpoint}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
