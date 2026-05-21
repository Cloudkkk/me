import { tool } from '@langchain/core/tools'
import { z } from 'zod'

export const getCurrentTimeTool = tool(
  async () => {
    const now = new Date()
    return JSON.stringify({
      iso: now.toISOString(),
      local: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      date: now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      time: now.toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      timestamp: now.getTime(),
    })
  },
  {
    name: 'get_current_time',
    description: '获取当前时间。当用户询问时间或需要基于时间的上下文时使用。',
    schema: z.object({}),
  }
)
