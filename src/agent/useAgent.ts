import { useState, useRef, useCallback } from 'react'
import { getAgent, C1oudAgent } from './core'
import type { StreamEvent } from './types'
import type { NavigateAction } from './tools/navigate'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: { name: string; status: 'running' | 'done'; result?: string }[]
}

interface UseAgentReturn {
  messages: ChatMessage[]
  streaming: string
  loading: boolean
  activeTools: string[]
  isConfigured: boolean
  send: (text: string) => Promise<NavigateAction | null>
  clear: () => void
}

export function useAgent(): UseAgentReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const agentRef = useRef<C1oudAgent>(getAgent())

  const send = useCallback(async (text: string): Promise<NavigateAction | null> => {
    const trimmed = text.trim()
    if (!trimmed || loading) return null

    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setLoading(true)
    setStreaming('')
    setActiveTools([])

    let fullContent = ''
    const toolCallsAccum: ChatMessage['toolCalls'] = []

    try {
      const stream = agentRef.current.chat(trimmed)
      for await (const event of stream) {
        handleEvent(event)
      }
    } catch {
      fullContent = fullContent || '// 连接异常，请稍后再试'
    }

    function handleEvent(event: StreamEvent) {
      switch (event.type) {
        case 'token':
          fullContent += event.content || ''
          setStreaming(fullContent)
          break

        case 'tool_start':
          if (event.toolName) {
            setActiveTools(prev => [...prev, event.toolName!])
            toolCallsAccum.push({ name: event.toolName, status: 'running' })
          }
          break

        case 'tool_end':
          if (event.toolName) {
            setActiveTools(prev => prev.filter(t => t !== event.toolName))
            const tc = toolCallsAccum.find(t => t.name === event.toolName && t.status === 'running')
            if (tc) {
              tc.status = 'done'
              tc.result = event.toolResult
            }
          }
          fullContent = ''
          setStreaming('')
          break

        case 'error':
          fullContent = event.content || '// 发生错误'
          setStreaming(fullContent)
          break

        case 'done': {
          const finalContent = fullContent || '// 信号丢失，请重试'
          setStreaming('')
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: finalContent,
              toolCalls: toolCallsAccum.length > 0 ? [...toolCallsAccum] : undefined,
            },
          ])
          setLoading(false)
          setActiveTools([])
          break
        }
      }
    }

    setLoading(false)
    return agentRef.current.getNavigationAction()
  }, [loading])

  const clear = useCallback(() => {
    setMessages([])
    setStreaming('')
    agentRef.current.clearHistory()
  }, [])

  return {
    messages,
    streaming,
    loading,
    activeTools,
    isConfigured: agentRef.current.isConfigured,
    send,
    clear,
  }
}
