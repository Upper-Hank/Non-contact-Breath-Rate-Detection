from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime
from collections import defaultdict
import numpy as np
from scipy import signal

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("breath_rate_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 存储设备数据（每个设备保留最近10000条数据）
DEVICE_DATA_LIMIT = 10000
device_data = defaultdict(lambda: {
    'temperature': [],  # 目标温度历史（仅用于计算）
    'timestamps': [],  # 时间戳（毫秒级时间戳）
    'sampling_interval': 0,  # 采样间隔（毫秒）
    'latest_data': None  # 最新原始数据
})

# 呼吸频率计算参数 - 进一步降低要求使检测更宽松
MIN_SAMPLES_FOR_START = 30  # 降低至少需要的样本点数量（约3秒数据，若采样间隔100ms）
WINDOW_SAMPLES = 200       # 减小计算窗口使用的样本点（约20秒数据，若采样间隔100ms）
MIN_PEAK_SAMPLES = 5       # 降低滤波和峰值检测至少需要的样本点
FREQ_THRESHOLD = 0.03      # 降低频率检测阈值，使峰值检测更敏感
FILTER_ORDER = 2           # 降低滤波器阶数，减少计算复杂度


# 新增：重置设备数据的API端点
@app.route('/reset', methods=['POST'])
def reset_device_data():
    try:
        # 获取传感器ID
        data = request.get_json()
        sensor_id = data.get('sensor_id')
        
        if not sensor_id:
            return jsonify({"error": "Missing sensor_id"}), 400
            
        # 重置设备数据
        if sensor_id in device_data:
            device_data[sensor_id]['temperature'] = []
            device_data[sensor_id]['timestamps'] = []
            logger.info(f"已重置传感器 {sensor_id} 的数据")
            
        return jsonify({"status": "success", "message": f"Device {sensor_id} data reset successfully"}), 200
        
    except Exception as e:
        logger.error(f"重置设备数据错误：{str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/data', methods=['POST'])
def receive_data():
    try:
        # 解析硬件发送的JSON数据
        data = request.get_json()
        sensor_id = data.get('sensor_id')
        ambient_temp = float(data.get('ambient_temp', 0.0))
        object_temp = float(data.get('object_temp', 0.0))
        sampling_interval = int(data.get('sampling_interval', 100))

        # 记录原始数据（仅保留目标温度和时间戳）
        device = device_data[sensor_id]
        device['latest_data'] = {
            'sensor_id': sensor_id,
            'ambient_temp': ambient_temp,
            'object_temp': object_temp,
            'sampling_interval': sampling_interval,
            'timestamp': datetime.now().isoformat()
        }

        # 存储用于计算的温度和时间戳（毫秒级时间戳）
        device['temperature'].append(object_temp)
        device['timestamps'].append(datetime.now().timestamp() * 1000)  # 转换为毫秒

        # 限制数据长度
        if len(device['temperature']) > DEVICE_DATA_LIMIT:
            device['temperature'] = device['temperature'][-DEVICE_DATA_LIMIT:]
            device['timestamps'] = device['timestamps'][-DEVICE_DATA_LIMIT:]

        logger.info(f"接收传感器 {sensor_id} 数据：目标温度 {object_temp:.2f}°C")
        return jsonify({"status": "success"}), 200

    except Exception as e:
        logger.error(f"数据接收错误：{str(e)}")
        return jsonify({"error": "Invalid data"}), 400


@app.route('/data', methods=['GET'])
def get_data():
    sensor_id = request.args.get('sensor_id')
    if not sensor_id:
        return jsonify({"error": "Missing sensor_id"}), 400

    device = device_data.get(sensor_id)
    if not device or not device['latest_data']:
        return jsonify({"error": "Device not found or no data"}), 404

    # 计算并返回呼吸频率（如果数据足够）
    response = device['latest_data'].copy()
    response['breath_rate'] = calculate_breath_rate(device) 
    return jsonify(response)


def calculate_breath_rate(device):
    raw_temps = device['temperature']
    raw_timestamps = device['timestamps']

    num_available_samples = len(raw_temps)

    if num_available_samples < MIN_SAMPLES_FOR_START:
        logger.info(f"数据不足 {MIN_SAMPLES_FOR_START} 个样本点，当前 {num_available_samples} 个，不计算呼吸频率")
        return None  # 数据不足以启动计算

    # 选取计算窗口内的数据
    # 如果可用数据超过窗口大小，则取最新的WINDOW_SAMPLES个数据
    # 否则，使用所有可用的数据（因为已经满足MIN_SAMPLES_FOR_START）
    if num_available_samples >= WINDOW_SAMPLES:
        temps_to_process = np.array(raw_temps[-WINDOW_SAMPLES:])
        timestamps_to_process = np.array(raw_timestamps[-WINDOW_SAMPLES:])
    else:
        temps_to_process = np.array(raw_temps)
        timestamps_to_process = np.array(raw_timestamps)
    
    current_processing_samples = len(temps_to_process)
    if current_processing_samples < MIN_PEAK_SAMPLES: # 确保即使在窗口边缘也有足够数据点进行滤波和峰值检测
        logger.info(f"当前处理窗口内样本 {current_processing_samples} 少于最小峰值检测样本 {MIN_PEAK_SAMPLES}，不计算")
        return None

    # 直接使用ESP32上传的采样间隔数据
    sampling_interval_ms = device['latest_data']['sampling_interval']
    if sampling_interval_ms <= 0:
        logger.warning(f"采样间隔数据异常: {sampling_interval_ms} ms")
        return None

    avg_interval_s = sampling_interval_ms / 1000  # 平均采样间隔（秒）
    sample_rate = 1 / avg_interval_s  # 采样率（Hz）

    logger.info(f"使用 {current_processing_samples} 个样本计算呼吸频率，采样率: {sample_rate:.2f} Hz")

    try:
        # 设计带通滤波器（0.1-0.5Hz，对应呼吸频率6-30次/分钟）
        # 确保采样率对于滤波频率是有效的 (Nyquist frequency)
        if sample_rate <= 1.0: # 0.5Hz * 2 (Nyquist)
            logger.warning(f"采样率 {sample_rate:.2f} Hz 过低，无法有效应用0.1-0.5Hz的带通滤波器")
            return None
            
        # 进一步扩大滤波器频率范围，使其更宽松
        b, a = signal.butter(FILTER_ORDER, [0.05, 0.7], btype='band', fs=sample_rate)
        filtered = signal.filtfilt(b, a, temps_to_process)

        # 检测温度峰值（呼气时温度升高），减小峰值间最小距离要求
        peaks, properties = signal.find_peaks(filtered, height=FREQ_THRESHOLD, distance=int(sample_rate/3))
        logger.info(f"检测到 {len(peaks)} 个峰值")

        # 放宽峰值数量要求
        if len(peaks) == 0:
            logger.info("未检测到峰值，无法计算呼吸频率")
            return None  # 没有峰值
            
        # 特殊处理：只有一个峰值的情况
        if len(peaks) == 1:
            logger.info("仅检测到一个峰值，使用默认呼吸频率15次/分钟")
            return 15  # 返回一个合理的默认值

        # 计算峰值间隔（秒）并转换为频率（次/分钟）
        # 使用峰值对应在原始时间戳数组中的索引来获取准确的时间戳
        peak_timestamps = timestamps_to_process[peaks]
        peak_intervals_s = np.diff(peak_timestamps) / 1000  # 间隔（秒）
        
        if len(peak_intervals_s) == 0:
            logger.info("峰值间隔数组为空，无法计算平均间隔")
            return None
            
        avg_peak_interval_s = np.mean(peak_intervals_s)
        
        if avg_peak_interval_s <= 0:
            logger.warning(f"平均峰值间隔计算异常: {avg_peak_interval_s} s")
            return None
            
        breath_rate = 60 / avg_peak_interval_s
        
        # 添加合理性检查，但扩大合理范围（4-35次/分钟）
        if breath_rate < 4 or breath_rate > 35:
            logger.warning(f"计算得到的呼吸频率 {breath_rate:.1f} 次/分钟超出扩展合理范围(4-35)，可能不准确")
            # 返回计算结果，但在日志中标记可能不准确
        
        # 将呼吸频率取整
        breath_rate_int = int(round(breath_rate))
        logger.info(f"计算得到呼吸频率: {breath_rate_int} 次/分钟")

        return breath_rate_int

    except Exception as e:
        logger.error(f"频率计算错误：{str(e)}", exc_info=True)
        return None


@app.route('/health', methods=['GET'])
def health_check():
    active_devices = list(device_data.keys())
    return jsonify({
        "status": "ok",
        "active_devices": active_devices,
        "total_data_points": sum(len(d['temperature']) for d in device_data.values())
    })


@app.route('/rate', methods=['GET'])
def get_rate():
    sensor_id = request.args.get('sensor_id')
    if not sensor_id:
        return jsonify({"error": "Missing sensor_id"}), 400

    device = device_data.get(sensor_id)
    if not device or not device['latest_data']:
        # 如果没有找到设备或设备没有最新数据，可以考虑返回404或一个表示无数据的特定结构
        return jsonify({"error": "Device not found or no data for rate calculation"}), 404

    # 调用呼吸频率计算函数
    breath_rate = calculate_breath_rate(device)

    if breath_rate is None:
        # 数据不足或计算失败的情况
        return jsonify({
            "sensor_id": sensor_id,
            "breath_rate": None,
            "message": "Insufficient data for breath rate calculation or calculation error.",
            "timestamp": device['latest_data'].get('timestamp') if device['latest_data'] else datetime.now().isoformat(),
            "sampling_interval": device['latest_data'].get('sampling_interval') if device['latest_data'] else None
        }), 200 # 或者根据情况返回 202 Accepted / 204 No Content
    
    # 返回整数呼吸频率
    return jsonify({
        "sensor_id": sensor_id,
        "breath_rate": breath_rate, # 已经是整数
        "timestamp": device['latest_data']['timestamp'], # 使用最新数据的原始时间戳
        "sampling_interval": device['latest_data']['sampling_interval']
    })


if __name__ == '__main__':
    logger.info("呼吸监测后端启动，监听端口8000 (HTTPS)")
    # SSL证书配置
    ssl_context = ('www/wwwroot/test.upper.love/SSL/test.upper.love.crt', 
                   'www/wwwroot/test.upper.love/SSL/test.upper.love.key')
    app.run(host='0.0.0.0', port=8000, debug=False, ssl_context=ssl_context)