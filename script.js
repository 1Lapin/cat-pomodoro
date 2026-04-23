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
const noiseBtns = document.querySelectorAll('.noise-btn');
const noiseAudio = document.getElementById('noise-audio');
const alertAudio = document.getElementById('alert-audio');
const rewardModal = document.getElementById('reward-modal');
const rewardImg = document.getElementById('reward-img');
const closeRewardBtn = document.getElementById('close-reward');
const volumeSlider = document.getElementById('volume-slider');

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
};

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
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // 更新 UI 状态
    timerCard.classList.add('focus');
    timerCard.classList.remove('rest');
    statusBadge.textContent = '工作中...';
    statusBadge.style.background = '#ff9a9e';
    
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
    }, 100); // 更加频繁地检查以保证平滑
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
    statusBadge.textContent = '休息中...';
    statusBadge.style.background = '#fad0c4';
}

// 重置计时器
function resetTimer() {
    pauseTimer();
    isWorking = true;
    timeLeft = 25 * 60;
    updateDisplay();
}

// 处理会话完成
function handleSessionComplete() {
    alertAudio.play();
    
    // 停止计时，进入休息状态
    timerCard.classList.remove('focus');
    timerCard.classList.add('rest');
    statusBadge.textContent = '休息中...';
    statusBadge.style.background = '#fad0c4';

    if (isWorking) {
        // 工作结束，给奖励并休息
        showReward();
        isWorking = false;
        timeLeft = 1 * 60; // 1分钟休息
    } else {
        // 休息结束，回到工作
        isWorking = true;
        timeLeft = 25 * 60;
        alert('休息结束，开始新的专注吧！');
    }
    
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
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

// 添加空格键控制：按空格开始/暂停
document.addEventListener('keydown', (e) => {
    // 只有当没有弹出奖励窗口时才响应空格
    if (e.code === 'Space' && rewardModal.classList.contains('hidden')) {
        e.preventDefault(); // 防止空格键导致页面滚动
        if (timerId) {
            pauseTimer();
        } else {
            startTimer();
        }
    }
});

// 初始化
startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;
timerCard.classList.add('rest');
statusBadge.textContent = '休息中...';
statusBadge.style.background = '#fad0c4';
updateDisplay();
