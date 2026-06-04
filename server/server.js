import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import claudeRouter from './routes/claude.js'
import elevenLabsRouter from './routes/elevenlabs.js'
import didRouter from './routes/did.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/claude', claudeRouter)
app.use('/api/elevenlabs', elevenLabsRouter)
app.use('/api/did', didRouter)

app.listen(PORT, () => {
  console.log(`CatalanTutor server running on http://localhost:${PORT}`)
})
