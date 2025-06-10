// main.js - 入口点，负责初始化和协调各模块

// 当DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化UI
    window.UI.initUI();

    // 设置语言切换按钮事件
    const langToggleBtn = document.getElementById('langToggle');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', window.UI.switchLanguage);
    }

    // 初始化核心功能
    window.Core.initCore();

    console.log('应用程序初始化完成');
});