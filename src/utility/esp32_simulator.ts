type esp32 = {
  device_id: string;
  voltage: number;
  power: number;
  timestamp: number;
};

const base_voltage = 230;
const base_current = 0.5;

function randGen(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getSimulatedMetrics() {
  const voltage = base_voltage + randGen(-10, 10) + (Math.random() - 0.5);
  const current = base_current + (randGen(1, 5) / 10) + (Math.random() * 0.1);
  const pf = parseFloat((Math.random() * (1.0 - 0.7) + 0.7).toFixed(2));

  return {
    voltage: Math.round(voltage * 100) / 100,
    power: Math.round((voltage * current * pf) * 100) / 100
  };
}

function generateESPData(id: string): esp32 {
  const metrics = getSimulatedMetrics();
  return {
    device_id: id,
    voltage: metrics.voltage,
    power: metrics.power,
    timestamp: Date.now(),
  };
}


function simulateStream(count: number, deviceId: string): esp32[] {
  return Array.from({ length: count }, () => generateESPData(deviceId));
}


const simulationBatch = simulateStream(5, "esp32-room-01");
console.table(simulationBatch);
