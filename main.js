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

// 当前选中的性别
let currentGender = 'female';

// 老虎机状态
let isSpinning = false;
let currentSlots = [];

// 初始化标签页切换
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (isSpinning) return;
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentGender = button.dataset.gender;
        
        // 重新初始化老虎机
        initializeSlotMachine();
    });
});

// 创建老虎机轮盘
function createSlotReel(dimension, keywords) {
    const reelContainer = document.createElement('div');
    reelContainer.className = 'slot-reel';
    
    const dimensionLabel = document.createElement('div');
    dimensionLabel.className = 'dimension-label';
    dimensionLabel.textContent = getDimensionDisplayName(dimension);
    
    const slotItem = document.createElement('div');
    slotItem.className = 'slot-item';
    slotItem.textContent = '❓';
    
    reelContainer.appendChild(dimensionLabel);
    reelContainer.appendChild(slotItem);
    
    return {
        element: slotItem,
        container: reelContainer,
        dimension: dimension,
        keywords: keywords,
        isSpinning: false,
        finalValue: null
    };
}

// 获取维度的显示名称
function getDimensionDisplayName(dimension) {
    const dimensionMap = {
        physique: '身材',
        dress: '打扮',
        scene: '场景',
        relationship: '关系',
        identity: '身份'
    };
    return dimensionMap[dimension] || dimension;
}

// 初始化老虎机
function initializeSlotMachine() {
    slotMachine.innerHTML = '';
    currentSlots = [];
    
    const dimensions = getDimensions(currentGender);
    dimensions.forEach(dimension => {
        const keywords = getKeywords(currentGender, dimension);
        const slot = createSlotReel(dimension, keywords);
        slotMachine.appendChild(slot.container);
        currentSlots.push(slot);
    });
}

// 生成随机延迟时间
function getRandomDelay(min, max) {
    return Math.random() * (max - min) + min;
}

// 滚动单个轮盘
async function spinReel(slot, index) {
    return new Promise(resolve => {
        slot.isSpinning = true;
        
        // 设置滚动动画
        const spinInterval = setInterval(() => {
            if (!slot.isSpinning) {
                clearInterval(spinInterval);
                slot.element.textContent = slot.finalValue;
                slot.element.classList.remove('spinning');
                resolve();
                return;
            }
            
            const randomKeyword = getRandomKeyword(currentGender, slot.dimension);
            slot.element.textContent = randomKeyword;
            slot.element.classList.add('spinning');
        }, 100);
        
        // 设置停止时间
        setTimeout(() => {
            slot.isSpinning = false;
            slot.finalValue = getRandomKeyword(currentGender, slot.dimension);
        }, 2000 + index * 1000); // 每个轮盘依次停止，间隔1秒
    });
}

// 开始所有轮盘的滚动
async function startSpinning() {
    if (isSpinning) return;
    isSpinning = true;
    generateButton.disabled = true;
    
    try {
        // 同时开始所有轮盘的动画
        await Promise.all(currentSlots.map((slot, index) => spinReel(slot, index)));
        
        // 收集所有维度的最终结果
        const dimensions = currentSlots.map(slot => 
            `${getDimensionDisplayName(slot.dimension)}：${slot.finalValue}`
        );
        
        // 添加性别字段
        const gender = currentGender === 'female' ? '性别：女性' : '性别：男性';
        dimensions.unshift(gender);  // 将性别放在最前面
        
        // 组合成最终的 prompt
        const prompt = dimensions.join('\n');
        
        // 调用 API 生成图片
        await generateImage(prompt);
    } catch (error) {
        console.error('Error during spinning:', error);
        responseDiv.textContent = '抽卡失败，请重试';
    } finally {
        isSpinning = false;
        generateButton.disabled = false;
    }
}

// 显示错误信息
function showError(message) {
    cardError.textContent = message;
    cardError.style.display = 'block';
    setTimeout(() => {
        cardError.style.display = 'none';
    }, 5000);
}

// 处理API返回的数据
function handleApiResponse(data) {
    try {
        const parsedData = JSON.parse(data);
        
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
                    cardText.textContent = text;
                    cardText.style.display = 'block';
                }
                
                if (imageUrl) {
                    generatedImage.src = imageUrl;
                    generatedImage.style.display = 'block';
                    cardPlaceholder.style.display = 'none';
                }
                break;
        }
    } catch (error) {
        console.error('Error parsing API response:', error);
        showError('解析响应失败');
    }
}

// 生成图片
async function generateImage(prompt) {
    cardLoading.style.display = 'flex';
    generatedImage.style.display = 'none';
    cardText.textContent = '';
    cardPlaceholder.style.display = 'flex';
    cardError.style.display = 'none';

    try {
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

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const data = line.slice(5);
                    handleApiResponse(data);
                }
            }
        }
    } catch (error) {
        console.error('生成失败:', error);
        showError('生成失败，请重试');
        cardPlaceholder.style.display = 'flex';
    } finally {
        cardLoading.style.display = 'none';
    }
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

// 初始化事件监听
generateButton.addEventListener('click', startSpinning);

// 页面加载完成后初始化老虎机
document.addEventListener('DOMContentLoaded', initializeSlotMachine);
