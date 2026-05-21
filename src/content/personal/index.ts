export interface PersonalEntry {
  slug: string
  date: string
  title: string
  description: string
  tag: string
  content: () => Promise<string>
}

const modules = import.meta.glob('./*.md', { query: '?raw', import: 'default' }) as Record<string, () => Promise<string>>

export const personalEntries: PersonalEntry[] = [
  { slug: '2026-blog', date: '2026.05', title: '构建个人博客', description: '用粒子动效与极简设计，打造属于自己的数字空间。', tag: 'project', content: modules['./2026-blog.md'] },
  { slug: '2025-cloud-native', date: '2025', title: '深入 Cloud Native', description: '探索 Kubernetes、微服务架构与分布式系统的实践之路。', tag: 'learning', content: modules['./2025-cloud-native.md'] },
  { slug: '2024-fullstack', date: '2024', title: '全栈开发实践', description: '从前端到后端，TypeScript 全栈技术体系的构建与沉淀。', tag: 'career', content: modules['./2024-fullstack.md'] },
  { slug: '2023-ai', date: '2023', title: '拥抱 AI 浪潮', description: '将 AI 工具融入开发工作流，探索 LLM 的无限可能。', tag: 'exploration', content: modules['./2023-ai.md'] },
  { slug: '2022-opensource', date: '2022', title: '开源贡献之旅', description: '在 GitHub 上参与开源项目，学习协作与代码审查。', tag: 'open-source', content: modules['./2022-opensource.md'] },
  { slug: '2021-origin', date: '2021', title: '编程启程', description: '写下第一行代码，从此踏上了与计算机对话的旅程。', tag: 'origin', content: modules['./2021-origin.md'] },
]

export function getPersonalEntry(slug: string) {
  return personalEntries.find(e => e.slug === slug)
}
