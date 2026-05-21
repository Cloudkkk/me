import { tool } from '@langchain/core/tools'
import { z } from 'zod'

export type NavigateAction = {
  type: 'navigate'
  path: string
  slug?: string
}

let pendingNavigation: NavigateAction | null = null

export function consumeNavigation(): NavigateAction | null {
  const action = pendingNavigation
  pendingNavigation = null
  return action
}

export const navigateTool = tool(
  async ({ page, slug }) => {
    const routes: Record<string, string> = {
      home: '/',
      timeline: '/timeline',
      about: '/about',
    }

    const path = routes[page]
    if (!path) {
      return JSON.stringify({
        success: false,
        message: `未知页面: ${page}。可选页面: home, timeline, about`,
      })
    }

    pendingNavigation = { type: 'navigate', path, slug: slug || undefined }

    if (slug) {
      return JSON.stringify({
        success: true,
        message: `正在导航到时间线中的「${slug}」文章详情页。`,
      })
    }

    const pageNames: Record<string, string> = {
      home: '首页',
      timeline: '时间线',
      about: '关于页',
    }

    return JSON.stringify({
      success: true,
      message: `正在导航到${pageNames[page]}。`,
    })
  },
  {
    name: 'navigate_to',
    description: '导航到博客的指定页面。可以导航到首页、时间线、关于页，也可以打开时间线中的某篇文章详情。',
    schema: z.object({
      page: z.enum(['home', 'timeline', 'about']).describe('目标页面'),
      slug: z.string().optional().describe('时间线文章的 slug（仅在 page=timeline 时使用），如 "2026-blog"、"2025-cloud-native" 等'),
    }),
  }
)
