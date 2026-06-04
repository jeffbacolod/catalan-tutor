// POST conversation history to the Express proxy, which forwards to Anthropic.
// systemPrompt is passed separately so it never ends up in the messages array.

export async function sendMessage(messages, systemPrompt) {
  const response = await fetch('/api/claude/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Claude API error: ${response.statusText}`)
  }
  return response.json()
}
