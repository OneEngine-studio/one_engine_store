const KEY = 'oneengine_play_days';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getPlayDays = (): Set<string> => {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
};

/** Remember that something was launched today. */
export const recordPlayDay = () => {
  try {
    const days = getPlayDays();
    days.add(todayIso());
    localStorage.setItem(KEY, JSON.stringify([...days]));
  } catch {
    // storage unavailable: the calendar simply stays empty
  }
};
