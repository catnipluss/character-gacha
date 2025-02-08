// 角色特征关键词配置
const SLOT_KEYWORDS = {
    female: {
        // 女性卡包配置
        physique: [
            "童颜丰乳",      // 规避屏蔽词
            "蜜桃臀曲线",  
            "马甲线纤腰",  
            "九头身比例",  
            "柔韧舞者体",  
            "锁骨蝴蝶骨",  
            "蜜大腿紧致",  
            "沙漏型腰臀",  
            "天鹅颈直角肩",
            "饱满胸型"
        ],
        dress: [
            "湿透白衬衫",  
            "深V包臀裙",   
            "高衩侧开旗袍",
            "运动背心露腰",
            "透肉黑丝袜",  
            "浴巾滑落瞬",  
            "绑带高跟鞋",  
            "男友衬衫",    
            "系带泳装",    
            "落肩针织衫"  
        ],
        scene: [
            "深夜独处办公",  
            "私教拉伸指导",  
            "泳池扶梯水珠",  
            "温泉私汤雾气",  
            "豪车后座空间",  
            "试衣间帘半开",  
            "暴雨湿身屋檐",  
            "晨起窗帘微光",  
            "酒吧高脚凳",    
            "更衣室镜前"   
        ],
        relationship: [
            "继母",
            "继妹",
            "女上司",
            "同学的妈妈",
            "房东阿姨",
            "前女友的闺蜜",
            "女班主任",
            "室友的姐姐",
            "青梅竹马",
            "上司的前妻"
        ]
    },
    male: {
        // 男性卡包配置（乙女向）
        identity: [
            "禁欲系总裁",
            "血族亲王",
            "天才外科医生",
            "帝国骑士长",
            "顶流偶像",
            "黑道少主",
            "古风国师",
            "星际指挥官",
            "音乐剧演员",
            "人外精灵王"
        ],
        relationship: [
            "契约假婚对象",
            "宿敌变情人",
            "重生救赎者",
            "暗恋多年竹马",
            "禁忌导师",
            "双重人格恋人",
            "任务目标反派",
            "AI仿生人",
            "天降婚约者",
            "平行时空同位体"
        ],
        physique: [
            "雕塑级腰臀比",
            "战损肌理感",
            "冷白皮反差",
            "慵懒修长型",
            "爆发力背肌",
            "西装暴徒",
            "异化体征",
            "少年感薄肌",
            "神明躯体",
            "伤痕叙事"
        ]
    }
};

// 获取指定性别和维度的所有关键词
function getKeywords(gender, dimension) {
    return SLOT_KEYWORDS[gender][dimension];
}

// 获取指定性别的所有维度
function getDimensions(gender) {
    return Object.keys(SLOT_KEYWORDS[gender]);
}

// 从指定性别和维度中随机获取一个关键词
function getRandomKeyword(gender, dimension) {
    const dimensionKeywords = SLOT_KEYWORDS[gender][dimension];
    const randomIndex = Math.floor(Math.random() * dimensionKeywords.length);
    return dimensionKeywords[randomIndex];
}

// 导出工具函数
export {
    getKeywords,
    getDimensions,
    getRandomKeyword
};
