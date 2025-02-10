import { getKeywords, getDimensions, getRandomKeyword } from './keywords.js';

// API 配置
const API_CONFIG = {
    url: 'https://api.coze.cn/v3/chat',
    botId: '7468199399991066659',
    userId: '123456789',
    token: 'pat_xkZDwU3d8yAcSKT3MsSzyGpAJI4fV8rMNzsSx1Z3cHcp61hyhUbQ5BCQ1ogBTR4b'
};

// DOM 元素
const slotMachine = document.getElementById('slotMachine');
const responseDiv = document.getElementById('response');
const generatedImage = document.querySelector('.generated-image');
const cardLoading = document.querySelector('.card-loading');
const cardText = document.querySelector('.card-text');
const cardError = document.querySelector('.card-error');
const cardPlaceholder = document.querySelector('.card-placeholder');
const tabButtons = document.querySelectorAll('.tab-button');
const generateButton = document.querySelector('.generate-button');

// 当前选中的卡包类型
let currentPackType = 'female';

// 老虎机状态
let isSpinning = false;
let currentSlots = [];

// 获取当前卡包的维度
function getCurrentDimensions() {
    return getDimensions(currentPackType);
}

// 获取当前卡包的随机关键词
function getCurrentRandomKeyword(dimension) {
    return getRandomKeyword(currentPackType, dimension);
}

// 初始化标签页切换事件
function initializeTabs() {
    if (!tabButtons.length) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isSpinning) return;
            
            // 移除所有活动状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前活动状态
            button.classList.add('active');
            // 更新当前卡包类型
            currentPackType = button.classList[1];  // 使用第二个类名作为类型
            
            // 重置当前槽位
            currentSlots = null;
            // 重新初始化老虎机，重置为问号状态
            initializeSlotMachine(false);
            // 更新维度显示
            updateDimensionDisplay();
            
            // 记录切换卡包行为
            trackEvent('卡包', '切换', button.textContent, 1);
        });
    });
}

// 更新维度显示
function updateDimensionDisplay() {
    const dimensions = getCurrentDimensions();
    const reels = document.querySelectorAll('.slot-reel');
    
    if (!dimensions || !reels.length) return;
    
    dimensions.forEach((dimension, index) => {
        if (reels[index]) {
            const label = reels[index].querySelector('.dimension-label');
            if (label) {
                label.textContent = getDimensionDisplayName(dimension);
            }
        }
    });
}

// 获取维度的显示名称
function getDimensionDisplayName(dimension) {
    const displayNames = {
        // 女性卡包
        physique: '身材',
        dress: '穿搭',
        scene: '氛围',
        relationship: '身份',
        
        // 男性卡包
        appearance: '相貌',
        outfit: '装扮',
        scene_male: '场合',
        personality: '性格',
        
        // 萝莉卡包
        appearance_loli: '萌点',
        outfit_loli: '搭配',
        action: '动作',
        setting: '环境',
        
        // 战士卡包
        equipment: '战甲',
        weapon: '武器',
        scene_warrior: '战场',
        status: '姿态'
    };
    return displayNames[dimension] || dimension;
}

// 创建老虎机轮盘
function createSlotReel(dimension, keywords) {
    const container = document.createElement('div');
    container.className = 'slot-reel';
    
    const label = document.createElement('div');
    label.className = 'dimension-label';
    label.textContent = getDimensionDisplayName(dimension);
    container.appendChild(label);
    
    const slotItem = document.createElement('div');
    slotItem.className = 'slot-item';
    slotItem.innerHTML = '<span>?</span>';
    container.appendChild(slotItem);
    
    return {
        container,
        element: slotItem,
        dimension: dimension
    };
}

// 初始化老虎机
function initializeSlotMachine(keepQuestionMarks = false) {
    if (!slotMachine) return;
    
    const dimensions = getCurrentDimensions();
    if (!dimensions) return;
    
    // 如果不是保持问号状态，才需要重新生成内容
    if (!keepQuestionMarks) {
        slotMachine.innerHTML = '';
        currentSlots = [];
        
        dimensions.forEach(dimension => {
            const keywords = getKeywords(currentPackType, dimension);
            const reel = createSlotReel(dimension, keywords);
            currentSlots.push(reel);
            slotMachine.appendChild(reel.container);
        });
    }
    
    // 确保 currentSlots 正确初始化
    if (!currentSlots || !currentSlots.length) {
        currentSlots = Array.from(document.querySelectorAll('.slot-reel')).map((element, index) => ({
            element: element.querySelector('.slot-item'),
            dimension: dimensions[index],
            container: element
        }));
    }
}

