// ==UserScript==
// @name         好看视频标题搜索 (终极版)
// @namespace    http://tampermonkey.net/
// @version      0.0.3
// @description  在好看视频网页中添加按钮，点击后在抖音和B站搜索。支持自动隐藏、页面检测、关键词编辑。
// @author       SeekFreeSky
// @updateURL    https://github.com/SeekFreeSky/HaoKanSearch/blob/main/HaoKanSearch.user.js
// @match        *://haokan.baidu.com/*
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @license      MIT
// ==/UserScript==
 
(function() {
    'use strict';
 
    // 配置：是否在搜索前允许编辑标题（默认为 false，嫌麻烦可以不改，想精准搜索建议改为 true）
    const ENABLE_EDIT_BEFORE_SEARCH = false;
 
    // 1. 高级样式：包含全屏隐藏逻辑
    const css = `
        #hk-search-btn {
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            padding: 8px 16px;
            font-size: 14px;
            background: linear-gradient(135deg, #ff4081, #e91e63);
            color: white;
            border: none;
            border-radius: 25px;
            box-shadow: 0 4px 10px rgba(233, 30, 99, 0.4);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
            font-weight: 500;
        }
        #hk-search-btn:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 6px 15px rgba(233, 30, 99, 0.6);
        }
        #hk-search-btn:active {
            transform: translateY(0) scale(0.95);
        }
        
        /* 核心修复：全屏模式下自动隐藏按钮 */
        :fullscreen #hk-search-btn,
        :-webkit-full-screen #hk-search-btn,
        :-moz-full-screen #hk-search-btn {
            display: none !important;
        }
 
        /* 非视频详情页让按钮变灰或隐藏 */
        body:not([data-page-type="video"]) #hk-search-btn {
            display: none; /* 如果只想在视频页显示，用这个 */
            /* filter: grayscale(1); opacity: 0.5; cursor: not-allowed; */
        }
    `;
    GM_addStyle(css);
 
    // 获取当前页面是否是视频播放页
    function isVideoPage() {
        // 简单判断：URL中是否包含 /v?vid= 或者路径以 /v 开头
        return location.href.includes('/v') || location.pathname.match(/\/v\d+/);
    }
 
    function getCleanTitle() {
        // 策略A：h1
        const h1 = document.querySelector('h1.video-info-title, h1.videoinfo-title, h1');
        if (h1 && h1.innerText.trim()) return h1.innerText.trim();
 
        // 策略B：title清洗
        let title = document.title;
        title = title.replace(/[-_\|]\s*好看视频.*/g, '') // 去除品牌后缀
                     .replace(/[-_\|]\s*百度.*/g, '')
                     .replace(/【.*?】/g, '') // 去除【高清】这类标记
                     .trim();
        return title;
    }
 
    function init() {
        // 避免重复创建
        if (document.getElementById('hk-search-btn')) return;
 
        const btn = document.createElement("button");
        btn.id = "hk-search-btn";
        btn.textContent = "🔍 搜同款";
        btn.title = "点击在抖音/B站搜索此视频";
        document.body.appendChild(btn);
 
        // 检查页面类型，决定是否显示按钮（初次加载）
        if (!isVideoPage()) {
             btn.style.display = 'none';
        }
 
        btn.addEventListener("click", (e) => {
            e.stopPropagation(); // 防止点击穿透
            
            if (!isVideoPage()) {
                // 如果在首页点击（理论上已隐藏，做个兜底）
                alert("请进入视频播放页后再使用搜索功能");
                return;
            }
 
            let keyword = getCleanTitle();
            if (!keyword) {
                alert("无法提取视频标题，请手动搜索。");
                return;
            }
 
            // 可选：允许用户编辑关键词
            if (ENABLE_EDIT_BEFORE_SEARCH) {
                const userInput = prompt("确认搜索关键词（可修改）：", keyword);
                if (userInput === null) return; // 用户取消
                keyword = userInput.trim();
            }
 
            if (keyword) {
                const encoded = encodeURIComponent(keyword);
                // 抖音通常需要 active: true 来避免一部分验证码问题
                GM_openInTab(`https://www.douyin.com/search/${encoded}`, { active: true, insert: true });
                GM_openInTab(`https://www.bilibili.com/search?keyword=${encoded}`, { active: false, insert: true });
            }
        });
    }
 
    // 监听 URL 变化 (解决 SPA 路由切换问题)
    // 现代浏览器 SPA 切换通常使用 History API
    const pushState = history.pushState;
    history.pushState = function() {
        pushState.apply(history, arguments);
        checkButtonState();
    };
    window.addEventListener('popstate', checkButtonState);
    window.addEventListener('replaceState', checkButtonState);
    
    // 定时器兜底：处理按钮意外被移除或 URL 变化未被监听到的情况
    // 这里的开销非常小，每秒检查一次
    setInterval(() => {
        init(); // 确保按钮存在
        checkButtonState(); // 确保显隐状态正确
    }, 1000);
 
    function checkButtonState() {
        const btn = document.getElementById('hk-search-btn');
        if (!btn) return;
        
        if (isVideoPage()) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    }
 
    // 启动
    init();
 
})();
