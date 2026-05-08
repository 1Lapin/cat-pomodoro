// 计时器变量
let timeLeft = 25 * 60; // 25分钟
let timerId = null;
let isWorking = true;
let startTime = null;
let originalTime = 25 * 60;

// DOM 元素
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const statusBadge = document.getElementById('status');
const timerCard = document.querySelector('.timer-card');
const mainCatImg = document.getElementById('main-cat-img');
const noiseBtns = document.querySelectorAll('.noise-btn');
const noiseAudio = document.getElementById('noise-audio');
const alertAudio = document.getElementById('alert-audio');
const rewardModal = document.getElementById('reward-modal');
const rewardImg = document.getElementById('reward-img');
const closeRewardBtn = document.getElementById('close-reward');
const volumeSlider = document.getElementById('volume-slider');
const muteBtn = document.getElementById('mute-btn');
const fishTotalDisplay = document.getElementById('fish-total');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const viewHistoryBtn = document.getElementById('view-history');
const closeHistoryBtn = document.getElementById('close-history');

// 账号相关 DOM
const loginModal = document.getElementById('login-modal');
const phoneInput = document.getElementById('phone-input');
const loginSubmit = document.getElementById('login-submit');
const profileModal = document.getElementById('profile-modal');
const userProfileTrigger = document.getElementById('user-profile-trigger');
const userAvatarMini = document.getElementById('user-avatar-mini');
const userNameMini = document.getElementById('user-name-mini');
const profileAvatarPreview = document.getElementById('profile-avatar-preview');
const avatarFileInput = document.getElementById('avatar-file-input');
const avatarUploadBtn = document.getElementById('avatar-upload-btn');
const usernameInput = document.getElementById('username-input');
const userPhoneDisplay = document.getElementById('user-phone-display');
const saveProfileBtn = document.getElementById('save-profile');
const logoutBtn = document.getElementById('logout-btn');
const closeProfileBtn = document.getElementById('close-profile');

// 数据变量
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let fishCount = 0;
let focusHistory = [];
let isResting = false;
let lastVolume = 0.5;
let isMuted = false;

// 更稳定的白噪音链接 (Mixkit)
const noiseSources = {
    rain: 'https://assets.mixkit.co/active_storage/sfx/2443/2443-preview.mp3', // 雨声
    purr: 'https://assets.mixkit.co/active_storage/sfx/1125/1125-preview.mp3', // 海浪声 (较温和)
    forest: 'https://assets.mixkit.co/active_storage/sfx/1218/1218-preview.mp3', // 森林鸟叫
    none: ''
};

// 设置初始音量
noiseAudio.volume = 0.5;
alertAudio.volume = 0.7;

// 音量调节
volumeSlider.oninput = (e) => {
    const vol = e.target.value;
    noiseAudio.volume = vol;
    lastVolume = vol;
    
    // 如果在静音状态下调节音量，自动取消静音
    if (vol > 0 && isMuted) {
        toggleMute(false);
    } else if (vol == 0 && !isMuted) {
        toggleMute(true);
    }
};

// 静音功能
function toggleMute(forceMute = null) {
    isMuted = forceMute !== null ? forceMute : !isMuted;
    
    if (isMuted) {
        noiseAudio.muted = true;
        alertAudio.muted = true;
        muteBtn.textContent = '🔇';
        muteBtn.classList.add('muted');
        volumeSlider.value = 0;
    } else {
        noiseAudio.muted = false;
        alertAudio.muted = false;
        muteBtn.textContent = '🔊';
        muteBtn.classList.remove('muted');
        // 恢复到静音前的音量，如果之前就是0，则恢复到默认0.5
        volumeSlider.value = lastVolume > 0 ? lastVolume : 0.5;
        noiseAudio.volume = volumeSlider.value;
    }
}

muteBtn.onclick = () => toggleMute();

// 更新计时器显示
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.textContent = timeStr;
    document.title = `${timeStr} - 喵喵番茄钟`;
}

