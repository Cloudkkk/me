const TARGET = 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
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
      const t0 = Date.now()
      const body = await request.json()
      const t1 = Date.now()

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

      const upstream = await fetch(TARGET, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })
      const t2 = Date.now()

      console.log(`[Worker] parse=${t1-t0}ms upstream=${t2-t1}ms total=${t2-t0}ms stream=${body.stream}`)

      if (body.stream) {
        return new Response(upstream.body, {
          headers: {
            ...CORS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Worker-Timing': `parse=${t1-t0}ms,upstream=${t2-t1}ms`,
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
