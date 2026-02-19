import mqtt from 'mqtt';

const protocol = 'mqtt';
const host = 'localhost';
const port = '1883';
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `${protocol}://${host}:${port}`;

const topic = 'esp32/data';

const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'client1',
    password: 'public',
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log('Connected');
    client.subscribe(topic, (err)=>{
      if(err){
        console.log(err)
      }
      console.log('Subscribed to topic: ', topic)

    })
});

client.on('message', (topic, message) => {
    console.log('Message: ', message.toString());
    console.log(topic)
    client.end;
});

client.on('error', (err)=>{
  console.log('websocket error: ',err)
  client.reconnect()
})
