(function taskHistoryModule(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FocusPadTaskHistory = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  function toTimestamp(value) {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function sameDay(left, right) {
    return left.getFullYear() === right.getFullYear()
      && left.getMonth() === right.getMonth()
      && left.getDate() === right.getDate();
  }

  function dayInfo(iso, now) {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return { key: 'older', label: '更早', timeLabel: '过往记录' };

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const timeLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const label = sameDay(date, now) ? '今天' : sameDay(date, yesterday) ? '昨天' : `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    return { key, label, timeLabel };
  }

  function groupHistoryRecords(records, now = new Date()) {
    const groups = [];
    const byKey = new Map();
    [...records]
      .sort((left, right) => toTimestamp(right.completedAt) - toTimestamp(left.completedAt))
      .forEach((record) => {
        const info = dayInfo(record.completedAt, now);
        if (!byKey.has(info.key)) {
          const group = { key: info.key, label: info.label, records: [] };
          byKey.set(info.key, group);
          groups.push(group);
        }
        byKey.get(info.key).records.push({ ...record, timeLabel: info.timeLabel });
      });
    return groups;
  }

  return { groupHistoryRecords };
});
