import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { personalEntries, type PersonalEntry } from '../../content/personal'

let knowledgeBase: { entry: PersonalEntry; content: string }[] | null = null

async function loadKnowledgeBase() {
  if (knowledgeBase) return knowledgeBase

  knowledgeBase = await Promise.all(
    personalEntries.map(async (entry) => {
      const content = await entry.content()
      return { entry, content }
    })
  )
  return knowledgeBase
}

function computeRelevance(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/[\s,，。、？！]+/).filter(Boolean)
  const lowerText = text.toLowerCase()
  let score = 0

  for (const term of queryTerms) {
    if (term.length < 2) continue
    const regex = new RegExp(term, 'gi')
    const matches = lowerText.match(regex)
    if (matches) {
      score += matches.length * (term.length > 3 ? 2 : 1)
    }
  }

  return score
}

export const knowledgeSearchTool = tool(
  async ({ query, top_k = 3 }) => {
    const kb = await loadKnowledgeBase()

    const scored = kb.map(({ entry, content }) => {
      const fullText = `${entry.title} ${entry.description} ${entry.tag} ${content}`
      const score = computeRelevance(query, fullText)
      return { entry, content, score }
    })

    scored.sort((a, b) => b.score - a.score)
    const results = scored.slice(0, top_k).filter(r => r.score > 0)

    if (results.length === 0) {
      return JSON.stringify({
        found: false,
        message: '未找到相关内容，请尝试其他关键词。',
      })
    }

    return JSON.stringify({
      found: true,
      results: results.map(({ entry, content, score }) => ({
        slug: entry.slug,
        date: entry.date,
        title: entry.title,
        description: entry.description,
        tag: entry.tag,
        relevance: score,
        content: content.slice(0, 800),
      })),
    })
  },
  {
    name: 'knowledge_search',
    description: '在 C1oud 的个人知识库中搜索相关内容。包含 C1oud 从 2021 到 2026 年的编程历程、技术栈、项目经验等文档。当用户询问 C1oud 的经历、技术、项目时使用。',
    schema: z.object({
      query: z.string().describe('搜索关键词或问题'),
      top_k: z.number().optional().default(3).describe('返回的最大结果数'),
    }),
  }
)
