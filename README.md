# 远程呼吸频率检测系统 (Non-contact Breath Rate Detection)

“为自己喝彩”

一个基于红外温度传感器的非接触式呼吸频率实时监测系统，采用ESP32硬件、Flask后端和现代化Web前端的完整解决方案。

## 🌟 项目特性

- **非接触式检测**：使用MLX90614红外温度传感器，无需接触人体
- **实时监测**：100ms采样间隔，实时数据传输和处理
- **智能算法**：基于信号处理的呼吸频率计算，支持带通滤波和峰值检测
- **现代化界面**：响应式Web界面，支持中英文切换
- **安全通信**：HTTPS加密传输，保障数据安全
- **多设备支持**：支持多个传感器设备同时工作

## 🏗️ 系统架构

```
┌─────────────────┐    HTTPS/WiFi    ┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   ESP32硬件端    │ ───────────────► │   Flask后端      │ ───────────────► │   Web前端       │
│                 │                  │                 │                  │                 │
│ • MLX90614传感器 │                  │ • 数据接收处理   │                  │ • 实时数据展示   │
│ • WiFi连接      │                  │ • 呼吸频率计算   │                  │ • 图表可视化     │
│ • 数据采集上传   │                  │ • RESTful API   │                  │ • 多语言支持     │
└─────────────────┘                  └─────────────────┘                  └─────────────────┘
```

## 📁 项目结构

```
BreathRate
├── Backend/                 # Flask后端服务
│   └── app.py               # 主应用程序
├── Frontend/                # Web前端界面
│   ├── index.html          # 主页面
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       ├── main.js         # 主程序入口
│       ├── data.js         # 数据处理模块
│       ├── ui.js           # 界面控制模块
│       ├── core.js         # 核心功能模块
│       ├── chart.js        # 图表显示模块
│       └── gsap.min.js     # 动画库
└── Hardware/                # ESP32硬件代码
    └── esp32.ino           # Arduino代码
```

## 🔧 技术栈

### 硬件端
- **微控制器**：ESP32
- **传感器**：MLX90614红外温度传感器
- **开发环境**：Arduino IDE
- **通信协议**：WiFi + HTTPS

### 后端
- **框架**：Flask (Python)
- **数据处理**：NumPy, SciPy
- **跨域支持**：Flask-CORS
- **安全**：SSL/TLS加密
- **日志**：Python logging

### 前端
- **技术**：原生JavaScript (ES6+)
- **样式**：CSS3 + CSS变量
- **动画**：GSAP
- **特性**：响应式设计、国际化支持

## 🚀 快速开始

### 环境要求

- Python 3.7+
- Arduino IDE
- ESP32开发板
- MLX90614传感器
- SSL证书（用于HTTPS）

### 1. 后端部署

#### 系统要求
- Python 3.7 或更高版本
- pip 包管理器
- SSL证书（生产环境）
- 至少 512MB 可用内存

#### 安装依赖
```bash
cd Backend

# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 安装依赖包
pip install flask flask-cors numpy scipy

# 验证安装
python -c "import flask, numpy, scipy; print('依赖安装成功')"
```

#### SSL证书配置

**生产环境（HTTPS）：**
将SSL证书文件放置在以下路径：
```
www/wwwroot/test.upper.love/SSL/
├── test.upper.love.crt    # 证书文件
└── test.upper.love.key    # 私钥文件
```

**开发环境（HTTP）：**
如需使用HTTP进行开发测试，修改 `app.py` 最后几行：
```python
if __name__ == '__main__':
    logger.info("呼吸监测后端启动，监听端口8000 (HTTP)")
    # 注释掉SSL配置
    # ssl_context = ('www/wwwroot/test.upper.love/SSL/test.upper.love.crt', 
    #                'www/wwwroot/test.upper.love/SSL/test.upper.love.key')
    app.run(host='0.0.0.0', port=8000, debug=True)  # 移除ssl_context参数
```

#### 配置参数调整

在 `app.py` 中可根据需要调整以下参数：

