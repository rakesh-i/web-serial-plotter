#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

// Replace these with your network credentials
const char* ssid = "SSID";
const char* password = "PASSWORD";

// Create a WebSocket server object
WebSocketsServer webSocket = WebSocketsServer(81);

// Create an object for the MPU6050 sensor
Adafruit_MPU6050 mpu;

void setup(void) {
  // Initialize serial communication at 115200 baud
  Serial.begin(115200);

  // Initialize I2C communication on specified SDA and SCL pins
  Wire.begin(21, 4);

  // Initialize the MPU6050 sensor
  if (!mpu.begin()) {
    // If initialization fails, loop indefinitely
    while (1) {
      delay(10);
    }
  }

  // Configure the MPU6050 sensor
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  // Connect to Wi-Fi network
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected to Wi-Fi. IP address: ");
  Serial.println(WiFi.localIP());

  // Start the WebSocket server and set the event handler
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  // Handle WebSocket events
  webSocket.loop();

  // Get new sensor events with the readings
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Create a JSON string with the accelerometer data
  String payload = "{";
  payload += "\"ax\": " + String(a.acceleration.x) + ",";
  payload += "\"ay\": " + String(a.acceleration.y) + ",";
  payload += "\"az\": " + String(a.acceleration.z) ;
  payload += "}";

  // Broadcast the accelerometer data to all connected WebSocket clients
  webSocket.broadcastTXT(payload);

  // Delay to throttle the sensor reading frequency
  delay(10);
}

// Event handler for WebSocket events
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      // Handle disconnection event
      break;
    case WStype_CONNECTED:
      // Handle new connection event
      break;
    case WStype_TEXT:
      // Handle incoming text message event
      break;
  }
}
