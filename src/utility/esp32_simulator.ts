type esp32 = {
  device_id: string;
  voltage:  number;
  power:  number;
  timestamp: number;
};

const base_voltage = 230; // Math.floor(Math.random() * (250-230 +1)) + 230;
const base_current = 0.5;

function randGen(max: number, min: number): number {
  const high = max;
  const low = min;
  return Math.floor(Math.random() * (high - low + 1) + low);
}

function espVoltage(base: number): number | null {
  const base_value = base;
  const low_voltage = 5;
  const high_voltage = 10;

  let drift_voltage = randGen(high_voltage, low_voltage);
  let small_noise = Math.random() < 0.5 ? -1 : 1;
  let voltage = base_value + drift_voltage + small_noise;

  if (voltage < 180 || voltage >= 250) {
    console.error(`voltage simulation is not simulate properly ${voltage}`);
    return null;
  }

  return voltage;
}

function espCurrent(base: number): number {
  const base_value = base;
  const low_current = 2;
  const high_current = 5;
  let spike = randGen(high_current, low_current);
  let noise = Math.random() < 0.5 ? -0.5 : 0.5;
  let current = base_value + spike + noise;
  return current;
}

function powerFactor(): number {
  const high = 1;
  const low = 0.7;
  return randGen(high, low);
}

function espPower(power_facotr: () => number) {
  let voltage = espVoltage(base_voltage);
  let current = espCurrent(base_current);
  let pf = power_facotr();

  const power = voltage! * current * pf;

  if(power == 0 || power < 0){
    console.log(`power generation can't be ${power} `)
    return null
  }
  return power;
}

console.log(espPower(powerFactor));