```python
# 数据存储配置
DEVICE_DATA_LIMIT = 10000        # 每设备最大存储数据点数

# 呼吸频率计算参数
MIN_SAMPLES_FOR_START = 30       # 开始计算所需最少样本数（约3秒）
WINDOW_SAMPLES = 200             # 计算窗口大小（约20秒）
MIN_PEAK_SAMPLES = 5             # 峰值检测最少样本数
FREQ_THRESHOLD = 0.03            # 频率检测阈值（越小越敏感）
FILTER_ORDER = 2                 # 滤波器阶数
```

#### 启动服务

**前台运行（开发）：**
```bash
python app.py
```

**后台运行（生产）：**
```bash
# 使用 nohup
nohup python app.py > breath_server.log 2>&1 &

# 或使用 screen
screen -S breath_server
python app.py
# Ctrl+A, D 分离会话

# 或使用 systemd（推荐）
sudo nano /etc/systemd/system/breath-rate.service
```

**systemd 服务配置示例：**
```ini
[Unit]
Description=Breath Rate Detection Server
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/BreathRate/Backend
Environment=PATH=/path/to/BreathRate/Backend/venv/bin
ExecStart=/path/to/BreathRate/Backend/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable breath-rate.service
sudo systemctl start breath-rate.service
sudo systemctl status breath-rate.service
```

#### 服务验证

服务启动后，可通过以下方式验证：

```bash
# 检查服务状态
curl -k https://test.upper.love:8000/health
# 或 HTTP: curl http://localhost:8000/health

# 查看日志
tail -f breath_rate_server.log

# 检查端口占用
netstat -tlnp | grep 8000
```

预期响应：
```json
{
  "status": "ok",
  "active_devices": [],
  "total_data_points": 0
}
```

### 2. 硬件配置

#### 硬件要求
- ESP32 开发板（推荐 ESP32-DevKitC）
- MLX90614 红外温度传感器
- 杜邦线若干
- 面包板（可选）
- USB数据线（用于编程和供电）

#### 硬件连接

**标准连接方式：**
```
ESP32 引脚    MLX90614 引脚    说明
─────────    ─────────────    ────────────
GPIO18       SDA              I2C 数据线
GPIO17       SCL              I2C 时钟线
3.3V         VCC              电源正极
GND          GND              电源负极
```

**连接注意事项：**
- 确保使用3.3V供电，不要使用5V
- I2C总线需要上拉电阻（通常传感器模块已集成）
- 连接线尽量短，避免干扰
- 可在SDA和SCL线上并联4.7kΩ上拉电阻到3.3V（如果传感器模块没有）

#### 开发环境配置

