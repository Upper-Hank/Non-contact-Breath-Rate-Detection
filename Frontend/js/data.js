// data.js - 数据通信和处理模块

// 服务器配置
const SERVER_URL = 'https://test.upper.love:8000';
const SENSOR_ID = 'Bob'; // 与硬件设备保持一致
const FETCH_INTERVAL = 500; // 毫秒，从100ms增加到500ms，减少更新频率

// 数据处理器类
class DataProcessor {
    constructor() {
        // 数据缓冲区
        this.dataBuffer = [];
        this.fetchTimer = null;
        this.isConnected = false;
        this.lastFetchTime = 0;
    }

    // 连接到服务器
    connect() {
        if (this.isConnected) return Promise.resolve(true);

        // 先重置设备数据，然后再测试连接
        return this.resetDeviceData()
            .then(() => this.testConnection())
            .then(success => {
                if (success) {
                    this.isConnected = true;
                    this.startFetching();
                    return true;
                }
                return false;
            })
            .catch(error => {
                console.error('连接错误:', error);
                return false;
            });
    }

    // 重置设备数据
    resetDeviceData() {
        return fetch(`${SERVER_URL}/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sensor_id: SENSOR_ID })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('设备数据重置成功:', data);
                return true;
            })
            .catch(error => {
                console.error('重置设备数据失败:', error);
                // 即使重置失败，也继续连接过程
                return true;
            });
    }

    // 断开连接
    disconnect() {
        this.stopFetching();
        this.isConnected = false;
    }

    // 测试服务器连接
    testConnection() {
        return fetch(`${SERVER_URL}/data?sensor_id=${SENSOR_ID}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('连接测试成功:', data);
                return true;
            })
            .catch(error => {
                console.error('连接测试失败:', error);
                return false;
            });
    }

    // 开始数据获取
    startFetching() {
        if (this.fetchTimer) return;

        this.fetchTimer = setInterval(() => {
            this.fetchLatestData();
            this.fetchBreathRate();
        }, FETCH_INTERVAL);
    }

    // 停止数据获取
    stopFetching() {
        if (this.fetchTimer) {
            clearInterval(this.fetchTimer);
            this.fetchTimer = null;
        }
    }

    // 获取最新传感器数据
    fetchLatestData() {
        fetch(`${SERVER_URL}/data?sensor_id=${SENSOR_ID}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // 计算采样率
                const now = Date.now();
                const timeDiff = now - this.lastFetchTime;
                this.lastFetchTime = now;

                // 后端直接返回单个数据点，不是数组
                if (data && data.ambient_temp !== undefined && data.object_temp !== undefined) {
                    const samplingRate = data.sampling_interval ? 60000 / data.sampling_interval : 0;

                    if (window.processData) {
                        window.processData({
                            ambientTemp: data.ambient_temp,
                            objectTemp: data.object_temp,
                            samplingRate: samplingRate
                        });
                    }

                    // 移除调试输出
                }
            })
            .catch(error => {
                console.error('获取数据错误:', error);
                // 如果连续失败多次，可以考虑断开连接
            });
    }

    // 获取呼吸频率
    fetchBreathRate() {
        fetch(`${SERVER_URL}/rate?sensor_id=${SENSOR_ID}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && typeof data.breath_rate !== 'undefined') {
                    // 打印呼吸频率数据到控制台
                    console.log('呼吸频率数据:', data);

                    if (window.processData) {
                        window.processData({
                            breathRate: data.breath_rate
                        });
                    }
                }
            })
            .catch(error => {
                console.error('获取呼吸频率错误:', error);
            });
    }

    // 获取连接状态
    getConnectionStatus() {
        return this.isConnected;
    }
}

// 导出模块
window.DataModule = {
    DataProcessor,
    SERVER_URL,
    SENSOR_ID,
    FETCH_INTERVAL
};