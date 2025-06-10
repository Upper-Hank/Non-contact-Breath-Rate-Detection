// ui.js - UI交互、动画渲染和语言切换模块

// 语言数据配置
const languages = {
    zh: {
        title: '远程呼吸频率检测',
        connectDevice: '连接设备',
        connectDeviceConnected: '断开连接',
        breathRate: '呼吸频率',
        roomTemp: '室温',
        samplingRate: '采集频率',
        ambientTemp: '环境温度',
        objectTemp: '物体温度',
        unit: {
            breathRate: '次/分钟',
            temperature: '°C',
            samplingRate: '次/分钟'
        }
    },
    en: {
        title: 'Remote Breath Rate Detection',
        connectDevice: 'Connect Device',
        connectDeviceConnected: 'Disconnected',
        breathRate: 'Breath Rate',
        roomTemp: 'Room Temp',
        samplingRate: 'Sampling Rate',
        ambientTemp: 'Ambient Temperature',
        objectTemp: 'Object Temperature',
        unit: {
            breathRate: 'bpm',
            temperature: '°C',
            samplingRate: 'sps'
        }
    }
};

// 当前语言状态
let currentLang = 'zh';

// 滚动方向状态（true为向上，false为向下）
let scrollDirection = true;

// 语言切换函数
function switchLanguage() {
    const langButton = document.getElementById('langToggle');

    // GSAP动画：按钮点击效果
    gsap.to(langButton, {
        scale: 0.9,
        duration: 0.1,
        ease: "power2.out",
        onComplete: () => {
            gsap.to(langButton, {
                scale: 1,
                duration: 0.1,
                ease: "power2.out"
            });
        }
    });

    // 切换语言
    currentLang = currentLang === 'zh' ? 'en' : 'zh';

    // 获取需要动画的元素
    const elementsToAnimate = [
        document.querySelector('h1'),
        document.getElementById('connectDevice'),
        ...document.querySelectorAll('.output-item h2'),
        ...document.querySelectorAll('.unit'),
        ...document.querySelectorAll('.text-label')
    ];

    // 简单的淡出淡入动画，避免抖动
    gsap.to(elementsToAnimate, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.inOut",
        onComplete: () => {
            // 更新文本内容
            updateUI();
            // 淡入新文本
            gsap.to(elementsToAnimate, {
                opacity: 1,
                duration: 0.2,
                ease: "power2.inOut"
            });
        }
    });
}

// 更新UI文本
function updateUI() {
    const lang = languages[currentLang];

    // 更新页面标题
    document.title = lang.title;

    // 更新主标题
    document.querySelector('h1').textContent = lang.title;

    // 更新连接按钮
    const connectBtn = document.getElementById('connectDevice');
    if (connectBtn.classList.contains('connected')) {
        connectBtn.textContent = lang.connectDeviceConnected;
    } else {
        connectBtn.textContent = lang.connectDevice;
    }

    // 更新数据输出标题
    const outputItems = document.querySelectorAll('.output-item h2');
    outputItems[0].textContent = lang.breathRate;
    outputItems[1].textContent = lang.roomTemp;
    outputItems[2].textContent = lang.samplingRate;

    // 更新单位文本
    const breathRateUnit = document.getElementById('breathRateUnit');
    const roomTempUnit = document.getElementById('roomTempUnit');
    const samplingRateUnit = document.getElementById('samplingRateUnit');

    if (breathRateUnit) breathRateUnit.textContent = lang.unit.breathRate;
    if (roomTempUnit) roomTempUnit.textContent = lang.unit.temperature;
    if (samplingRateUnit) samplingRateUnit.textContent = lang.unit.samplingRate;

    // 更新语言切换按钮
    document.getElementById('langToggle').textContent = currentLang === 'zh' ? 'EN' : '中';
}

//初始化渲染动画
function initUI() {
    updateUI();
    //获取对象
    const langButton = document.getElementById('langToggle');
    const header = document.querySelector('header');
    const chartContainer = document.getElementById('chartContainer');
    const outputItems = document.querySelectorAll('.output-item');

    gsap.fromTo([header.children, chartContainer, ...outputItems],
        {
            y: 100,
            opacity: 0,
        },
        {
            ease: "power2.inOut",
            y: 0,
            opacity: 1,
            stagger: 0.1,
        })
}

// 导出模块
window.UI = {
    languages,
    get currentLang() { return currentLang; },
    set currentLang(value) { currentLang = value; },
    switchLanguage,
    updateUI,
    initUI
};