**1. 安装 Arduino IDE**
- 下载并安装 [Arduino IDE](https://www.arduino.cc/en/software)
- 版本要求：1.8.x 或 2.x

**2. 添加 ESP32 开发板支持**
```
文件 → 首选项 → 附加开发板管理器网址
添加：https://dl.espressif.com/dl/package_esp32_index.json

工具 → 开发板 → 开发板管理器
搜索 "ESP32" 并安装 "ESP32 by Espressif Systems"
```

**3. 安装必需库**
```
工具 → 管理库，搜索并安装：
- Adafruit MLX90614 Library (by Adafruit)
- ArduinoJson (by Benoit Blanchon)
- WiFi (ESP32 内置，无需额外安装)
```

#### 代码配置

在 `Hardware/esp32.ino` 中修改以下配置：

**WiFi 配置：**
```cpp
// WiFi配置 - 根据实际网络环境修改
const char *ssid = "你的WiFi名称";        // 2.4GHz WiFi
const char *password = "你的WiFi密码";    // WPA/WPA2密码
```

**服务器配置：**
```cpp
// 服务器配置
const char *serverUrl = "https://test.upper.love:8000/data";  // 生产环境
// const char *serverUrl = "http://192.168.1.100:8000/data";   // 开发环境

const char *sensor_id = "设备唯一ID";  // 每个设备设置不同ID，如："Device_001"
```

**采样配置：**
```cpp
// 采样间隔配置（毫秒）
const unsigned long sampling_interval = 100;  // 100ms = 10Hz采样率
// 可选值：50ms(20Hz), 100ms(10Hz), 200ms(5Hz)
```

**I2C 引脚配置（如需修改）：**
```cpp
void setup() {
  // ...
  Wire.begin(18, 17); // SDA = GPIO18, SCL = GPIO17
  // 如需修改引脚：Wire.begin(SDA_PIN, SCL_PIN);
  // ...
}
```

#### 编译和上传

**1. 开发板配置**
```
工具 → 开发板："ESP32 Dev Module"
工具 → 上传速度："921600"
工具 → CPU频率："240MHz (WiFi/BT)"
工具 → Flash频率："80MHz"
工具 → Flash模式："QIO"
工具 → Flash大小："4MB (32Mb)"
工具 → 分区方案："Default 4MB with spiffs"
工具 → 端口：选择对应的串口
```

**2. 编译验证**
```
项目 → 验证/编译 (Ctrl+R)
检查编译输出，确保无错误
```

**3. 上传代码**
```
项目 → 上传 (Ctrl+U)
上传过程中按住ESP32的BOOT按钮（如果需要）
```

#### 调试和监控

**串口监视器配置：**
```
工具 → 串口监视器
波特率：115200
```

**正常运行输出示例：**
```
🔌 正在连接 WiFi...
✅ WiFi 连接成功！
IP 地址：192.168.1.100
📡 正在发送数据：
{"sensor_id":"Bob","ambient_temp":25.5,"object_temp":36.2,"sampling_interval":100}
✅ POST 成功，响应码：200
```

#### 硬件故障排除

**常见问题及解决方案：**

1. **传感器初始化失败**
   ```
   ❌ 无法初始化 MLX90614，请检查接线！
   ```
   - 检查I2C接线是否正确
   - 确认传感器供电电压为3.3V
   - 检查传感器是否损坏

2. **WiFi连接失败**
   ```
   🔌 正在连接 WiFi......（一直显示点）
   ```
   - 确认WiFi名称和密码正确
   - 检查WiFi是否为2.4GHz频段
   - 确认ESP32在WiFi信号覆盖范围内

3. **HTTP请求失败**
   ```
   ❌ POST 失败，错误码：-1
   ```
   - 检查服务器地址和端口
   - 确认服务器正在运行
   - 检查防火墙设置
   - 验证SSL证书（HTTPS）

4. **数据异常**
   - 传感器读数为NaN：检查传感器连接
   - 温度值异常：检查传感器安装位置
   - 采样间隔不稳定：检查代码逻辑

#### 多设备部署

**设备ID规划：**
```cpp
// 设备1
const char *sensor_id = "Room_A_001";

// 设备2  
const char *sensor_id = "Room_B_002";

// 设备3
const char *sensor_id = "Lab_C_003";
```

**批量配置建议：**
- 为每个设备准备独立的配置文件
- 使用标签标识不同设备
- 建立设备部署记录表
- 统一固件版本管理

### 3. 前端部署

#### 配置服务器地址
在 `Frontend/js/data.js` 中确认服务器配置：

```javascript
const SERVER_URL = 'https://test.upper.love:8000';
const SENSOR_ID = 'Bob';  // 与硬件设备ID保持一致
```

#### 部署方式

**方式一：本地文件访问**
直接用浏览器打开 `Frontend/index.html`

**方式二：HTTP服务器**
```bash
cd Frontend
python -m http.server 3000
# 访问 http://localhost:3000
```

**方式三：Nginx部署**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/Frontend;
    index index.html;
}
```

## 📡 API接口文档

### 数据接收 (POST /data)
接收硬件设备上传的传感器数据

**请求体：**
```json
{
    "sensor_id": "Bob",
    "ambient_temp": 25.5,
    "object_temp": 36.2,
    "sampling_interval": 100
}
```

### 数据获取 (GET /data)
获取指定设备的最新数据和呼吸频率

**参数：** `sensor_id` - 设备ID

**响应：**
```json
{
    "sensor_id": "Bob",
    "ambient_temp": 25.5,
    "object_temp": 36.2,
    "sampling_interval": 100,
    "timestamp": "2024-01-01T12:00:00",
    "breath_rate": 18
}
```

### 呼吸频率 (GET /rate)
单独获取呼吸频率计算结果

### 设备重置 (POST /reset)
重置指定设备的历史数据

### 健康检查 (GET /health)
检查服务状态和活跃设备

## ⚙️ 配置说明

### 呼吸频率计算参数

在 `Backend/app.py` 中可调整以下参数：

```python
MIN_SAMPLES_FOR_START = 30   # 开始计算所需最少样本数
WINDOW_SAMPLES = 200         # 计算窗口大小
MIN_PEAK_SAMPLES = 5         # 峰值检测最少样本数
FREQ_THRESHOLD = 0.03        # 频率检测阈值
FILTER_ORDER = 2             # 滤波器阶数
```

### 前端更新频率

在 `Frontend/js/data.js` 中调整：

```javascript
const FETCH_INTERVAL = 500;  // 数据获取间隔(毫秒)
```

## 🔍 故障排除

### 后端问题诊断

#### 1. 服务启动问题

**SSL证书错误：**
```
FileNotFoundError: [Errno 2] No such file or directory: 'www/wwwroot/test.upper.love/SSL/test.upper.love.crt'
```
解决方案：
- 确保证书路径正确
- 检查域名与证书匹配
- 临时使用HTTP进行测试（修改代码移除ssl_context）

**端口占用错误：**
```
OSError: [Errno 48] Address already in use
```
解决方案：
```bash
# 查找占用端口的进程
lsof -i :8000
# 或
netstat -tlnp | grep 8000

