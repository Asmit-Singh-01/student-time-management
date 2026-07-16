// Global State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let alarms = JSON.parse(localStorage.getItem('alarms')) || [];

// DOM Elements
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');
const alarmTime = document.getElementById('alarm-time');
const alarmLabel = document.getElementById('alarm-label');
const setAlarmBtn = document.getElementById('set-alarm-btn');
const activeAlarmsContainer = document.getElementById('active-alarms');
const notiBtn = document.getElementById('noti-btn');

// --- NOTIFICATION HANDLER ---
notiBtn.addEventListener('click', () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('Notifications Enabled! 🎉');
                notiBtn.style.display = 'none';
            }
        });
    } else {
        alert('Your browser does not support notifications.');
    }
});

if (window.Notification && Notification.permission === 'granted') {
    notiBtn.style.display = 'none';
}

// --- ALARM SYSTEM (Using Web Audio API for synthetic Buzzer) ---
function playAlarmSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    
    // Stop sound after 2 seconds
    setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
    }, 2000);
}

function triggerAlarmNotification(label) {
    playAlarmSound();
    if (window.Notification && Notification.permission === 'granted') {
        new Notification("⏰ Alarm Reminder!", {
            body: label || "Time to focus on your task!",
            icon: "https://cdn-icons-png.flaticon.com/512/1827/1827347.png"
        });
    } else {
        alert(`⏰ ALARM: ${label || "Time's up!"}`);
    }
}

// Check Alarms every second
setInterval(() => {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeString = `${currentHours}:${currentMinutes}`;

    alarms.forEach((alarm, index) => {
        if (alarm.time === currentTimeString && !alarm.triggered) {
            triggerAlarmNotification(alarm.label);
            alarm.triggered = true;
            
            // Remove triggered alarm from list after execution
            setTimeout(() => {
                alarms.splice(index, 1);
                updateAlarmsUI();
                saveAlarms();
            }, 5000);
        }
    });
}, 1000);

// Set Alarm Logic
setAlarmBtn.addEventListener('click', () => {
    const timeValue = alarmTime.value;
    const labelValue = alarmLabel.value.trim();

    if (!timeValue) return alert('Please select a time!');

    const newAlarm = {
        id: Date.now(),
        time: timeValue,
        label: labelValue || 'Reminder',
        triggered: false
    };

    alarms.push(newAlarm);
    saveAlarms();
    updateAlarmsUI();
    
    alarmTime.value = '';
    alarmLabel.value = '';
});

function deleteAlarm(id) {
    alarms = alarms.filter(alarm => alarm.id !== id);
    saveAlarms();
    updateAlarmsUI();
}

function updateAlarmsUI() {
    activeAlarmsContainer.innerHTML = '';
    alarms.forEach(alarm => {
        const div = document.createElement('div');
        div.className = 'alarm-item';
        div.innerHTML = `
            <span>🔔 <b>${alarm.time}</b> - ${alarm.label}</span>
            <button class="btn-delete" onclick="deleteAlarm(${alarm.id})">❌</button>
        `;
        activeAlarmsContainer.appendChild(div);
    });
}

function saveAlarms() {
    localStorage.setItem('alarms', JSON.stringify(alarms));
}

// --- TO-DO LIST SYSTEM ---
addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    todoInput.value = '';
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) task.completed = !task.completed;
        return task;
    });
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function renderTasks() {
    todoList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})">
            <span class="todo-text" onclick="toggleTask(${task.id})">${task.text}</span>
            <button class="btn-delete" onclick="deleteTask(${task.id})">❌</button>
        `;
        todoList.appendChild(li);
    });
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Initial Render on Page Load
renderTasks();
updateAlarmsUI();
      
