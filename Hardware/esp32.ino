#include <Adafruit_MLX90614.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Wire.h>

// === Wi-Fi 配置 ===
const char *ssid = "Tim";
const char *password = "12345678";

// === 服务器配置 ===
const char *serverUrl = "https://test.upper.love:8000/data";
const char *sensor_id = "Bob"; // 每块板子设定唯一 ID

// === 采样间隔 ===
const unsigned long sampling_interval = 100; // 单位：毫秒

// === 初始化 MLX90614 ===
Adafruit_MLX90614 mlx = Adafruit_MLX90614();
unsigned long lastSendTime = 0;

void setup() {
  Serial.begin(115200);
  Wire.begin(18, 17); // SDA = GPIO18, SCL = GPIO17

  // 初始化传感器
  if (!mlx.begin()) {
    Serial.println("❌ 无法初始化 MLX90614，请检查接线！");
    while (true)
      ; // 阻塞
  }

  // 连接 Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("🔌 正在连接 WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi 连接成功！");
  Serial.print("IP 地址：");
  Serial.println(WiFi.localIP());
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendTime >= sampling_interval) {
    lastSendTime = now;

    float ambientTemp = mlx.readAmbientTempC();
    float objectTemp = mlx.readObjectTempC();

    // 构造 JSON 数据
    StaticJsonDocument<256> doc;
    doc["sensor_id"] = sensor_id;
    doc["ambient_temp"] = ambientTemp;
    doc["object_temp"] = objectTemp;
    doc["sampling_interval"] = sampling_interval;

    String jsonData;
    serializeJson(doc, jsonData);

    // 输出调试信息
    Serial.println("📡 正在发送数据：");
    Serial.println(jsonData);

    // 发送 POST 请求
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");

      int httpCode = http.POST(jsonData);
      if (httpCode > 0) {
        Serial.printf("✅ POST 成功，响应码：%d\n", httpCode);
        // String response = http.getString(); // 简化服务器响应打印
        // Serial.println("📝 服务器响应：");
        // Serial.println(response);
      } else {
        Serial.printf("❌ POST 失败，错误码：%d\n", httpCode);
      }
      // 增加简短的服务器响应信息，如果需要的话
      // String shortResponse = http.getString();
      // if (shortResponse.length() > 0) {
      //   Serial.printf("服务器简短响应: %s\n", shortResponse.substring(0,
      //   min(50, shortResponse.length())).c_str());
      // }

      http.end();
    } else {
      Serial.println("⚠️ WiFi 未连接，无法发送数据");
    }
  }
}