# 终止进程
kill -9 <PID>
```

**依赖包缺失：**
```
ModuleNotFoundError: No module named 'flask'
```
解决方案：
```bash
# 激活虚拟环境
source venv/bin/activate
# 重新安装依赖
pip install -r requirements.txt
```

#### 2. 数据处理问题

**呼吸频率计算异常：**
- 数据不足：等待更多采样数据（至少30个样本点）
- 滤波失败：检查采样率是否过低
- 峰值检测失败：调整FREQ_THRESHOLD参数

**内存使用过高：**
- 减少DEVICE_DATA_LIMIT值
- 定期重启服务
- 监控设备数量

#### 3. 网络连接问题

**CORS跨域错误：**
```python
# 确保CORS配置正确
from flask_cors import CORS
CORS(app, origins=['*'])  # 生产环境应限制域名
```

**HTTPS证书验证失败：**
```bash
# 测试证书有效性
openssl s_client -connect test.upper.love:8000 -servername test.upper.love
```

### 硬件问题诊断

#### 1. 传感器问题

**I2C通信失败：**
```
❌ 无法初始化 MLX90614，请检查接线！
```
诊断步骤：
```cpp
// 添加I2C扫描代码
void scanI2C() {
  for (byte i = 8; i < 120; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      Serial.printf("发现I2C设备地址: 0x%02X\n", i);
    }
  }
}
```

**温度读数异常：**
- NaN值：检查传感器连接和供电
- 异常高温：检查传感器是否被遮挡
- 读数不变：检查传感器是否损坏

#### 2. 网络连接问题

**WiFi连接超时：**
```cpp
// 增加连接超时处理
int wifi_retry = 0;
while (WiFi.status() != WL_CONNECTED && wifi_retry < 20) {
  delay(500);
  Serial.print(".");
  wifi_retry++;
}
if (wifi_retry >= 20) {
  Serial.println("\n❌ WiFi连接超时，请检查网络配置");
  ESP.restart();
}
```

**HTTP请求失败：**
```cpp
// 添加详细错误信息
if (httpCode < 0) {
  Serial.printf("❌ HTTP错误: %s\n", http.errorToString(httpCode).c_str());
}
```

#### 3. 数据传输问题

**JSON格式错误：**
```cpp
// 验证JSON格式
if (doc.overflowed()) {
  Serial.println("❌ JSON缓冲区溢出");
}
```

**数据丢失：**
- 增加重传机制
- 检查网络稳定性
- 调整采样间隔

### 前端问题诊断

#### 1. 连接问题

**无法获取数据：**
```javascript
// 检查网络请求
fetch(SERVER_URL + '/health')
  .then(response => {
    console.log('服务器状态:', response.status);
    return response.json();
  })
  .then(data => console.log('服务器响应:', data))
  .catch(error => console.error('连接错误:', error));
