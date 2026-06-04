// Creates and manages a D-ID streaming talk session for the animated avatar.
// The backend proxies D-ID credentials; this service handles the WebRTC lifecycle.

export async function createTalkStream(sourceUrl, audioUrl) {
  const response = await fetch('/api/did/talks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceUrl, audioUrl }),
  })
  if (!response.ok) {
    throw new Error(`D-ID API error: ${response.statusText}`)
  }
  return response.json()
}

export async function getTalkStatus(talkId) {
  const response = await fetch(`/api/did/talks/${talkId}`)
  if (!response.ok) {
    throw new Error(`D-ID API error: ${response.statusText}`)
  }
  return response.json()
}
