// core.js - 核心逻辑和连接功能模块

// 全局变量
let chart = null;
let dataProcessor = null;
let connectButton = null;
let breathRateElement = null;
let roomTempElement = null;
let samplingRateElement = null;

// 初始化核心功能
function initCore() {
    // 获取DOM元素
    connectButton = document.getElementById('connectDevice');
    breathRateElement = document.getElementById('breathRate');
    roomTempElement = document.getElementById('roomTemp');
    samplingRateElement = document.getElementById('samplingRate');

    // 初始化图表
    const chartContainer = document.querySelector('.chart-container');
    chart = new TemperatureChart(chartContainer, {
        width: chartContainer.clientWidth,
        height: 200,
        maxDataPoints: 100,
        yMin: 20,
        yMax: 40,
        animationDuration: 0.3,
        updateInterval: 100
    });

    // 初始化数据处理器
    dataProcessor = new window.DataModule.DataProcessor();

    // 设置连接按钮事件
    connectButton.addEventListener('click', handleConnectClick);

    // 设置窗口关闭事件，确保断开连接
    window.addEventListener('beforeunload', () => {
        if (dataProcessor && dataProcessor.getConnectionStatus()) {
            dataProcessor.disconnect();
        }
    });

    // 设置全局数据处理函数
    window.processData = handleData;
}

// 处理连接按钮点击
function handleConnectClick(event) {
    event.preventDefault();

    if (!dataProcessor) return;

    if (dataProcessor.getConnectionStatus()) {
        // 断开连接
        disconnectDevice();
    } else {
        // 连接设备
        connectDevice();
    }
}

// 连接设备
function connectDevice() {
    if (!dataProcessor) return;

    const originalText = connectButton.querySelector('.link-text')?.textContent || connectButton.textContent;
    const linkText = connectButton.querySelector('.link-text') || connectButton;

    // 添加加载动画
    connectButton.classList.add('loading');

    // 使用GSAP添加简单的按钮动画
    gsap.to(connectButton, {
        scale: 0.95,
        duration: 0.2,
        ease: "back.out(1.7)",
        onComplete: () => {
            gsap.to(connectButton, {
                scale: 1,
                duration: 0.2,
                ease: "power1.out"
            });
        }
    });

    if (window.UI.currentLang === 'zh') {
        linkText.textContent = '连接中...';
    } else {
        linkText.textContent = 'Connecting...';
    }

    // 先清空图表数据，等待动画完成后再连接
    if (chart) {
        // 清空图表数据
        chart.clearData();

        // 等待动画完成后再连接设备
        setTimeout(() => {
            // 尝试连接
            actualConnect(originalText, linkText);
        }, 400); // 等待400毫秒，确保清空动画完成
    } else {
        // 如果没有图表，直接连接
        actualConnect(originalText, linkText);
    }
}

// 实际执行连接操作
function actualConnect(originalText, linkText) {
    dataProcessor.connect()
        .then(success => {
            if (success) {
                // 连接成功
                connectButton.classList.remove('loading');
                connectButton.classList.add('connected');
                linkText.textContent = window.UI.languages[window.UI.currentLang].connectDeviceConnected;
            } else {
                // 连接失败
                connectButton.classList.remove('loading');
                linkText.textContent = originalText;

                // 添加简单的失败动画
                gsap.to(connectButton, {
                    x: [-5, 5, -5, 5, 0],
                    duration: 0.4,
                    ease: "power2.out"
                });

                alert('连接失败，请检查设备是否在线');
            }
        })
        .catch(error => {
            console.error('连接错误:', error);
            connectButton.classList.remove('loading');
            linkText.textContent = originalText;

            // 添加简单的错误动画
            gsap.to(connectButton, {
                x: [-5, 5, -5, 5, 0],
                duration: 0.4,
                ease: "power2.out"
            });

            alert('连接出错: ' + error.message);
        });
}

// 断开连接
function disconnectDevice() {
    if (!dataProcessor) return;

    // 添加简单的断开连接动画
    gsap.to(connectButton, {
        scale: 0.95,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
            gsap.to(connectButton, {
                scale: 1,
                duration: 0.2,
                ease: "back.out(1.7)"
            });
        }
    });

    dataProcessor.disconnect();
    resetConnectButton();
}

// 重置连接按钮状态
function resetConnectButton() {
    connectButton.classList.remove('loading', 'connected');
    const linkText = connectButton.querySelector('.link-text') || connectButton;
    linkText.textContent = window.UI.languages[window.UI.currentLang].connectDevice;
}

// 处理数据并更新UI
function handleData(data) {
    // 更新图表
    if (chart && data.ambientTemp !== undefined && data.objectTemp !== undefined) {
        chart.addDataPoint(data.ambientTemp, data.objectTemp);
    }

    // 更新呼吸频率显示
    if (data.breathRate !== undefined && data.breathRate !== null && breathRateElement) {
        // 打印呼吸频率数据到控制台
        console.log('处理呼吸频率数据:', data.breathRate.toFixed(1));
        updateValueWithAnimation(breathRateElement, data.breathRate.toFixed(1));
    } else if (data.breathRate === null && breathRateElement) {
        console.log('呼吸频率数据不可用');
        updateValueWithAnimation(breathRateElement, "--");
    }

    // 更新室温显示
    if (data.ambientTemp !== undefined && roomTempElement) {
        updateValueWithAnimation(roomTempElement, data.ambientTemp.toFixed(1));
    }

    // 更新采样率显示
    if (data.samplingRate !== undefined && samplingRateElement) {
        updateValueWithAnimation(samplingRateElement, data.samplingRate.toString());
    }
}

// 使用动画更新数值
function updateValueWithAnimation(element, newValue) {
    if (!element || element.textContent === newValue) return;

    // 如果元素正在动画中，取消之前的动画
    if (element._animating) {
        gsap.killTweensOf(element);
    }

    if (window.gsap && window.TextPlugin) {
        // 标记元素正在动画中
        element._animating = true;

        gsap.to(element, {
            duration: 0.3,
            text: newValue,
            ease: "power1.out",
            onComplete: function () {
                // 动画完成后移除标记
                element._animating = false;
            }
        });
    } else {
        element.textContent = newValue;
    }
}

// 导出模块
window.Core = {
    initCore,
    connectDevice,
    disconnectDevice,
    handleData
};