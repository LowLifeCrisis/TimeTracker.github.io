/* ============================================================
   TIMECRAFT — app.js
   All timer logic, persistence, and DOM rendering.
   No dependencies. Uses localStorage for session storage.
   ============================================================ */

(function () {

  // ── Constants ──────────────────────────────────────────────
  const STORAGE_KEY  = 'timecraft-sessions-v1';
  const MAX_SESSIONS = 100;
  const LOG_DISPLAY  = 30;
  const XP_PER_MIN   = 1;       // 1 XP per minute tracked
  const XP_PER_LEVEL = 60;      // 60 XP to level up

  const LEVELS = [
    'RECRUIT', 'INITIATE', 'OPERATIVE', 'AGENT',   'SPECIALIST',
    'VETERAN', 'ELITE',    'COMMANDER', 'LEGEND',   'MYTHIC'
  ];

  // ── State ───────────────────────────────────────────────────
  let sessions = [];
  let running  = false;
  let paused   = false;
  let elapsed  = 0;      // ms tracked so far this session
  let startRef = null;   // Date.now() reference for current run
  let interval = null;

  // ── DOM refs ────────────────────────────────────────────────
  const display      = document.getElementById('timer-display');
  const statusLabel  = document.getElementById('timer-status-label');
  const taskDisplay  = document.getElementById('task-display');
  const taskInput    = document.getElementById('task-input');
  const taskLabel    = document.getElementById('task-label');
  const btnStart     = document.getElementById('btn-start');
  const btnPause     = document.getElementById('btn-pause');
  const btnCommit    = document.getElementById('btn-commit');
  const logList      = document.getElementById('log-list');
  const statToday    = document.getElementById('stat-today');
  const statSessions = document.getElementById('stat-sessions');
  const statXp       = document.getElementById('stat-xp');
  const statTotal    = document.getElementById('stat-total');
  const xpFillEl     = document.getElementById('xp-fill');
  const xpPctEl      = document.getElementById('xp-pct');
  const levelBadge   = document.getElementById('level-badge');
  const clearBtn     = document.getElementById('clear-log');

  // ── Helpers ─────────────────────────────────────────────────
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /** Format milliseconds as HH:MM:SS */
  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return pad(Math.floor(s / 3600)) + ':' +
           pad(Math.floor((s % 3600) / 60)) + ':' +
           pad(s % 60);
  }

  /** Format milliseconds as a short human string, e.g. "1h 4m" or "35s" */
  function fmtShort(ms) {
    const s   = Math.floor(ms / 1000);
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + sec + 's';
    return sec + 's';
  }

  /** Format ISO timestamp as HH:MM */
  function fmtDate(iso) {
    const d = new Date(iso);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /** Escape HTML special characters to prevent XSS in task names */
  function escHtml(t) {
    return t
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Persistence ─────────────────────────────────────────────
  function loadSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) sessions = JSON.parse(raw);
    } catch (e) {
      sessions = [];
    }
  }

  function saveSessions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('TIMECRAFT: could not save to localStorage', e);
    }
  }

  // ── Timer ────────────────────────────────────────────────────
  function tick() {
    elapsed = Date.now() - startRef;
    display.textContent = fmtTime(elapsed);
  }

  function startTimer() {
    const task = taskInput.value.trim() || 'Unnamed Mission';

    startRef = Date.now() - elapsed;   // resume from current elapsed if any
    running  = true;
    paused   = false;

    clearInterval(interval);
    interval = setInterval(tick, 100);

    display.classList.remove('stopped', 'paused');
    statusLabel.textContent = '● RECORDING';
    statusLabel.classList.add('tc-pulse');
    taskDisplay.textContent = '> ' + task;

    btnStart.disabled  = true;
    btnPause.disabled  = false;
    btnCommit.disabled = false;
    taskInput.disabled = true;
  }

  function pauseTimer() {
    if (paused) {
      // ── Resume ──
      startRef = Date.now() - elapsed;
      running  = true;
      paused   = false;

      clearInterval(interval);
      interval = setInterval(tick, 100);

      display.classList.remove('paused');
      statusLabel.textContent = '● RECORDING';
      statusLabel.classList.add('tc-pulse');
      btnPause.textContent = '[ PAUSE ]';
    } else {
      // ── Pause ──
      clearInterval(interval);
      running = false;
      paused  = true;

      display.classList.add('paused');
      statusLabel.textContent = '⏸ PAUSED';
      statusLabel.classList.remove('tc-pulse');
      btnPause.textContent = '[ RESUME ]';
    }
  }

  function commitTimer() {
    if (elapsed < 500) return;   // ignore accidental clicks under 0.5s
    clearInterval(interval);

    const session = {
      id:        Date.now(),
      task:      taskInput.value.trim() || 'Unnamed Mission',
      duration:  elapsed,
      timestamp: new Date().toISOString(),
      category: taskLabel.value
    };

    sessions.unshift(session);
    if (sessions.length > MAX_SESSIONS) sessions = sessions.slice(0, MAX_SESSIONS);
    saveSessions();

    // Reset all state
    running = false;
    paused  = false;
    elapsed = 0;

    display.textContent = '00:00:00';
    display.classList.add('stopped');
    display.classList.remove('paused');

    statusLabel.textContent = '✓ COMMITTED';
    statusLabel.classList.remove('tc-pulse');

    taskDisplay.textContent = '';
    taskInput.value         = '';
    taskInput.disabled      = false;

    btnStart.disabled        = false;
    btnPause.disabled        = true;
    btnPause.textContent     = '[ PAUSE ]';
    btnCommit.disabled       = true;

    renderStats();
    renderLog();

    // Revert status label after a moment
    setTimeout(() => { if (!running) statusLabel.textContent = 'STANDBY'; }, 1500);
  }

  // ── Log management ───────────────────────────────────────────
  function deleteSession(id) {
    sessions = sessions.filter(s => s.id !== id);
    saveSessions();
    renderStats();
    renderLog();
  }

  function clearAll() {
    if (running) return;   // don't nuke while a session is active
    sessions = [];
    saveSessions();
    renderStats();
    renderLog();
  }

  // ── Render ───────────────────────────────────────────────────
  function renderStats() {
    const today   = new Date().toDateString();
    const todayMs = sessions
      .filter(s => new Date(s.timestamp).toDateString() === today)
      .reduce((a, s) => a + s.duration, 0);
    const totalMs = sessions.reduce((a, s) => a + s.duration, 0);

    const xp       = Math.floor(totalMs / 60000) * XP_PER_MIN;
    const levelIdx = Math.min(Math.floor(xp / XP_PER_LEVEL), LEVELS.length - 1);
    const xpInLvl  = xp % XP_PER_LEVEL;
    const pct      = Math.round((xpInLvl / XP_PER_LEVEL) * 100);

    statToday.textContent    = fmtShort(todayMs);
    statSessions.textContent = sessions.length;
    statXp.textContent       = xp + ' XP';
    statTotal.textContent    = fmtShort(totalMs);

    xpFillEl.style.width   = pct + '%';
    xpPctEl.textContent    = xpInLvl + ' / ' + XP_PER_LEVEL + ' XP';
    levelBadge.textContent = 'LVL ' + (levelIdx + 1) + ' // ' + LEVELS[levelIdx];
  }

  function renderLog() {
    if (sessions.length === 0) {
      logList.innerHTML = '<div class="tc-empty">NO MISSIONS LOGGED YET</div>';
      return;
    }

    logList.innerHTML = sessions.slice(0, LOG_DISPLAY).map(s => `
      <div class="tc-log-item">
        <span class="tc-log-task">${escHtml(s.task)}</span>
        <span class="tc-log-time">${fmtDate(s.timestamp)}</span>
        <span class="tc-log-dur">${fmtShort(s.duration)}</span>
        <span class="tc-log-tag"> ${s.category}</span>
        <button class="tc-log-del" data-id="${s.id}">[ X ]</button>
      </div>
    `).join('');

    logList.querySelectorAll('.tc-log-del').forEach(el => {
      el.addEventListener('click', () => deleteSession(Number(el.dataset.id)));
    });
  }

  // ── Event listeners ──────────────────────────────────────────
  btnStart.addEventListener('click', startTimer);
  btnPause.addEventListener('click', pauseTimer);
  btnCommit.addEventListener('click', commitTimer);
  clearBtn.addEventListener('click', clearAll);

  // Allow pressing Enter in the input to start the timer
  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !running) startTimer();
  });

  // ── Init ─────────────────────────────────────────────────────
  loadSessions();
  renderStats();
  renderLog();

})();