```

**CORS策略错误：**
```
Access to fetch at 'https://test.upper.love:8000/data' from origin 'null' has been blocked by CORS policy
```
解决方案：
- 确保后端CORS配置正确
- 使用HTTP服务器而非直接打开HTML文件

#### 2. 显示问题

**图表不显示：**
- 检查数据格式是否正确
- 确认Chart.js库加载成功
- 查看浏览器控制台错误

**语言切换失效：**
- 检查语言文件路径
- 确认localStorage支持

### 系统监控和日志

#### 后端监控

**日志级别配置：**
```python
# 开发环境 - 详细日志
logging.basicConfig(level=logging.DEBUG)

# 生产环境 - 关键日志
logging.basicConfig(level=logging.INFO)
```

**性能监控：**
```python
import psutil
import time

@app.route('/metrics', methods=['GET'])
def get_metrics():
    return jsonify({
        'cpu_percent': psutil.cpu_percent(),
        'memory_percent': psutil.virtual_memory().percent,
        'active_devices': len(device_data),
        'total_data_points': sum(len(d['temperature']) for d in device_data.values()),
        'uptime': time.time() - start_time
    })
```

#### 硬件监控

**设备状态检查：**
```cpp
// 添加设备健康检查
void deviceHealthCheck() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi连接丢失，尝试重连...");
    WiFi.reconnect();
  }
  
  if (isnan(mlx.readAmbientTempC())) {
    Serial.println("⚠️ 传感器读数异常");
  }
}
```

**看门狗定时器：**
```cpp
#include "esp_system.h"

void setup() {
  // 启用看门狗，10秒超时
  esp_task_wdt_init(10, true);
  esp_task_wdt_add(NULL);
}

void loop() {
  // 喂狗
  esp_task_wdt_reset();
  // ... 其他代码
}
```

### 调试工具和命令

#### 后端调试

**启用调试模式：**
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
```

**实时日志监控：**
```bash
# 实时查看日志
tail -f breath_rate_server.log

# 过滤特定内容
grep "ERROR" breath_rate_server.log

# 查看最近的错误
tail -100 breath_rate_server.log | grep "ERROR"
```

**API测试：**
```bash
# 健康检查
curl -k https://test.upper.love:8000/health

# 模拟数据上传
curl -k -X POST https://test.upper.love:8000/data \
  -H "Content-Type: application/json" \
  -d '{"sensor_id":"test","ambient_temp":25.0,"object_temp":36.0,"sampling_interval":100}'

# 获取数据
curl -k "https://test.upper.love:8000/data?sensor_id=test"
```

#### 硬件调试

**串口调试增强：**
```cpp
// 添加时间戳
String getTimestamp() {
  return String(millis()) + "ms: ";
}

// 使用示例
Serial.println(getTimestamp() + "开始发送数据");
```

**网络诊断：**
```cpp
void networkDiagnostics() {
  Serial.println("=== 网络诊断信息 ===");
  Serial.printf("WiFi状态: %d\n", WiFi.status());
  Serial.printf("信号强度: %d dBm\n", WiFi.RSSI());
  Serial.printf("本地IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("网关IP: %s\n", WiFi.gatewayIP().toString().c_str());
  Serial.printf("DNS: %s\n", WiFi.dnsIP().toString().c_str());
}
```

## 🔒 安全考虑

- 使用HTTPS加密所有通信
- 定期更新SSL证书
- 限制服务器访问权限
- 不在代码中硬编码敏感信息
- 定期更新依赖库版本

## 📈 性能优化

### 后端性能优化

#### 数据存储优化
```python
# 动态调整数据缓冲区大小
DEVICE_DATA_LIMIT = 10000  # 默认值

# 根据设备数量动态调整
def adjust_buffer_size():
    device_count = len(device_data)
    if device_count > 10:
        return max(5000, 50000 // device_count)
    return DEVICE_DATA_LIMIT
```

