const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://mqtt:1883', {
    connectTimeout: 5000,
    reconnectPeriod: 0 
});

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    process.exit(0);
});

client.on('error', (err) => {
    console.error('Failed to connect:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('Connection timed out');
    process.exit(1);
}, 6000);
