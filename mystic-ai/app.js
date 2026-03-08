// ========== 翻译数据 ==========
const i18nData = {
    en: {
        formTitle: 'Enter Your Information',
        nameLabel: 'Your Name',
        namePlaceholder: 'Enter your name',
        genderLabel: 'Gender',
        male: 'Male',
        female: 'Female',
        birthDateLabel: 'Date of Birth',
        yearLabel: 'Year',
        monthLabel: 'Month',
        dayLabel: 'Day',
        zodiacLabel: 'Zodiac',
        birthTimeLabel: 'Birth Hour (Chinese)',
        submitBtn: 'Reveal My Fortune',
        personalityTitle: 'Personality Analysis',
        todayTitle: "Today's Horoscope",
        weekTitle: 'This Week',
        monthTitle: 'This Month',
        careerTitle: 'Career · Love · Wealth',
        restartBtn: 'Read Again',
        backBtn: 'Back to History',
        historyTitle: 'Reading History',
        historyListTitle: 'Your Readings',
        clearHistory: 'Clear All',
        emptyHistory: 'No readings yet',
        newsletterTitle: 'Stay Updated',
        newsletterSubtitle: 'Get notified about new readings',
        newsletterBtn: 'Subscribe',
        newsletterNote: 'We respect your privacy',
        donateTitle: 'Support This Reading',
        donateSubtitle: 'If this resonated with you, consider a tip',
        donateLabel: 'Ethereum (ERC-20)',
        donateNote: 'Your support keeps the stars aligned ✨',
        loadingTexts: ['The stars are aligning...', 'Consulting the ancient wisdom...', 'Reading your celestial chart...', 'Weaving your fate...'],
        shareBtn: 'Share Result',
        networkError: 'Network error. Please try again.',
        tryAgain: 'Try Again'
    },
    zh: {
        formTitle: '填写您的信息',
        nameLabel: '您的姓名',
        namePlaceholder: '请输入姓名',
        genderLabel: '性别',
        male: '男',
        female: '女',
        birthDateLabel: '出生日期',
        yearLabel: '年',
        monthLabel: '月',
        dayLabel: '日',
        zodiacLabel: '星座',
        birthTimeLabel: '出生时辰',
        submitBtn: '揭示命运',
        personalityTitle: '性格分析',
        todayTitle: '今日运势',
        weekTitle: '本周运势',
        monthTitle: '本月运势',
        careerTitle: '事业 · 爱情 · 财运',
        restartBtn: '再次解读',
        backBtn: '返回历史',
        historyTitle: '历史记录',
        historyListTitle: '您的解读',
        clearHistory: '清空',
        emptyHistory: '暂无解读记录',
        newsletterTitle: '订阅更新',
        newsletterSubtitle: '获取最新解读通知',
        newsletterBtn: '订阅',
        newsletterNote: '我们尊重您的隐私',
        donateTitle: '支持我们',
        donateSubtitle: '如果对您有启发，欢迎打赏',
        donateLabel: 'ETH (ERC-20)',
        donateNote: '您的支持是我们前进的动力 ✨',
        loadingTexts: ['星辰正在排列...', '探寻古老智慧...', '解读你的星盘...', '编织你的命运...']
    }
};

let currentLang = 'en';

// ========== 语言切换 ==========
function switchLanguage(lang) {
    currentLang = lang;
    const t = i18nData[lang];
    
    // 更新按钮状态
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // 更新所有带 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) {
            el.textContent = t[key];
        }
    });
    
    // 更新 placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (t[key]) {
            el.placeholder = t[key];
        }
    });
    
    // 更新加载文字
    const loadingTextEl = document.getElementById('loadingText');
    if (loadingTextEl && t.loadingTexts) {
        loadingTextEl.innerHTML = t.loadingTexts.map(txt => `<span style="display:block;text-align:center;">${txt}</span>`).join('');
    }
    
    // 更新时辰选择器（根据用户时区）
    initEarthlyBranchSelector();
    
    // 保存语言设置
    localStorage.setItem('mystic_lang', lang);
}

