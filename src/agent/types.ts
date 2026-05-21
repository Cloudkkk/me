export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  name?: string
}

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  name: string
  result: string
}

export interface StreamEvent {
  type: 'token' | 'tool_start' | 'tool_end' | 'error' | 'done'
  content?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolResult?: string
}

export interface AgentConfig {
  endpoint: string
  headers: Record<string, string>
  model: string
  maxTokens: number
  temperature: number
  systemPrompt: string
}
