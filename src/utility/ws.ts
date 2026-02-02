import mqtt from "mqtt";

const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const connectUrl = `ws://localhost:1883/mqtt`;

const topic = 'node/socket'

const wsClient = mqtt.connect(connectUrl, {
  clientId,
  keepalive:30,
  clean: true,
  connectTimeout: 4000,
  username: "ws service",
  reconnectPeriod: 10000,
});


wsClient.on('connect', () => {
  console.log( 'ws client connected!')

  wsClient.subscribe(topic, error=>{
    if(!error){
      wsClient.publish(topic,`ws socket data publishing from topic:${topic} `)
    }
  })
})


wsClient.on('message', (topic, message)=> {
    console.log(`Received message. Payload: ${message.toString()}. Topic: ${topic}`);
    wsClient.end()
})


wsClient.on('error', (error) => {
    console.log('Error: ', error);
});

wsClient.on('packetreceive', packet =>{
  console.log('packet send ....', packet)
})

wsClient.on('reconnect',()=>{
   console.log('Reconnecting')
})

wsClient.on('close', ()=>{
  console.log('Closing Client')
})
