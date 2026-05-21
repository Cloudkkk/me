import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import { SYSTEM_PROMPT } from './prompt'
import { allTools } from './tools'
import { consumeNavigation, type NavigateAction } from './tools/navigate'
import type { StreamEvent, AgentConfig } from './types'

const MAX_TOOL_ROUNDS = 5
const MAX_HISTORY_MESSAGES = 10

function getDefaultConfig(): AgentConfig {
  const proxyUrl = import.meta.env.VITE_CHAT_PROXY_URL
  const isDev = import.meta.env.DEV

  let endpoint = ''
  if (proxyUrl) {
    endpoint = proxyUrl.replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '')
  } else if (isDev) {
    endpoint = `${window.location.origin}/v1`
  }

  return {
    endpoint,
    headers: {},
    model: 'qwen3.6-plus',
    maxTokens: 512,
    temperature: 0.7,
    systemPrompt: SYSTEM_PROMPT,
  }
}

export class C1oudAgent {
  private config: AgentConfig
  private model: ReturnType<ChatOpenAI['bindTools']>
  private history: BaseMessage[] = []

  constructor(config?: Partial<AgentConfig>) {
    const defaults = getDefaultConfig()
    this.config = { ...defaults, ...config }

    const llm = new ChatOpenAI({
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      streaming: true,
      configuration: {
        baseURL: this.config.endpoint,
      },
      apiKey: import.meta.env.VITE_CHAT_API_KEY || 'not-needed',
    })

    this.model = llm.bindTools(allTools)
  }

  get isConfigured(): boolean {
    return !!this.config.endpoint
  }

  clearHistory(): void {
    this.history = []
  }

  getNavigationAction(): NavigateAction | null {
    return consumeNavigation()
  }

  async *chat(userMessage: string): AsyncGenerator<StreamEvent> {
    if (!this.isConfigured) {
      yield { type: 'error', content: '对话服务未配置' }
      return
    }

    this.history.push(new HumanMessage(userMessage))

    if (this.history.length > MAX_HISTORY_MESSAGES) {
      this.history = this.history.slice(-MAX_HISTORY_MESSAGES)
    }

    const messages: BaseMessage[] = [
      new SystemMessage(this.config.systemPrompt),
      ...this.history,
    ]

    let toolRound = 0

    while (toolRound < MAX_TOOL_ROUNDS) {
      try {
        const stream = await this.model.stream(messages)
        let fullContent = ''
        let toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> = []
        const toolCallBuffers: Map<number, { id: string; name: string; argsStr: string }> = new Map()

        for await (const chunk of stream) {
          const content = typeof chunk.content === 'string' ? chunk.content : ''
          if (content) {
            fullContent += content
            yield { type: 'token', content }
          }

          if (chunk.tool_calls && chunk.tool_calls.length > 0) {
            for (const tc of chunk.tool_calls) {
              if (tc.id && tc.name) {
                toolCalls.push({
                  id: tc.id,
                  name: tc.name,
                  args: (tc.args as Record<string, unknown>) || {},
                })
              }
            }
          }

          if (chunk.additional_kwargs?.tool_calls) {
            for (const tc of chunk.additional_kwargs.tool_calls as Array<{
              index: number; id?: string; function?: { name?: string; arguments?: string }
            }>) {
              const idx = tc.index ?? 0
              if (!toolCallBuffers.has(idx)) {
                toolCallBuffers.set(idx, { id: '', name: '', argsStr: '' })
              }
              const buf = toolCallBuffers.get(idx)!
              if (tc.id) buf.id = tc.id
              if (tc.function?.name) buf.name = tc.function.name
              if (tc.function?.arguments) buf.argsStr += tc.function.arguments
            }
          }
        }

        if (toolCalls.length === 0 && toolCallBuffers.size > 0) {
          for (const buf of toolCallBuffers.values()) {
            if (buf.id && buf.name) {
              let args: Record<string, unknown> = {}
              try { args = JSON.parse(buf.argsStr) } catch { /* empty */ }
              toolCalls.push({ id: buf.id, name: buf.name, args })
            }
          }
        }

        if (toolCalls.length === 0) {
          const aiMsg = new AIMessage(fullContent)
          this.history.push(aiMsg)
          yield { type: 'done' }
          return
        }

        const aiMsg = new AIMessage({
          content: fullContent,
          tool_calls: toolCalls.map(tc => ({
            id: tc.id,
            name: tc.name,
            args: tc.args,
            type: 'tool_call' as const,
          })),
        })
        messages.push(aiMsg)
        this.history.push(aiMsg)

        for (const tc of toolCalls) {
          yield { type: 'tool_start', toolName: tc.name, toolArgs: tc.args }

          const targetTool = allTools.find(t => t.name === tc.name)
          let result: string

          if (targetTool) {
            try {
              result = await targetTool.invoke(tc.args)
            } catch (err) {
              result = JSON.stringify({ error: String(err) })
            }
          } else {
            result = JSON.stringify({ error: `Unknown tool: ${tc.name}` })
          }

          yield { type: 'tool_end', toolName: tc.name, toolResult: result }

          const toolMsg = new ToolMessage({
            content: result,
            tool_call_id: tc.id,
          })
          messages.push(toolMsg)
          this.history.push(toolMsg)
        }

        toolRound++
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        yield { type: 'error', content: `请求失败: ${errorMsg}` }
        return
      }
    }

    yield { type: 'error', content: '工具调用轮次超限，请简化问题后重试。' }
  }
}

let agentInstance: C1oudAgent | null = null

export function getAgent(): C1oudAgent {
  if (!agentInstance) {
    agentInstance = new C1oudAgent()
  }
  return agentInstance
}
