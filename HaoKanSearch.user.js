// ==UserScript==
// @name         好看视频标题搜索 (优化版)
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  在好看视频网页中添加按钮，点击后在抖音和B站搜索当前视频标题
// @author       SeekFreeSky
// @updateURL    https://github.com/SeekFreeSky/HaoKanSearch/blob/main/HaoKanSearch.user.js
// @match        *://haokan.baidu.com/*
// @grant        GM_openInTab
// @grant        GM_addStyle
// @run-at       document-idle
// @license      MIT
// ==/UserScript==
 
(function() {
    'use strict';
 
    // 1. 添加样式 (美化按钮，避免行内样式过于杂乱)
    const css = `
        #hk-search-btn {
            position: fixed;
            top: 100px; /* 避开顶部导航栏 */
            right: 20px; /* 放在右侧，类似侧边栏工具 */
            z-index: 9999;
            padding: 8px 15px;
            font-size: 14px;
            background-color: #e91e63; /* 换个醒目的颜色，比如玫红色 */
            color: white;
            border: none;
            border-radius: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            cursor: pointer;
            transition: all 0.3s ease;
            opacity: 0.8;
        }
        #hk-search-btn:hover {
            opacity: 1;
            transform: scale(1.05);
            box-shadow: 0 6px 8px rgba(0,0,0,0.3);
        }
    `;
    GM_addStyle(css);
 
    function createButton() {
        // 避免重复创建
        if (document.getElementById('hk-search-btn')) return;
 
        const searchButton = document.createElement("button");
        searchButton.id = "hk-search-btn";
        searchButton.textContent = "🔍 全网搜同款";
        
        document.body.appendChild(searchButton);
 
        // 2. 点击事件 (核心逻辑)
        searchButton.addEventListener("click", () => {
            // --- 关键优化：在点击时才获取标题，解决SPA切换不更新的问题 ---
            let cleanTitle = "";
 
            // 策略A：优先尝试获取页面中的 h1 标签 (通常最准确)
            const h1Element = document.querySelector('h1.video-info-title, h1');
            if (h1Element && h1Element.textContent.trim()) {
                cleanTitle = h1Element.textContent.trim();
            } 
            // 策略B：如果没有h1，回退到 document.title 并清洗
            else {
                let docTitle = document.title || "";
                // 清洗规则：去除 " - 好看视频", "_好看视频" 以及可能的后缀
                cleanTitle = docTitle.替换(/[-_\|]\s*好看视频.*/, '').trim();
                
                // 保留你原本的逗号清洗逻辑（以防万一）
                const match = cleanTitle.match(/([^,]+),/);
                if (match) {
                    cleanTitle = match[1].trim();
                }
            }
 
            if (!cleanTitle) {
                alert("未找到有效的视频标题！");
                return;
            }
 
            console。log("搜索关键词:", cleanTitle);
            const encodedTitle = encodeURIComponent(cleanTitle);
 
            // 打开搜索页
            GM_openInTab(`https://www.douyin.com/search/${encodedTitle}`, { active: true, insert: true });
            GM_openInTab(`https://www.bilibili.com/search?keyword=${encodedTitle}`, { active: false, insert: true });
        });
    }
 
    // 3. 启动逻辑
    createButton();
 
})();