// 开始计时
function startTimer() {
    if (timerId) return;
    
    // 如果是在休息结束后的状态，重置为工作时间
    if (!isWorking && timeLeft <= 0) {
        isWorking = true;
        timeLeft = 25 * 60;
    }

    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // 更新 UI 状态
    timerCard.classList.add('focus');
    timerCard.classList.remove('rest');
    
    if (isWorking) {
        statusBadge.textContent = '工作中...';
        statusBadge.style.background = '#ff9a9e';
        startBtn.textContent = '正在专注...';
        mainCatImg.src = 'assets/cat-work.png'; // 切换为专注图片
    } else {
        statusBadge.textContent = '休息中...';
        statusBadge.style.background = '#fad0c4';
        startBtn.textContent = '正在休息...';
        mainCatImg.src = 'assets/cat-rest.png'; // 切换为休息图片
    }
    
    startTime = Date.now();
    const initialTimeLeft = timeLeft;
    
    timerId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timeLeft = Math.max(0, initialTimeLeft - elapsed);
        updateDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            handleSessionComplete();
        }
    }, 100);
}

// 暂停计时
function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // 更新 UI 状态
    timerCard.classList.remove('focus');
    timerCard.classList.add('rest');
    mainCatImg.src = 'assets/cat-rest.png'; // 暂停时显示休息图
    
    if (isWorking) {
        statusBadge.textContent = '已暂停';
        startBtn.textContent = '继续专注';
    } else {
        statusBadge.textContent = '休息中...';
        startBtn.textContent = '继续休息';
    }
}

// 重置计时器
function resetTimer() {
    pauseTimer();
    isWorking = true;
    timeLeft = 25 * 60;
    startBtn.textContent = '开始专注';
    statusBadge.textContent = '休息中...';
    statusBadge.style.background = '#fad0c4';
    mainCatImg.src = 'assets/cat-rest.png'; // 重置显示休息图
    updateDisplay();
}

// 处理会话完成
function handleSessionComplete() {
    alertAudio.play();
    
    if (isWorking) {
        // 工作结束，记录奖励
        addFish();
        showReward();
        
        // 自动进入 1 分钟倒计时
        isWorking = false;
        timeLeft = 1 * 60;
        statusBadge.textContent = '开始休息喵！';
        mainCatImg.src = 'assets/cat-rest.png'; // 切换为休息图
        
        // 休息时间自动开始
        setTimeout(() => {
            startTimer();
        }, 1000); // 稍微延迟一下，让用户看清楚状态
    } else {
        // 休息结束，回到待命状态
        isWorking = true;
        timeLeft = 25 * 60;
        startBtn.textContent = '开始专注';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        statusBadge.textContent = '休息结束喵！';
        timerCard.classList.remove('focus');
        timerCard.classList.add('rest');
        mainCatImg.src = 'assets/cat-rest.png'; // 保持休息图直到下次开始
        alert('休息结束，开始新的专注吧！');
    }
    
    updateDisplay();
}

// 账号系统逻辑
function initAccount() {
    if (!currentUser) {
        loginModal.classList.remove('hidden');
    } else {
        loadUserData();
    }
}

function loadUserData() {
    // 根据手机号加载对应用户的数据
    const userData = JSON.parse(localStorage.getItem(`user_${currentUser.phone}`)) || {
        fishCount: 0,
        focusHistory: [],
        name: `喵友_${currentUser.phone.slice(-4)}`,
        avatar: 'https://via.placeholder.com/100'
    };
    
    fishCount = userData.fishCount;
    focusHistory = userData.focusHistory;
    currentUser.name = userData.name;
    currentUser.avatar = userData.avatar;
    
    updateFishDisplay();
    updateProfileUI();
}

function updateProfileUI() {
    userNameMini.textContent = currentUser.name;
    userAvatarMini.src = currentUser.avatar;
    profileAvatarPreview.src = currentUser.avatar;
    usernameInput.value = currentUser.name;
    userPhoneDisplay.value = currentUser.phone;
}

function saveUserData() {
    if (!currentUser) return;
    const userData = {
        fishCount: fishCount,
        focusHistory: focusHistory,
        name: currentUser.name,
        avatar: currentUser.avatar
    };
    localStorage.setItem(`user_${currentUser.phone}`, JSON.stringify(userData));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// 登录
loginSubmit.onclick = () => {
    const phone = phoneInput.value.trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        alert('请输入正确的11位手机号喵！');
        return;
    }
    
    currentUser = { phone: phone };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    loginModal.classList.add('hidden');
    loadUserData();
};

// 退出
logoutBtn.onclick = () => {
    if (confirm('确定要退出登录吗喵？')) {
        saveUserData();
        localStorage.removeItem('currentUser');
        location.reload(); // 刷新页面回到登录态
    }
};

