// State Matrix
let tasks = JSON.parse(localStorage.getItem('advanced_tasks')) || [];

// DOM Links
const todoInput = document.getElementById('todo-input');
const todoTime = document.getElementById('todo-time');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');
const liveClock = document.getElementById('live-clock');
const notiBtn = document.getElementById('noti-btn');

// Counters Elements
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');

// --- 1. LIVE DIGITAL DASH CLOCK ---
function updateClock() {
    const now = new Date();
    liveClock.innerText = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// --- 2. NOTIFICATIONS CONFIG ---
notiBtn.addEventListener('click', () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('Notifications Activated! 🚀');
                notiBtn.style.display = 'none';
            }
        });
    }
});
if (window.Notification && Notification.permission === 'granted') {
    notiBtn.style.display = 'none';
}

// --- 3. SYNTHETIC AUDIO ENGINE ---
function soundBuzzer() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, audioCtx.currentTime); 
    gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    
    setTimeout(() => {
        osc.stop();
        audioCtx.close();
    }, 1500);
}

// --- 4. ENGINE CORE LOOP (Alarm Checker) ---
setInterval(() => {
    const now = new Date();
    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    const timeNow = `${currentH}:${currentM}`;

    let updated = false;

    tasks.forEach(task => {
        if (task.deadline && task.deadline === timeNow && !task.completed && !task.triggered) {
            task.triggered = true;
            updated = true;
            
            // Fire System Notification
            soundBuzzer();
            if (window.Notification && Notification.permission === 'granted') {
                new Notification("⏳ Task Deadline Hit!", {
                    body: `Time up for: "${task.text}"`,
                    icon: "https://cdn-icons-png.flaticon.com/512/1827/1827347.png"
                });
            } else {
                alert(`⏳ DEADLINE ALERT:\n\nTime to check: "${task.text}"`);
            }
        }
    });

    if (updated) {
        saveAndRender();
    }
}, 1000);

// --- 5. DATA OPERATIONS ---
addTodoBtn.addEventListener('click', createTask);
todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') createTask(); });

function createTask() {
    const title = todoInput.value.trim();
    if (!title) return alert('Task description cant be empty!');

    const deadlineVal = todoTime.value || null;

    const taskObj = {
        id: Date.now(),
        text: title,
        deadline: deadlineVal,
        completed: false,
        triggered: false
    };

    tasks.push(taskObj);
    todoInput.value = '';
    todoTime.value = '';
    saveAndRender();
}

window.toggleTaskStatus = function(id) {
    tasks = tasks.map(t => {
        if (t.id === id) t.completed = !t.completed;
        return t;
    });
    saveAndRender();
};

window.removeTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
};

function calculateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    statTotal.innerText = total;
    statPending.innerText = pending;
    statCompleted.innerText = completed;
}

function renderMatrix() {
    todoList.innerHTML = '';
    
    // Sort tasks: pending ones on top
    const sortedTasks = [...tasks].sort((a,b) => a.completed - b.completed);

    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;

        // Setup custom badge based on deadline rules
        let badgeHtml = `<span class="badge badge-none">No Deadline</span>`;
        if (task.deadline) {
            if (task.triggered && !task.completed) {
                badgeHtml = `<span class="badge badge-alert">⏰ Overdue (${task.deadline})</span>`;
            } else {
                badgeHtml = `<span class="badge badge-time">⏳ Target: ${task.deadline}</span>`;
            }
        }

        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTaskStatus(${task.id})">
            <div class="task-core">
                <span class="task-text">${task.text}</span>
                ${badgeHtml}
            </div>
            <button class="btn-delete" onclick="removeTask(${task.id})">🗑️</button>
        `;
        todoList.appendChild(li);
    });
}

function saveAndRender() {
    localStorage.setItem('advanced_tasks', JSON.stringify(tasks));
    calculateStats();
    renderMatrix();
}

// Initial Boot
calculateStats();
renderMatrix();