// 生成随机延迟时间
function getRandomDelay(min, max) {
    return Math.random() * (max - min) + min;
}

// 生成最终的关键词组合
function generateFinalKeywords() {
    const dimensions = getCurrentDimensions();
    return dimensions.map(dimension => getCurrentRandomKeyword(dimension));
}

// 显示加载状态
function showLoadingState() {
    generateButton.textContent = '生成中...';
    generateButton.disabled = true;
    cardPlaceholder.innerHTML = `
        <div class="loading-animation">
            <div class="loading-icon">🎨</div>
            <div class="loading-text">正在绘制角色...</div>
        </div>
    `;
}

// 格式化描述文本
function formatDescription(text) {
    if (!text) return '';
    
    // 处理括号中的文本
    return text.replace(/（([^）]+)）|\(([^)]+)\)/g, (match, p1, p2) => {
        const content = p1 || p2;
        return `<span class="action">（${content}）</span>`;
    });
}

// 显示成功状态
async function showSuccess(result) {
    if (!result) return;
    
    // 设置图片源并等待加载完成
    await new Promise((resolve) => {
        generatedImage.onload = resolve;
        generatedImage.src = result.imageUrl;
    });
    
    // 准备新的内容
    cardText.innerHTML = result.description;
    generatedImage.style.display = 'block';
    cardText.style.display = result.description ? 'block' : 'none';
    
    // 先添加隐藏类
    generatedImage.classList.add('hidden');
    cardText.classList.add('hidden');
    
    // 平滑切换状态
    cardPlaceholder.classList.add('hidden');
    // 等待淡出动画完成
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 隐藏占位符并显示新内容
    cardPlaceholder.style.display = 'none';
    generatedImage.classList.remove('hidden');
    if (result.description) {
        cardText.classList.remove('hidden');
    }
    
    generateButton.textContent = '重新抽取';
    generateButton.disabled = false;
}

