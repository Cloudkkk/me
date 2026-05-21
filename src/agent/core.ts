import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, AIMessage, SystemMessage, ToolMessage, AIMessageChunk } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { SYSTEM_PROMPT } from './prompt'
import { allTools } from './tools'
import { consumeNavigation, type NavigateAction } from './tools/navigate'
import type { StreamEvent, AgentConfig } from './types'

/** 单次对话中最多进行几轮 tool call（防止无限循环） */
const MAX_TOOL_ROUNDS = 5
/** 上下文窗口中保留的最大历史消息数 */
const MAX_HISTORY_MESSAGES = 10

/**
 * 根据环境变量自动推断 LLM 接入配置：
 * - 生产环境：使用 VITE_CHAT_PROXY_URL（Cloudflare Worker）
 * - 开发环境：通过 Vite proxy 转发到本地 /v1
 */
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

/**
 * C1oud 博客 Agent 核心类。
 *
 * 架构：LangChain ChatOpenAI + bindTools 实现 ReAct 风格的
 * 流式 tool-calling loop，UI 层通过 AsyncGenerator 消费事件。
 */
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
      modelKwargs: { enable_thinking: false },
    })

    this.model = llm.bindTools(allTools)
  }

  get isConfigured(): boolean {
    return !!this.config.endpoint
  }

  clearHistory(): void {
    this.history = []
  }

  /** 消费 navigate tool 产生的导航动作（一次性读取后清空） */
  getNavigationAction(): NavigateAction | null {
    return consumeNavigation()
  }

  /**
   * 核心对话方法，以 AsyncGenerator 形式逐步 yield 事件流：
   *
   * 1. 将用户消息加入历史，拼接 system prompt 后发送给 LLM
   * 2. 流式接收 LLM 响应，逐 token yield 给 UI
   * 3. 若 LLM 返回 tool_calls，依次执行对应 tool 并将结果
   *    作为 ToolMessage 追加到上下文，再次请求 LLM（ReAct loop）
   * 4. 无 tool_calls 时结束循环，yield done 事件
   */
  async *chat(userMessage: string): AsyncGenerator<StreamEvent> {
    if (!this.isConfigured) {
      yield { type: 'error', content: '对话服务未配置' }
      return
    }

    this.history.push(new HumanMessage(userMessage))

    // 滑动窗口截断，避免上下文过长
    if (this.history.length > MAX_HISTORY_MESSAGES) {
      this.history = this.history.slice(-MAX_HISTORY_MESSAGES)
    }

    const messages: BaseMessage[] = [
      new SystemMessage(this.config.systemPrompt),
      ...this.history,
    ]

    let toolRound = 0

    // ReAct loop: LLM 响应 -> 解析 tool calls -> 执行 -> 回传结果 -> 再次请求
    while (toolRound < MAX_TOOL_ROUNDS) {
      try {
        console.group(`[Agent] ReAct round ${toolRound + 1}/${MAX_TOOL_ROUNDS}`)
        console.log('[Agent] messages count:', messages.length)

        // 流式请求：逐 token yield 文本给 UI，同时用 concat 累积完整响应。
        // qwen 流式返回 tool_calls 时 args 会拆成多个 chunk，
        // 必须等所有 chunk 拼完后从 accumulated 中提取完整的 tool_calls。
        const stream = await this.model.stream(messages)
        let accumulated: AIMessageChunk | null = null
        let fullContent = ''

        for await (const chunk of stream) {
          // concat 累积：LangChain 会自动合并 tool_calls 的增量片段
          accumulated = accumulated ? accumulated.concat(chunk) : chunk

          // 实时 yield 文本 token
          const content = typeof chunk.content === 'string' ? chunk.content : ''
          if (content) {
            fullContent += content
            yield { type: 'token', content }
          }
        }

        // 从累积的完整消息中提取 tool_calls（此时 args 已完整拼接）
        const toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> = []

        if (accumulated?.tool_calls && accumulated.tool_calls.length > 0) {
          for (const tc of accumulated.tool_calls) {
            if (tc.name) {
              toolCalls.push({
                id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                name: tc.name,
                args: (tc.args as Record<string, unknown>) || {},
              })
            }
          }
        }

        // fallback: 从 additional_kwargs 中提取（兼容原始 OpenAI 格式）
        if (toolCalls.length === 0 && accumulated?.additional_kwargs?.tool_calls) {
          for (const tc of accumulated.additional_kwargs.tool_calls as Array<{
            id?: string; function?: { name?: string; arguments?: string }
          }>) {
            if (tc.id && tc.function?.name) {
              let args: Record<string, unknown> = {}
              try { args = JSON.parse(tc.function.arguments || '{}') } catch { /* malformed */ }
              toolCalls.push({ id: tc.id, name: tc.function.name, args })
            }
          }
        }

        console.log('[Agent] LLM content:', fullContent.slice(0, 120) || '(empty)')
        console.log('[Agent] tool_calls:', toolCalls.length)
        if (toolCalls.length > 0) {
          console.table(toolCalls.map(tc => ({ name: tc.name, id: tc.id, args: JSON.stringify(tc.args).slice(0, 120) })))
        }

        // 无 tool call —— 本轮对话结束
        if (toolCalls.length === 0) {
          console.log('[Agent] no tool calls, finishing')
          console.groupEnd()
          const aiMsg = new AIMessage(fullContent)
          this.history.push(aiMsg)
          yield { type: 'done' }
          return
        }

        // 将 AI 的 tool_calls 响应加入消息链
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

        // 依次执行每个 tool 并收集结果
        for (const tc of toolCalls) {
          yield { type: 'tool_start', toolName: tc.name, toolArgs: tc.args }

          const targetTool = allTools.find(t => t.name === tc.name)
          let result: string

          if (targetTool) {
            try {
              // allTools 是异构 tool 联合数组，invoke 签名各异，
              // 运行时由 zod schema 校验参数，这里用 as never 绕过静态类型
              result = await (targetTool as StructuredToolInterface).invoke(tc.args as never)
            } catch (err) {
              result = JSON.stringify({ error: String(err) })
            }
          } else {
            result = JSON.stringify({ error: `Unknown tool: ${tc.name}` })
          }

          console.log(`[Agent] tool "${tc.name}" result:`, result.slice(0, 200))

          yield { type: 'tool_end', toolName: tc.name, toolResult: result }

          const toolMsg = new ToolMessage({
            content: result,
            tool_call_id: tc.id,
          })
          messages.push(toolMsg)
          this.history.push(toolMsg)
        }

        console.groupEnd()
        toolRound++
      } catch (err) {
        console.error('[Agent] error in round', toolRound, err)
        console.groupEnd()
        const errorMsg = err instanceof Error ? err.message : String(err)
        yield { type: 'error', content: `请求失败: ${errorMsg}` }
        return
      }
    }

    console.warn('[Agent] tool round limit reached!', { toolRound, MAX_TOOL_ROUNDS })
    yield { type: 'error', content: '工具调用轮次超限，请简化问题后重试。' }
  }
}

/** 单例，整个应用共享同一个 Agent 实例及其对话历史 */
let agentInstance: C1oudAgent | null = null

export function getAgent(): C1oudAgent {
  if (!agentInstance) {
    agentInstance = new C1oudAgent()
  }
  return agentInstance
}
