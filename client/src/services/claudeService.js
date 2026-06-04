// Sends messages to the backend /api/claude proxy, which calls the Anthropic API.
// All conversation turns are passed so Claude maintains context.

export async function sendMessage(messages) {
  const response = await fetch('/api/claude/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }
  return response.json()
}