// 显示错误状态
function showError(error) {
    // 隐藏其他状态
    cardLoading.style.display = 'none';
    cardPlaceholder.style.display = 'none';
    cardText.style.display = 'none';
    generatedImage.style.display = 'none';
    
    // 显示错误信息
    cardError.style.display = 'block';
    cardError.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div class="error-message">${error.message || '生成失败'}</div>
    `;
    
    // 更新按钮状态
    generateButton.textContent = '重新抽取';
    generateButton.disabled = false;
}

// 清理状态
function cleanup() {
    isSpinning = false;
    generateButton.classList.remove('error');
}

// 确保最小动画时间
async function ensureMinimumDuration(promise, minDuration) {
    const startTime = Date.now();
    await promise;
    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
    }
}

// 播放单个轮盘的动画
async function playSlotAnimation(slot, finalValue) {
    const spinDuration = 2000; // 2秒
    const spinInterval = 67; // 约每秒15次
    const totalSpins = Math.floor(spinDuration / spinInterval);
    
    slot.element.classList.remove('selected');
    slot.element.classList.add('spinning');
    
    for (let i = 0; i < totalSpins; i++) {
        const randomKeyword = getCurrentRandomKeyword(slot.dimension);
        slot.element.innerHTML = `<span>${randomKeyword}</span>`;
        await new Promise(resolve => setTimeout(resolve, spinInterval));
    }
    
    slot.finalValue = finalValue;
    slot.element.innerHTML = `<span>${finalValue}</span>`;
    slot.element.classList.remove('spinning');
    slot.element.classList.add('selected');
}

// 播放所有轮盘的动画
async function playSpinningAnimation(finalKeywords) {
    if (!currentSlots || !currentSlots.length) {
        // 如果老虎机还没有初始化，先初始化
        initializeSlotMachine(true);
        currentSlots = Array.from(document.querySelectorAll('.slot-reel')).map((element, index) => ({
            element: element.querySelector('.slot-item'),
            dimension: getCurrentDimensions()[index]
        }));
    }

    // 立即重置除第一个维度外的所有维度为问号
    for (let i = 1; i < currentSlots.length; i++) {
        resetSlot(currentSlots[i]);
    }

    // 立即开始第一个维度的动画
    const firstSlotPromise = playSlotAnimation(currentSlots[0], finalKeywords[0]);
    
    // 依次播放剩余轮盘的动画
    await firstSlotPromise;
    for (let i = 1; i < currentSlots.length; i++) {
        await playSlotAnimation(currentSlots[i], finalKeywords[i]);
        
        if (i < currentSlots.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 150));
        }
    }
}

// 重置单个轮盘到初始状态
function resetSlot(slot) {
    slot.element.classList.remove('spinning', 'selected');
    slot.element.innerHTML = '<span>?</span>';
    slot.finalValue = null;
}

// 处理API返回的数据
function handleApiResponse(data) {
    try {
        const parsedData = JSON.parse(data);
        let result = {};
        
        switch(parsedData.type) {
            case 'function_call':
                console.log('Function call:', parsedData.content);
                break;
                
            case 'tool_response':
                console.log('Tool response:', parsedData.content);
                break;
                
            case 'answer':
                const [text, imageUrl] = parsedData.content.split('^^^');
                
                if (text) {
                    result.description = formatDescription(text);
                }
                
                if (imageUrl) {
                    result.imageUrl = imageUrl;
                }
                
                return result;
        }
    } catch (error) {
        console.error('解析API响应失败:', error);
    }
    return null;
}

// 生成角色描述
function generateCharacterDescription(keywords) {
    // 获取当前卡包的维度
    const dimensions = getCurrentDimensions();
    
    // 根据不同卡包类型生成不同的隐藏词
    let hiddenKeyword;
    switch(currentPackType) {
        case 'female':
            hiddenKeyword = '女性';
            break;
        case 'male':
            hiddenKeyword = '男性';
            break;
        case 'loli':
            hiddenKeyword = '萝莉';
            break;
        case 'warrior':
            // 战士卡包随机选择性别
            hiddenKeyword = Math.random() < 0.5 ? '女战士' : '男战士';
            break;
        default:
            hiddenKeyword = '';
    }

    // 组合维度和关键词
    const keywordPairs = dimensions.map((dimension, index) => 
        `${getDimensionDisplayName(dimension)}：${keywords[index]}`
    );

    // 将隐藏词放在最前面
    return [hiddenKeyword, ...keywordPairs].join(' ');
}

// 生成图片
async function generateCharacter(keywords) {
    const prompt = generateCharacterDescription(keywords);
    const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_CONFIG.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            bot_id: API_CONFIG.botId,
            user_id: API_CONFIG.userId,
            stream: true,
            auto_save_history: true,
            additional_messages: [{
                role: 'user',
                content: prompt,
                content_type: 'text'
            }]
        })
    });

    if (!response.ok) {
        throw new Error('API请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let hasImage = false;
    let finalResult = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const data = line.slice(5);
                const result = handleApiResponse(data);
                if (result) {
                    if (result.imageUrl) hasImage = true;
                    finalResult = { ...finalResult, ...result };
                }
            }
        }
    }

    // 如果整个响应结束后还是没有图片，显示错误
    if (!hasImage || !finalResult || !finalResult.imageUrl) {
        throw new Error('偶尔绘制失败，可以重新抽取');
    }

    return finalResult;
}

// 解析流式返回的数据
function parseStreamData(chunk) {
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
        if (line.startsWith('data:')) {
            try {
                const jsonStr = line.substring(5);
                if (jsonStr.trim() === '"[DONE]"') {
                    return null;
                }
                
                const data = JSON.parse(jsonStr);
                if (data.type === 'answer' && data.content) {
                    return data.content;
                }
            } catch (e) {
                console.error('解析数据失败:', e);
            }
        }
    }
    return null;
}

// 显示图片
function displayImage(imageUrl) {
    if (imageUrl && imageUrl.startsWith('http')) {
        generatedImage.src = imageUrl;
        generatedImage.style.display = 'block';
        cardLoading.style.display = 'none';
        responseDiv.style.display = 'none';  // 隐藏状态文本
    }
}

// 重置角色卡片到初始状态
async function resetCharacterCard() {
    // 立即隐藏所有元素，不使用动画
    cardText.style.display = 'none';
    cardError.style.display = 'none';
    generatedImage.style.display = 'none';
    cardText.classList.remove('hidden');
    cardError.classList.remove('hidden');
    generatedImage.classList.remove('hidden');
    
    // 直接显示占位符，不使用动画
    cardPlaceholder.style.display = 'flex';
    cardPlaceholder.classList.remove('hidden');
    cardPlaceholder.innerHTML = `
        <div class="card-placeholder-icon">🎴</div>
        <div class="card-placeholder-content">
            <div class="start-hint">请先抽取角色词条</div>
            <div class="start-subhint"> </div>
        </div>
    `;
}

// 开始抽取流程
async function startSpinning() {
    if (isSpinning) return;
    isSpinning = true;
    
    try {
        // 1. 确保老虎机已初始化
        if (!currentSlots || !currentSlots.length) {
            initializeSlotMachine(true);
        }
        
        // 2. 如果当前有显示的角色卡，先淡出
        if (generatedImage.style.display === 'block') {
            generatedImage.classList.add('hidden');
            cardText.classList.add('hidden');
            await new Promise(resolve => setTimeout(resolve, 300));
            generatedImage.style.display = 'none';
            cardText.style.display = 'none';
        }
        
        // 3. 显示抽取提示
        cardPlaceholder.style.display = 'flex';
        cardPlaceholder.innerHTML = `
            <div class="card-placeholder-icon">🎲</div>
            <div class="card-placeholder-content">
                <div class="start-hint">正在抽取词条...</div>
            </div>
        `;
        cardPlaceholder.classList.remove('hidden');
        
        // 4. 生成最终关键词并立即开始API调用
        const finalKeywords = generateFinalKeywords();
        const apiPromise = Promise.race([
            generateCharacter(finalKeywords),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('生成超时，请重试')), 30000)
            )
        ]);
        
        // 5. 更新按钮状态
        generateButton.textContent = '抽取中...';
        generateButton.disabled = true;
        
        // 6. 播放动画（动画和API调用并行进行）
        const animationPromise = playSpinningAnimation(finalKeywords);
        
        // 7. 等待动画完成
        await animationPromise;
        
        // 8. 显示加载动画
        showLoadingState();
        
        // 9. 等待API结果
        const result = await apiPromise;
        
        // 10. 显示结果
        await showSuccess(result);
        
        // 11. 记录成功
        trackEvent('生成', '成功', getCurrentTab(), 1);
        trackEvent('卡包使用', '生成成功', getCurrentTab(), 1);
        
        // 12. 添加到历史记录
        addToHistory({
            timestamp: new Date().toISOString(),
            keywords: finalKeywords,
            imageUrl: result.imageUrl,
            greeting: result.description,
            type: currentPackType  // 添加卡包类型
        });
    } catch (error) {
        generateButton.classList.add('error');
        showError(error);
        
        // 记录失败
        trackEvent('生成', '失败', `${getCurrentTab()} - ${error.message}`, 1);
        trackEvent('卡包使用', '生成失败', getCurrentTab(), 1);
    } finally {
        cleanup();
    }
}

// 统计用户行为的函数
function trackEvent(category, action, label = '', value = 0) {
    if (window.gtag) {
        gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value,
            'user_id': getUserId()  // 添加用户ID到每个事件中
        });
    }
}

// 获取当前选中的标签页
function getCurrentTab() {
    const activeTab = document.querySelector('.tab-button.active');
    return activeTab ? activeTab.textContent : '';
}

// 生成或获取用户ID
function getUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        // 生成一个随机的用户ID
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
    }
    return userId;
}

// 初始化用户会话
function initUserSession() {
    const userId = getUserId();
    if (window.gtag) {
        // 设置用户ID
        gtag('set', 'user_id', userId);
        // 设置用户属性
        gtag('set', 'user_properties', {
            user_id: userId,
            first_visit_date: localStorage.getItem('first_visit_date') || new Date().toISOString(),
            visit_count: parseInt(localStorage.getItem('visit_count') || '0') + 1
        });
        // 记录访问次数
        localStorage.setItem('visit_count', parseInt(localStorage.getItem('visit_count') || '0') + 1);
        // 记录首次访问时间
        if (!localStorage.getItem('first_visit_date')) {
            localStorage.setItem('first_visit_date', new Date().toISOString());
        }
    }
}

// 历史记录展开/收起
function initializeHistory() {
    const toggleButton = document.getElementById('history-toggle');
    const historyContainer = document.getElementById('history-container');
    
    if (!toggleButton || !historyContainer) return;

    // 确保history-grid存在
    let historyGrid = document.getElementById('history-grid');
    if (!historyGrid) {
        historyGrid = document.createElement('div');
        historyGrid.id = 'history-grid';
        historyGrid.className = 'history-grid';
        historyContainer.appendChild(historyGrid);
    }

    // 设置初始状态
    let isExpanded = false;
    const history = loadHistory();
    toggleButton.textContent = history.length === 0 ? '暂无历史记录' : `历史记录 ${isExpanded ? '▼' : '▲'}`;
    
    // 更新历史记录按钮状态
    updateHistoryButtonState();

    toggleButton.addEventListener('click', async () => {
        const currentHistory = loadHistory();
        if (currentHistory.length === 0) return;
        
        isExpanded = !isExpanded;
        toggleButton.textContent = `历史记录 ${isExpanded ? '▼' : '▲'}`;
        
        // 添加历史记录展开/收起埋点
        trackEvent('历史记录', isExpanded ? '展开' : '收起', '', 1);
        
        if (isExpanded) {
            // 1. 先加载内容但保持不可见
            await updateHistoryDisplay();
            
            // 2. 展开容器
            historyContainer.classList.add('expanded');
            
            // 3. 等待一小段时间确保展开动画开始
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // 4. 显示内容
            const grid = document.getElementById('history-grid');
            grid.classList.add('visible');
            
            // 5. 显示提示文案
            const hint = document.querySelector('.history-hint');
            if (hint) {
                hint.style.display = 'block';
            }
        } else {
            // 收起时反向操作
            const grid = document.getElementById('history-grid');
            grid.classList.remove('visible');
            
            // 隐藏提示文案
            const hint = document.querySelector('.history-hint');
            if (hint) {
                hint.style.display = 'none';
            }
            
            // 同时进行容器收起和滚动动画
            historyContainer.classList.remove('expanded');
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
}

// 更新历史记录显示
async function updateHistoryDisplay() {
    const history = loadHistory();
    const historySection = document.querySelector('.history-section');
    const historyGrid = document.querySelector('.history-grid');
    
    if (!historyGrid) return;
    
    historyGrid.innerHTML = '';
    
    history.forEach(record => {
        historyGrid.appendChild(createHistoryCard(record));
    });

    // 更新或添加提示文本
    let hint = document.querySelector('.history-hint');
    if (history.length > 0) {
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'history-hint';
            historySection.appendChild(hint);
        }
        hint.textContent = '为保证浏览体验，仅展示最近30个角色';
        hint.style.cssText = 'color: rgba(255,255,255,0.4); font-size: 13px; text-align: center; padding: 1px 0 8px 0; width: 100%;';
        // 初始化时隐藏提示文案
        hint.style.display = 'none';
    } else if (hint) {
        hint.style.display = 'none';
    }

    layoutMasonry();
}

// 瀑布流布局
function layoutMasonry() {
    const grid = document.getElementById('history-grid');
    const items = Array.from(grid.children);
    const columnCount = 2;
    const columnHeights = new Array(columnCount).fill(0);
    const gridWidth = grid.offsetWidth;
    const columnWidth = (gridWidth - COLUMN_GAP) / 2;

    // 按照从左到右、从上到下的顺序排列
    items.forEach((item, index) => {
        const columnIndex = index % columnCount; // 0 或 1，决定是左列还是右列
        const xPos = columnIndex * (columnWidth + COLUMN_GAP);
        const yPos = columnHeights[columnIndex];

        item.style.transform = `translate(${xPos}px, ${yPos}px)`;
        columnHeights[columnIndex] += item.offsetHeight + ROW_GAP;
    });

    // 设置grid容器高度为最高的列的高度
    grid.style.height = Math.max(...columnHeights) + 'px';
}

// 历史记录管理
const HISTORY_KEY = 'character_history';
const MAX_HISTORY = 30;
const COLUMN_GAP = 16; // 列间距
const ROW_GAP = 20;    // 行间距

function loadHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function addToHistory(record) {
    let history = loadHistory();
    history.unshift(record);
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    saveHistory(history);
    
    // 添加历史记录保存埋点
    trackEvent('历史记录', '保存记录', `${record.type}卡包`, 1);
    
    // 更新历史记录按钮状态
    updateHistoryButtonState();
    
    updateHistoryDisplay();
}

// 更新历史记录按钮状态
function updateHistoryButtonState() {
    const toggleButton = document.getElementById('history-toggle');
    if (!toggleButton) return;
    
    const history = loadHistory();
    const isExpanded = toggleButton.textContent.includes('▼');
    toggleButton.textContent = history.length === 0 ? '暂无历史记录' : `历史记录 ${isExpanded ? '▼' : '▲'}`;
}

// 创建历史记录卡片
function createHistoryCard(record) {
    const item = document.createElement('div');
    item.className = 'history-item';

    const info = document.createElement('div');
    info.className = 'history-info';

    const date = document.createElement('div');
    date.className = 'history-date';
    date.textContent = formatDate(record.timestamp);

    const card = document.createElement('div');
    card.className = 'character-card history-card';

    const img = document.createElement('img');
    img.src = record.imageUrl;
    img.alt = '历史角色卡';
    img.loading = 'lazy';
    
    img.onload = () => {
        layoutMasonry();
    };

    const description = document.createElement('p');
    description.className = 'character-description';
    
    // 在历史记录列表中隐藏括号内容，并移除HTML标签
    const greeting = record.greeting
        .replace(/<[^>]*>/g, '') // 移除所有HTML标签
        .replace(/[（(]([^）)]*)[）)]/g, ''); // 移除括号内容
    description.textContent = greeting;

    info.appendChild(date);
    card.appendChild(img);
    card.appendChild(description);
    item.appendChild(info);
    item.appendChild(card);

    // 添加点击事件和埋点
    card.addEventListener('click', () => {
        trackEvent('历史记录', '查看详情', `${record.type}卡包`, 1);
        showModal(record);
    });

    return item;
}

// 显示模态框时显示完整的开场白
function showModal(record) {
    const modal = document.getElementById('modal');
    const modalKeywords = document.getElementById('modal-keywords');
    const modalImage = document.getElementById('modal-image');
    const modalDescription = document.getElementById('modal-description');
    
    // 清空并添加关键词
    modalKeywords.innerHTML = '';
    record.keywords.forEach((keyword, index) => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = keyword;
        modalKeywords.appendChild(tag);
    });
    
    modalImage.src = record.imageUrl;
    
    // 在模态框中显示完整文本，并保持颜色一致
    modalDescription.innerHTML = record.greeting.replace(/[（(]([^）)]*)[）)]/g, (match, content) => {
        return `<span class="action">（${content}）</span>`;
    });
    
    // 显示模态框
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    // 点击任意位置关闭
    const closeModal = (e) => {
        // 阻止事件冒泡
        e.stopPropagation();
        
        // 添加关闭动画
        modal.classList.remove('show');
        
        // 添加埋点
        trackEvent('历史记录', '关闭详情', '', 1);
        
        // 移除事件监听
        modal.removeEventListener('click', closeModal);
    };
    
    // 移除之前可能存在的事件监听器
    modal.removeEventListener('click', closeModal);
    // 添加新的事件监听器
    modal.addEventListener('click', closeModal);
}

// 日期格式化函数
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
        console.error('日期格式化失败:', error);
        return dateString;
    }
}

// 监听窗口大小变化，重新布局
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(layoutMasonry, 100);
});

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化用户会话
    initUserSession();
    
    // 初始化标签页
    initializeTabs();
    
    // 初始化老虎机（显示问号）
    initializeSlotMachine(true);
    
    // 初始化维度显示
    updateDimensionDisplay();
    
    // 初始化历史记录
    initializeHistory();
    
    // 添加历史记录初始化埋点
    const history = loadHistory();
    if (history && history.length > 0) {
        trackEvent('历史记录', '初始化', `记录数:${history.length}`, history.length);
    }
    
    // 初始化生成按钮
    if (generateButton) {
        generateButton.addEventListener('click', startSpinning);
    }
    
    // 重置角色卡片到初始状态
    resetCharacterCard();
});
