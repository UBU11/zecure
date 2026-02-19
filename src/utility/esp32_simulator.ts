import fs from "fs";
import path from "path";
import { encryptJsonFile } from "./key";


type ESP32State = "BOOTING" | "CONNECTING_WIFI" | "CONNECTING_MQTT" | "RUNNING" | "ERROR";

type ESP32Data = {
  device_id: string;
  voltage: number;
  current: number;
  power: number;
  power_factor: number;
  timestamp: number;
};

class ESP32Simulator {
  private deviceId: string;
  private state: ESP32State = "BOOTING";
  private voltage: number = 230;
  private current: number = 0.5;
  private powerFactor: number = 0.9;
  private dataFile: string;
  private encryptedFile: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    this.dataFile = path.resolve(__dirname, "../data/esp32.json");
    this.encryptedFile = path.resolve(__dirname, "../data/esp32.json.enc");
  }

  private log(message: string, level: "INFO" | "WARN" | "ERROR" = "INFO") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.deviceId}] [${level}] ${message}`);
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateMetrics() {

    const voltageChange = (Math.random() - 0.5) * 2;
    this.voltage += voltageChange;

    this.voltage = Math.min(Math.max(this.voltage, 210), 250);


    const currentChange = (Math.random() - 0.5) * 0.1;
    this.current += currentChange;
    this.current = Math.max(0, this.current);


    this.powerFactor = 0.8 + Math.random() * 0.2;

    const power = this.voltage * this.current * this.powerFactor;

    return {
      voltage: parseFloat(this.voltage.toFixed(2)),
      current: parseFloat(this.current.toFixed(2)),
      power: parseFloat(power.toFixed(2)),
      power_factor: parseFloat(this.powerFactor.toFixed(2)),
    };
  }

  private async saveState(data: ESP32Data) {
    try {

      fs.writeFileSync(this.dataFile, JSON.stringify([data], null, 2));


      await encryptJsonFile(this.dataFile, this.encryptedFile);

    } catch (error) {
      this.log(`Failed to save state: ${error}`, "ERROR");
    }
  }

  public async start() {
    this.log("Initializing ESP32...", "INFO");
    await this.sleep(1000);


    this.state = "BOOTING";
    this.log("Booting kernel...", "INFO");
    await this.sleep(1500);
    this.log("Hardware initialized.", "INFO");


    this.state = "CONNECTING_WIFI";
    this.log("Scanning for networks...", "INFO");
    await this.sleep(2000);
    this.log("Connecting to 'Home_IoT_Secure'...", "INFO");
    await this.sleep(2500);
    this.log("WiFi Connected. IP: 192.168.1.105", "INFO");


    this.state = "CONNECTING_MQTT";
    this.log("Connecting to MQTT Broker...", "INFO");
    await this.sleep(1000);
    this.log("MQTT Connected.", "INFO");


    this.state = "RUNNING";
    this.log("Starting main loop. Publishing sensor data...", "INFO");

    while (true) {
      const metrics = this.generateMetrics();

      const payload: ESP32Data = {
        device_id: this.deviceId,
        ...metrics,
        timestamp: Date.now(),
      };

      console.log(
        `[${new Date().toISOString()}] V:${metrics.voltage}V | I:${metrics.current}A | P:${metrics.power}W`
      );

      await this.saveState(payload);


      await this.sleep(2000);
    }
  }
}


const simulator = new ESP32Simulator("esp32-room-01");
simulator.start().catch((err) => console.error(err));
