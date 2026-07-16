// State Engine
let currentUser = localStorage.getItem('os_user') || null;
let tasks = JSON.parse(localStorage.getItem('os_tasks')) || [];
let attendance = JSON.parse(localStorage.getItem('os_attendance')) || [];
let habits = JSON.parse(localStorage.getItem('os_habits')) || { wake: false, exercise: false, read: false, water: false, streak: 0 };
let notes = JSON.parse(localStorage.getItem('os_notes')) || [];

// Auth Nodes
const authScreen = document.getElementById('auth-screen');
const appContent = document.getElementById('app-content');
const authUsername = document.getElementById('auth-username');
const authPassword = document.getElementById('auth-password');
const authBtn = document.getElementById('auth-btn');
const logoutBtn = document.getElementById('logout-btn');
const userDisplayName = document.getElementById('user-display-name');

// Navigation Tabs Setup
const navItems = document.querySelectorAll('.nav-item');
const tabPanels = document.querySelectorAll('.tab-panel');

// Clock Nodes
const indianClock = document.getElementById('indian-clock');
const liveDate = document.getElementById('live-date');

// Task Nodes
const btnAddTask = document.getElementById('btn-add-task');
const taskTitle = document.getElementById('task-title');
const taskPriority = document.getElementById('task-priority');
const taskDeadline = document.getElementById('task-deadline');
const taskSubject = document.getElementById('task-subject');
const taskType = document.getElementById('task-type');
const taskMatrix = document.getElementById('task-matrix');
const searchBar = document.getElementById('search-bar');
const filterPriority = document.getElementById('filter-priority');

// Attendance Nodes
const btnAddSubject = document.getElementById('btn-add-subject');
const attSubject = document.getElementById('att-subject');
const attendanceList = document.getElementById('attendance-list');

// Notes System
const btnSaveNote = document.getElementById('btn-save-note');
const noteTitle = document.getElementById('note-title');
const noteBody = document.getElementById('note-body');
const notesShelf = document.getElementById('notes-shelf');

// Export Hub
const btnExportPdf = document.getElementById('btn-export-pdf');

// --- 1. LOCAL AUTH SYSTEM ---
function initAuth() {
    if (currentUser) {
        authScreen.classList.add('hidden');
        appContent.classList.remove('hidden');
        userDisplayName.innerText = currentUser;
        startApp();
    } else {
        authScreen.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
}

authBtn.addEventListener('click', () => {
    const user = authUsername.value.trim();
    const pass = authPassword.value.trim();
    if (!user || !pass) return alert('Enter credentials first!');
    
    // Save locally
    localStorage.setItem('os_user', user);
    currentUser = user;
    initAuth();
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('os_user');
    currentUser = null;
    initAuth();
});

// --- 2. 12-HOUR INDIAN SYSTEM CLOCK ---
function runClock() {
    const now = new Date();
    
    // Indian Localized Clock Formatting (12-hour after 12)
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    
    indianClock.innerText = `${hours}:${minutes}:${seconds} ${ampm}`;
    
    // Live Calendar Day
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    liveDate.innerText = now.toLocaleDateString('en-US', options);
}
setInterval(runClock, 1000);

// --- 3. TAB CONTROLLER ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        item.classList.add('active');
        const activeTabId = item.getAttribute('data-tab');
        document.getElementById(activeTabId).classList.add('active');
    });
});

// --- 4. LIGHT / DARK SWITCH ---
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', isDark ? 'light' : 'dark');
});

// --- 5. POMODORO COUNTER ---
let pomoTime = 1500;
let pomoInterval = null;
const pomoDisplay = document.getElementById('pomo-display');
const pomoStartBtn = document.getElementById('pomo-start');

