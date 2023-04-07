import express from 'express'
import path from 'path'
import cors from 'cors'
import sockjs from 'sockjs'
import cookieParser from 'cookie-parser'
import axios from 'axios'

import config from './config'
import Html from '../client/html'

require('colors')

let connections = []

const port = process.env.PORT || 8090
const server = express()

const middleware = [
  cors(),
  express.static(path.resolve(__dirname, '../dist')),
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }),
  express.json({ limit: '50mb', extended: true }),
  cookieParser()
]

middleware.forEach((it) => server.use(it))

server.get('/', (req, res) => {
  res.send(`
    <h2>This is SkillCrucial Express Server!</h2>
    <h3>Client hosted at <a href="http://localhost:8087">localhost:8087</a>!</h3>
  `)
})
// making http requests requests and building api
server.get('/api/v1/users/:name', (req, res) => {
  const { name } = req.params
  res.json({ name })
})

server.get('/api/v1/users/', async (req, res) => {
  const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')
  res.json(users)
})

server.get('/api/v1/users/take/:number', async (req, res) => {
  const { number } = req.params
  const { data: users } = await axios('https://jsonplaceholder.typicode.com/users')
  res.json(users.slice(0, +number))
})
//end of practice

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  return res.send(
    Html({
      body: '',
      initialState
    })
  )
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

const app = server.listen(port)

if (config.isSocketsEnabled) {
  const echo = sockjs.createServer()
  echo.on('connection', (conn) => {
    connections.push(conn)
    conn.on('data', async () => {})

    conn.on('close', () => {
      connections = connections.filter((c) => c.readyState !== 3)
    })
  })
  echo.installHandlers(app, { prefix: '/ws' })
}
console.log(`Serving at http://localhost:${port}`)
