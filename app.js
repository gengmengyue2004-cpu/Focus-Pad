const widget = document.getElementById('widget');
const dragHandle = document.getElementById('dragHandle');
const expandButton = document.getElementById('expandButton');
const modeIndicator = document.getElementById('modeIndicator');
const focusViewButton = document.getElementById('focusViewButton');
const tasksViewButton = document.getElementById('tasksViewButton');
const focusView = document.getElementById('focusView');
const tasksView = document.getElementById('tasksView');
const curveButton = document.getElementById('curveButton');
const timeLabel = document.getElementById('timeLabel');
const statusLabel = document.getElementById('statusLabel');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const completeCurrentButton = document.getElementById('completeCurrentButton');
const currentTaskButton = document.getElementById('currentTaskButton');
const currentTaskName = document.getElementById('currentTaskName');
const currentTaskTime = document.getElementById('currentTaskTime');
const durationRow = document.getElementById('durationRow');
const taskStack = document.getElementById('taskStack');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const addTaskButton = document.getElementById('addTaskButton');
const queueCount = document.getElementById('queueCount');
const emptyQueue = document.getElementById('emptyQueue');
const taskHistory = document.getElementById('taskHistory');
const taskHistoryToggle = document.getElementById('taskHistoryToggle');
const taskHistoryCount = document.getElementById('taskHistoryCount');
const historyDialog = document.getElementById('historyDialog');
const historyDialogBackdrop = document.getElementById('historyDialogBackdrop');
const historyDialogClose = document.getElementById('historyDialogClose');
const historyDialogCount = document.getElementById('historyDialogCount');
const completedList = document.getElementById('completedList');
const completionToast = document.getElementById('completionToast');
const completionTime = document.getElementById('completionTime');
const onboardingLayer = document.getElementById('onboardingLayer');
const onboardingSpotlight = document.getElementById('onboardingSpotlight');
const onboardingCard = document.getElementById('onboardingCard');
const onboardingStep = document.getElementById('onboardingStep');
const onboardingTitle = document.getElementById('onboardingTitle');
const onboardingCopy = document.getElementById('onboardingCopy');
const onboardingNext = document.getElementById('onboardingNext');
const onboardingSkip = document.getElementById('onboardingSkip');
const trackPath = document.getElementById('trackPath');
const fillPath = document.getElementById('fillPath');
const currentPoint = document.getElementById('currentPoint');
const durationChips = [...document.querySelectorAll('.duration__chip')];
const desktopBridge = window.focusPetDesktop || null;

const DEFAULT_MINUTES = 30;
const MINUTE_MS = 60_000;
const DRAG_THRESHOLD = 4;
const STORAGE_KEY = 'focus-pet-task-queue-v1';
const taskQueue = window.FocusPadTaskQueue;
const { MAX_TASKS, createTask, taskTotalMs, normalizeTaskState, completeTaskInSlot } = taskQueue;
const { groupHistoryRecords } = window.FocusPadTaskHistory;
const { WIDGET_SIZES } = window.FocusPadWindowSize;

function loadTaskState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tasks) && saved.tasks.length <= MAX_TASKS) return saved;
  } catch {}
  return { tasks: [createTask('完成课程作业'), createTask('阅读 20 篇文献'), createTask('背 40 个单词')], selectedMinutes: DEFAULT_MINUTES, focusMode: 'task', freeSessions: [] };
}

const loaded = loadTaskState();
const normalized = normalizeTaskState(loaded);
const saved = { ...loaded, ...normalized };
const shouldShowOnboarding = new URLSearchParams(window.location.search).has('showOnboarding');
const state = {
  expanded: false,
  focusMode: saved.focusMode === 'free' ? 'free' : 'task',
  view: 'focus',
  selectedMinutes: saved.selectedMinutes || DEFAULT_MINUTES,
  mode: 'idle',
  runningSince: 0,
  elapsedBeforePause: 0,
  sessionStartedElapsed: 0,
  sessionFocusMode: null,
  remainingMs: (saved.selectedMinutes || DEFAULT_MINUTES) * MINUTE_MS,
  sessionTaskId: null,
  sessionCommitted: false,
  frame: 0,
  drag: null,
  trackLength: 1,
  desktopMode: Boolean(desktopBridge),
  tasks: saved.tasks,
  history: saved.history,
  historyDialogOpen: false,
  freeSessions: Array.isArray(saved.freeSessions) ? saved.freeSessions : [],
  onboardingCompleted: saved.onboardingCompleted === true && !shouldShowOnboarding,
  onboardingStepIndex: 0,
  onboardingPositionTimer: 0,
  toastTimer: 0,
};

