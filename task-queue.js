(function taskQueueModule(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FocusPadTaskQueue = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  const MAX_TASKS = 3;

  function createTask(title = '') {
    return {
      id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      sessions: [],
    };
  }

  function taskTotalMs(task) {
    return (task.sessions || []).reduce((total, session) => total + Number(session.durationMs || 0), 0);
  }

  function normalizeTask(task) {
    return {
      id: task?.id || createTask().id,
      title: typeof task?.title === 'string' ? task.title : '',
      sessions: Array.isArray(task?.sessions) ? task.sessions : [],
    };
  }

  function makeHistoryRecord(task, completedAt) {
    return {
      id: `history-${task.id}`,
      taskId: task.id,
      title: task.title,
      completedAt,
      focusDurationMs: taskTotalMs(task),
    };
  }

  function normalizeTaskState(saved = {}) {
    const seenHistoryTaskIds = new Set();
    const history = (Array.isArray(saved.history) ? saved.history : []).filter((item) => {
      if (!item?.taskId || seenHistoryTaskIds.has(item.taskId)) return false;
      seenHistoryTaskIds.add(item.taskId);
      return true;
    }).map((item) => ({
      id: item.id || `history-${item.taskId}`,
      taskId: item.taskId,
      title: typeof item.title === 'string' ? item.title : '',
      completedAt: item.completedAt || null,
      focusDurationMs: Number(item.focusDurationMs || 0),
    }));

    const tasks = (Array.isArray(saved.tasks) ? saved.tasks : []).slice(0, MAX_TASKS).map((rawTask) => {
      const task = normalizeTask(rawTask);
      if (!rawTask?.completed) return task;
      if (task.title.trim() && !seenHistoryTaskIds.has(task.id)) {
        history.unshift(makeHistoryRecord(task, rawTask.completedAt || null));
        seenHistoryTaskIds.add(task.id);
      }
      return createTask();
    });

    while (tasks.length < MAX_TASKS) tasks.push(createTask());
    return { tasks, history };
  }

  function completeTaskInSlot(tasks, history, taskId, completedAt) {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index === -1 || history.some((entry) => entry.taskId === taskId)) return { tasks, history };
    const task = normalizeTask(tasks[index]);
    if (!task.title.trim()) return { tasks, history };

    const nextTasks = tasks.slice();
    nextTasks[index] = createTask();
    return {
      tasks: nextTasks,
      history: [makeHistoryRecord(task, completedAt), ...history],
    };
  }

  return { MAX_TASKS, createTask, taskTotalMs, normalizeTaskState, completeTaskInSlot };
});
