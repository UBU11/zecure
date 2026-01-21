import mqtt from "mqtt";

const brokerUrl = "mqtt://localhost:1883";

const client = mqtt.connect(brokerUrl, {
  clientId: "client_1",
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});


client.on("connect", ()=>{
  console.log("connected to broker")

  client.subscribe('test/topic',(err) =>{
    if(!err){
        client.publish("test/topic","Hello from single client")
    }
  })
})


client.on('message',(topic:string, msg:Buffer)=>{
  console.log(`Received on ${topic}: ${msg.toString()}`)
})


client.on("error", (err:Error)=>{
  console.error(`MQTT error: ${err}`)
})