pomoStartBtn.addEventListener('click', () => {
    if (pomoInterval) {
        clearInterval(pomoInterval);
        pomoInterval = null;
        pomoStartBtn.innerText = 'Start Focus';
        pomoStartBtn.className = 'btn-success';
    } else {
        pomoStartBtn.innerText = 'Pause';
        pomoStartBtn.className = 'btn-secondary';
        pomoInterval = setInterval(() => {
            if (pomoTime > 0) {
                pomoTime--;
                const min = String(Math.floor(pomoTime / 60)).padStart(2, '0');
                const sec = String(pomoTime % 60).padStart(2, '0');
                pomoDisplay.innerText = `${min}:${sec}`;
            } else {
                clearInterval(pomoInterval);
                pomoDisplay.innerText = "25:00";
                pomoTime = 1500;
                alert('Focus target complete! Time for a short break.');
            }
        }, 1000);
    }
});

document.getElementById('pomo-reset').addEventListener('click', () => {
    clearInterval(pomoInterval);
    pomoInterval = null;
    pomoTime = 1500;
    pomoDisplay.innerText = "25:00";
    pomoStartBtn.innerText = 'Start Focus';
    pomoStartBtn.className = 'btn-success';
});

// --- 6. TASK ENGINE AND SEARCH ---
btnAddTask.addEventListener('click', () => {
    const title = taskTitle.value.trim();
    if (!title) return alert('Please enter a task details!');

    const newTask = {
        id: Date.now(),
        text: title,
        priority: taskPriority.value,
        deadline: taskDeadline.value || 'No Target Time',
        subject: taskSubject.value.trim() || 'General',
        type: taskType.value,
        completed: false
    };

    tasks.push(newTask);
    taskTitle.value = '';
    taskSubject.value = '';
    taskDeadline.value = '';
    saveTasks();
    renderTasks();
});

window.toggleTask = function(id) {
    tasks = tasks.map(t => {
        if (t.id === id) t.completed = !t.completed;
        return t;
    });
    saveTasks();
    renderTasks();
};

window.deleteTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
};

