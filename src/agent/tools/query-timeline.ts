import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { personalEntries } from '../../content/personal'

const agentTimelineEntries = [
  { date: '2026.05', title: '四大终端 Agent 格局成型', tag: 'agent' },
  { date: '2026.04', title: 'Claude 4 发布', tag: 'agent' },
  { date: '2026.03', title: 'Manus 通用 Agent 爆火', tag: 'agent' },
  { date: '2026.01', title: 'DeepSeek-R1 开源推理模型', tag: 'agent' },
  { date: '2025.12', title: 'Google Gemini 2.0 发布', tag: 'agent' },
  { date: '2025.09', title: 'OpenAI o1 推理模型', tag: 'agent' },
  { date: '2025.06', title: 'Claude 3.5 Sonnet', tag: 'agent' },
  { date: '2025.03', title: 'GPT-4o 多模态', tag: 'agent' },
  { date: '2024.11', title: 'Cursor AI 代码编辑器崛起', tag: 'agent' },
  { date: '2024.06', title: 'Claude 3 Opus 发布', tag: 'agent' },
  { date: '2024.02', title: 'Sora 视频生成模型', tag: 'agent' },
  { date: '2024.01', title: 'RAG 技术成为主流', tag: 'agent' },
]

export const queryTimelineTool = tool(
  async ({ type, year }) => {
    let results: { date: string; title: string; tag: string; slug?: string }[] = []

    if (type === 'personal' || type === 'all') {
      const personal = personalEntries.map(e => ({
        date: e.date,
        title: e.title,
        tag: e.tag,
        slug: e.slug,
      }))
      results.push(...personal)
    }

    if (type === 'agent' || type === 'all') {
      results.push(...agentTimelineEntries)
    }

    if (year) {
      results = results.filter(e => e.date.startsWith(year))
    }

    results.sort((a, b) => b.date.localeCompare(a.date))

    return JSON.stringify({
      total: results.length,
      entries: results,
    })
  },
  {
    name: 'query_timeline',
    description: '查询时间线上的事件条目。支持按类型（个人/AI行业/全部）和年份筛选。',
    schema: z.object({
      type: z.enum(['personal', 'agent', 'all']).describe('事件类型：personal=个人经历, agent=AI行业事件, all=全部'),
      year: z.string().optional().describe('筛选年份，如 "2024"、"2025"'),
    }),
  }
)
