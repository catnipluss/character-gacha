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
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isSpinning) return;
            
            // 移除所有活动状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前活动状态
            button.classList.add('active');
            // 更新当前卡包类型
            currentPackType = button.classList[1];  // 使用第二个类名作为类型
            // 更新维度显示
            updateDimensionDisplay();
            // 重新初始化老虎机，但保持问号状态
            initializeSlotMachine(true);
            
            // 记录切换卡包行为
            trackEvent('卡包', '切换', button.textContent, 1);
        });
    });
}

// 更新维度显示
function updateDimensionDisplay() {
    const dimensions = getCurrentDimensions();
    const dimensionElements = document.querySelectorAll('.dimension-label');
    
    dimensions.forEach((dimension, index) => {
        if (dimensionElements[index]) {
            // 将维度名称转换为中文显示
            let displayName = getDimensionDisplayName(dimension);
            dimensionElements[index].textContent = displayName;
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
    const reelContainer = document.createElement('div');
    reelContainer.className = 'slot-reel';
    
    const dimensionLabel = document.createElement('div');
    dimensionLabel.className = 'dimension-label';
    dimensionLabel.textContent = getDimensionDisplayName(dimension);
    
    const slotItem = document.createElement('div');
    slotItem.className = 'slot-item';
    slotItem.innerHTML = '<span>❓</span>';
    
    reelContainer.appendChild(dimensionLabel);
    reelContainer.appendChild(slotItem);
    
    return {
        element: slotItem,
        container: reelContainer,
        dimension: dimension,
        keywords: keywords,
        finalValue: null
    };
}

// 初始化老虎机
function initializeSlotMachine(keepQuestionMarks = false) {
    slotMachine.innerHTML = '';
    currentSlots = [];
    
    const dimensions = getCurrentDimensions();
    dimensions.forEach(dimension => {
        const keywords = getKeywords(currentPackType, dimension);
        const slot = createSlotReel(dimension, keywords);
        slotMachine.appendChild(slot.container);
        currentSlots.push(slot);
        
        // 如果需要保持问号状态
        if (keepQuestionMarks) {
            slot.element.innerHTML = '<span>❓</span>';
        }
    });
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
            <div class="loading-subtext"> </div>
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
    // 先隐藏占位符
    cardPlaceholder.classList.add('hidden');
    await new Promise(resolve => setTimeout(resolve, 300));
    cardPlaceholder.style.display = 'none';
    
    // 显示图片和文字
    generatedImage.classList.add('hidden');
    cardText.classList.add('hidden');
    
    // 设置图片源并等待加载完成
    await new Promise((resolve) => {
        generatedImage.onload = resolve;
        generatedImage.src = result.imageUrl;
    });
    
    cardText.innerHTML = result.description;
    generatedImage.style.display = 'block';
    cardText.style.display = 'block';
    
    // 触发重排后显示
    setTimeout(() => {
        generatedImage.classList.remove('hidden');
        cardText.classList.remove('hidden');
    }, 50);
    
    generateButton.textContent = '重新抽取';
    generateButton.disabled = false;
}

// 显示错误状态
function showError(error) {
    cardPlaceholder.style.display = 'none';
    cardError.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div class="error-message">${error.message || '生成失败'}</div>
    `;
    cardError.style.display = 'block';
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
    // 重置显示状态
    cardText.style.display = 'none';
    cardError.style.display = 'none';
    generatedImage.style.display = 'none';
    cardPlaceholder.classList.add('hidden');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    cardPlaceholder.style.display = 'flex';
    cardPlaceholder.innerHTML = `
        <div class="card-placeholder-icon">🎲</div>
        <div>正在抽取角色词条...</div>
    `;
    cardPlaceholder.classList.remove('hidden');
    
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
    slot.element.innerHTML = '<span>❓</span>';
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
    // 先隐藏现有内容
    if (cardText.style.display !== 'none') cardText.classList.add('hidden');
    if (cardError.style.display !== 'none') cardError.classList.add('hidden');
    if (generatedImage.style.display !== 'none') generatedImage.classList.add('hidden');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 隐藏所有元素
    cardText.style.display = 'none';
    cardError.style.display = 'none';
    generatedImage.style.display = 'none';
    
    // 准备显示占位符
    cardPlaceholder.classList.add('hidden');
    cardPlaceholder.style.display = 'flex';
    cardPlaceholder.innerHTML = `
        <div class="card-placeholder-icon">🎴</div>
        <div class="card-placeholder-content">
            <div class="start-hint">请先抽取角色词条</div>
            <div class="start-subhint"> </div>
        </div>
    `;
    
    // 触发重排后显示
    setTimeout(() => {
        cardPlaceholder.classList.remove('hidden');
    }, 50);
}

// 开始抽取流程
async function startSpinning() {
    if (isSpinning) return;
    isSpinning = true;
    
    try {
        // 1. 生成最终关键词
        const finalKeywords = generateFinalKeywords();
        
        // 2. 更新按钮状态
        generateButton.textContent = '抽取中...';
        generateButton.disabled = true;
        
        // 3. 播放动画
        const animationPromise = playSpinningAnimation(finalKeywords);
        
        // 4. 启动API调用（带超时和重试）
        const apiPromise = Promise.race([
            generateCharacter(finalKeywords),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('生成超时，请重试')), 30000)
            )
        ]);
        
        await animationPromise;
        
        // 5. 显示加载动画
        showLoadingState();
        
        // 6. 等待API结果
        const result = await apiPromise;
        showSuccess(result);
        
        // 记录生成成功
        trackEvent('生成', '成功', getCurrentTab(), 1);
        trackEvent('卡包使用', '生成成功', getCurrentTab(), 1);
    } catch (error) {
        generateButton.classList.add('error');
        showError(error);
        
        // 记录生成失败
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
            'value': value
        });
    }
}

// 获取当前选中的标签页
function getCurrentTab() {
    const activeTab = document.querySelector('.tab-button.active');
    return activeTab ? activeTab.textContent : '';
}

// 初始化事件监听
generateButton.addEventListener('click', async () => {
    if (generateButton.disabled) return;
    
    // 记录开始生成
    trackEvent('生成', '点击', getCurrentTab(), 1);
    trackEvent('卡包使用', '生成点击', getCurrentTab(), 1);
    
    startSpinning();
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    updateDimensionDisplay();
    initializeSlotMachine();  // 添加这行，确保初始化老虎机
    resetCharacterCard();
});