// ========== 创建星星背景 ==========
function createStars() {
    const container = document.getElementById('stars');
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(star);
    }
}

// ========== 粒子背景 ==========
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 25 + 's';
        particle.style.animationDuration = (20 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// ========== 初始化年份选择器 ==========
function initYearSelector() {
    const yearSelect = document.getElementById('birthYear');
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1950; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// ========== 初始化日期选择器 ==========
function initDaySelector() {
    const daySelect = document.getElementById('birthDay');
    daySelect.innerHTML = '<option value="">Day</option>';
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day.toString().padStart(2, '0');
        option.textContent = day;
        daySelect.appendChild(option);
    }
}

// ========== 初始化地支时辰选择器（根据用户时区） ==========
function initEarthlyBranchSelector() {
    const timeSelect = document.getElementById('birthTime');
    if (!timeSelect) return;
    
    // 地支及其中文名称
    const branches = [
        { char: '子', name: 'Zi', pinyin: '子' },
        { char: '丑', name: 'Chou', pinyin: '丑' },
        { char: '寅', name: 'Yin', pinyin: '寅' },
        { char: '卯', name: 'Mao', pinyin: '卯' },
        { char: '辰', name: 'Chen', pinyin: '辰' },
        { char: '巳', name: 'Si', pinyin: '巳' },
        { char: '午', name: 'Wu', pinyin: '午' },
        { char: '未', name: 'Wei', pinyin: '未' },
        { char: '申', name: 'Shen', pinyin: '申' },
        { char: '酉', name: 'You', pinyin: '酉' },
        { char: '戌', name: 'Xu', pinyin: '戌' },
        { char: '亥', name: 'Hai', pinyin: '亥' }
    ];
    
    // 地支对应的北京时间（24小时制）
    const beijingOffsets = [
        { start: 23, end: 1 },   // 子时: 23:00-01:00
        { start: 1, end: 3 },    // 丑时: 01:00-03:00
        { start: 3, end: 5 },    // 寅时: 03:00-05:00
        { start: 5, end: 7 },    // 卯时: 05:00-07:00
        { start: 7, end: 9 },    // 辰时: 07:00-09:00
        { start: 9, end: 11 },   // 巳时: 09:00-11:00
        { start: 11, end: 13 },  // 午时: 11:00-13:00
        { start: 13, end: 15 },  // 未时: 13:00-15:00
        { start: 15, end: 17 },  // 申时: 15:00-17:00
        { start: 17, end: 19 },  // 酉时: 17:00-19:00
        { start: 19, end: 21 },  // 戌时: 19:00-21:00
        { start: 21, end: 23 }   // 亥时: 21:00-23:00
    ];
    
    // 获取用户时区与北京时间的时差（小时）
    function getBeijingTimeDiff() {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        try {
            // 创建一个北京时间日期
            const beijingTime = new Date();
            beijingTime.setHours(12, 0, 0, 0); // 中午12点
            
            // 转换为用户时区的时间
            const userTimeStr = beijingTime.toLocaleString('en-US', { timeZone: userTimeZone });
            const userTime = new Date(userTimeStr);
            
            // 计算差值（小时）
            const diff = (beijingTime.getTime() - userTime.getTime()) / (1000 * 60 * 60);
            return diff;
        } catch (e) {
            console.warn('Timezone detection failed, defaulting to Beijing:', e);
            return 0;
        }
    }
    
    // 将北京时间转换为用户当地时间
    function convertToUserTime(beijingHour) {
        const diff = getBeijingTimeDiff();
        let userHour = beijingHour - diff;
        
        // 规范化到 0-23 范围
        while (userHour < 0) userHour += 24;
        while (userHour >= 24) userHour -= 24;
        
        return userHour;
    }
    
    // 格式化时间显示
    function formatTime(hour) {
        const endHour = hour + 2;
        const startStr = `${hour.toString().padStart(2, '0')}:00`;
        const endStr = `${endHour.toString().padStart(2, '0')}:00`;
        return `${startStr}-${endStr}`;
    }
    
    // 清空现有选项
    timeSelect.innerHTML = '';
    
    // 获取当前语言
    const isChinese = currentLang === 'zh';
    
    // 添加选项
    branches.forEach((branch, index) => {
        const option = document.createElement('option');
        const userStartHour = convertToUserTime(beijingOffsets[index].start);
        const timeDisplay = formatTime(userStartHour);
        
        if (isChinese) {
            option.textContent = `${branch.pinyin} ${branch.char} (${timeDisplay})`;
        } else {
            option.textContent = `${branch.char} ${branch.name} (${timeDisplay})`;
        }
        option.value = branch.char;
        timeSelect.appendChild(option);
    });
    
    // 保存原始值用于翻译更新
    timeSelect.dataset.originalValues = JSON.stringify(branches);
    timeSelect.dataset.beijingOffsets = JSON.stringify(beijingOffsets);
}

// ========== 计算星座 ==========
function getZodiac(month, day) {
    const zodiacMap = [
        { sign: 'Capricorn', start: [12, 22], end: [1, 19] },
        { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
        { sign: 'Pisces', start: [2, 19], end: [3, 20] },
        { sign: 'Aries', start: [3, 21], end: [4, 19] },
        { sign: 'Taurus', start: [4, 20], end: [5, 20] },
        { sign: 'Gemini', start: [5, 21], end: [6, 20] },
        { sign: 'Cancer', start: [6, 21], end: [7, 22] },
        { sign: 'Leo', start: [7, 23], end: [8, 22] },
        { sign: 'Virgo', start: [8, 23], end: [9, 22] },
        { sign: 'Libra', start: [9, 23], end: [10, 22] },
        { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
        { sign: 'Sagittarius', start: [11, 22], end: [12, 21] }
    ];
    for (let zodiac of zodiacMap) {
        const [startMonth, startDay] = zodiac.start;
        const [endMonth, endDay] = zodiac.end;
        if (startMonth > endMonth) {
            if ((month === startMonth && day >= startDay) || (month <= endMonth && day <= endDay)) return zodiac.sign;
        } else {
            if ((month === startMonth && day >= startDay) || (month > startMonth && month < endMonth) || (month === endMonth && day <= endDay)) return zodiac.sign;
        }
    }
    return 'Capricorn';
}

// ========== 更新星座显示 ==========
function updateZodiac() {
    const month = parseInt(document.getElementById('birthMonth').value);
    const day = parseInt(document.getElementById('birthDay').value);
    const zodiacDisplay = document.getElementById('zodiacDisplay');
    const zodiacInput = document.getElementById('zodiac');
    if (month && day) {
        const zodiac = getZodiac(month, day);
        zodiacDisplay.textContent = zodiac;
        zodiacInput.value = zodiac;
    } else {
        zodiacDisplay.textContent = '-';
        zodiacInput.value = '';
    }
}

// ========== 显示加载动画 ==========
function showLoading() {
    const inputCard = document.getElementById('inputCard');
    const loadingContainer = document.getElementById('loadingContainer');
    inputCard.style.display = 'none';
    loadingContainer.style.display = 'block';
}

// ========== 显示结果 ==========
function showResults(aiReading) {
    const loadingContainer = document.getElementById('loadingContainer');
    const resultsContainer = document.getElementById('resultsContainer');
    const footerSection = document.getElementById('footerSection');
    loadingContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    footerSection.style.display = 'block';
    
    setTimeout(() => {
        const tarotCard = document.getElementById('tarotCard');
        tarotCard.classList.add('revealed');
        const tarotSymbols = ['🌟', '🌙', '☀️', '⚡', '🌊', '🔥'];
        const tarotNames = ['The Star', 'The Moon', 'The Sun', 'Strength', 'Wheel of Fortune', 'Temperance'];
        const randomIndex = Math.floor(Math.random() * tarotSymbols.length);
        document.getElementById('tarotImage').textContent = tarotSymbols[randomIndex];
        document.getElementById('tarotName').textContent = tarotNames[randomIndex];
    }, 600);
    
    if (aiReading) {
        // 解析内容并分别放到各个卡片
        const parts = parseReadingContent(aiReading);
        document.getElementById('personalityContent').innerHTML = parts.personality || aiReading;
        document.getElementById('todayContent').innerHTML = parts.today || '';
        document.getElementById('weekContent').innerHTML = parts.week || '';
        document.getElementById('monthContent').innerHTML = parts.month || '';
        document.getElementById('careerContent').innerHTML = parts.career || '';
    } else {
        fillDefaultResults();
    }
    animateResultCards();
}

// ========== 解析解读内容 ==========
function parseReadingContent(text) {
    if (!text) return {};
    
    // 如果内容包含 HTML 标签，先清理
    text = text.replace(/<[^>]*>/g, ' ');
    
    // 按常见分隔符分割
    const sections = text.split(/\n\n+/).filter(s => s.trim());
    
    const result = {
        personality: '',
        today: '',
        week: '',
        month: '',
        career: ''
    };
    
    // 中文标题关键词
    const zhKeywords = {
        personality: ['性格', 'Personality'],
        today: ['今日', "Today's", '今日运势'],
        week: ['本周', "This Week", '本周运势'],
        month: ['本月', "This Month", '本月运势'],
        career: ['事业', 'Career', '爱情', 'Love', '财运', 'Wealth']
    };
    
    // 英文标题关键词
    const enKeywords = {
        personality: ['Personality'],
        today: ["Today's Horoscope"],
        week: ["This Week"],
        month: ["This Month"],
        career: ['Career', 'Love', 'Wealth']
    };
    
    // 遍历每个段落，尝试识别属于哪个部分
    let currentSection = 'personality';
    let collected = { personality: [], today: [], week: [], month: [], career: [] };
    
    for (const section of sections) {
        const lower = section.toLowerCase();
        let matched = false;
        
        // 检查是否匹配某个标题
        for (const key in zhKeywords) {
            for (const kw of zhKeywords[key]) {
                if (lower.includes(kw.toLowerCase())) {
                    currentSection = key;
                    matched = true;
                    break;
                }
            }
            if (matched) break;
        }
        
        // 如果是新的部分开头，跳过标题行
        if (matched) {
            const lines = section.split('\n');
            const contentLines = lines.filter(l => !isTitleLine(l));
            if (contentLines.length > 0) {
                collected[currentSection].push(contentLines.join('\n'));
            }
        } else {
            // 如果内容比较长，也收集到当前部分
            if (section.length > 50) {
                collected[currentSection].push(section);
            }
        }
    }
    
    // 组装结果
    result.personality = collected.personality.join('\n\n') || text;
    result.today = collected.today.join('\n\n');
    result.week = collected.week.join('\n\n');
    result.month = collected.month.join('\n\n');
    result.career = collected.career.join('\n\n');
    
    // 如果某个部分为空，用默认值
    const t = i18nData[currentLang];
    if (!result.today) result.today = `<p>${t?.loadingTexts?.[0] || 'Loading...'}</p>`;
    if (!result.week) result.week = `<p>${t?.loadingTexts?.[1] || 'Loading...'}</p>`;
    if (!result.month) result.month = `<p>${t?.loadingTexts?.[2] || 'Loading...'}</p>`;
    if (!result.career) result.career = `<p>${t?.loadingTexts?.[3] || 'Loading...'}</p>`;
    
    return result;
}

// 判断一行是否是标题行
function isTitleLine(line) {
    const titlePatterns = [
        /^【[^】]+】/,
        /^[一二三四五六七八九十]+[\s:：]/,
        /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*[\s:：]/,
        /^\*\*[^*]+\*\*/,
        /^[◆☀☾★✦]+/
    ];
    return titlePatterns.some(p => p.test(line.trim()));
}

// ========== 默认结果 ==========
function fillDefaultResults() {
    const name = document.getElementById('name').value || 'You';
    document.getElementById('personalityContent').innerHTML = `
        <p>Based on your birth information, ${name}, AI has analyzed your personality:</p>
        <p style="margin-top: 16px;">🔮 <strong>Core Traits:</strong> You are a creative soul with exceptional intuition.</p>
        <p style="margin-top: 12px;">💫 <strong>Style:</strong> You think deeply and often find inspiration in solitude.</p>
    `;
    document.getElementById('todayContent').innerHTML = `
        <p>☀️ <strong>Overall:</strong> ★★★★☆</p>
        <p style="margin-top: 12px;">💼 <strong>Career:</strong> Excellent day for important matters.</p>
        <p style="margin-top: 12px;">💕 <strong>Love:</strong> Unexpected surprises await.</p>
    `;
    document.getElementById('weekContent').innerHTML = `
        <p>☾ <strong>Overall:</strong> ★★★★☆</p>
        <p style="margin-top: 12px;">📅 This week brings adjustments and breakthroughs.</p>
    `;
    document.getElementById('monthContent').innerHTML = `
        <p>★ <strong>Overall:</strong> ★★★★★</p>
        <p style="margin-top: 12px;">🎯 This is your lucky month!</p>
    `;
    document.getElementById('careerContent').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div style="text-align: center;"><div style="font-size: 2rem; margin-bottom: 10px;">💼</div><strong>Career</strong></div>
            <div style="text-align: center;"><div style="font-size: 2rem; margin-bottom: 10px;">💕</div><strong>Love</strong></div>
            <div style="text-align: center;"><div style="font-size: 2rem; margin-bottom: 10px;">💰</div><strong>Wealth</strong></div>
        </div>
    `;
}

// ========== 结果卡片入场动画 ==========
function animateResultCards() {
    const cards = document.querySelectorAll('.result-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.classList.add('animate-in');
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150 + 800);
    });
}

// ========== 调用 AI API ==========
async function callAIAPI(data) {
    try {
        const response = await fetch('/api/mystic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('API call failed');
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========== 表单提交 ==========
document.getElementById('mysticForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const year = document.getElementById('birthYear').value;
    const month = document.getElementById('birthMonth').value;
    const day = document.getElementById('birthDay').value;
    const formData = {
        name: document.getElementById('name').value,
        gender: document.querySelector('input[name="gender"]:checked')?.value,
        birthDate: `${year}-${month}-${day}`,
        birthTime: document.getElementById('birthTime').value,
        zodiac: document.getElementById('zodiac').value,
        lang: currentLang
    };
    if (!formData.name || !formData.gender || !formData.birthDate || !formData.zodiac) {
        alert('Please fill in all fields');
        return;
    }
    showLoading();
    try {
        const result = await callAIAPI(formData);
        if (result.success && result.reading) {
            saveReadingHistory({ name: formData.name, zodiac: formData.zodiac, reading: result.reading, date: new Date().toISOString(), lang: currentLang });
            updateHistoryCount();
            showResults(result.reading);
        } else {
            showError(t.networkError || 'Failed to get reading. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        showError(t.networkError || 'Connection error. Please check your network.');
    }
});

function showError(message) {
    hideLoading();
    const t = translations[currentLang] || translations.en;
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    
    if (loadingContainer) loadingContainer.style.display = 'none';
    
    resultsContainer.innerHTML = `
        <div class="error-container" style="text-align:center;padding:40px 20px;">
            <div style="font-size:3rem;margin-bottom:20px;">⚠️</div>
            <h3 style="color:#ef4444;margin-bottom:12px;">${t.error || 'Error'}</h3>
            <p style="color:var(--text-secondary);margin-bottom:24px;">${message}</p>
            <button onclick="location.reload()" class="submit-btn" style="max-width:200px;margin:0 auto;">
                ${t.tryAgain || 'Try Again'}
            </button>
        </div>
    `;
    resultsContainer.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== 重新测试 ==========
document.getElementById('restartBtn').addEventListener('click', function() {
    document.getElementById('mysticForm').reset();
    document.getElementById('zodiacDisplay').textContent = '-';
    const resultsContainer = document.getElementById('resultsContainer');
    const footerSection = document.getElementById('footerSection');
    const inputCard = document.getElementById('inputCard');
    const tarotCard = document.getElementById('tarotCard');
    resultsContainer.style.display = 'none';
    footerSection.style.display = 'none';
    inputCard.style.display = 'block';
    tarotCard.classList.remove('revealed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ========== 复制钱包地址 ==========
document.getElementById('copyBtn')?.addEventListener('click', async function() {
    const walletAddress = '0x44B82c81d3f5c712ACFaf3C6e760779A41b2ACE6';
    try {
        await navigator.clipboard.writeText(walletAddress);
        this.innerHTML = '<span style="color: #22c55e;">✓</span>';
        setTimeout(() => { this.innerHTML = '<span class="copy-icon">📋</span>'; }, 2000);
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = walletAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.innerHTML = '<span style="color: #22c55e;">✓</span>';
        setTimeout(() => { this.innerHTML = '<span class="copy-icon">📋</span>'; }, 2000);
    }
});

// ========== 邮件订阅 ==========
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value;
        const btn = newsletterForm.querySelector('.newsletter-btn');
        if (!email) return;
        btn.disabled = true;
        btn.innerHTML = '<span>Subscribing...</span>';
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const card = document.querySelector('.newsletter-card');
            card.classList.add('success');
            let emails = JSON.parse(localStorage.getItem('mystic_subscribers') || '[]');
            if (!emails.includes(email)) { emails.push(email); localStorage.setItem('mystic_subscribers', JSON.stringify(emails)); }
            console.log('📧 Email subscribed:', email);
        } catch (error) {
            console.error('Subscription error:', error);
            btn.disabled = false;
            btn.innerHTML = '<span>Subscribe</span><span class="btn-icon">→</span>';
        }
    });
}

// ========== 历史记录 ==========
function saveReadingHistory(record) {
    let history = JSON.parse(localStorage.getItem('mystic_history') || '[]');
    history.unshift(record);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem('mystic_history', JSON.stringify(history));
}

function getReadingHistory() {
    return JSON.parse(localStorage.getItem('mystic_history') || '[]');
}

function clearReadingHistory() {
    localStorage.removeItem('mystic_history');
    renderHistory();
    updateHistoryCount();
}

function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    updateHistoryCount();
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    const history = getReadingHistory();
    if (history.length === 0) {
        historyList.innerHTML = `<p class="empty-history">${i18nData[currentLang]?.emptyHistory || 'No readings yet'}</p>`;
        return;
    }
    historyList.innerHTML = history.map((item, index) => {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const preview = item.reading?.replace(/<[^>]*>/g, '').substring(0, 100) || '';
        return `<div class="history-item" onclick="viewHistoryItem(${index})">
            <div class="history-item-header">
                <span class="history-item-name">${escapeHtml(item.name)}</span>
                <span class="history-item-date">${dateStr}</span>
            </div>
            <span class="history-item-zodiac">${item.zodiac}</span>
            <p class="history-item-preview">${preview}...</p>
        </div>`;
    }).join('');
}

function viewHistoryItem(index) {
    const history = getReadingHistory();
    if (history[index]) {
        const item = history[index];
        // 临时切换到记录的语言
        const prevLang = currentLang;
        if (item.lang) switchLanguage(item.lang);
        showResults(item.reading);
        document.getElementById('historyPanel').style.display = 'none';
        document.getElementById('backBtn').style.display = 'flex';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateHistoryCount() {
    const history = getReadingHistory();
    const countEl = document.getElementById('historyCount');
    if (countEl) countEl.textContent = history.length;
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
    createStars();
    createParticles();
    initYearSelector();
    initDaySelector();
    initEarthlyBranchSelector();
    console.log('✨ Mystic AI Ready - Version 2.1');
    initEnhancedFeatures();;
    
    // 语言切换初始化
    const savedLang = localStorage.getItem('mystic_lang') || 'en';
    switchLanguage(savedLang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
    });
    
    // 历史记录
    const historyToggleBtn = document.getElementById('historyToggleBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (historyToggleBtn) historyToggleBtn.addEventListener('click', toggleHistory);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => { if (confirm('Clear all reading history?')) clearReadingHistory(); });
    updateHistoryCount();
    
    // 返回按钮
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            this.style.display = 'none';
            toggleHistory();
        });
    }
    
    // 初始化月份和日选项
    const monthSelect = document.getElementById('birthMonth');
    if (monthSelect) {
        monthSelect.addEventListener('change', updateZodiac);
    }
    const daySelect = document.getElementById('birthDay');
    if (daySelect) {
        daySelect.addEventListener('change', updateZodiac);
    }
});

// ========== 优化功能: Toast 通知 ==========
function showToast(message, type = 'default') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast ' + type;
    
    // 显示
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 3秒后隐藏
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== 优化功能: 分享结果 ==========
function initShareButton() {
    const shareBtn = document.getElementById('shareBtn');
    const shareContainer = document.getElementById('shareContainer');
    
    if (shareContainer) {
        shareContainer.style.display = 'flex';
        shareContainer.style.justifyContent = 'center';
        shareContainer.style.gap = '10px';
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const name = document.getElementById('name').value || 'Guest';
            const tarotName = document.getElementById('tarotName').textContent || 'Mystic Card';
            
            const shareText = `✨ Mystic AI Reading for ${name}\n\n🃏 Card: ${tarotName}\n\n🔮 Get your fortune at: mystic-ai-henna.vercel.app`;
            
            if (navigator.share) {
                // 使用原生分享
                try {
                    await navigator.share({
                        title: 'Mystic AI Fortune',
                        text: shareText,
                        url: 'https://mystic-ai-henna.vercel.app'
                    });
                    showToast('Shared successfully! ✨', 'success');
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        copyToClipboard(shareText);
                    }
                }
            } else {
                // 复制到剪贴板
                copyToClipboard(shareText);
            }
        });
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard! 📋', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// ========== 优化功能: 增强历史记录 ==========
function renderHistoryItem(reading) {
    const date = new Date(reading.timestamp);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    return `
        <div class="history-item" onclick="loadReading('${reading.timestamp}')">
            <div class="history-item-icon">🃏</div>
            <div class="history-item-content">
                <div class="history-item-title">${reading.tarotName || 'Mystic Reading'}</div>
                <div class="history-item-date">${dateStr}</div>
            </div>
        </div>
    `;
}

function loadReading(timestamp) {
    const history = getReadingHistory();
    const reading = history.find(r => r.timestamp === timestamp);
    if (!reading) return;
    
    // 显示结果
    document.getElementById('inputCard').style.display = 'none';
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    
    // 填充数据
    if (reading.tarotName) document.getElementById('tarotName').textContent = reading.tarotName;
    if (reading.tarotSymbol) document.getElementById('tarotImage').innerHTML = reading.tarotSymbol;
    
    // 填充各个卡片内容
    const sections = ['personality', 'today', 'week', 'month', 'career'];
    sections.forEach(section => {
        const el = document.getElementById(section + 'Content');
        if (el && reading[section]) el.innerHTML = reading[section];
    });
    
    // 显示返回按钮
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.style.display = 'inline-flex';
    
    // 显示分享按钮
    initShareButton();
    
    // 切换语言
    if (reading.lang) switchLanguage(reading.lang);
}

// 修改 initHistoryRendering 使用新样式
const originalRenderHistoryList = renderHistoryList;
renderHistoryList = function() {
    const history = getReadingHistory();
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-history" data-i18n="emptyHistory">No readings yet</p>';
        return;
    }
    
    historyList.innerHTML = history.map(renderHistoryItem).join('');
};

// ========== 初始化增强功能 ==========
function initEnhancedFeatures() {
    // 在结果显示时初始化分享按钮
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'resultsContainer' && 
                mutation.target.style.display === 'block') {
                initShareButton();
            }
        });
    });
    
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        observer.observe(resultsContainer, { attributes: true, attributeFilter: ['style'] });
    }
}

// 在 DOMContentLoaded 中调用
console.log('✨ Mystic AI Ready - Version 2.1');
