require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connectDB } = require('./src/config/db')
const usersRouter = require('./src/api/routes/users')
const eventsRouter = require('./src/api/routes/events')
const { connectCloudinary } = require('./src/config/cloudinary')

const app = express()
const PORT = process.env.PORT || 3000

connectDB()
connectCloudinary()
app.use(express.json())
app.use(cors())

app.use('/api/v1/users', usersRouter)
app.use('/api/v1/events', eventsRouter)

app.use((req, res, next) => {
  return res.status(404).json('Route not found')
})

app.listen(PORT, () => {
  console.log(`El servidor está funcionando en http://localhost:${PORT}`)
})
