// chart.js - 图表渲染模块
// 独立的图表渲染功能，可以被其他模块调用

class TemperatureChart {
    constructor(container, options = {}) {
        // 配置选项
        this.options = {
            maxDataPoints: options.maxDataPoints || 400,
            markerRadius: options.markerRadius || 4,
            updateInterval: options.updateInterval || 150,
            animationDuration: options.animationDuration || 0.05,
            ...options
        };

        // 获取容器元素
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        if (!this.container) {
            throw new Error('Container element not found');
        }

        // 数据缓冲区
        this.ambientData = [];
        this.objectData = [];
        this.timeStamps = [];

        // 动画状态跟踪
        this.lastPathLength = 0;
        this.animationQueue = [];

        // SVG相关元素
        this.svg = null;
        this.ambientPath = null;
        this.objectPath = null;

        // 初始化图表
        this.init();
    }

    // 初始化图表
    init() {
        this.createSVG();
        this.createGradients();
        this.createPaths();
    }

    // 创建SVG元素
    createSVG() {
        const svgNS = 'http://www.w3.org/2000/svg';
        this.svg = document.createElementNS(svgNS, 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.backgroundColor = 'transparent';

        // 创建defs元素用于定义渐变和遮罩
        this.defs = document.createElementNS(svgNS, 'defs');
        this.svg.appendChild(this.defs);

        this.container.appendChild(this.svg);
    }

    // 创建渐变定义
    createGradients() {
        const svgNS = 'http://www.w3.org/2000/svg';

        // 环境温度渐变（流星尾迹效果）
        const ambientGradient = document.createElementNS(svgNS, 'linearGradient');
        ambientGradient.setAttribute('id', 'ambientGradient');
        ambientGradient.setAttribute('x1', '0%');
        ambientGradient.setAttribute('y1', '0%');
        ambientGradient.setAttribute('x2', '100%');
        ambientGradient.setAttribute('y2', '0%');
        ambientGradient.innerHTML = `
            <stop offset="0%" stop-color="#999" stop-opacity="0" />
            <stop offset="70%" stop-color="#999" stop-opacity="0.3" />
            <stop offset="90%" stop-color="#999" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#999" stop-opacity="1" />
        `;

        // 物体温度渐变（流星尾迹效果）
        const objectGradient = document.createElementNS(svgNS, 'linearGradient');
        objectGradient.setAttribute('id', 'objectGradient');
        objectGradient.setAttribute('x1', '0%');
        objectGradient.setAttribute('y1', '0%');
        objectGradient.setAttribute('x2', '100%');
        objectGradient.setAttribute('y2', '0%');
        objectGradient.innerHTML = `
            <stop offset="0%" stop-color="#ff8c00" stop-opacity="0" />
            <stop offset="70%" stop-color="#ff8c00" stop-opacity="0.3" />
            <stop offset="90%" stop-color="#ff8c00" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#ff8c00" stop-opacity="1" />
        `;

        this.defs.appendChild(ambientGradient);
        this.defs.appendChild(objectGradient);
    }

    // 创建路径元素
    createPaths() {
        const svgNS = 'http://www.w3.org/2000/svg';

        // 环境温度路径
        this.ambientPath = document.createElementNS(svgNS, 'path');
        this.ambientPath.setAttribute('stroke', 'url(#ambientGradient)');
        this.ambientPath.setAttribute('stroke-width', '2');
        this.ambientPath.setAttribute('fill', 'none');
        this.ambientPath.setAttribute('stroke-linecap', 'round');
        this.ambientPath.setAttribute('stroke-linejoin', 'round');
        this.ambientPath.setAttribute('mask', 'url(#fadeMask)');

        // 物体温度路径
        this.objectPath = document.createElementNS(svgNS, 'path');
        this.objectPath.setAttribute('stroke', 'url(#objectGradient)');
        this.objectPath.setAttribute('stroke-width', '2');
        this.objectPath.setAttribute('fill', 'none');
        this.objectPath.setAttribute('stroke-linecap', 'round');
        this.objectPath.setAttribute('stroke-linejoin', 'round');
        this.objectPath.setAttribute('mask', 'url(#fadeMask)');

        this.svg.appendChild(this.ambientPath);
        this.svg.appendChild(this.objectPath);
    }

    // 更新图表路径
    updateChartPaths() {
        const svgWidth = this.svg.clientWidth;
        const svgHeight = this.svg.clientHeight;

        // 计算Y轴数据范围，用于数据归一化
        const allData = [...this.ambientData, ...this.objectData];
        const minValue = allData.length > 0 ? Math.min(...allData) : 0;
        const maxValue = allData.length > 0 ? Math.max(...allData) : 1;
        let range = maxValue - minValue;
        if (range === 0) {
            range = 1;
        }

        let ambientPathData = '';
        let objectPathData = '';

        if (this.ambientData.length > 0) {
            // 计算滚动偏移量，确保路径只显示最近的数据点
            const scrollOffset = Math.max(0, this.ambientData.length - this.options.maxDataPoints);

            // 遍历数据点生成SVG路径
            for (let i = 0; i < this.ambientData.length; i++) {
                const adjustedIndex = i - scrollOffset;

                if (adjustedIndex >= 0) {
                    // X坐标：从左边开始，向右移动
                    const x = (adjustedIndex / (this.options.maxDataPoints - 1)) * svgWidth;

                    // Y坐标计算：数据归一化并映射到SVG高度
                    const ambientY = svgHeight - ((this.ambientData[i] - minValue) / range) * svgHeight * 0.7 - svgHeight * 0.15;
                    const objectY = svgHeight - ((this.objectData[i] - minValue) / range) * svgHeight * 0.7 - svgHeight * 0.15;

                    if (adjustedIndex === 0) {
                        ambientPathData += `M ${x},${ambientY}`;
                        objectPathData += `M ${x},${objectY}`;
                    } else {
                        ambientPathData += ` L ${x},${ambientY}`;
                        objectPathData += ` L ${x},${objectY}`;
                    }
                }
            }
        }

        // 延伸动画：只补间最后一个点的y坐标
        // 修改动画逻辑，确保所有情况下都有平滑过渡
        if (window.gsap && this.ambientData.length > 1) { // 只要有至少两个点就使用动画
            // 计算上一个点和新点的坐标
            const scrollOffset = Math.max(0, this.ambientData.length - this.options.maxDataPoints);
            const lastIdx = this.ambientData.length - 1;
            const prevIdx = lastIdx - 1;
            const adjustedLast = lastIdx - scrollOffset;
            const adjustedPrev = prevIdx - scrollOffset;
            const xPrev = (adjustedPrev / (this.options.maxDataPoints - 1)) * svgWidth;
            const xLast = (adjustedLast / (this.options.maxDataPoints - 1)) * svgWidth;
            const ambientYPrev = svgHeight - ((this.ambientData[prevIdx] - minValue) / range) * svgHeight * 0.7 - svgHeight * 0.15;
            const ambientYLast = svgHeight - ((this.ambientData[lastIdx] - minValue) / range) * svgHeight * 0.7 - svgHeight * 0.15;
            const objectYPrev = svgHeight - ((this.objectData[prevIdx] - minValue) / range) * svgHeight * 0.7 - svgHeight * 0.15;
            const objectYLast = svgHeight - ((this.objectData[lastIdx] - minValue) / range) * svgHeight * 0.7 - svgHeight * 0.15;

            // 先渲染到倒数第二个点
            let ambientPathBase = '';
            let objectPathBase = '';
            for (let i = 0; i < this.ambientData.length - 1; i++) {
                const adjustedIndex = i - scrollOffset;
                if (adjustedIndex >= 0) {
                    const x = (adjustedIndex / (this.options.maxDataPoints - 1)) * svgWidth;
                    const ambientY = svgHeight - ((this.ambientData[i] - minValue) / range) * svgHeight * 0.7 - svgHeight * 0.15;
                    const objectY = svgHeight - ((this.objectData[i] - minValue) / range) * svgHeight * 0.7 - svgHeight * 0.15;
                    if (adjustedIndex === 0) {
                        ambientPathBase += `M ${x},${ambientY}`;
                        objectPathBase += `M ${x},${objectY}`;
                    } else {
                        ambientPathBase += ` L ${x},${ambientY}`;
                        objectPathBase += ` L ${x},${objectY}`;
                    }
                }
            }
            // 动画补间最后一个点的y
            let ambientYProxy = { y: ambientYPrev };
            let objectYProxy = { y: objectYPrev };
            const updatePath = () => {
                const ambientPath = ambientPathBase + ` L ${xLast},${ambientYProxy.y}`;
                const objectPath = objectPathBase + ` L ${xLast},${objectYProxy.y}`;
                this.ambientPath.setAttribute('d', ambientPath);
                this.objectPath.setAttribute('d', objectPath);
            };

            // 根据数据点数量调整动画持续时间
            const duration = this.ambientData.length <= 5 ? 0.15 : (this.options.animationDuration || 0.3);

            gsap.to(ambientYProxy, {
                y: ambientYLast,
                duration: duration,
                ease: 'power2.out', // 使用更平滑的缓动效果
                onUpdate: updatePath,
                onComplete: () => {
                    this.ambientPath.setAttribute('d', ambientPathData);
                }
            });
            gsap.to(objectYProxy, {
                y: objectYLast,
                duration: duration,
                ease: 'power2.out', // 使用更平滑的缓动效果
                onUpdate: updatePath,
                onComplete: () => {
                    this.objectPath.setAttribute('d', objectPathData);
                }
            });
            this.lastPathLength = ambientPathData.length;
        } else {
            // 直接设置SVG路径属性
            this.ambientPath.setAttribute('d', ambientPathData);
            this.objectPath.setAttribute('d', objectPathData);
            this.lastPathLength = ambientPathData.length;
        }
    }



    // 添加数据点
    addDataPoint(ambientTemp, objectTemp) {
        const now = Date.now();

        // 控制更新频率
        if (this.timeStamps.length === 0 || (now - this.timeStamps[this.timeStamps.length - 1] >= this.options.updateInterval)) {
            // 记录是否是新数据点
            const wasEmpty = this.ambientData.length === 0;

            this.ambientData.push(ambientTemp);
            this.objectData.push(objectTemp);
            this.timeStamps.push(now);

            // 保持数据不超过最大数据点数量
            if (this.ambientData.length > this.options.maxDataPoints) {
                this.ambientData.shift();
                this.objectData.shift();
                this.timeStamps.shift();
            }

            // 如果是第一个数据点，添加入场动画
            if (wasEmpty && window.gsap) {
                // 确保路径初始状态是透明的
                gsap.set([this.ambientPath, this.objectPath], { opacity: 0 });

                // 应用平滑的淡入动画
                gsap.to([this.ambientPath, this.objectPath], {
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                    delay: 0.1 // 添加小延迟，确保clearData的动画已完成
                });
            }

            // 更新图表
            this.updateChart();
        }
    }
    // 更新图表路径
    updateChart() {
        if (window.requestAnimationFrame) {
            requestAnimationFrame(() => {
                this.updateChartPaths();
            });
        } else {
            this.updateChartPaths();
        }
    }

    // 清空图表数据
    clearData() {
        if (window.gsap && this.ambientData.length > 0) {
            // 添加清空动画 - 修改为直接淡出效果，不使用弹跳
            gsap.to([this.ambientPath, this.objectPath], {
                opacity: 0,
                duration: 0.3, // 稍微加快动画速度
                ease: 'power2.out', // 使用平滑的淡出效果
                onComplete: () => {
                    this.ambientData.length = 0;
                    this.objectData.length = 0;
                    this.timeStamps.length = 0;
                    this.lastPathLength = 0;
                    this.updateChart();

                    // 不要立即重置透明度，让路径保持透明状态
                    // 当新数据到来时，addDataPoint会设置透明度
                }
            });
        } else {
            this.ambientData.length = 0;
            this.objectData.length = 0;
            this.timeStamps.length = 0;
            this.lastPathLength = 0;
            this.updateChart();

            // 确保路径是透明的
            if (window.gsap) {
                gsap.set([this.ambientPath, this.objectPath], {
                    opacity: 0
                });
            }
        }
    }

    // 获取当前数据
    getData() {
        return {
            ambientData: [...this.ambientData],
            objectData: [...this.objectData],
            timeStamps: [...this.timeStamps]
        };
    }

    // 销毁图表
    destroy() {
        if (this.svg && this.svg.parentNode) {
            if (window.gsap) {
                // 使用GSAP动画淡出
                gsap.to(this.svg, {
                    opacity: 0,
                    scale: 0.8,
                    duration: 0.5,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        if (this.svg && this.svg.parentNode) {
                            this.svg.parentNode.removeChild(this.svg);
                        }
                    }
                });
            } else {
                this.svg.parentNode.removeChild(this.svg);
            }
        }
        this.clearData();
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemperatureChart;
} else {
    window.TemperatureChart = TemperatureChart;
}