function renderTasks() {
    taskMatrix.innerHTML = '';
    const query = searchBar.value.toLowerCase();
    const priorityFilter = filterPriority.value;

    const filtered = tasks.filter(t => {
        const matchesSearch = t.text.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query);
        const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    filtered.forEach(t => {
        const li = document.createElement('li');
        li.className = `task-item ${t.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="row" style="align-items: center;">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTask(${t.id})">
                <div class="task-info">
                    <h4>${t.text}</h4>
                    <p>📚 ${t.subject} | ⏰ ${t.deadline} | Priority: ${t.priority}</p>
                </div>
            </div>
            <button class="btn-danger-sm" onclick="deleteTask(${t.id})">Delete</button>
        `;
        taskMatrix.appendChild(li);
    });

    updateDashboardMetrics();
}

searchBar.addEventListener('input', renderTasks);
filterPriority.addEventListener('change', renderTasks);

function saveTasks() {
    localStorage.setItem('os_tasks', JSON.stringify(tasks));
}

// --- 7. HABIT MECHANISM ---
window.toggleHabit = function(habitKey) {
    habits[habitKey] = !habits[habitKey];
    
    // Auto calculate streak on daily complete
    if (habits.wake && habits.exercise && habits.read && habits.water) {
        habits.streak += 1;
    }
    
    localStorage.setItem('os_habits', JSON.stringify(habits));
    renderHabits();
    updateDashboardMetrics();
};

function renderHabits() {
    const keys = ['wake', 'exercise', 'read', 'water'];
    keys.forEach(k => {
        const el = document.querySelector(`[onclick="toggleHabit('${k}')"]`);
        if (habits[k]) {
            el.classList.add('checked');
        } else {
            el.classList.remove('checked');
        }
    });
}

// --- 8. ATTENDANCE METRIC BUILDER ---
btnAddSubject.addEventListener('click', () => {
    const name = attSubject.value.trim();
    if (!name) return alert('Enter a subject name!');

    attendance.push({
        id: Date.now(),
        name: name,
        present: 0,
        total: 0
    });

    attSubject.value = '';
    saveAttendance();
    renderAttendance();
});

window.markAttendance = function(id, isPresent) {
    attendance = attendance.map(a => {
        if (a.id === id) {
            a.total += 1;
            if (isPresent) a.present += 1;
        }
        return a;
    });
    saveAttendance();
    renderAttendance();
};

function renderAttendance() {
    attendanceList.innerHTML = '';
    attendance.forEach(a => {
        const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 100;
        const lowAlert = pct < 75 ? 'color: var(--danger); font-weight: bold;' : 'color: var(--success);';
        
        const li = document.createElement('li');
        li.className = 'att-row';
        li.innerHTML = `
            <div>
                <strong>${a.name}</strong>
                <p style="font-size: 0.8rem; ${lowAlert}">Attendance: ${pct}% (${a.present}/${a.total})</p>
                ${pct < 75 ? '<span style="font-size:0.65rem; color:var(--danger)">⚠️ Below 75%! Attendance Alert</span>' : ''}
            </div>
            <div class="att-buttons">
                <button class="btn-success" onclick="markAttendance(${a.id}, true)">✔️ P</button>
                <button class="btn-secondary" onclick="markAttendance(${a.id}, false)">❌ A</button>
            </div>
        `;
        attendanceList.appendChild(li);
    });
}

function saveAttendance() {
    localStorage.setItem('os_attendance', JSON.stringify(attendance));
}

// --- 9. NOTES STORAGE ---
btnSaveNote.addEventListener('click', () => {
    const title = noteTitle.value.trim();
    const body = noteBody.value.trim();
    if (!title || !body) return alert('Notes cannot be blank!');

    notes.push({ id: Date.now(), title, body });
    noteTitle.value = '';
    noteBody.value = '';
    saveNotes();
    renderNotes();
});

window.deleteNote = function(id) {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    renderNotes();
};

function renderNotes() {
    notesShelf.innerHTML = '';
    notes.forEach(n => {
        const div = document.createElement('div');
        div.className = 'note-item';
        div.innerHTML = `
            <span>📓 ${n.title}</span>
            <button class="btn-danger-sm" onclick="deleteNote(${n.id})">Delete</button>
        `;
        notesShelf.appendChild(div);
    });
}

function saveNotes() {
    localStorage.setItem('os_notes', JSON.stringify(notes));
}

// --- 10. GENERATE STATIC CALENDAR DIALS ---
function renderCalendar() {
    const calendarView = document.getElementById('calendar-view');
    calendarView.innerHTML = '';
    const today = new Date().getDate();

    for (let i = 1; i <= 30; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = `cal-day ${i === today ? 'today' : ''}`;
        dayDiv.innerText = i;
        calendarView.appendChild(dayDiv);
    }
}

// --- 11. METRIC UPDATE ROUTER ---
function updateDashboardMetrics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-streak').innerText = `${habits.streak} 🔥`;

    // Calculate Productivity Score
    let score = 0;
    if (total > 0) {
        score = Math.round((completed / total) * 100);
    }
    document.getElementById('prod-score').innerText = `${score}%`;

    // Dynamic Daily Goal tracker
    const goalFill = document.getElementById('goal-fill');
    const goalText = document.getElementById('goal-text');
    const pct = Math.min((completed / 3) * 100, 100);
    goalFill.style.width = `${pct}%`;
    goalText.innerText = `${completed}/3 Daily Target Solved`;
}

// --- 12. EXPORT AS PRINT REPORT ---
btnExportPdf.addEventListener('click', () => {
    window.print();
});

// Bootloader App Initializer
function startApp() {
    renderTasks();
    renderHabits();
    renderAttendance();
    renderNotes();
    renderCalendar();
    updateDashboardMetrics();
}

// Initialize Authentication Frame
initAuth();
    
