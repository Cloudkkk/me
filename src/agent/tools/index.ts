export { knowledgeSearchTool } from './knowledge-search'
export { navigateTool, consumeNavigation, type NavigateAction } from './navigate'
export { queryTimelineTool } from './query-timeline'
export { getCurrentTimeTool } from './get-current-time'

import { knowledgeSearchTool } from './knowledge-search'
import { navigateTool } from './navigate'
import { queryTimelineTool } from './query-timeline'
import { getCurrentTimeTool } from './get-current-time'

export const allTools = [
  knowledgeSearchTool,
  navigateTool,
  queryTimelineTool,
  getCurrentTimeTool,
]
