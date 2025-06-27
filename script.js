// Enhanced Mood Tracker App Script
// Dynamic features and interactions

// --- Global Variables ---
let selectedMood = null;
let currentStreak = 0;
let moodHistory = [];
let sleepHistory = [];
let moodOptions = [];
let selectedMoodChange = null;

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    renderCharts();
    updateStats();
    startQuoteRotation();
    loadTodayData();
});

// --- App Initialization ---
function initializeApp() {
    loadData();
    updateCurrentDate();
    checkStreak();
}

function updateCurrentDate() {
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Add date display to welcome section
    const welcomeSection = document.querySelector('.welcome-section .card');
    const dateElement = document.createElement('p');
    dateElement.className = 'current-date';
    dateElement.innerHTML = `<i class="fas fa-calendar"></i> ${dateString}`;
    dateElement.style.cssText = 'margin-top: 16px; font-size: 0.9rem; opacity: 0.8;';
    welcomeSection.appendChild(dateElement);
}

// --- Enhanced Event Listeners ---
function setupEventListeners() {
    // Mood selection with animation
    moodOptions = document.querySelectorAll('.mood-option');
    moodOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectMood(option);
        });
        
        // Add hover effects
        option.addEventListener('mouseenter', () => {
            option.style.transform = 'scale(1.1) rotate(2deg)';
        });
        
        option.addEventListener('mouseleave', () => {
            if (!option.classList.contains('selected')) {
                option.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });

    // Enhanced save buttons
    document.getElementById('saveMood').addEventListener('click', saveMoodWithAnimation);
    document.getElementById('saveSleep').addEventListener('click', saveSleepWithAnimation);
    document.getElementById('saveNotes').addEventListener('click', saveNotesWithAnimation);
    
    // Notes character counter
    const notesTextarea = document.getElementById('dailyNotes');
    notesTextarea.addEventListener('input', updateCharacterCount);
    
    // Mood change modal events
    setupMoodChangeModal();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// --- Notes Functionality ---
function updateCharacterCount() {
    const textarea = document.getElementById('dailyNotes');
    const counter = document.getElementById('charCount');
    const currentLength = textarea.value.length;
    const maxLength = 500;
    
    counter.textContent = currentLength;
    
    if (currentLength > maxLength * 0.9) {
        counter.style.color = '#FFC107';
    } else {
        counter.style.color = '#6B4EF6';
    }
    
    if (currentLength > maxLength) {
        counter.style.color = '#EF9A9A';
        textarea.value = textarea.value.substring(0, maxLength);
        counter.textContent = maxLength;
    }
}

function saveNotesWithAnimation() {
    const notes = document.getElementById('dailyNotes').value.trim();
    
    const button = document.getElementById('saveNotes');
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    button.disabled = true;
    
    setTimeout(() => {
        saveData('notes', notes);
        showMessage('Notes saved successfully! 📝', 'success');
        button.innerHTML = '<i class="fas fa-check"></i> Saved!';
        
        setTimeout(() => {
            button.innerHTML = 'Save Notes';
            button.disabled = false;
        }, 2000);
        
        updateStats();
    }, 1000);
}

// --- Mood Change Modal ---
function setupMoodChangeModal() {
    // Add change mood button to stats section
    const statsSection = document.querySelector('.stats-section .card');
    const changeMoodBtn = document.createElement('button');
    changeMoodBtn.className = 'change-mood-btn';
    changeMoodBtn.innerHTML = '<i class="fas fa-edit"></i> Change Mood';
    changeMoodBtn.addEventListener('click', openMoodChangeModal);
    statsSection.style.position = 'relative';
    statsSection.appendChild(changeMoodBtn);
    
    // Mood change options
    const moodChangeOptions = document.querySelectorAll('.mood-change-option');
    moodChangeOptions.forEach(option => {
        option.addEventListener('click', () => {
            moodChangeOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedMoodChange = option.getAttribute('data-mood');
        });
    });
    
    // Confirm mood change
    document.getElementById('confirmMoodChange').addEventListener('click', confirmMoodChange);
}

function openMoodChangeModal() {
    const modal = document.getElementById('moodChangeModal');
    modal.classList.add('show');
    
    // Load current mood if exists
    const today = new Date().toISOString().slice(0, 10);
    const data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    const currentMood = data[today]?.mood;
    
    if (currentMood) {
        const currentOption = document.querySelector(`.mood-change-option[data-mood="${currentMood}"]`);
        if (currentOption) {
            currentOption.classList.add('selected');
            selectedMoodChange = currentMood;
        }
    }
}

function closeMoodChangeModal() {
    const modal = document.getElementById('moodChangeModal');
    modal.classList.remove('show');
    
    // Reset selections
    document.querySelectorAll('.mood-change-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('moodChangeNotes').value = '';
    selectedMoodChange = null;
}

function confirmMoodChange() {
    if (!selectedMoodChange) {
        showMessage('Please select a mood.', 'error');
        return;
    }
    
    const notes = document.getElementById('moodChangeNotes').value.trim();
    const today = new Date().toISOString().slice(0, 10);
    let data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    
    if (!data[today]) data[today] = {};
    
    // Save mood change with timestamp
    data[today].mood = selectedMoodChange;
    data[today].moodChangeTime = new Date().toISOString();
    if (notes) {
        data[today].moodChangeNotes = notes;
    }
    
    localStorage.setItem('moodTrackerData', JSON.stringify(data));
    
    showMessage('Mood updated successfully! 🎉', 'success');
    closeMoodChangeModal();
    
    // Update UI
    loadData();
    renderCharts();
    updateStats();
    
    // Update main mood selection if it's today
    const todayMoodOption = document.querySelector(`.mood-option[data-mood="${selectedMoodChange}"]`);
    if (todayMoodOption) {
        selectMood(todayMoodOption);
    }
}

// --- Load Today's Data ---
function loadTodayData() {
    const today = new Date().toISOString().slice(0, 10);
    const data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    const todayData = data[today];
    
    if (todayData) {
        // Load notes
        if (todayData.notes) {
            document.getElementById('dailyNotes').value = todayData.notes;
            updateCharacterCount();
        }
        
        // Load sleep
        if (todayData.sleep) {
            document.getElementById('sleepHours').value = todayData.sleep;
        }
        
        // Load mood
        if (todayData.mood) {
            const moodOption = document.querySelector(`.mood-option[data-mood="${todayData.mood}"]`);
            if (moodOption) {
                selectMood(moodOption);
            }
        }
    }
}

// --- Enhanced Mood Selection ---
function selectMood(option) {
    // Remove previous selection with animation
    moodOptions.forEach(opt => {
        opt.classList.remove('selected');
        opt.style.transform = 'scale(1) rotate(0deg)';
    });
    
    // Add new selection with animation
    option.classList.add('selected');
    option.style.transform = 'scale(1.1) rotate(2deg)';
    selectedMood = option.getAttribute('data-mood');
    
    // Add selection feedback
    showSelectionFeedback(option);
}

function showSelectionFeedback(option) {
    const feedback = document.createElement('div');
    feedback.className = 'selection-feedback';
    feedback.innerHTML = '✓ Selected!';
    feedback.style.cssText = `
        position: absolute;
        top: -10px;
        right: -10px;
        background: #6B4EF6;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        animation: fadeInOut 1s ease-in-out;
    `;
    
    option.style.position = 'relative';
    option.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 1000);
}

// --- Enhanced Save Functions ---
function saveMoodWithAnimation() {
    if (!selectedMood) {
        showMessage('Please select your mood.', 'error');
        return;
    }
    
    const button = document.getElementById('saveMood');
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    button.disabled = true;
    
    setTimeout(() => {
        saveData('mood', selectedMood);
        showMessage('Mood saved successfully! 🎉', 'success');
        button.innerHTML = '<i class="fas fa-check"></i> Saved!';
        
        setTimeout(() => {
            button.innerHTML = 'Save Mood';
            button.disabled = false;
        }, 2000);
        
        updateStats();
        renderCharts();
    }, 1000);
}

function saveSleepWithAnimation() {
    const hours = document.getElementById('sleepHours').value;
    if (!hours) {
        showMessage('Please select your sleep hours.', 'error');
        return;
    }
    
    const button = document.getElementById('saveSleep');
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    button.disabled = true;
    
    setTimeout(() => {
        saveData('sleep', hours);
        showMessage('Sleep data saved! 😴', 'success');
        button.innerHTML = '<i class="fas fa-check"></i> Saved!';
        
        setTimeout(() => {
            button.innerHTML = 'Save Sleep Data';
            button.disabled = false;
        }, 2000);
        
        updateStats();
        renderCharts();
    }, 1000);
}

// --- Enhanced Data Management ---
function saveData(type, value) {
    const today = new Date().toISOString().slice(0, 10);
    let data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    
    if (!data[today]) data[today] = {};
    data[today][type] = value;
    data[today].timestamp = new Date().toISOString();
    
    localStorage.setItem('moodTrackerData', JSON.stringify(data));
    loadData();
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    moodHistory = [];
    sleepHistory = [];
    
    Object.keys(data).forEach(date => {
        if (data[date].mood) {
            moodHistory.push({ date, mood: data[date].mood });
        }
        if (data[date].sleep) {
            sleepHistory.push({ date, sleep: data[date].sleep });
        }
    });
    
    moodHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    sleepHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// --- Enhanced Chart Rendering ---
function renderCharts() {
    renderMoodChart();
    renderSleepChart();
    renderMoodTrend();
}

function renderMoodChart() {
    const moodChart = document.getElementById('moodChart');
    moodChart.innerHTML = '';
    
    const days = getLast7Days();
    days.forEach((day, index) => {
        const mood = getMoodForDay(day);
        const color = getMoodColor(mood);
        const icon = getMoodIcon(mood);
        const height = mood ? '120px' : '30px';
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar mood-bar';
        bar.style.cssText = `
            height: ${height};
            background: ${color};
            animation: slideInUp 0.6s ease-out ${index * 0.1}s both;
        `;
        
        bar.innerHTML = `
            <div class="bar-content">
                <span class="mood-icon-small">${icon}</span>
                <span class="chart-bar-label">${day.slice(5)}</span>
            </div>
        `;
        
        bar.addEventListener('click', () => showDayDetails(day));
        moodChart.appendChild(bar);
    });
}

function renderSleepChart() {
    const sleepChart = document.getElementById('sleepChart');
    sleepChart.innerHTML = '';
    
    const days = getLast7Days();
    days.forEach((day, index) => {
        const hours = getSleepForDay(day);
        const height = getSleepHeight(hours);
        const color = getSleepColor(hours);
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar sleep-bar';
        bar.setAttribute('data-hours', hours || '');
        bar.style.cssText = `
            height: ${height};
            background: ${color};
            animation: slideInUp 0.6s ease-out ${index * 0.1}s both;
        `;
        
        bar.innerHTML = `
            <div class="bar-content">
                <span class="sleep-hours">${hours || '-'}</span>
                <span class="chart-bar-label">${day.slice(5)}</span>
            </div>
        `;
        
        bar.addEventListener('click', () => showDayDetails(day));
        sleepChart.appendChild(bar);
    });
}

function renderMoodTrend() {
    // Add mood trend visualization
    const trendContainer = document.createElement('div');
    trendContainer.className = 'mood-trend';
    trendContainer.innerHTML = `
        <h4>Mood Trend</h4>
        <div class="trend-line"></div>
    `;
    
    const statsSection = document.querySelector('.stats-section .card');
    statsSection.appendChild(trendContainer);
    
    // Create trend line
    const trendLine = trendContainer.querySelector('.trend-line');
    const recentMoods = moodHistory.slice(-7);
    
    if (recentMoods.length > 1) {
        const trend = calculateMoodTrend(recentMoods);
        trendLine.innerHTML = `
            <div class="trend-indicator ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}">
                <i class="fas fa-${trend > 0 ? 'arrow-up' : trend < 0 ? 'arrow-down' : 'minus'}"></i>
                ${Math.abs(trend)}% ${trend > 0 ? 'improvement' : trend < 0 ? 'decline' : 'stable'}
            </div>
        `;
    }
}

// --- Enhanced Statistics ---
function updateStats() {
    updateStreak();
    updateAverages();
    updateInsights();
}

function updateStreak() {
    checkStreak();
    const streakElement = document.createElement('div');
    streakElement.className = 'streak-display';
    streakElement.innerHTML = `
        <i class="fas fa-fire"></i>
        <span>${currentStreak} day${currentStreak !== 1 ? 's' : ''} streak!</span>
    `;
    
    // Add to welcome section
    const welcomeSection = document.querySelector('.welcome-section .card');
    const existingStreak = welcomeSection.querySelector('.streak-display');
    if (existingStreak) existingStreak.remove();
    welcomeSection.appendChild(streakElement);
}

function updateAverages() {
    if (moodHistory.length > 0) {
        const avgMood = calculateAverageMood();
        const avgSleep = calculateAverageSleep();
        
        // Add averages to stats section
        const statsSection = document.querySelector('.stats-section .card');
        const averagesDiv = document.createElement('div');
        averagesDiv.className = 'averages';
        averagesDiv.innerHTML = `
            <div class="average-item">
                <span class="average-label">Avg Mood:</span>
                <span class="average-value">${avgMood}</span>
            </div>
            <div class="average-item">
                <span class="average-label">Avg Sleep:</span>
                <span class="average-value">${avgSleep}h</span>
            </div>
        `;
        
        const existingAverages = statsSection.querySelector('.averages');
        if (existingAverages) existingAverages.remove();
        statsSection.appendChild(averagesDiv);
    }
}

function updateInsights() {
    const insights = generateInsights();
    if (insights.length > 0) {
        const insightsDiv = document.createElement('div');
        insightsDiv.className = 'insights';
        insightsDiv.innerHTML = `
            <h4>💡 Insights</h4>
            <ul>
                ${insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
        `;
        
        const statsSection = document.querySelector('.stats-section .card');
        const existingInsights = statsSection.querySelector('.insights');
        if (existingInsights) existingInsights.remove();
        statsSection.appendChild(insightsDiv);
    }
}

// --- Helper Functions ---
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

function getMoodForDay(date) {
    const data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    return data[date]?.mood;
}

function getSleepForDay(date) {
    const data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    return data[date]?.sleep;
}

function getMoodColor(mood) {
    switch (mood) {
        case 'very_happy': return '#FFC107';
        case 'happy': return '#81C784';
        case 'neutral': return '#90CAF9';
        case 'sad': return '#FFAB91';
        case 'very_sad': return '#EF9A9A';
        default: return '#404040';
    }
}

function getMoodIcon(mood) {
    switch (mood) {
        case 'very_happy': return '😊';
        case 'happy': return '😀';
        case 'neutral': return '🙂';
        case 'sad': return '🙁';
        case 'very_sad': return '😞';
        default: return '❓';
    }
}

function getSleepColor(hours) {
    switch (hours) {
        case '9+': return '#90CAF9';
        case '7-8': return '#81C784';
        case '5-6': return '#FFD700';
        case '3-4': return '#FFAB91';
        case '0-2': return '#EF9A9A';
        default: return '#404040';
    }
}

function getSleepHeight(hours) {
    switch (hours) {
        case '9+': return '160px';
        case '7-8': return '120px';
        case '5-6': return '80px';
        case '3-4': return '50px';
        case '0-2': return '30px';
        default: return '20px';
    }
}

function checkStreak() {
    const data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    const dates = Object.keys(data).sort();
    currentStreak = 0;
    
    for (let i = dates.length - 1; i >= 0; i--) {
        const date = new Date(dates[i]);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - (dates.length - 1 - i));
        
        if (date.toDateString() === expectedDate.toDateString() && data[dates[i]].mood) {
            currentStreak++;
        } else {
            break;
        }
    }
}

function calculateMoodTrend(moods) {
    if (moods.length < 2) return 0;
    
    const moodValues = {
        'very_sad': 1, 'sad': 2, 'neutral': 3, 'happy': 4, 'very_happy': 5
    };
    
    const firstHalf = moods.slice(0, Math.ceil(moods.length / 2));
    const secondHalf = moods.slice(Math.ceil(moods.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + moodValues[m.mood], 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + moodValues[m.mood], 0) / secondHalf.length;
    
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

function calculateAverageMood() {
    const moodValues = {
        'very_sad': 1, 'sad': 2, 'neutral': 3, 'happy': 4, 'very_happy': 5
    };
    
    const avg = moodHistory.reduce((sum, m) => sum + moodValues[m.mood], 0) / moodHistory.length;
    const moodNames = ['Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy'];
    return moodNames[Math.round(avg) - 1] || 'Neutral';
}

function calculateAverageSleep() {
    const sleepValues = {
        '0-2': 1, '3-4': 3.5, '5-6': 5.5, '7-8': 7.5, '9+': 9.5
    };
    
    const avg = sleepHistory.reduce((sum, s) => sum + sleepValues[s.sleep], 0) / sleepHistory.length;
    return Math.round(avg * 10) / 10;
}

function generateInsights() {
    const insights = [];
    
    if (moodHistory.length > 0) {
        const recentMoods = moodHistory.slice(-3);
        const positiveMoods = recentMoods.filter(m => ['happy', 'very_happy'].includes(m.mood));
        
        if (positiveMoods.length >= 2) {
            insights.push('Great mood streak! Keep it up! 🌟');
        }
        
        if (sleepHistory.length > 0) {
            const recentSleep = sleepHistory.slice(-3);
            const goodSleep = recentSleep.filter(s => ['7-8', '9+'].includes(s.sleep));
            
            if (goodSleep.length >= 2) {
                insights.push('Consistent good sleep patterns detected! 😴');
            }
        }
    }
    
    if (currentStreak > 3) {
        insights.push(`Amazing ${currentStreak}-day tracking streak! 🔥`);
    }
    
    return insights;
}

// --- Interactive Features ---
function showDayDetails(date) {
    const data = JSON.parse(localStorage.getItem('moodTrackerData') || '{}');
    const dayData = data[date];
    
    if (dayData) {
        const modal = document.createElement('div');
        modal.className = 'day-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${new Date(date).toLocaleDateString()}</h3>
                <div class="day-details">
                    <p><strong>Mood:</strong> ${dayData.mood ? getMoodIcon(dayData.mood) + ' ' + dayData.mood.replace('_', ' ') : 'Not recorded'}</p>
                    <p><strong>Sleep:</strong> ${dayData.sleep ? dayData.sleep + ' hours' : 'Not recorded'}</p>
                    ${dayData.notes ? `<p><strong>Notes:</strong> ${dayData.notes}</p>` : ''}
                    ${dayData.moodChangeNotes ? `<p><strong>Mood Change Note:</strong> ${dayData.moodChangeNotes}</p>` : ''}
                </div>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

// --- Keyboard Shortcuts ---
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1': case '2': case '3': case '4': case '5':
                const moodIndex = parseInt(e.key) - 1;
                const moodOptions = ['very_happy', 'happy', 'neutral', 'sad', 'very_sad'];
                const moodOption = document.querySelector(`[data-mood="${moodOptions[moodIndex]}"]`);
                if (moodOption) selectMood(moodOption);
                break;
        }
    }
}

// --- Quote Rotation ---
function startQuoteRotation() {
    const quotes = [
        "Every day is a new beginning. Take a deep breath and start again.",
        "Your mood is a choice. Choose wisely.",
        "Small progress is still progress.",
        "You are stronger than you think.",
        "Today's mood is tomorrow's memory."
    ];
    
    const quoteElement = document.getElementById('dailyQuote');
    let currentIndex = 0;
    
    setInterval(() => {
        quoteElement.style.opacity = '0';
        setTimeout(() => {
            quoteElement.textContent = quotes[currentIndex];
            quoteElement.style.opacity = '1';
            currentIndex = (currentIndex + 1) % quotes.length;
        }, 500);
    }, 10000);
}

// --- Enhanced Message Display ---
function showMessage(msg, type) {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${msg}
    `;
    
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => message.remove(), 300);
    }, 3000);
} 