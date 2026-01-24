import fs from 'fs'
import mqtt from 'mqtt'

const protocol = 'mqtts'
const host = 'localhost'
const port = '8883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `${protocol}://${host}:${port}`

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
  rejectUnauthorized: true,
  ca: fs.readFileSync('cert/ca.crt'),
  key: fs.readFileSync('cert/client.key'),
  cert: fs.readFileSync('cert/client.crt'),
})