// 编辑资料
userProfileTrigger.onclick = () => {
    if (!currentUser) {
        loginModal.classList.remove('hidden');
    } else {
        profileModal.classList.remove('hidden');
    }
};

closeProfileBtn.onclick = () => profileModal.classList.add('hidden');

// 头像上传
avatarUploadBtn.onclick = () => avatarFileInput.click();

avatarFileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Img = event.target.result;
            profileAvatarPreview.src = base64Img;
            currentUser.avatar = base64Img;
        };
        reader.readAsDataURL(file);
    }
};

// 保存资料
saveProfileBtn.onclick = () => {
    currentUser.name = usernameInput.value.trim() || `喵友_${currentUser.phone.slice(-4)}`;
    saveUserData();
    updateProfileUI();
    profileModal.classList.add('hidden');
    alert('资料保存成功喵！');
};

// 小鱼干系统
function addFish() {
    fishCount++;
    updateFishDisplay();
    
    // 记录历史
    const record = {
        date: new Date().toLocaleString(),
        type: '番茄钟完成'
    };
    focusHistory.unshift(record);
    if (focusHistory.length > 50) focusHistory = focusHistory.slice(0, 50);
    
    saveUserData(); // 每次获得鱼干都保存
}

function updateFishDisplay() {
    fishTotalDisplay.textContent = fishCount;
}

// 历史记录弹窗
function showHistory() {
    historyList.innerHTML = '';
    if (focusHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-msg">还没有记录喵，开始第一个番茄钟吧！</p>';
    } else {
        focusHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span>${item.type} 🐟</span>
                <span class="history-date">${item.date}</span>
            `;
            historyList.appendChild(div);
        });
    }
    historyModal.classList.remove('hidden');
}

// 显示奖励
async function showReward() {
    rewardImg.src = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4Z3R4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3oriO0OEd9QIDdllqo/giphy.gif'; // 加载中占位
    
    try {
        // 使用 TheCatAPI 获取随机猫咪
        const response = await fetch('https://api.thecatapi.com/v1/images/search');
        const data = await response.json();
        rewardImg.src = data[0].url;
    } catch (error) {
        console.error('获取猫咪失败', error);
        rewardImg.src = 'https://cdn2.thecatapi.com/images/MTY3MDUxNg.jpg'; // 备用图
    }
    
    rewardModal.classList.remove('hidden');
}

// 关闭奖励
closeRewardBtn.onclick = () => {
    rewardModal.classList.add('hidden');
};

viewHistoryBtn.onclick = showHistory;
closeHistoryBtn.onclick = () => historyModal.classList.add('hidden');

// 白噪音切换
noiseBtns.forEach(btn => {
    btn.onclick = () => {
        const noise = btn.dataset.noise;
        
        // 如果点击的是当前已激活的按钮，则不做处理
        if (btn.classList.contains('active') && noise !== 'none') return;

        // 更新 UI
        noiseBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 处理音频
        if (noise === 'none') {
            noiseAudio.pause();
            noiseAudio.src = '';
        } else {
            // 先停止当前音频，更换源后再播放
            noiseAudio.pause();
            noiseAudio.src = noiseSources[noise];
            noiseAudio.load(); // 强制重新加载
            
            const playPromise = noiseAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('音频播放失败:', error);
                    // 提示用户需要交互
                    if (error.name === 'NotAllowedError') {
                        alert('由于浏览器限制，请先点击页面任意位置或开始按钮后再开启白噪音喵~');
                    }
                });
            }
        }
    };
});

// 添加键盘控制
document.addEventListener('keydown', (e) => {
    // 只有当没有弹出奖励窗口时才响应快捷键
    if (!rewardModal.classList.contains('hidden')) return;

    // 空格键：开始/暂停
    if (e.code === 'Space') {
        e.preventDefault(); // 防止空格键导致页面滚动
        if (timerId) {
            pauseTimer();
        } else {
            startTimer();
        }
    }
    
    // R 键：重置
    if (e.key.toLowerCase() === 'r') {
        resetTimer();
    }
    
    // M 键：静音切换 (可选添加)
    if (e.key.toLowerCase() === 'm') {
        toggleMute();
    }
});

// 初始化
startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;
timerCard.classList.add('rest');
mainCatImg.src = 'assets/cat-rest.png'; // 初始显示休息图
statusBadge.textContent = '休息中...';
statusBadge.style.background = '#fad0c4';
initAccount();
updateDisplay();