#### 算法性能优化
```python
# 使用更高效的滤波算法
from scipy.signal import sosfilt, butter

# 使用二阶节形式，提高数值稳定性
sos = signal.butter(FILTER_ORDER, [0.05, 0.7], btype='band', fs=sample_rate, output='sos')
filtered = signal.sosfilt(sos, temps_to_process)

# 缓存滤波器系数
filter_cache = {}
def get_filter_coefficients(sample_rate):
    if sample_rate not in filter_cache:
        filter_cache[sample_rate] = signal.butter(FILTER_ORDER, [0.05, 0.7], btype='band', fs=sample_rate, output='sos')
    return filter_cache[sample_rate]
```

#### 内存管理
```python
import gc

# 定期清理内存
@app.route('/cleanup', methods=['POST'])
def cleanup_memory():
    # 清理过期设备数据
    current_time = time.time() * 1000
    for sensor_id in list(device_data.keys()):
        device = device_data[sensor_id]
        if device['timestamps'] and (current_time - device['timestamps'][-1]) > 300000:  # 5分钟无数据
            del device_data[sensor_id]
            logger.info(f"清理过期设备数据: {sensor_id}")
    
    gc.collect()
    return jsonify({"status": "cleanup completed"})
```

#### 并发处理优化
```python
from threading import Lock
import threading

# 添加线程锁保护共享数据
data_lock = Lock()

@app.route('/data', methods=['POST'])
def receive_data():
    with data_lock:
        # 数据处理逻辑
        pass

# 使用异步处理提高并发性能
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

def async_calculate_breath_rate(device):
    return executor.submit(calculate_breath_rate, device)
```

### 硬件性能优化

#### 采样策略优化
```cpp
// 自适应采样间隔
unsigned long adaptive_sampling_interval = 100;
float last_temp_diff = 0;

void adaptiveSampling() {
  float current_diff = abs(objectTemp - lastObjectTemp);
  
  // 温度变化大时增加采样频率
  if (current_diff > 0.1) {
    adaptive_sampling_interval = 50;  // 20Hz
  } else if (current_diff < 0.05) {
    adaptive_sampling_interval = 200; // 5Hz
  } else {
    adaptive_sampling_interval = 100; // 10Hz
  }
  
  last_temp_diff = current_diff;
}
```

#### 数据压缩和批量传输
```cpp
// 批量数据结构
struct SensorReading {
  float ambient_temp;
  float object_temp;
  unsigned long timestamp;
};

SensorReading readings[10];  // 批量缓冲区
int reading_count = 0;

void batchSendData() {
  if (reading_count >= 10 || (millis() - last_batch_time) > 5000) {
    // 构造批量JSON
    StaticJsonDocument<1024> doc;
    doc["sensor_id"] = sensor_id;
    doc["batch_size"] = reading_count;
    
    JsonArray data_array = doc.createNestedArray("readings");
    for (int i = 0; i < reading_count; i++) {
      JsonObject reading = data_array.createNestedObject();
      reading["ambient_temp"] = readings[i].ambient_temp;
      reading["object_temp"] = readings[i].object_temp;
      reading["timestamp"] = readings[i].timestamp;
    }
    
    // 发送数据
    sendBatchData(doc);
    reading_count = 0;
    last_batch_time = millis();
  }
}
```

#### 功耗优化
```cpp
#include "esp_sleep.h"

// 深度睡眠模式（适用于低频采样）
void enterDeepSleep(int seconds) {
  esp_sleep_enable_timer_wakeup(seconds * 1000000ULL);
  esp_deep_sleep_start();
}

// 轻度睡眠模式
void enterLightSleep(int milliseconds) {
  esp_sleep_enable_timer_wakeup(milliseconds * 1000ULL);
  esp_light_sleep_start();
}

// CPU频率调节
void adjustCPUFrequency() {
  // 降低CPU频率以节省功耗
  setCpuFrequencyMhz(80);  // 从240MHz降至80MHz
}
```

### 前端性能优化