state.compactMode = Boolean(desktopBridge) || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: state.tasks, history: state.history, selectedMinutes: state.selectedMinutes, focusMode: state.focusMode, freeSessions: state.freeSessions, onboardingCompleted: state.onboardingCompleted })); }
function formatTime(ms) { const safe = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`; }
function getActiveTask() { return state.tasks.find((task) => task.title.trim()) || null; }
function getTaskById(id) { return state.tasks.find((task) => task.id === id) || null; }
function liveElapsedMs(now = performance.now()) { return state.mode === 'running' ? state.elapsedBeforePause + now - state.runningSince : state.elapsedBeforePause; }
function liveSessionMs(now = performance.now()) { return Math.max(0, liveElapsedMs(now) - state.sessionStartedElapsed); }
function taskDisplayMs(task) {
  const belongsToTask = state.sessionTaskId === task.id && !state.sessionCommitted;
  return taskTotalMs(task) + (belongsToTask && (state.mode === 'running' || state.mode === 'paused') ? liveSessionMs() : 0);
}
function durationMs() { return state.selectedMinutes * MINUTE_MS; }

function syncWindowSize() {
  if (!desktopBridge?.resizeWindow) return;
  const size = !state.expanded
    ? WIDGET_SIZES.compact
    : state.view === 'tasks'
      ? WIDGET_SIZES.tasks
      : WIDGET_SIZES.focus;
  desktopBridge.resizeWindow(size.width, size.height);
}

function setExpanded(expanded) {
  const wasExpanded = state.expanded;
  if (!expanded && state.view === 'tasks') {
    state.view = 'focus';
    widget.dataset.view = 'focus';
    focusView.hidden = false;
    tasksView.hidden = true;
    focusViewButton.classList.add('is-active');
    tasksViewButton.classList.remove('is-active');
    focusViewButton.setAttribute('aria-selected', 'true');
    tasksViewButton.setAttribute('aria-selected', 'false');
  }
  state.expanded = expanded;
  widget.dataset.expanded = String(expanded);
  expandButton.setAttribute('aria-expanded', String(expanded));
  syncWindowSize();
  if (expanded && !wasExpanded && state.compactMode && !state.onboardingCompleted && onboardingLayer.hidden) requestAnimationFrame(startOnboardingIfNeeded);
}

function setView(view) {
  state.view = view;
  widget.dataset.view = view;
  const isFocus = view === 'focus';
  focusView.hidden = !isFocus;
  tasksView.hidden = isFocus;
  focusViewButton.classList.toggle('is-active', isFocus);
  tasksViewButton.classList.toggle('is-active', !isFocus);
  focusViewButton.setAttribute('aria-selected', String(isFocus));
  tasksViewButton.setAttribute('aria-selected', String(!isFocus));
  if (!state.expanded) setExpanded(true);
  renderAll();
  syncWindowSize();
}

function setMode(mode, customStatus = '') {
  state.mode = mode;
  widget.dataset.state = mode;
  const active = state.focusMode === 'task' ? getActiveTask() : null;
  const label = active ? active.title : '添加一个任务';
  if (mode === 'idle') statusLabel.textContent = customStatus || (state.focusMode === 'free' ? '自由专注 · 随时开始' : active ? `准备专注 · ${label}` : '先写下一件事');
  if (mode === 'running') statusLabel.textContent = state.focusMode === 'free' ? '自由专注 · 记录这一段时间' : `专注中 · ${label}`;
  if (mode === 'paused') statusLabel.textContent = '已暂停 · 可继续或切换任务';
  if (mode === 'complete') statusLabel.textContent = '本次专注结束 · 等你确认任务';
}

function updateDurationChips() { durationChips.forEach((chip) => chip.classList.toggle('is-active', Number(chip.dataset.minutes) === state.selectedMinutes)); }
function updateControls() {
  const hasTask = Boolean(getActiveTask());
  const canEditDuration = state.mode !== 'running';
  durationRow.style.pointerEvents = canEditDuration ? 'auto' : 'none';
  durationRow.style.opacity = canEditDuration ? '1' : '.5';
  startButton.disabled = state.focusMode === 'task' && !hasTask;
  completeCurrentButton.disabled = state.focusMode !== 'task' || !hasTask;
}
function syncButtons() {
  startButton.textContent = state.mode === 'running' ? '暂停' : state.mode === 'paused' ? '继续' : state.mode === 'complete' ? '再来一次' : '开始';
  startButton.classList.toggle('is-primary', state.mode !== 'running');
  pauseButton.style.display = 'none';
  resetButton.style.display = state.expanded ? 'inline-flex' : 'none';
  completeCurrentButton.style.display = (state.expanded || state.compactMode) && state.focusMode === 'task' ? 'inline-flex' : 'none';
}

function setSelectedDuration(minutes) {
  if (state.mode === 'running') return;
  if (liveSessionMs() > 0 && !state.sessionCommitted) commitFocusSession();
  state.selectedMinutes = minutes;
  state.elapsedBeforePause = 0;
  state.remainingMs = durationMs();
  state.sessionTaskId = null;
  state.sessionCommitted = false;
  updateDurationChips();
  timeLabel.textContent = formatTime(state.remainingMs);
  setMode('idle', `${minutes} 分钟已就绪`);
  renderCurve(0);
  persist();
  renderAll();
}

function setPosition(x, y) {
  if (state.desktopMode) { desktopBridge?.setPosition?.(x, y); return; }
  const maxX = Math.max(0, window.innerWidth - widget.offsetWidth - 12);
  const maxY = Math.max(0, window.innerHeight - widget.offsetHeight - 12);
  widget.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
  widget.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
}

function renderCurve(progress) {
  const clamped = Math.max(0, Math.min(1, progress));
  fillPath.style.strokeDasharray = `${state.trackLength}`;
  fillPath.style.strokeDashoffset = `${state.trackLength * (1 - clamped)}`;
  const point = trackPath.getPointAtLength(state.trackLength * clamped);
  currentPoint.setAttribute('cx', point.x);
  currentPoint.setAttribute('cy', point.y);
}

function commitFocusSession() {
  const sessionDuration = liveSessionMs();
  if (state.sessionCommitted || sessionDuration < 1000) return;
  if (state.sessionFocusMode === 'free') {
    state.freeSessions.push({ durationMs: Math.round(sessionDuration), finishedAt: new Date().toISOString() });
  } else {
    const task = getTaskById(state.sessionTaskId);
    if (!task) return;
    task.sessions.push({ durationMs: Math.round(sessionDuration), finishedAt: new Date().toISOString() });
  }
  state.sessionCommitted = true;
  persist();
}

function clearSession() {
  state.runningSince = 0;
  state.elapsedBeforePause = 0;
  state.sessionStartedElapsed = 0;
  state.sessionFocusMode = null;
  state.remainingMs = durationMs();
  state.sessionTaskId = null;
  state.sessionCommitted = false;
}

function tick(now) {
  if (state.mode !== 'running') return;
  const elapsed = liveElapsedMs(now);
  state.remainingMs = Math.max(0, durationMs() - elapsed);
  timeLabel.textContent = formatTime(state.remainingMs);
  renderCurve(elapsed / durationMs());
  renderCurrentTask();
  renderTaskStack();
  if (state.remainingMs <= 0) return completeSession();
  state.frame = requestAnimationFrame(tick);
}

function startSession() {
  const active = state.focusMode === 'task' ? getActiveTask() : null;
  if (state.focusMode === 'task' && !active) return setView('tasks');
  if (state.mode === 'running') return pauseSession();
  const sameSession = state.mode === 'paused' && state.sessionFocusMode === state.focusMode && (state.focusMode === 'free' || state.sessionTaskId === active.id) && !state.sessionCommitted;
  if (!sameSession) {
    clearSession();
    state.sessionTaskId = state.focusMode === 'task' ? active.id : null;
    state.sessionFocusMode = state.focusMode;
  }
  state.mode = 'running';
  state.runningSince = performance.now();
  if (state.compactMode && !state.expanded) {
    state.view = 'focus';
    widget.dataset.view = 'focus';
    focusView.hidden = false;
    tasksView.hidden = true;
  } else {
    setExpanded(true);
    setView('focus');
  }
  setMode('running');
  syncButtons();
  updateControls();
  state.frame = requestAnimationFrame(tick);
}

function pauseSession() {
  if (state.mode !== 'running') return;
  cancelAnimationFrame(state.frame);
  state.elapsedBeforePause = liveElapsedMs();
  state.remainingMs = Math.max(0, durationMs() - state.elapsedBeforePause);
  timeLabel.textContent = formatTime(state.remainingMs);
  setMode('paused');
  syncButtons();
  updateControls();
  renderCurve(state.elapsedBeforePause / durationMs());
  renderAll();
}

function resetSession() {
  if (state.mode === 'running') pauseSession();
  commitFocusSession();
  clearSession();
  timeLabel.textContent = formatTime(state.remainingMs);
  setMode('idle', '已保存本段专注时间');
  syncButtons();
  updateControls();
  renderCurve(0);
  renderAll();
}

function toggleFocusMode() {
  const nextMode = state.focusMode === 'task' ? 'free' : 'task';
  const wasRunning = state.mode === 'running';
  if (wasRunning) {
    cancelAnimationFrame(state.frame);
    state.elapsedBeforePause = liveElapsedMs();
    state.remainingMs = Math.max(0, durationMs() - state.elapsedBeforePause);
    commitFocusSession();
  } else if (state.mode === 'paused') {
    commitFocusSession();
  }
  state.focusMode = nextMode;
  widget.dataset.focusMode = nextMode;
  state.sessionTaskId = nextMode === 'task' ? getActiveTask()?.id || null : null;
  state.sessionFocusMode = nextMode;
  state.sessionStartedElapsed = state.elapsedBeforePause;
  state.sessionCommitted = false;
  modeIndicator.setAttribute('aria-label', nextMode === 'task' ? '当前为任务专注模式，点击切换自由专注' : '当前为自由专注模式，点击切换任务专注');
  if (wasRunning) {
    state.mode = 'running';
    state.runningSince = performance.now();
    state.frame = requestAnimationFrame(tick);
  }
  setMode(state.mode);
  persist();
  renderAll();
}

function completeSession() {
  cancelAnimationFrame(state.frame);
  state.elapsedBeforePause = durationMs();
  state.remainingMs = 0;
  state.runningSince = 0;
  commitFocusSession();
  timeLabel.textContent = '00:00';
  setMode('complete');
  syncButtons();
  updateControls();
  renderCurve(1);
  renderAll();
}

function selectTask(taskId) {
  const selected = getTaskById(taskId);
  if (!selected || !selected.title.trim() || selected === getActiveTask()) return;
  if (state.mode === 'running') pauseSession();
  commitFocusSession();
  clearSession();
  state.tasks = [selected, ...state.tasks.filter((task) => task.id !== taskId)];
  timeLabel.textContent = formatTime(state.remainingMs);
  setMode('idle', `已切换至 · ${selected.title}`);
  renderCurve(0);
  persist();
  renderAll();
}

function showCompletion(task) {
  completionTime.textContent = `Focus Time ${formatTime(taskTotalMs(task))}`;
  completionToast.hidden = false;
  requestAnimationFrame(() => completionToast.classList.add('is-visible'));
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    completionToast.classList.remove('is-visible');
    setTimeout(() => { completionToast.hidden = true; }, 240);
  }, 3200);
}

function completeTask(taskId) {
  if (state.focusMode !== 'task') return;
  const task = getTaskById(taskId);
  if (!task || !task.title.trim()) return;
  if (state.sessionTaskId === taskId && state.mode === 'running') pauseSession();
  if (state.sessionTaskId === taskId) commitFocusSession();
  if (state.sessionTaskId === taskId) clearSession();
  const completed = completeTaskInSlot(state.tasks, state.history, taskId, new Date().toISOString());
  if (completed.tasks === state.tasks) return;
  state.tasks = completed.tasks;
  state.history = completed.history;
  timeLabel.textContent = formatTime(state.remainingMs);
  setMode('idle', getActiveTask() ? '下一件任务已经就绪' : '写下下一件要专注的事');
  renderCurve(0);
  persist();
  showCompletion(task);
  renderAll();
}

function removeTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;
  if (state.sessionTaskId === taskId && state.mode === 'running') pauseSession();
  if (state.sessionTaskId === taskId) commitFocusSession();
  if (state.sessionTaskId === taskId) clearSession();
  state.tasks = state.tasks.map((item) => item.id === taskId ? createTask() : item);
  timeLabel.textContent = formatTime(state.remainingMs);
  setMode('idle');
  renderCurve(0);
  persist();
  renderAll();
}

function addTask(title) {
  const name = title.trim();
  const emptyIndex = state.tasks.findIndex((task) => !task.title.trim());
  if (!name || emptyIndex === -1) return;
  state.tasks[emptyIndex] = { ...state.tasks[emptyIndex], title: name };
  taskInput.value = '';
  persist();
  renderAll();
}

function updateTaskTitle(taskId, title) {
  const task = getTaskById(taskId);
  const nextTitle = title.trim();
  if (!task || task.title === nextTitle) return;
  task.title = nextTitle;
  persist();
  renderAll();
}

function renderCurrentTask() {
  const active = getActiveTask();
  const showTask = state.focusMode === 'task';
  currentTaskButton.classList.toggle('is-empty', !active || !showTask);
  currentTaskName.textContent = showTask ? (active ? active.title : '添加一件要专注的事') : '';
  currentTaskTime.textContent = showTask && active ? `Focus ${formatTime(taskDisplayMs(active))}` : '';
}

function makeTaskCard(task) {
  const card = document.createElement('article');
  card.className = 'task-card';
  card.dataset.taskId = task.id;
  card.innerHTML = `<div class="task-card__paper"><button class="task-card__check" type="button" data-action="complete" aria-label="确认完成 ${task.title}">○</button><div class="task-card__details"><span class="task-card__role"></span><input class="task-card__title" type="text" maxlength="28" aria-label="任务名称" /><span class="task-card__time"></span></div><button class="task-card__remove" type="button" data-action="remove" aria-label="移除任务">×</button></div>`;
  return card;
}

function renderTaskStack() {
  const existing = new Map([...taskStack.children].map((card) => [card.dataset.taskId, card]));
  taskStack.querySelectorAll('.task-card').forEach((card) => { if (!state.tasks.some((task) => task.id === card.dataset.taskId)) card.remove(); });
  const active = getActiveTask();
  state.tasks.forEach((task, slot) => {
    let card = existing.get(task.id);
    if (!card || !card.isConnected) { card = makeTaskCard(task); taskStack.append(card); }
    card.dataset.slot = String(slot);
    const isBlank = !task.title.trim();
    card.classList.toggle('is-empty', isBlank);
    card.querySelector('.task-card__role').textContent = isBlank ? 'NEW TASK' : task === active ? 'CURRENT' : 'NEXT';
    const input = card.querySelector('.task-card__title');
    if (document.activeElement !== input) input.value = task.title;
    input.placeholder = '添加任务...';
    card.querySelector('.task-card__time').textContent = isBlank ? '点击输入任务' : `Focus ${formatTime(taskDisplayMs(task))}`;
    const check = card.querySelector('.task-card__check');
    check.disabled = isBlank;
    check.setAttribute('aria-label', isBlank ? '请先输入任务' : `确认完成 ${task.title}`);
    taskStack.append(card);
  });
  emptyQueue.hidden = true;
}

function renderCompletedList() {
  completedList.innerHTML = '';
  taskHistoryCount.textContent = `已完成 ${state.history.length} 个任务`;
  historyDialogCount.textContent = `已完成 ${state.history.length} 个任务`;

  const groups = groupHistoryRecords(state.history);
  if (!groups.length) {
    const empty = document.createElement('p');
    empty.className = 'task-history__empty';
    empty.textContent = '还没有完成的任务';
    completedList.append(empty);
    return;
  }

  groups.forEach((group) => {
    const day = document.createElement('div');
    day.className = 'task-history__day';
    day.textContent = group.label;
    completedList.append(day);

    group.records.forEach((record) => {
      const item = document.createElement('article');
      item.className = 'completed-item';
      const title = document.createElement('strong');
      title.textContent = `✓ ${record.title}`;
      const meta = document.createElement('span');
      meta.textContent = `${record.timeLabel} · 专注 ${formatTime(record.focusDurationMs)}`;
      item.append(title, meta);
      completedList.append(item);
    });
  });
}

function openTaskHistory() {
  state.historyDialogOpen = true;
  renderCompletedList();
  historyDialog.hidden = false;
  requestAnimationFrame(() => historyDialog.classList.add('is-visible'));
  historyDialogClose.focus();
}

function closeTaskHistory() {
  if (!state.historyDialogOpen) return;
  state.historyDialogOpen = false;
  historyDialog.classList.remove('is-visible');
  setTimeout(() => { if (!state.historyDialogOpen) historyDialog.hidden = true; }, 180);
  taskHistoryToggle.focus();
}

function renderQueueControls() {
  const activeTaskCount = state.tasks.filter((task) => task.title.trim()).length;
  const hasEmptySlot = activeTaskCount < MAX_TASKS;
  queueCount.textContent = `${activeTaskCount} / ${MAX_TASKS}`;
  taskInput.disabled = !hasEmptySlot;
  addTaskButton.disabled = !hasEmptySlot;
  taskInput.placeholder = hasEmptySlot ? '添加任务...' : '三个任务已就绪';
}

function renderAll() {
  renderCurrentTask();
  renderTaskStack();
  renderCompletedList();
  renderQueueControls();
  updateDurationChips();
  syncButtons();
  updateControls();
}

const onboardingSteps = [
  { title: '注意力曲线', copy: '记录专注节奏', view: 'focus', target: () => curveButton },
  { title: '选择专注时长', copy: '', view: 'focus', target: () => durationRow },
  { title: '一点，切换模式', copy: '自由专注 / 任务专注', view: 'focus', target: () => modeIndicator },
  { title: '添加最多 3 个任务', copy: '', view: 'tasks', target: () => tasksViewButton },
  { title: '最大的，是当前任务', copy: '', view: 'tasks', target: () => taskStack.querySelector('.task-card[data-slot="0"] .task-card__paper') || taskStack },
  { title: '滑动，切换任务', copy: '', view: 'tasks', target: () => taskStack },
  { title: '点击，开始专注', copy: '', view: 'focus', target: () => startButton },
  { title: '完成后，打个 ✓', copy: '自动记录专注时间', view: 'tasks', target: () => taskStack.querySelector('.task-card[data-slot="0"] .task-card__check') || taskStack },
  { title: '准备好了，开始专注吧。', copy: '', view: 'focus', target: () => widget, final: true },
];

function onboardingTargetFor(step) {
  const target = step.target();
  return target || widget;
}

function positionOnboarding(target) {
  const targetRect = target.getBoundingClientRect();
  const layerRect = onboardingLayer.getBoundingClientRect();
  const pad = target === widget ? 0 : 6;
  onboardingSpotlight.style.left = `${targetRect.left - layerRect.left - pad}px`;
  onboardingSpotlight.style.top = `${targetRect.top - layerRect.top - pad}px`;
  onboardingSpotlight.style.width = `${targetRect.width + pad * 2}px`;
  onboardingSpotlight.style.height = `${targetRect.height + pad * 2}px`;
  onboardingSpotlight.style.borderRadius = target === taskStack ? '18px' : target === durationRow ? '12px' : '16px';

  const edge = 10;
  const gap = 12;
  const cardWidth = Math.min(206, Math.max(174, layerRect.width - edge * 2));
  onboardingCard.style.width = `${cardWidth}px`;

  // Measure after content and width are applied so short and long steps share the same bounds logic.
  const cardHeight = onboardingCard.getBoundingClientRect().height || 96;
  let left = targetRect.left - layerRect.left + Math.min(20, Math.max(0, (targetRect.width - cardWidth) / 2));
  left = Math.min(Math.max(edge, left), Math.max(edge, layerRect.width - cardWidth - edge));

  const below = targetRect.bottom - layerRect.top + gap;
  const above = targetRect.top - layerRect.top - cardHeight - gap;
  const maxTop = Math.max(edge, layerRect.height - cardHeight - edge);
  let top = below;
  let placement = 'bottom';
  if (below > maxTop && above >= edge) {
    top = above;
    placement = 'top';
  } else if (below > maxTop) {
    top = Math.max(edge, Math.min(maxTop, above));
    placement = top <= above ? 'top' : 'bottom';
  }

  onboardingCard.dataset.placement = placement;
  onboardingCard.style.left = `${left}px`;
  onboardingCard.style.top = `${Math.max(edge, Math.min(maxTop, top))}px`;
}

function repositionOnboarding() {
  const step = onboardingSteps[state.onboardingStepIndex];
  if (!step || onboardingLayer.hidden) return;
  if (step.final) {
    onboardingCard.style.width = `${Math.min(206, Math.max(174, onboardingLayer.clientWidth - 28))}px`;
    onboardingCard.style.left = `${Math.max(14, (onboardingLayer.clientWidth - onboardingCard.offsetWidth) / 2)}px`;
    onboardingCard.style.top = `${Math.max(48, (onboardingLayer.clientHeight - onboardingCard.offsetHeight) / 2)}px`;
    return;
  }
  positionOnboarding(onboardingTargetFor(step));
}

function closeOnboarding() {
  state.onboardingCompleted = true;
  persist();
  onboardingLayer.classList.remove('is-visible');
  setTimeout(() => { onboardingLayer.hidden = true; }, 220);
}

function showOnboardingStep(index) {
  state.onboardingStepIndex = index;
  const step = onboardingSteps[index];
  if (!step) return closeOnboarding();
  if (step.final) {
    onboardingStep.textContent = '';
    onboardingTitle.textContent = step.title;
    onboardingCopy.textContent = '';
    onboardingNext.textContent = '开始使用';
    onboardingSkip.hidden = true;
    setView('focus');
    onboardingLayer.classList.add('is-final');
  } else {
    onboardingStep.textContent = `${index + 1} / 8`;
    onboardingTitle.textContent = step.title;
    onboardingCopy.textContent = step.copy;
    onboardingNext.textContent = index === onboardingSteps.length - 2 ? '开始使用' : '下一步';
    onboardingSkip.hidden = false;
    setView(step.view);
    onboardingLayer.classList.remove('is-final');
  }
  onboardingLayer.hidden = false;
  requestAnimationFrame(() => {
    repositionOnboarding();
    onboardingLayer.classList.add('is-visible');
    clearTimeout(state.onboardingPositionTimer);
    // The widget height animates when moving from TASKS to FOCUS; measure once more after it settles.
    state.onboardingPositionTimer = setTimeout(repositionOnboarding, 360);
  });
}

function startOnboardingIfNeeded() {
  if (state.onboardingCompleted) return;
  setExpanded(true);
  showOnboardingStep(0);
}

function toggleExpanded() { setExpanded(!state.expanded); renderAll(); }

function tryDragStart(event) {
  if (event.button !== 0 || event.target.closest('button, input')) return;
  const rect = widget.getBoundingClientRect();
  state.drag = { pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, offsetX:event.clientX - rect.left, offsetY:event.clientY - rect.top, active:false };
  dragHandle.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  const dx = event.clientX - state.drag.startX;
  const dy = event.clientY - state.drag.startY;
  if (!state.drag.active && Math.hypot(dx, dy) > DRAG_THRESHOLD) { state.drag.active = true; widget.classList.add('is-dragging'); }
  if (state.drag.active) setPosition(event.clientX - state.drag.offsetX, event.clientY - state.drag.offsetY);
}

function endDrag(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  try { dragHandle.releasePointerCapture(event.pointerId); } catch {}
  const wasDragging = state.drag.active;
  state.drag = null;
  widget.classList.remove('is-dragging');
  if (!wasDragging) toggleExpanded();
}

function attachEvents() {
  dragHandle.addEventListener('pointerdown', tryDragStart);
  window.addEventListener('pointermove', moveDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  expandButton.addEventListener('click', (event) => { event.stopPropagation(); toggleExpanded(); });
  modeIndicator.addEventListener('click', (event) => { event.stopPropagation(); toggleFocusMode(); });
  focusViewButton.addEventListener('click', () => setView('focus'));
  tasksViewButton.addEventListener('click', () => setView('tasks'));
  curveButton.addEventListener('click', () => toggleExpanded());
  currentTaskButton.addEventListener('click', () => setView('tasks'));
  timeLabel.addEventListener('click', () => { setExpanded(true); setView('focus'); });
  timeLabel.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpanded(true); setView('focus'); } });
  startButton.addEventListener('click', startSession);
  pauseButton.addEventListener('click', pauseSession);
  resetButton.addEventListener('click', resetSession);
  completeCurrentButton.addEventListener('click', () => { const active = getActiveTask(); if (active) completeTask(active.id); });
  taskHistoryToggle.addEventListener('click', openTaskHistory);
  historyDialogBackdrop.addEventListener('click', closeTaskHistory);
  historyDialogClose.addEventListener('click', closeTaskHistory);
  durationChips.forEach((chip) => chip.addEventListener('click', () => setSelectedDuration(Number(chip.dataset.minutes))));
  taskForm.addEventListener('submit', (event) => { event.preventDefault(); addTask(taskInput.value); });
  taskStack.addEventListener('click', (event) => {
    const card = event.target.closest('.task-card');
    if (!card) return;
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'complete') return completeTask(card.dataset.taskId);
    if (action === 'remove') return removeTask(card.dataset.taskId);
    selectTask(card.dataset.taskId);
  });
  taskStack.addEventListener('change', (event) => { if (event.target.matches('.task-card__title')) updateTaskTitle(event.target.closest('.task-card').dataset.taskId, event.target.value); });
  taskStack.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('.task-card__title')) {
      event.preventDefault();
      event.target.blur();
    }
  });
  onboardingNext.addEventListener('click', (event) => {
    event.stopPropagation();
    if (state.onboardingStepIndex >= onboardingSteps.length - 1) return closeOnboarding();
    showOnboardingStep(state.onboardingStepIndex + 1);
  });
  onboardingSkip.addEventListener('click', (event) => { event.stopPropagation(); closeOnboarding(); });
  window.addEventListener('resize', () => {
    if (!state.desktopMode) setPosition(widget.offsetLeft, widget.offsetTop);
    repositionOnboarding();
  });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeTaskHistory(); });
}

function bootstrap() {
  state.trackLength = trackPath.getTotalLength();
  fillPath.style.strokeDasharray = `${state.trackLength}`;
  currentPoint.style.opacity = '1';
  if (state.desktopMode) document.body.classList.add('desktop-app');
  if (state.compactMode) {
    document.body.classList.add('compact-app');
    widget.dataset.compact = 'true';
  }
  widget.dataset.focusMode = state.focusMode;
  modeIndicator.setAttribute('aria-label', state.focusMode === 'task' ? '当前为任务专注模式，点击切换自由专注' : '当前为自由专注模式，点击切换任务专注');
  if (state.compactMode && !state.desktopMode) {
    widget.style.left = '';
    widget.style.top = '';
  } else {
    setPosition(state.desktopMode ? 14 : 28, state.desktopMode ? 12 : 26);
  }
  setExpanded(false);
  timeLabel.textContent = formatTime(state.remainingMs);
  setMode('idle');
  renderCurve(0);
  renderAll();
  attachEvents();
  if (!state.compactMode) requestAnimationFrame(startOnboardingIfNeeded);
}

bootstrap();
