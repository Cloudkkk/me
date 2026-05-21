const BASE_TARGET = 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS })
    }

    const apiKey = env.CHAT_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    try {
      const url = new URL(request.url)
      const targetPath = url.pathname || '/v1/chat/completions'
      const target = `${BASE_TARGET}${targetPath}`

      const body = await request.json()

      const payload = {
        model: body.model || 'qwen3.6-plus',
        messages: body.messages || [],
        max_tokens: Math.min(body.max_tokens || 512, 1024),
        temperature: body.temperature ?? 0.7,
        stream: !!body.stream,
        enable_thinking: false,
      }

      if (body.tools) payload.tools = body.tools
      if (body.tool_choice) payload.tool_choice = body.tool_choice

      const upstream = await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (body.stream) {
        return new Response(upstream.body, {
          headers: {
            ...CORS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        })
      }

      const data = await upstream.json()
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    } catch {
      return new Response(JSON.stringify({ error: 'Proxy error' }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
  },
}