#### 数据获取优化
```javascript
// 自适应刷新频率
let fetchInterval = 500;
let lastDataTime = 0;

function adaptiveFetch() {
  const now = Date.now();
  const timeSinceLastData = now - lastDataTime;
  
  // 根据数据新鲜度调整刷新频率
  if (timeSinceLastData > 5000) {
    fetchInterval = 2000;  // 数据较旧，降低刷新频率
  } else if (timeSinceLastData < 1000) {
    fetchInterval = 300;   // 数据很新，提高刷新频率
  } else {
    fetchInterval = 500;   // 默认频率
  }
}
```

#### 图表渲染优化
```javascript
// 数据点限制和采样
function optimizeChartData(data, maxPoints = 200) {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

// 使用requestAnimationFrame优化动画
function smoothChartUpdate(newData) {
  requestAnimationFrame(() => {
    chart.data.datasets[0].data = optimizeChartData(newData);
    chart.update('none');  // 禁用动画以提高性能
  });
}
```

#### 内存管理
```javascript
// 定期清理旧数据
function cleanupOldData() {
  const maxDataPoints = 1000;
  if (temperatureData.length > maxDataPoints) {
    temperatureData = temperatureData.slice(-maxDataPoints);
    timestampData = timestampData.slice(-maxDataPoints);
  }
}

// 防抖处理
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedUpdate = debounce(updateChart, 100);
```

### 网络优化

#### 连接池和重用
```python
# 使用连接池
from urllib3.poolmanager import PoolManager

http_pool = PoolManager(
    num_pools=10,
    maxsize=10,
    block=True
)
```

#### 数据压缩
```python
from flask import Flask, request, jsonify, compress

# 启用gzip压缩
app.config['COMPRESS_MIMETYPES'] = [
    'text/html', 'text/css', 'text/xml',
    'application/json', 'application/javascript'
]
compress.Compress(app)
```

#### 缓存策略
```python
from functools import lru_cache
import time

# 缓存计算结果
@lru_cache(maxsize=100)
def cached_breath_rate_calculation(data_hash, timestamp):
    # 计算逻辑
    pass

# HTTP缓存头
@app.after_request
def after_request(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response
```

### 系统级优化

#### 操作系统调优
```bash
# 增加文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 调整TCP参数
echo "net.core.somaxconn = 1024" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 1024" >> /etc/sysctl.conf
sysctl -p
```

#### 监控和告警
```python
# 性能监控
import psutil
import logging

def monitor_system_resources():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory_percent = psutil.virtual_memory().percent
    
    if cpu_percent > 80:
        logger.warning(f"CPU使用率过高: {cpu_percent}%")
    
    if memory_percent > 80:
        logger.warning(f"内存使用率过高: {memory_percent}%")
    
    return {
        'cpu_percent': cpu_percent,
        'memory_percent': memory_percent,
        'active_devices': len(device_data),
        'total_data_points': sum(len(d['temperature']) for d in device_data.values())
    }
```

### 性能基准测试

#### 后端压力测试
```bash
# 使用Apache Bench进行压力测试
ab -n 1000 -c 10 -H "Content-Type: application/json" \
   -p test_data.json https://test.upper.love:8000/data

# 使用wrk进行更详细的测试
wrk -t12 -c400 -d30s --script=post.lua https://test.upper.love:8000/data
```

#### 硬件性能测试
```cpp
// 测试采样性能
void performanceTest() {
  unsigned long start_time = millis();
  int sample_count = 1000;
  
  for (int i = 0; i < sample_count; i++) {
    float temp = mlx.readObjectTempC();
  }
  
  unsigned long elapsed = millis() - start_time;
  float samples_per_second = (float)sample_count / (elapsed / 1000.0);
  
  Serial.printf("采样性能: %.2f samples/sec\n", samples_per_second);
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Adafruit](https://www.adafruit.com/) - MLX90614库支持
- [Flask](https://flask.palletsprojects.com/) - Web框架
- [GSAP](https://greensock.com/gsap/) - 动画库
- [SciPy](https://scipy.org/) - 科学计算库
- [ChatGPT](https://chatgpt.com/) - 最好的老师

---

**注意**：本系统仅用于研究和教育目的，不应用于医疗诊断。如需医疗级别的呼吸监测，请咨询专业医疗设备